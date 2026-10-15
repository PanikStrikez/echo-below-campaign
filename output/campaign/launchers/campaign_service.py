"""DM-local integration API for structured state, grounded retrieval and sessions."""
from __future__ import annotations

import hashlib
import ipaddress
import json
import os
from pathlib import Path
import re
import secrets
import threading
import time
import tempfile
import shutil
from urllib.parse import urlsplit

from ai_service import AIError, AIService
from campaign_store import CampaignStore, KINDS, RevisionConflict
from campaign_sessions import SessionEngine, checked_text
from campaign_reconciliation import Reconciler
from campaign_backup import WholeBackup, MAX_UPLOAD, export_store
from campaign_voice import VoiceService
from voice_audition import VoiceAuditionService

PREFIX = '/__echo_campaign'
MAX_BODY = 2_000_000


class CampaignService:
    def __init__(self, state_dir, served_root, port=48261, ai_service=None):
        self.state_dir = Path(state_dir).expanduser().resolve()
        self.root = Path(served_root).resolve()
        if self.state_dir.is_relative_to(self.root):
            raise ValueError('Campaign databases must remain outside the served tree.')
        self.port = port
        self.ai = ai_service
        self.token = secrets.token_urlsafe(32)
        self.lock = threading.RLock()
        self.engines, self.replies, self.indexes, self.ai_jobs = {}, {}, {}, {}
        self.backups=WholeBackup(self)

    def engine(self, campaign_id):
        if not isinstance(campaign_id, str) or not re.fullmatch(r'[A-Za-z0-9_.:-]{1,120}', campaign_id):
            raise AIError('invalid_campaign', 'Choose a valid campaign identifier.')
        with self.lock:
            if campaign_id not in self.engines:
                self.state_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
                self.state_dir.chmod(0o700)
                folder = self.state_dir / hashlib.sha256(campaign_id.encode()).hexdigest()[:24]
                store = CampaignStore(folder / 'campaign.sqlite3')
                from campaign_sources import seed_initial_state
                if campaign_id in ('default', 'echo-below'):
                    seed_initial_state(store, self.root / 'sources', self.root / 'output' / 'campaign')
                sessions = SessionEngine(store)
                if self.ai:
                    with self.ai.lock:
                        if self.ai.voice_service is None:
                            self.ai.voice_service = VoiceAuditionService(self.ai.state_dir)
                        auditions = self.ai.voice_service
                    voices = VoiceService(store, audition_service=auditions)
                else:
                    voices = VoiceService(store)
                self.engines[campaign_id] = (store, sessions, voices)
            return self.engines[campaign_id]

    def authorize(self, handler, method, path):
        host = handler.headers.get('Host', '')
        try:
            local = ipaddress.ip_address(handler.client_address[0]).is_loopback
        except ValueError:
            local = False
        if not local or host not in (f'127.0.0.1:{self.port}', f'localhost:{self.port}'):
            raise AIError('local_only', 'Campaign control is available only in the local DM app.', 403)
        origin = handler.headers.get('Origin')
        if origin and origin != 'http://' + host or handler.headers.get('Sec-Fetch-Site') in ('cross-site','same-site'):
            raise AIError('origin_rejected', 'Open campaign control in the same local app.', 403)
        if path != '/bootstrap' or method != 'GET':
            token = handler.headers.get('X-Echo-Campaign-Token', '')
            if not secrets.compare_digest(token, self.token):
                raise AIError('token_required', 'Reopen campaign control and try again.', 403)
        if method == 'POST' and origin != 'http://' + host:
            raise AIError('origin_required', 'A local DM origin is required.', 403)

    def _index(self, campaign_id, store):
        with self.lock:
            if self.indexes.get(campaign_id, {}).get('status') == 'running':
                return dict(self.indexes[campaign_id])
            self.indexes[campaign_id] = {'status': 'running', 'message': 'Reading local source files.'}
        def work():
            try:
                from campaign_sources import ingest_sources
                report = ingest_sources(store, self.root / 'sources', self.root / 'output' / 'campaign',
                                        seed=campaign_id in ('default', 'echo-below'))
                result = {'status': 'completed', 'report': report}
            except Exception:
                result = {'status': 'failed', 'message': 'Source indexing failed. Check the local extractor setup; existing campaign state is preserved.'}
            with self.lock:
                self.indexes[campaign_id] = result
        threading.Thread(target=work, daemon=True).start()
        return {'status': 'running', 'message': 'Source indexing started; refresh status for its report.'}

    def status(self, campaign_id, store, voices):
        records = store.list_records()
        return {'campaignId': campaign_id, 'revision': store.revision(),
                'counts': {kind: sum(r['kind'] == kind for r in records) for kind in sorted(KINDS)},
                'sources': store.source_manifest(), 'indexing': self.indexes.get(campaign_id, {'status': 'not_started'}),
                'voice': voices.profiles(), 'storage': 'private-local-sqlite',
                'aiConfigured': bool(self.ai and self.ai.status()['settings']['enabled'])}

    def ask(self, campaign_id, store, payload):
        if not self.ai:
            raise AIError('ai_unavailable', 'Open AI assistance settings to configure a provider.', 503)
        query = checked_text(payload.get('query'), 2000)
        audience, npc = payload.get('audience', 'dm'), payload.get('npcId')
        if audience == 'npc':
            raise AIError('npc_grounding_required', 'Use NPC voices for strictly grounded NPC replies.')
        results = store.search(query, audience=audience, npc_id=npc, limit=12)
        # Do not cut off a trailing qualification or negation to fit provider context.
        results = [row for row in results if len(row['text']) <= 4000]
        context = {'version': 1, 'audience': audience, 'subjectId': 'campaign' if audience == 'dm' else 'pc-party', 'records': []}
        for row in results:
            row['aiSourceId'] = 'ref-' + hashlib.sha256(row['id'].encode()).hexdigest()[:24]
            context['records'].append({'sourceId': row['aiSourceId'],
                                      'kind': row['type'], 'title': 'Authorized campaign reference',
                                      'text': row['text'],
                                      'status': 'confirmed' if row['epistemic'] == 'confirmed' else 'unconfirmed',
                                      'basis': (row['epistemic'] + '; ' + row.get('authority', 'approved_state') + '; '
                                                + row.get('source_warning', '') + '; ' + json.dumps(row.get('citations', [])))[:600]})
        prompt = ('Answer the question only from the supplied references. If unsupported, say the information is unresolved. '
                  'Cite source IDs. Campaign-specific sources take precedence over published lore; actual-play records take precedence over planned scenes. '
                  'Do not use recalled D&D lore to fill gaps. Do not treat inference or unresolved text as established. Question: ' + query)
        job = self.ai.create_job({'requestId': 'campaign-' + secrets.token_hex(12), 'context': context, 'prompt': prompt})
        self.ai_jobs[job['id']] = campaign_id
        return {'job': job, 'results': results}

    def dispatch(self, method, path, payload, campaign_id):
        if method == 'GET' and path == '/bootstrap':
            return {'token': self.token, 'version': 1}
        store, sessions, voices = self.engine(campaign_id)
        if method == 'GET' and path == '/status':
            return self.status(campaign_id, store, voices)
        if method == 'GET' and path == '/voice/profiles':
            return {'profiles': voices.profiles()}
        if method == 'GET' and path == '/sessions':
            return {'sessions': sessions.list()}
        if method == 'GET' and re.fullmatch(r'/sessions/[A-Za-z0-9_-]+', path):
            return {'draft': sessions.get(path.split('/')[2])}
        if method == 'GET' and path.startswith('/ai/jobs/'):
            identifier = path.rsplit('/', 1)[1]
            if not self.ai or self.ai_jobs.get(identifier) != campaign_id:
                raise AIError('not_found', 'That AI draft does not belong to this campaign.', 404)
            return {'job': self.ai.get_job(identifier)}
        if method != 'POST':
            raise AIError('not_found', 'That campaign endpoint does not exist.', 404)
        if path == '/records/query':
            return {'records': store.list_records(audience=payload.get('audience', 'dm'), npc_id=payload.get('npcId'), kind=payload.get('kind') or None), 'revision': store.revision()}
        if path in ('/backup/prepare','/backup/commit','/backup/cancel'):
            with self.lock:
                if path=='/backup/prepare':return self.backups.prepare(payload.get('ticket'),payload.get('targetCampaignId'))
                if path=='/backup/commit':return self.backups.commit(payload.get('ticket'),payload.get('targetCampaignId'))
                return self.backups.cancel(payload.get('ticket'))
        if path=='/backup/check':
            snapshot=export_store(store,campaign_id)
            return {'compatible':True,'databaseVersion':snapshot['schemaVersion'],'structuredRecords':len(snapshot['tables']['campaign_records']),'referenceIndexes':'excluded; rebuild locally'}
        if path == '/outcomes/preview':
            return Reconciler(store, campaign_id).preview(payload.get('snapshot'))
        if path == '/outcomes/apply':
            return Reconciler(store, campaign_id).apply(payload)
        if path == '/outcomes/status':
            return Reconciler(store, campaign_id).head()
        if path == '/outcomes/history':
            mirror=Reconciler(store,campaign_id)
            return {'entry':mirror.history_detail(payload['sequence'])} if 'sequence' in payload else {'history':mirror.history()}
        if path == '/records/upsert':
            if type(payload.get('expectedRevision')) is not int:
                raise AIError('revision_required', 'Reload campaign state before saving a record.', 409)
            record = store.upsert_record(payload.get('record'), expected_revision=payload['expectedRevision'])
            return {'record': record, 'revision': store.revision()}
        if path == '/search':
            results = store.search(checked_text(payload.get('query'), 2000), audience=payload.get('audience', 'dm'), npc_id=payload.get('npcId'), limit=12)
            answer = '\n\n'.join('[' + r['epistemic'] + '] ' + r['text'] for r in results[:4]) if results else 'No permitted evidence was found. This remains unresolved for this audience.'
            return {'results': results, 'answer': answer, 'mode': 'local-cited-search'}
        if path == '/ai/ask':
            return self.ask(campaign_id, store, payload)
        if path == '/voice/config':
            return {'config': voices.agent_config(payload.get('npcId'))}
        if path == '/voice/configure':
            if set(payload) != {'npcId', 'voiceId', 'expectedRevision'}:
                raise AIError('invalid_voice_config', 'Voice configuration accepts only an NPC, stock voice ID, and current revision.')
            return voices.configure(payload['npcId'], payload['voiceId'], payload['expectedRevision'])
        if path == '/voice/reply':
            revision = store.revision()
            result = voices.reply(payload.get('npcId'), payload.get('query'))
            if revision != store.revision():
                raise AIError('knowledge_changed', 'Campaign knowledge changed. Ask the NPC again.', 409)
            reply_id = secrets.token_urlsafe(24)
            with self.lock:
                self.replies = {k:v for k,v in self.replies.items() if time.monotonic() - v['at'] < 900}
                if len(self.replies) >= 200:
                    self.replies.pop(next(iter(self.replies)))
                self.replies[reply_id] = {'campaign': campaign_id, 'npc': payload['npcId'], 'text': result['text'],
                                          'at': time.monotonic(), 'revision': revision, 'spoken': False}
            return {**result, 'replyId': reply_id}
        if path == '/voice/speak':
            if set(payload) != {'replyId'} or not isinstance(payload.get('replyId'), str):
                raise AIError('invalid_voice_request', 'Play a server-generated NPC reply; arbitrary text is not accepted.')
            with self.lock:
                reply = self.replies.get(payload['replyId'])
                if not reply or reply['campaign'] != campaign_id or time.monotonic() - reply['at'] >= 900:
                    raise AIError('reply_expired', 'Ask the NPC again before playing this reply.', 409)
                if reply['revision'] != store.revision():
                    raise AIError('knowledge_changed', 'Campaign knowledge changed. Ask the NPC again.', 409)
                if reply['spoken']:
                    raise AIError('already_spoken', 'This reply has already been sent for speech. Ask again to generate another.', 409)
                # Consume before dispatch to prevent double billing on retries.
                reply['spoken'] = True
            return voices.synthesize(reply['npc'], reply['text'])
        if path == '/sources/reindex':
            return {'indexing': self._index(campaign_id, store)}
        if path == '/sessions/analyze':
            return {'draft': sessions.analyze(payload.get('title'), payload.get('notes'), payload.get('playerNotes', ''))}
        if path == '/import/preview':
            if payload.get('campaignId') != campaign_id:
                raise AIError('campaign_mismatch', 'Import into the currently selected campaign only.', 409)
            return {'draft': sessions.import_story(campaign_id, payload.get('sessionId', ''), payload.get('story'))}
        match = re.fullmatch(r'/sessions/([A-Za-z0-9_-]+)/(save|commit)', path)
        if match:
            if match[2] == 'save':
                return {'draft': sessions.save(match[1], payload.get('draft'))}
            return sessions.commit(match[1], payload.get('expectedRevision'), payload.get('mutationIds'),
                                   payload.get('playerRecapApproved'), payload.get('draftVersion'))
        raise AIError('not_found', 'That campaign endpoint does not exist.', 404)

    def handle(self, handler, method):
        route = urlsplit(handler.path).path
        if route != PREFIX and not route.startswith(PREFIX + '/'):
            return False
        path = route[len(PREFIX):]
        try:
            self.authorize(handler, method, path)
            if method not in ('GET', 'POST'):
                raise AIError('method_not_allowed', 'Use GET or POST for campaign control.', 405)
            payload = {}
            if method=='POST' and path=='/backup/upload':
                if handler.headers.get('Transfer-Encoding') or handler.headers.get('Content-Type','').split(';')[0]!='application/zip':
                    raise AIError('invalid_content_type','Choose a whole-campaign ZIP.',415)
                length=int(handler.headers.get('Content-Length','0'))
                if not 0<length<=MAX_UPLOAD:raise AIError('body_too_large','Backup is empty or exceeds 4 GB.',413)
                with tempfile.TemporaryDirectory(prefix='echo-backup-upload-') as folder:
                    uploaded=Path(folder)/'backup.zip'
                    with uploaded.open('wb') as dst:
                        remaining=length
                        while remaining:
                            chunk=handler.rfile.read(min(1024*1024,remaining))
                            if not chunk:raise ValueError('Backup upload was interrupted. The original campaign was not changed.')
                            dst.write(chunk);remaining-=len(chunk)
                    with self.lock:result=self.backups.stage(uploaded)
                    AIService._respond(handler,200,json.dumps(result,ensure_ascii=False).encode())
                return True
            if method == 'POST':
                if handler.headers.get('Transfer-Encoding'):
                    raise AIError('invalid_body', 'Transfer encoding is not supported.')
                if handler.headers.get('Content-Type', '').split(';')[0].strip() != 'application/json':
                    raise AIError('invalid_content_type', 'Use a JSON request body.', 415)
                try:
                    length = int(handler.headers.get('Content-Length', '0'))
                except ValueError:
                    raise AIError('invalid_body', 'A valid body length is required.') from None
                limit=300_000_000 if path=='/backup/create' else MAX_BODY
                if not 0 < length <= limit:
                    raise AIError('body_too_large', 'The request is empty or exceeds '+('300 MB of browser data.' if path=='/backup/create' else '2 MB.'), 413)
                try:
                    payload = json.loads(handler.rfile.read(length))
                except (ValueError, UnicodeError):
                    raise AIError('invalid_json', 'Use a valid JSON object.') from None
                if not isinstance(payload, dict):
                    raise AIError('invalid_json', 'Use a JSON object.')
            campaign_id = handler.headers.get('X-Echo-Campaign-Id', 'echo-below')
            if method=='POST' and path=='/backup/create':
                with tempfile.TemporaryDirectory(prefix='echo-whole-backup-') as folder:
                    output=Path(folder)/'campaign.zip'
                    self.backups.create(campaign_id,payload.get('archive',{}),output)
                    handler.send_response(200)
                    for name,value in {'Content-Type':'application/zip','Content-Length':str(output.stat().st_size),'Content-Disposition':'attachment; filename="Echo-Whole-Campaign.zip"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}.items():handler.send_header(name,value)
                    handler.end_headers()
                    with output.open('rb') as src:shutil.copyfileobj(src,handler.wfile)
                return True
            result = self.dispatch(method, path, payload, campaign_id)
            if isinstance(result, tuple):
                AIService._respond(handler, 200, result[0], result[1])
            else:
                AIService._respond(handler, 200, json.dumps(result, ensure_ascii=False).encode())
        except Exception as exc:
            if isinstance(exc, AIError):
                status, code, message = exc.status, exc.code, exc.message
            elif isinstance(exc, RevisionConflict):
                status, code, message = 409, 'revision_conflict', 'Campaign state changed. Regenerate this draft and review it against current state.'
            elif isinstance(exc, (ValueError, TypeError)):
                status, code, message = 400, 'invalid_request', str(exc)[:300]
            else:
                status, code, message = 500, 'service_error', 'The campaign service could not finish this action. No partial transaction was committed.'
            AIService._respond(handler, status, json.dumps({'error': {'code': code, 'message': message}}).encode())
        return True
