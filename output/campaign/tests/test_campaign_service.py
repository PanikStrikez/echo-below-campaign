"""Campaign API boundaries: real SQLite stores, mocked AI/voice, no network."""
import copy
import io
import json
from pathlib import Path
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'launchers'))
from ai_service import AIError, validate_context
from campaign_service import CampaignService, PREFIX, MAX_BODY


class Handler:
    def __init__(self, path, body=None, headers=None, client='127.0.0.1'):
        self.path, self.client_address = path, (client, 12345)
        self.headers = {'Host': '127.0.0.1:48261', **(headers or {})}
        encoded = json.dumps(body).encode() if body is not None else b''
        self.rfile, self.wfile = io.BytesIO(encoded), io.BytesIO()
        self.headers.setdefault('Content-Length', str(len(encoded)))
        self.headers.setdefault('Content-Type', 'application/json')
        self.response_headers, self.code = {}, None

    def send_response(self, code):
        self.code = code

    def send_header(self, key, value):
        self.response_headers[key] = value

    def end_headers(self):
        pass

    def json(self):
        return json.loads(self.wfile.getvalue())


class VoiceFixture:
    def __init__(self, store, **kwargs):
        self.store, self.sent = store, []

    def profiles(self):
        return []

    def reply(self, npc_id, query):
        results = self.store.search(query, audience='npc', npc_id=npc_id)
        return {'npc_id': npc_id, 'text': ' '.join(row['text'] for row in results) or 'Unknown.',
                'citations': [], 'grounded': bool(results)}

    def synthesize(self, npc_id, text):
        self.sent.append((npc_id, text))
        return b'ID3fixture', 'audio/mpeg'


class AIFixture:
    def __init__(self):
        self.lock = threading.RLock()
        self.voice_service = object()
        self.submitted = []

    def create_job(self, payload):
        validate_context(payload['context'])
        self.submitted.append(copy.deepcopy(payload))
        return {'id': 'ai-fixture-' + str(len(self.submitted)), 'status': 'completed'}

    def get_job(self, identifier):
        return {'id': identifier, 'status': 'completed', 'text': 'Scoped fixture result.'}

    def status(self):
        return {'settings': {'enabled': True}}


def record(identifier, text, visibility='dm', npc_ids=None, player_safe=False):
    return {'id': identifier, 'kind': 'clue', 'name': 'SECRET parent name',
            'visibility': 'dm', 'epistemic': 'confirmed',
            'data': {'secret': 'SECRET arbitrary data'},
            'facts': [{'id': identifier + '-fact', 'text': text, 'visibility': visibility,
                       'npc_ids': npc_ids or [], 'player_safe': player_safe, 'epistemic': 'confirmed',
                       'provenance': [{'source_id': 'source-fixture', 'filename': 'SECRET source title',
                                       'page': 1, 'excerpt': 'SECRET adjacent excerpt'}]}]}


class CampaignServiceTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(prefix='echo-campaign-api-')
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.ai = AIFixture()
        mock_voices = patch('campaign_service.VoiceService', VoiceFixture)
        mock_voices.start()
        self.addCleanup(mock_voices.stop)
        self.service = CampaignService(self.root / 'private', self.root / 'served', ai_service=self.ai)
        self.store, self.sessions, self.voices = self.service.engine('campaign-a')

    def request(self, path, body=None, method='POST', campaign='campaign-a', headers=None, client='127.0.0.1'):
        hdrs = {'Origin': 'http://127.0.0.1:48261', 'X-Echo-Campaign-Token': self.service.token,
                'X-Echo-Campaign-Id': campaign, **(headers or {})}
        handler = Handler(PREFIX + path, body, hdrs, client)
        self.assertTrue(self.service.handle(handler, method))
        return handler

    def seed(self):
        self.store.apply_mutations([
            {'op': 'upsert', 'record': record('private', 'SECRET resonance ritual.')},
            {'op': 'upsert', 'record': record('shared', 'The resonance bell was heard.', 'player', ['npc-durnan'])},
            {'op': 'upsert', 'record': record('other-npc', 'SECRET resonance private account.', 'npc', ['npc-halaster'])},
        ], expected_revision=0)

    def reply(self, campaign='campaign-a'):
        response = self.request('/voice/reply', {'npcId': 'npc-durnan', 'query': 'resonance'}, campaign=campaign)
        self.assertEqual(response.code, 200)
        return response.json()['replyId']

    def test_bootstrap_is_loopback_only_and_does_not_require_token(self):
        handler = Handler(PREFIX + '/bootstrap')
        self.service.handle(handler, 'GET')
        self.assertEqual(handler.code, 200)
        self.assertEqual(handler.json()['token'], self.service.token)
        self.assertEqual(handler.response_headers['Cache-Control'], 'no-store')
        remote = Handler(PREFIX + '/bootstrap', client='192.168.1.55')
        self.service.handle(remote, 'GET')
        self.assertEqual(remote.code, 403)
        self.assertNotIn(self.service.token, remote.wfile.getvalue().decode())

    def test_host_dns_rebinding_origin_fetch_site_and_token_are_enforced(self):
        cases = [({'Host': 'attacker.example:48261'}, '127.0.0.1'),
                 ({'Host': '127.0.0.1:9'}, '127.0.0.1'),
                 ({'Origin': 'https://attacker.example'}, '127.0.0.1'),
                 ({'Origin': ''}, '127.0.0.1'),
                 ({'Sec-Fetch-Site': 'cross-site'}, '127.0.0.1'),
                 ({'Sec-Fetch-Site': 'same-site'}, '127.0.0.1'),
                 ({'X-Echo-Campaign-Token': 'forged'}, '127.0.0.1'),
                 ({}, '10.0.0.2')]
        for headers, client in cases:
            with self.subTest(headers=headers, client=client):
                result = self.request('/records/query', {}, headers=headers, client=client)
                self.assertEqual(result.code, 403)

    def test_body_content_type_length_transfer_encoding_and_shape_are_checked(self):
        cases = [({'Content-Type': 'text/plain'}, 415),
                 ({'Content-Length': str(MAX_BODY + 1)}, 413),
                 ({'Content-Length': '-1'}, 413),
                 ({'Content-Length': 'abc'}, 400),
                 ({'Transfer-Encoding': 'chunked'}, 400)]
        for headers, code in cases:
            with self.subTest(headers=headers):
                self.assertEqual(self.request('/records/query', {}, headers=headers).code, code)
        self.assertEqual(self.request('/records/query', []).code, 400)

    def test_invalid_json_and_unknown_method_are_rejected(self):
        handler = Handler(PREFIX + '/records/query', headers={
            'Origin': 'http://127.0.0.1:48261', 'X-Echo-Campaign-Token': self.service.token,
            'Content-Length': '3'})
        handler.rfile = io.BytesIO(b'{xx')
        self.service.handle(handler, 'POST')
        self.assertEqual(handler.code, 400)
        self.assertEqual(self.request('/status', method='DELETE').code, 405)

    def test_non_campaign_routes_are_not_consumed(self):
        handler = Handler('/__echo_campaign-other/status')
        self.assertFalse(self.service.handle(handler, 'GET'))
        self.assertIsNone(handler.code)

    def test_storage_cannot_be_inside_public_tree(self):
        with self.assertRaises(ValueError):
            CampaignService(self.root / 'served' / 'private', self.root / 'served')

    def test_campaigns_and_sessions_are_isolated(self):
        self.seed()
        other, other_sessions, _ = self.service.engine('campaign-b')
        self.assertEqual(other.list_records(), [])
        draft = self.sessions.analyze('Campaign A private session', 'SECRET notes.')
        result = self.request('/sessions/' + draft['id'], method='GET', campaign='campaign-b')
        self.assertEqual(result.code, 404)
        self.assertEqual(other_sessions.list(), [])
        self.assertNotEqual(self.store.db_path, other.db_path)

    def test_campaign_identifiers_cannot_escape_private_storage(self):
        for campaign in ('../outside', '/absolute', 'x' * 121, ''):
            with self.subTest(campaign=campaign):
                self.assertEqual(self.request('/status', method='GET', campaign=campaign).code, 400)

    def test_search_filters_dm_content_before_returning_to_player_or_npc(self):
        self.seed()
        for audience in ('player', 'npc'):
            response = self.request('/search', {'query': 'resonance', 'audience': audience, 'npcId': 'npc-durnan'})
            self.assertEqual(response.code, 200)
            text = json.dumps(response.json())
            self.assertIn('bell', text)
            self.assertNotIn('SECRET', text)
        dm = self.request('/search', {'query': 'resonance', 'audience': 'dm'})
        self.assertIn('SECRET resonance ritual', json.dumps(dm.json()))

    def test_player_ai_receives_only_scoped_projection(self):
        self.seed()
        response = self.request('/ai/ask', {'query': 'resonance', 'audience': 'player'})
        self.assertEqual(response.code, 200)
        context = self.ai.submitted[-1]['context']
        self.assertEqual(context['audience'], 'player')
        self.assertNotIn('SECRET', json.dumps(context))
        self.assertIn('bell', json.dumps(context))
        self.assertNotIn('SECRET', json.dumps(response.json()))

    def test_private_sourcebook_chunks_never_enter_player_search_or_model_context(self):
        self.seed()
        self.store.put_source({'id': 'dm-source', 'filename': 'SECRET DM book.pdf',
                               'sha256': 'a' * 64, 'visibility': 'dm', 'format': 'pdf',
                               'page_count': 1},
                              [{'id': 'dm-chunk', 'page': 1, 'chunk_index': 0,
                                'text': 'SECRET resonance finale from the sourcebook.',
                                'sha256': 'b' * 64, 'epistemic': 'confirmed'}])
        player = self.request('/ai/ask', {'query': 'resonance', 'audience': 'player'})
        self.assertEqual(player.code, 200)
        self.assertNotIn('SECRET', json.dumps(self.ai.submitted[-1]['context']))
        self.assertNotIn('SECRET', json.dumps(player.json()))
        dm = self.request('/ai/ask', {'query': 'resonance', 'audience': 'dm'})
        self.assertEqual(dm.code, 200)
        self.assertIn('sourcebook', json.dumps(self.ai.submitted[-1]['context']))

    def test_npc_ai_cannot_bypass_strict_grounded_voice_path(self):
        self.seed()
        response = self.request('/ai/ask', {'query': 'resonance', 'audience': 'npc', 'npcId': 'npc-durnan'})
        self.assertEqual(response.code, 400)
        self.assertEqual(self.ai.submitted, [])

    def test_ai_jobs_cannot_be_read_from_another_campaign(self):
        self.seed()
        result = self.request('/ai/ask', {'query': 'resonance', 'audience': 'player'}).json()
        identifier = result['job']['id']
        self.assertEqual(self.request('/ai/jobs/' + identifier, method='GET').code, 200)
        self.assertEqual(self.request('/ai/jobs/' + identifier, method='GET', campaign='campaign-b').code, 404)

    def test_voice_speaks_exact_server_reply_and_consumes_once(self):
        self.seed()
        reply_id = self.reply()
        result = self.request('/voice/speak', {'replyId': reply_id})
        self.assertEqual(result.code, 200)
        self.assertEqual(result.response_headers['Content-Type'], 'audio/mpeg')
        self.assertEqual(self.voices.sent, [('npc-durnan', 'The resonance bell was heard.')])
        again = self.request('/voice/speak', {'replyId': reply_id})
        self.assertEqual(again.code, 409)
        self.assertEqual(again.json()['error']['code'], 'already_spoken')
        self.assertEqual(len(self.voices.sent), 1)

    def test_voice_rejects_forged_text_expired_reply_and_other_campaign(self):
        self.seed()
        reply_id = self.reply()
        self.assertEqual(self.request('/voice/speak', {'replyId': reply_id, 'text': 'SECRET forged text'}).code, 400)
        self.assertEqual(self.request('/voice/speak', {'replyId': 'forged'}).code, 409)
        self.assertEqual(self.request('/voice/speak', {'replyId': reply_id}, campaign='campaign-b').code, 409)
        self.service.replies[reply_id]['at'] = time.monotonic() - 901
        self.assertEqual(self.request('/voice/speak', {'replyId': reply_id}).code, 409)
        self.assertEqual(self.voices.sent, [])

    def test_knowledge_revocation_invalidates_issued_voice_reply(self):
        self.seed()
        reply_id = self.reply()
        self.store.upsert_record(record('shared', 'SECRET revoked bell.'), expected_revision=1)
        result = self.request('/voice/speak', {'replyId': reply_id})
        self.assertEqual(result.code, 409)
        self.assertEqual(result.json()['error']['code'], 'knowledge_changed')
        self.assertEqual(self.voices.sent, [])

    def test_knowledge_change_during_reply_generation_cannot_stamp_old_text_with_new_revision(self):
        self.seed()
        original_reply = self.voices.reply
        def revoke_during_reply(npc_id, query):
            result = original_reply(npc_id, query)
            self.store.upsert_record(record('shared', 'SECRET revoked bell.'), expected_revision=1)
            return result
        with patch.object(self.voices, 'reply', side_effect=revoke_during_reply):
            result = self.request('/voice/reply', {'npcId': 'npc-durnan', 'query': 'resonance'})
        if result.code == 200:
            spoken = self.request('/voice/speak', {'replyId': result.json()['replyId']})
            self.assertEqual(spoken.code, 409)
        else:
            self.assertEqual(result.code, 409)
        self.assertEqual(self.voices.sent, [])

    def test_provider_error_does_not_allow_reply_replay(self):
        self.seed()
        reply_id = self.reply()
        with patch.object(self.voices, 'synthesize', side_effect=AIError('voice_provider_error', 'Provider fixture failure.', 502)):
            first = self.request('/voice/speak', {'replyId': reply_id})
        self.assertEqual(first.code, 502)
        self.assertEqual(self.request('/voice/speak', {'replyId': reply_id}).code, 409)

    def test_import_refuses_foreign_campaign_identity(self):
        response = self.request('/import/preview', {'campaignId': 'campaign-b', 'story': {'continuity': {'events': []}}})
        self.assertEqual(response.code, 409)
        self.assertEqual(self.sessions.list(), [])

    def test_upsert_requires_current_integer_revision(self):
        for revision in (None, True, '0'):
            with self.subTest(revision=revision):
                response = self.request('/records/upsert', {'record': record('fixture', 'Fixture'), 'expectedRevision': revision})
                self.assertEqual(response.code, 409)
        response = self.request('/records/upsert', {'record': record('fixture', 'Fixture'), 'expectedRevision': 0})
        self.assertEqual(response.code, 200)
        stale = self.request('/records/upsert', {'record': record('other', 'Other'), 'expectedRevision': 0})
        self.assertEqual(stale.code, 409)
        self.assertEqual(len(self.store.list_records()), 1)


if __name__ == '__main__':
    unittest.main()
