"""SQLite campaign state with fail-closed knowledge boundaries and audited transactions.

Do not serialize DM records to a player/NPC client and filter in the browser. Every
read accepts an audience and projects only the fields that audience may see.
"""
from contextlib import contextmanager
from datetime import datetime, timezone
import copy
import hashlib
import json
from pathlib import Path
import re
import sqlite3

KINDS = frozenset(('npc', 'quest', 'clue', 'location', 'item', 'relationship', 'choice', 'thread'))
VISIBILITIES = frozenset(('dm', 'player', 'npc'))
EPISTEMIC = frozenset(('confirmed', 'inferred', 'unresolved'))
SEARCH_STOPWORDS = frozenset(('a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'how', 'i', 'in', 'is', 'it', 'me', 'my', 'of', 'on', 'or', 'our', 's', 'should', 'tell', 'that', 'the', 'their', 'them', 'there', 'they', 'this', 'to', 'us', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'who', 'will', 'with', 'would', 'you', 'your'))
ID_PATTERN = re.compile(r'^[A-Za-z0-9][A-Za-z0-9:_.-]{0,159}$')
RECORD_FIELDS = frozenset(('id', 'kind', 'name', 'visibility', 'npc_ids', 'epistemic',
                            'data', 'provenance', 'facts', 'status', 'player_safe'))
FACT_FIELDS = frozenset(('id', 'text', 'visibility', 'npc_ids', 'player_safe', 'epistemic', 'provenance'))
PROVENANCE_FIELDS = frozenset(('source_id', 'filename', 'page', 'sha256', 'excerpt', 'locator', 'session_id', 'note'))


class RevisionConflict(ValueError):
    """A proposal was based on an earlier state. Review a newly generated proposal."""


def _now():
    return datetime.now(timezone.utc).isoformat()


def _json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, allow_nan=False)


def _identifier(value, field='id'):
    if not isinstance(value, str) or not ID_PATTERN.fullmatch(value):
        raise ValueError('%s must be a stable identifier (letters, numbers, :_.-)' % field)
    return value


def _audience(audience, npc_id):
    if audience not in VISIBILITIES:
        raise ValueError('Unknown audience')
    if audience == 'npc':
        _identifier(npc_id, 'npc_id')


def _allowed(value, audience, npc_id=None):
    if audience == 'dm':
        return True
    visibility = value.get('visibility', 'dm')
    if audience == 'player':
        return visibility == 'player'
    # NPC speech needs both explicit individual knowledge AND permission to disclose.
    return (visibility != 'dm' and npc_id in value.get('npc_ids', []) and
            (visibility == 'player' or value.get('player_safe') is True))


def _provenance(value):
    if not isinstance(value, list) or len(value) > 100:
        raise ValueError('provenance must be an array of at most 100 citations')
    result = []
    for item in value:
        if not isinstance(item, dict) or set(item) - PROVENANCE_FIELDS:
            raise ValueError('Unknown provenance fields')
        _identifier(item.get('source_id'), 'source_id')
        for key, val in item.items():
            if key == 'page':
                if isinstance(val, bool) or not isinstance(val, int) or val < 1:
                    raise ValueError('Citation page is a one-based integer')
            elif not isinstance(val, str) or len(val) > 12000:
                raise ValueError('Citation fields must be bounded text')
        result.append(copy.deepcopy(item))
    return result


def _knowledge(value):
    visibility = value.get('visibility', 'dm')
    if visibility not in VISIBILITIES:
        raise ValueError('visibility must be dm, player, or npc')
    epistemic = value.get('epistemic', 'unresolved')
    if epistemic not in EPISTEMIC:
        raise ValueError('epistemic must be confirmed, inferred, or unresolved')
    npc_ids = value.get('npc_ids', [])
    if not isinstance(npc_ids, list) or len(npc_ids) > 100:
        raise ValueError('npc_ids must be an array')
    npc_ids = sorted(set(_identifier(item, 'npc_id') for item in npc_ids))
    player_safe = value.get('player_safe', False)
    if not isinstance(player_safe, bool):
        raise ValueError('player_safe must be boolean')
    if visibility == 'dm' and player_safe:
        raise ValueError('DM-only information cannot be marked player_safe')
    if visibility == 'npc' and not npc_ids:
        raise ValueError('NPC information must name its authorized NPCs')
    return dict(visibility=visibility, epistemic=epistemic, npc_ids=npc_ids, player_safe=player_safe)


def validate_record(record):
    """Validate a complete replacement record; unknown fields fail closed."""
    if not isinstance(record, dict) or set(record) - RECORD_FIELDS:
        raise ValueError('Unknown record fields')
    result = {'id': _identifier(record.get('id'))}
    if record.get('kind') not in KINDS:
        raise ValueError('Unknown record kind')
    result['kind'] = record['kind']
    name = record.get('name')
    if not isinstance(name, str) or not name.strip() or len(name) > 300:
        raise ValueError('name must be nonempty text up to 300 characters')
    result['name'] = name.strip()
    result.update(_knowledge(record))
    data = record.get('data', {})
    if not isinstance(data, dict) or len(_json(data)) > 100000:
        raise ValueError('data must be a JSON object up to 100000 characters')
    result['data'] = copy.deepcopy(data)
    result['provenance'] = _provenance(record.get('provenance') or [{'source_id': 'dm-entry', 'filename': 'DM entry', 'note': 'Direct DM state entry; no external source supplied'}])
    status = record.get('status', 'active')
    if not isinstance(status, str) or len(status) > 100:
        raise ValueError('status must be bounded text')
    result['status'] = status
    facts = record.get('facts', [])
    if not isinstance(facts, list) or len(facts) > 500:
        raise ValueError('facts must be an array of at most 500 facts')
    result['facts'] = []
    seen = set()
    for index, fact in enumerate(facts):
        if not isinstance(fact, dict) or set(fact) - FACT_FIELDS:
            raise ValueError('Unknown fact fields')
        fact_id = _identifier(fact.get('id', result['id'] + ':fact:' + str(index + 1)), 'fact.id')
        if fact_id in seen:
            raise ValueError('Duplicate fact id')
        seen.add(fact_id)
        text = fact.get('text')
        if not isinstance(text, str) or not text.strip() or len(text) > 20000:
            raise ValueError('fact.text must be nonempty text up to 20000 characters')
        normalized = dict(id=fact_id, text=text.strip(), **_knowledge(fact))
        normalized['provenance'] = _provenance(fact.get('provenance') or result['provenance'])
        result['facts'].append(normalized)
    return result


def _opaque_id(value):
    return 'ref-' + hashlib.sha256(value.encode()).hexdigest()[:24]


def _public_citations(items):
    # IDs can themselves contain spoilers, so preserve traceability with an opaque
    # deterministic reference. Never forward private filenames/excerpts/notes.
    return [{**{key: value for key, value in item.items() if key in ('page', 'sha256')},
             'source_id': _opaque_id(item['source_id'])} for item in items]


class CampaignStore:
    def __init__(self, db_path):
        self.db_path = Path(db_path).expanduser().resolve()
        parent_existed = self.db_path.parent.exists()
        self.db_path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        if not parent_existed:
            self.db_path.parent.chmod(0o700)
        with self.connection() as db:
            db.executescript((Path(__file__).resolve().parents[1] / 'migrations' / '001_campaign_state.sql').read_text())
            db.execute("INSERT OR REPLACE INTO campaign_meta VALUES ('schema_version', '1')")
        try:
            self.db_path.chmod(0o600)
        except OSError:
            pass

    @contextmanager
    def connection(self):
        db = sqlite3.connect(str(self.db_path), timeout=30)
        db.row_factory = sqlite3.Row
        db.execute('PRAGMA foreign_keys = ON')
        db.execute('PRAGMA journal_mode = WAL')
        try:
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def revision(self):
        with self.connection() as db:
            return int(db.execute("SELECT value FROM campaign_meta WHERE key='revision'").fetchone()[0])

    def _project(self, record, audience, npc_id):
        if audience == 'dm':
            return record
        facts = [f for f in record['facts'] if _allowed(f, audience, npc_id)]
        if not _allowed(record, audience, npc_id):
            # A disclosed fact does not disclose its parent name, identity, or private data.
            return None
        return {'id': record['id'], 'kind': record['kind'], 'name': record['name'],
                'visibility': record['visibility'], 'epistemic': record['epistemic'],
                'facts': [{**{k: v for k, v in fact.items() if k not in ('provenance', 'npc_ids')},
                           'id': _opaque_id(fact['id']), 'provenance': _public_citations(fact['provenance'])} for fact in facts],
                'provenance': _public_citations(record['provenance'])}

    def list_records(self, audience='dm', npc_id=None, kind=None):
        _audience(audience, npc_id)
        if kind is not None and kind not in KINDS:
            raise ValueError('Unknown record kind')
        with self.connection() as db:
            rows = db.execute('SELECT body FROM campaign_records' + (' WHERE kind=?' if kind else '') + ' ORDER BY id',
                              (kind,) if kind else ()).fetchall()
        records = [self._project(json.loads(row['body']), audience, npc_id) for row in rows]
        return [record for record in records if record is not None]

    def get_record(self, id, audience='dm', npc_id=None):
        _audience(audience, npc_id)
        _identifier(id)
        with self.connection() as db:
            row = db.execute('SELECT body FROM campaign_records WHERE id=?', (id,)).fetchone()
        return self._project(json.loads(row['body']), audience, npc_id) if row else None

    def upsert_record(self, record, expected_revision=None, actor='dm'):
        result = self.apply_mutations([{'op': 'upsert', 'record': record}], expected_revision, actor=actor)
        return result['records'][0]

    def _write_record(self, db, record):
        record_id = record['id']
        old_facts = db.execute('SELECT id FROM campaign_facts WHERE record_id=?', (record_id,)).fetchall()
        for row in old_facts:
            db.execute("DELETE FROM campaign_search WHERE id=? AND doc_type='fact'", (row['id'],))
        db.execute('DELETE FROM campaign_facts WHERE record_id=?', (record_id,))
        timestamp = _now()
        db.execute('''INSERT INTO campaign_records(id,kind,body,created_at,updated_at) VALUES(?,?,?,?,?)
                      ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,body=excluded.body,updated_at=excluded.updated_at''',
                   (record_id, record['kind'], _json(record), timestamp, timestamp))
        for fact in record['facts']:
            db.execute('INSERT INTO campaign_facts VALUES(?,?,?,?,?,?,?,?)',
                       (fact['id'], record_id, fact['text'], fact['visibility'], _json(fact['npc_ids']),
                        int(fact['player_safe']), fact['epistemic'], _json(fact['provenance'])))
            db.execute('INSERT INTO campaign_search(id,doc_type,text) VALUES(?,?,?)', (fact['id'], 'fact', fact['text']))

    def apply_mutations(self, mutations, expected_revision, actor='dm', session_id=None, commit_hook=None, managed=False):
        if actor != 'dm':
            raise PermissionError('Only the DM can change campaign state')
        if not isinstance(mutations, list) or (not mutations and commit_hook is None) or len(mutations) > (20000 if managed else 500):
            raise ValueError('mutations must contain 1 to 500 operations; empty commits require a receipt hook')
        if expected_revision is not None and (isinstance(expected_revision, bool) or not isinstance(expected_revision, int)):
            raise ValueError('expected_revision must be an integer')
        if session_id is not None:
            _identifier(session_id, 'session_id')
        normalized, seen = [], set()
        for mutation in mutations:
            if not isinstance(mutation, dict):
                raise ValueError('Mutation must be an object')
            if mutation.get('op') == 'upsert' and set(mutation) <= {'op', 'record'}:
                record = validate_record(mutation.get('record'))
                normalized.append({'op': 'upsert', 'record': record})
                identifier = record['id']
            elif mutation.get('op') == 'delete' and set(mutation) <= {'op', 'id'}:
                identifier = _identifier(mutation.get('id'))
                normalized.append({'op': 'delete', 'id': identifier})
            else:
                raise ValueError('Mutation must be upsert(record) or delete(id)')
            if identifier in seen:
                raise ValueError('A batch cannot mutate the same record twice')
            seen.add(identifier)
        with self.connection() as db:
            db.execute('BEGIN IMMEDIATE')
            revision = int(db.execute("SELECT value FROM campaign_meta WHERE key='revision'").fetchone()[0])
            if expected_revision is not None and expected_revision != revision:
                raise RevisionConflict('Campaign changed: expected revision %s, current revision %s' % (expected_revision, revision))
            records, deleted = [], []
            if not managed and db.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='outcome_mirrors'").fetchone():
                for identifier in seen:
                    if db.execute('SELECT 1 FROM outcome_mirrors WHERE id=?', (identifier,)).fetchone():
                        raise RevisionConflict('This record is linked to an approved browser outcome. Correct it in Outcome review.')
            for mutation in normalized:
                if mutation['op'] == 'upsert':
                    try:
                        self._write_record(db, mutation['record'])
                    except sqlite3.IntegrityError as error:
                        raise ValueError('Fact IDs must be unique across all records') from error
                    records.append(mutation['record'])
                else:
                    identifier = mutation['id']
                    for row in db.execute('SELECT id FROM campaign_facts WHERE record_id=?', (identifier,)).fetchall():
                        db.execute("DELETE FROM campaign_search WHERE id=? AND doc_type='fact'", (row['id'],))
                    if not db.execute('DELETE FROM campaign_records WHERE id=?', (identifier,)).rowcount:
                        raise ValueError('Cannot delete missing record: ' + identifier)
                    deleted.append(identifier)
            revision += 1
            db.execute("UPDATE campaign_meta SET value=? WHERE key='revision'", (str(revision),))
            db.execute('INSERT INTO campaign_audit(revision,actor,session_id,created_at,mutations) VALUES(?,?,?,?,?)',
                       (revision, actor, session_id, _now(), _json(normalized)))
            result = {'revision': revision, 'records': records, 'deleted': deleted}
            if commit_hook is not None:
                commit_hook(db, result)
        return result

    def summary(self):
        """DM-only state/index counts; callers must enforce their DM transport gate."""
        with self.connection() as db:
            counts = {row['kind']: row['total'] for row in db.execute('SELECT kind,COUNT(*) AS total FROM campaign_records GROUP BY kind')}
            return {'revision': int(db.execute("SELECT value FROM campaign_meta WHERE key='revision'").fetchone()[0]),
                    'records': sum(counts.values()), 'by_kind': counts,
                    'facts': db.execute('SELECT COUNT(*) FROM campaign_facts').fetchone()[0],
                    'sources': db.execute('SELECT COUNT(*) FROM campaign_sources').fetchone()[0],
                    'chunks': db.execute('SELECT COUNT(*) FROM campaign_chunks').fetchone()[0], 'schema_version': 1}

    def source_manifest(self):
        with self.connection() as db:
            rows = db.execute('SELECT * FROM campaign_sources ORDER BY filename').fetchall()
        return [{**dict(row), 'metadata': json.loads(row['metadata'])} for row in rows]

    def put_source(self, source, chunks):
        """Replace the search index for one changed source, leaving all DM state intact."""
        _identifier(source['id'], 'source.id')
        if source.get('visibility') not in ('dm', 'player'):
            raise ValueError('Source visibility must be explicitly dm or player')
        with self.connection() as db:
            db.execute('BEGIN IMMEDIATE')
            old = db.execute('SELECT sha256, visibility FROM campaign_sources WHERE id=?', (source['id'],)).fetchone()
            if old and old['sha256'] == source['sha256'] and old['visibility'] == source['visibility']:
                return False
            old_ids = db.execute('SELECT id FROM campaign_chunks WHERE source_id=?', (source['id'],)).fetchall()
            for row in old_ids:
                db.execute("DELETE FROM campaign_search WHERE id=? AND doc_type='source'", (row['id'],))
            db.execute('DELETE FROM campaign_sources WHERE id=?', (source['id'],))
            db.execute('INSERT INTO campaign_sources VALUES(?,?,?,?,?,?,?,?)',
                       (source['id'], source['filename'], source['sha256'], source['visibility'],
                        source['format'], source['page_count'], _now(), _json(source.get('metadata', {}))))
            for chunk in chunks:
                db.execute('INSERT INTO campaign_chunks VALUES(?,?,?,?,?,?,?)',
                           (chunk['id'], source['id'], chunk['page'], chunk['chunk_index'], chunk['text'],
                            chunk['sha256'], chunk.get('epistemic', 'unresolved')))
                db.execute('INSERT INTO campaign_search(id,doc_type,text) VALUES(?,?,?)',
                           (chunk['id'], 'source', chunk['text']))
        return True

    def remove_source(self, source_id):
        """Revoke stale/deleted source chunks; record provenance survives as history."""
        _identifier(source_id, 'source_id')
        with self.connection() as db:
            db.execute('BEGIN IMMEDIATE')
            for row in db.execute('SELECT id FROM campaign_chunks WHERE source_id=?', (source_id,)).fetchall():
                db.execute("DELETE FROM campaign_search WHERE id=? AND doc_type='source'", (row['id'],))
            db.execute('DELETE FROM campaign_sources WHERE id=?', (source_id,))

    def search(self, query, audience='dm', npc_id=None, limit=12):
        _audience(audience, npc_id)
        if not isinstance(query, str) or len(query) > 2000:
            raise ValueError('query must be text up to 2000 characters')
        if isinstance(limit, bool) or not isinstance(limit, int) or not 1 <= limit <= 100:
            raise ValueError('limit must be 1 to 100')
        tokens = [token for token in re.findall(r'[^\W_]+', query, re.UNICODE) if token.lower() not in SEARCH_STOPWORDS][:32]
        if not tokens:
            return []
        match = ' OR '.join('"' + token.replace('"', '""') + '"' for token in tokens)
        fact_permission = '1=1' if audience == 'dm' else "f.visibility='player'"
        params = [match]
        if audience == 'npc':
            fact_permission = "f.visibility!='dm' AND (f.visibility='player' OR f.player_safe=1) AND EXISTS (SELECT 1 FROM json_each(f.npc_ids) WHERE value=?)"
            params.append(npc_id)
        source_permission = '1=1' if audience == 'dm' else "s.visibility='player'" if audience == 'player' else '0=1'
        # Authorization is applied inside the query BEFORE ranking/limiting, so many
        # hidden matches cannot crowd out an authorized answer or reveal their count.
        sql = '''SELECT campaign_search.id, campaign_search.doc_type, campaign_search.text,
                 bm25(campaign_search) AS rank, f.record_id, f.epistemic AS fact_epistemic,
                 f.visibility AS fact_visibility, f.provenance, c.source_id, c.page,
                 c.epistemic AS source_epistemic, s.filename, s.sha256, s.visibility AS source_visibility,
                 s.metadata, r.body AS record_body
                 FROM campaign_search
                 LEFT JOIN campaign_facts f ON campaign_search.doc_type='fact' AND f.id=campaign_search.id
                 LEFT JOIN campaign_records r ON r.id=f.record_id
                 LEFT JOIN campaign_chunks c ON campaign_search.doc_type='source' AND c.id=campaign_search.id
                 LEFT JOIN campaign_sources s ON s.id=c.source_id
                 WHERE campaign_search MATCH ? AND
                 ((campaign_search.doc_type='fact' AND (''' + fact_permission + ''')) OR
                  (campaign_search.doc_type='source' AND (''' + source_permission + ''')))
                 ORDER BY CASE WHEN campaign_search.doc_type='fact' AND json_extract(r.body,'$.data.scope')='current-linked-state' THEN -1
                   WHEN campaign_search.doc_type='fact' THEN 0
                   WHEN json_extract(s.metadata,'$.authority') IN ('actual_play','current_campaign') THEN 1
                   WHEN json_extract(s.metadata,'$.authority')='current_dm_plan' THEN 2
                   WHEN json_extract(s.metadata,'$.authority')='campaign_reference' THEN 3
                   WHEN json_extract(s.metadata,'$.authority') IN ('compiled_campaign_reference','compiled_player_reference') THEN 4
                   ELSE 5 END, rank, campaign_search.id LIMIT ?'''
        params.append(limit)
        with self.connection() as db:
            rows = db.execute(sql, params).fetchall()
        result = []
        for row in rows:
            if row['doc_type'] == 'fact':
                citations = json.loads(row['provenance'])
                item = {'id': row['id'] if audience == 'dm' else _opaque_id(row['id']), 'type': 'fact', 'text': row['text'],
                        'epistemic': row['fact_epistemic'], 'visibility': row['fact_visibility'],
                        'citations': citations if audience == 'dm' else _public_citations(citations)}
                if audience == 'dm':
                    item['record_id'] = row['record_id']
                data = json.loads(row['record_body']).get('data', {})
                item['authority'] = 'browser-outcome' if data.get('authority') == 'browser-outcome' else 'service-reference'
                item['source_warning'] = ('Current state from explicit reviewed links; do not infer unrecorded developments.' if data.get('scope') == 'current-linked-state'
                                              else 'Historical event; not necessarily the current situation.' if data.get('scope') == 'historical-event'
                                              else 'Separate service reference. Reconcile played events in browser Outcome review before treating this as current table state.')
            else:
                metadata = json.loads(row['metadata'])
                citation = {'source_id': row['source_id'], 'filename': row['filename'], 'page': row['page'], 'sha256': row['sha256']}
                item = {'id': row['id'], 'type': 'source', 'text': row['text'],
                        'epistemic': row['source_epistemic'], 'visibility': row['source_visibility'],
                        'citations': [citation], 'authority': metadata.get('authority', 'reference'),
                        'source_warning': metadata.get('source_warning', '')}
            result.append(item)
        return result
