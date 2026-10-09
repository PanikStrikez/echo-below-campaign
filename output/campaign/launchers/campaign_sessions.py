"""Local, extractive session analysis. Nothing becomes canon before DM review.

Mixed notes are private. Only a separate player-notes field or explicit [PLAYER]
lines can enter the player recap. Categorization is a proposal, not a fact checker.
"""
from __future__ import annotations

import copy
import hashlib
import json
import re
import secrets
import threading
from datetime import datetime, timezone

from ai_service import AIError


def checked_text(value, maximum=60000, empty=False):
    if not isinstance(value, str) or len(value) > maximum or '\x00' in value or (not empty and not value.strip()):
        raise AIError('invalid_input', 'Use plain text within the displayed size limit.')
    return value.strip()


def now():
    return datetime.now(timezone.utc).isoformat()


def lines(text):
    return [(number, re.sub(r'^\s*[-*•]\s*', '', line).strip())
            for number, line in enumerate(text.splitlines(), 1)
            if line.strip() and not line.lstrip().startswith('#')]


def provenance(identifier, text, line=1):
    return [{'source_id': identifier, 'filename': identifier + '.txt', 'page': line,
             'sha256': hashlib.sha256(text.encode()).hexdigest()}]


class SessionEngine:
    def __init__(self, store):
        self.store = store
        self.lock = threading.RLock()
        with store.connection() as conn:
            conn.execute('''CREATE TABLE IF NOT EXISTS campaign_sessions (
                id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL,
                body_json TEXT NOT NULL, created_at TEXT NOT NULL)''')

    def _persist(self, draft):
        with self.store.connection() as conn:
            conn.execute('INSERT OR REPLACE INTO campaign_sessions VALUES (?,?,?,?,?)',
                         (draft['id'], draft['title'], draft['status'], json.dumps(draft), draft['createdAt']))
        return copy.deepcopy(draft)

    def list(self):
        with self.store.connection() as conn:
            return [dict(row) for row in conn.execute(
                'SELECT id,title,status,created_at AS createdAt FROM campaign_sessions ORDER BY created_at DESC LIMIT 100')]

    def get(self, identifier):
        with self.store.connection() as conn:
            row = conn.execute('SELECT body_json FROM campaign_sessions WHERE id=?', (identifier,)).fetchone()
        if not row:
            raise AIError('not_found', 'That session draft does not exist.', 404)
        return json.loads(row[0])

    def analyze(self, title, notes, player_notes=''):
        title, notes = checked_text(title, 160), checked_text(notes)
        player_notes = checked_text(player_notes, 30000, True)
        if re.search(r'\[DM\]', player_notes, flags=re.I):
            raise AIError('mixed_visibility', 'Move lines labeled [DM] into the private session notes field.')
        identifier = 'session-' + secrets.token_hex(12)
        revision = self.store.revision()
        records = self.store.list_records(audience='dm')
        proposals, public_lines, summaries, npc_updates = [], [], [], {}
        buckets = {key: [] for key in ('unresolvedThreads', 'npcChanges', 'relationshipChanges', 'cluesLearned', 'cluesMissed')}
        source = provenance(identifier, notes)
        # Retain complete input; never silently truncate a long transcript into canon.
        input_lines = lines(notes)
        if len(input_lines) > 160:
            raise AIError('too_many_events', 'Split notes into at most 160 nonempty event lines per analysis.', 413)
        for number, original in input_lines:
            if len(original) > 4000:
                raise AIError('event_too_long', 'Split long transcript paragraphs into event lines of at most 4,000 characters.', 413)
            if len(re.findall(r'\[(?:PLAYER|DM)\]', original, flags=re.I)) > 1:
                raise AIError('mixed_visibility', 'Put player-safe and DM-only statements on separate lines.')
            public = original.upper().startswith('[PLAYER]')
            text = re.sub(r'^\[(?:PLAYER|DM)\]\s*', '', original, flags=re.I)
            if not text:
                continue
            if public:
                public_lines.append(text)
            summaries.append(text)
            lower = text.lower()
            uncertain = bool(re.search(r'\b(maybe|might|suspect|unknown|unresolved|unclear|perhaps|rumou?r|not confirmed|unconfirmed)\b|\?', lower))
            future = bool(re.search(r'\b(plan(?:ned)?|next session|prepare|could|if they|may happen)\b', lower))
            missed = bool(re.search(r'\b(missed|overlooked|did not (?:learn|find|notice)|never noticed)\b', lower))
            related = [r['id'] for r in records if len(r['name']) > 2 and
                       (r['name'].lower() in lower or (r['kind'] == 'npc' and r['name'].split()[0].lower() in lower))]
            kind = 'choice'
            if uncertain or future or re.search(r'\b(thread|follow.up|loose end|question)\b', lower):
                kind = 'thread'; buckets['unresolvedThreads'].append(text)
            elif re.search(r'\b(clue|learned|discovered|found out|evidence|inscription|secret)\b', lower):
                kind = 'clue'
            elif re.search(r'\b(trust|debt|promise|owe|friend|hostile|allied|betray)\w*\b', lower):
                kind = 'relationship'; buckets['relationshipChanges'].append(text)
            elif re.search(r'\b(quest|objective|mission)\b', lower):
                kind = 'quest'
            elif re.search(r'\b(item|loot|potion|gold|sword|medallion|token|inventory)\b', lower):
                kind = 'item'
            elif re.search(r'\b(arrived|visited|entered|stopped outside|location)\b', lower):
                kind = 'location'
            if missed:
                buckets['cluesMissed'].append(text)
            elif kind == 'clue':
                buckets['cluesLearned'].append(text)
            if any(r['kind'] == 'npc' and r['id'] in related for r in records):
                buckets['npcChanges'].append(text)
            record_id = identifier + '-event-' + str(number)
            epistemic = 'unresolved' if uncertain or future else 'confirmed'
            visibility = 'player' if public else 'dm'
            evidence = [{**source[0], 'page': number}]
            record = {'id': record_id, 'kind': kind, 'name': text[:140], 'visibility': visibility,
                      'npc_ids': [], 'epistemic': epistemic, 'status': 'planned' if future else 'open',
                      'data': {'session_id': identifier, 'related_ids': related, 'note_line': number,
                               'classification': 'proposed', 'clue_result': 'missed' if missed else 'learned' if kind == 'clue' else ''},
                      'provenance': evidence, 'facts': [{'id': record_id + '-fact', 'text': text[:4000],
                      'visibility': visibility, 'npc_ids': [], 'player_safe': public,
                      'epistemic': epistemic, 'provenance': evidence}]}
            proposals.append({'id': 'mutation-' + str(number), 'op': 'upsert', 'record': record,
                              'reason': f'Extracted from note line {number}; review classification and knowledge before approval.', 'selected': True})
            for existing in records:
                if existing['kind'] != 'npc' or existing['id'] not in related:
                    continue
                updated = npc_updates.setdefault(existing['id'], copy.deepcopy(existing))
                updated.setdefault('data', {})['last_session_observation'] = {'session_id': identifier, 'text': text, 'epistemic': epistemic}
                updated.setdefault('facts', []).append({'id': record_id + '-about-' + existing['id'], 'text': text,
                                                        'visibility': 'dm', 'npc_ids': [], 'player_safe': False,
                                                        'epistemic': epistemic, 'provenance': evidence})
        for npc_id, record in npc_updates.items():
            proposals.append({'id': 'mutation-' + npc_id, 'op': 'upsert', 'record': record,
                              'reason': 'Append private session observations about this NPC. This grants no new NPC knowledge.', 'selected': False})
        for _, text in lines(player_notes):
            public_lines.append(text)
        active = [r for r in records if r['kind'] == 'thread' and r.get('status') not in ('closed', 'resolved', 'completed')]
        prep = ['Confirm the stopping point and ask the players what they want to do next.']
        prep += ['Follow up: ' + x for x in buckets['unresolvedThreads'][:8]]
        prep += ['Prepare another route to this missed clue; do not mark it learned: ' + x for x in buckets['cluesMissed'][:5]]
        prep += ['Review ongoing thread: ' + r['name'] for r in active[:6]]
        if buckets['npcChanges']:
            prep.append('Confirm which NPCs witnessed each event before granting them knowledge.')
        draft = {'id': identifier, 'title': title, 'status': 'review', 'createdAt': now(),
                 'baseRevision': revision, 'draftVersion': 1, 'mode': 'local-extractive',
                 'notes': notes, 'playerNotes': player_notes,
                 'playerRecap': '\n\n'.join(public_lines), 'dmRecap': '\n\n'.join(summaries),
                 'mutations': proposals, **buckets, 'nextSessionPrep': prep,
                 'warnings': ['Automatic categories are proposals. Review every selected change before committing.',
                              'No NPC inherits party knowledge. Grant named NPCs access explicitly.',
                              'This engine extracts notes locally; it does not invent missing events or resolve contradictions.']}
        if not public_lines:
            draft['warnings'].append('No player-safe notes supplied. The player recap is empty until the DM writes or approves one.')
        return self._persist(draft)

    def save(self, identifier, incoming):
        with self.lock:
            draft = self.get(identifier)
            if draft['status'] != 'review':
                raise AIError('already_committed', 'Committed sessions are immutable; create a correction session.', 409)
            if not isinstance(incoming, dict) or type(incoming.get('draftVersion')) is not int or incoming.get('draftVersion') != draft['draftVersion']:
                raise AIError('draft_conflict', 'This draft changed. Reload it before saving.', 409)
            for key in ('title', 'playerRecap', 'dmRecap'):
                if key in incoming:
                    draft[key] = checked_text(incoming[key], 160 if key == 'title' else 60000, key != 'title')
            for key in ('unresolvedThreads', 'npcChanges', 'relationshipChanges', 'cluesLearned', 'cluesMissed', 'nextSessionPrep'):
                if key in incoming:
                    if not isinstance(incoming[key], list) or len(incoming[key]) > 160:
                        raise AIError('invalid_draft', 'Draft sections must be short lists of text.')
                    draft[key] = [checked_text(v, 4000) for v in incoming[key]]
            if 'mutations' in incoming:
                candidates = incoming['mutations']
                if not isinstance(candidates, list) or len(candidates) > 200:
                    raise AIError('invalid_draft', 'A draft supports at most 200 proposed changes.')
                seen = set()
                for m in candidates:
                    if not isinstance(m, dict) or m.get('op') != 'upsert' or not isinstance(m.get('record'), dict):
                        raise AIError('invalid_draft', 'Session drafts support explicit record upserts only.')
                    checked_text(m.get('id'), 120)
                    if m['id'] in seen:
                        raise AIError('invalid_draft', 'Every proposed change needs a unique ID.')
                    seen.add(m['id'])
                draft['mutations'] = copy.deepcopy(candidates)
            # baseRevision, source notes, identity and receipt cannot be forged in a save.
            draft['draftVersion'] += 1
            return self._persist(draft)

    def commit(self, identifier, expected_revision, mutation_ids, approved, draft_version=None):
        with self.lock:
            draft = self.get(identifier)
            if approved is not True:
                raise AIError('review_required', 'The DM must explicitly approve the player recap and selected changes.', 409)
            if draft['status'] == 'committed':
                return {'draft': draft, 'revision': draft['committedRevision'], 'alreadyCommitted': True}
            if type(draft_version) is not int or draft_version != draft['draftVersion']:
                raise AIError('draft_conflict', 'This draft changed. Review its latest version.', 409)
            if type(expected_revision) is not int or expected_revision != draft['baseRevision']:
                raise AIError('revision_conflict', 'Use the revision this draft was analyzed against.', 409)
            if not isinstance(mutation_ids, list) or any(not isinstance(x, str) for x in mutation_ids) or len(set(mutation_ids)) != len(mutation_ids):
                raise AIError('invalid_selection', 'Select unique proposed change IDs.')
            lookup = {m['id']: m for m in draft['mutations']}
            if any(identifier not in lookup for identifier in mutation_ids):
                raise AIError('invalid_selection', 'A selected change is not part of this reviewed draft.')
            mutations = [{'op': 'upsert', 'record': lookup[mid]['record']} for mid in mutation_ids]
            def receipt(conn, result):
                draft.update(status='committed', committedAt=now(), committedRevision=result['revision'], approvedMutationIds=mutation_ids)
                conn.execute('UPDATE campaign_sessions SET status=?,body_json=? WHERE id=?',
                             ('committed', json.dumps(draft), identifier))
            result = self.store.apply_mutations(mutations, expected_revision=expected_revision,
                                               actor='dm', session_id=identifier, commit_hook=receipt)
            return {'draft': draft, 'revision': result['revision']}

    def import_story(self, campaign_id, session_id, story):
        if not isinstance(story, dict):
            raise AIError('invalid_import', 'Choose an existing campaign before importing.')
        events = (story.get('continuity') or {}).get('events', [])
        if not isinstance(events, list) or len(events) > 5000:
            raise AIError('invalid_import', 'The existing continuity format is not supported.')
        # Import is always a review draft. Ignore raw DM notes for player projection.
        source_text = json.dumps(story, sort_keys=True, ensure_ascii=False)
        draft = self.analyze('Review existing campaign continuity', 'Existing campaign import; review each proposed record.')
        draft['mutations'] = []
        draft['playerRecap'] = ''
        public = []
        for event in events:
            if not isinstance(event, dict) or event.get('approved') is not True:
                continue
            if event.get('status') == 'planned':
                continue
            original_id = checked_text(event.get('id'), 120)
            rid = 'import-' + hashlib.sha256((campaign_id + ':' + original_id).encode()).hexdigest()[:24]
            # Already imported events are preserved; imports never overwrite subsequent edits.
            if self.store.get_record(rid, audience='dm'):
                continue
            knows = event.get('knows') if isinstance(event.get('knows'), list) else []
            shared = event.get('share') == 'party' and 'party' in knows and bool(event.get('playerText', '').strip())
            detail = checked_text(event.get('detail') or event.get('title') or 'Untitled event', 4000)
            evidence = provenance('browser-' + hashlib.sha256(campaign_id.encode()).hexdigest()[:16], source_text)
            epistemic = 'confirmed' if event.get('basis') == 'Observed' and event.get('status') in ('confirmed','completed') else 'inferred' if event.get('basis') in ('Inferred','Claimed') else 'unresolved'
            facts = [{'id': rid + '-private', 'text': detail, 'visibility': 'dm', 'npc_ids': [],
                      'player_safe': False, 'epistemic': epistemic, 'provenance': evidence}]
            if shared:
                safe = checked_text(event['playerText'], 4000)
                public.append(safe)
                facts.append({'id': rid + '-shared', 'text': safe, 'visibility': 'player',
                              'npc_ids': ['npc-' + n for n in knows if n in ('durnan','gundren','selise','halaster')],
                              'player_safe': True, 'epistemic': epistemic, 'provenance': evidence})
            kind = {'discovery': 'clue', 'promise': 'relationship', 'debt': 'relationship', 'custody': 'item', 'quest': 'quest'}.get(event.get('kind'), 'choice')
            record = {'id': rid, 'kind': kind, 'name': checked_text((event.get('publicTitle') if shared else event.get('title')) or 'Imported event', 160),
                      'visibility': 'player' if shared else 'dm', 'npc_ids': [], 'epistemic': epistemic,
                      'status': event.get('status', 'open'), 'provenance': evidence, 'facts': facts,
                      'data': {'legacy_event_id': original_id, 'legacy_campaign_id': campaign_id,
                               'legacy_session_id': event.get('session', session_id),
                               'relationships': event.get('relationships', []), 'tracks': event.get('tracks', []),
                               'quests': event.get('quests', [])}}
            draft['mutations'].append({'id': rid, 'op': 'upsert', 'record': record, 'selected': True,
                                       'reason': 'Previously DM-approved continuity; public text and witnesses preserved separately.'})
            if len(draft['mutations']) >= 200:
                draft['warnings'].append('First 200 unimported events staged. After approval, import again for remaining events.')
                break
        draft['playerRecap'] = '\n\n'.join(public)
        draft['dmRecap'] = f"{len(draft['mutations'])} existing approved events proposed for the structured store. Browser saves are preserved."
        return self._persist(draft)
