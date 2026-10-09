"""No credentials or external requests: executable regression tests for the AI gateway."""
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
from ai_service import (AIService, AIError, ChatGPTAdapter, DEFAULT_SETTINGS, MockProvider,
                        OpenAIProvider, MODEL, DEVELOPER_INSTRUCTION, validate_context)


def context():
    return {'version': 1, 'audience': 'dm', 'subjectId': 'campaign', 'records': [
        {'sourceId': 'test:1', 'kind': 'scene', 'title': 'Synthetic fixture',
         'text': 'fixture-confidential-text', 'status': 'planned', 'basis': 'Test fixture only.'}]}


def payload(identifier='test-request-1'):
    return {'requestId': identifier, 'context': context(), 'prompt': 'fixture-private-prompt'}


class BlockingProvider:
    def __init__(self, provider='openai', reserve=0.06):
        self.provider, self.reservation = provider, reserve
        self.started, self.release = threading.Event(), threading.Event()
        self.calls = 0

    def status(self):
        return {'id': self.provider, 'ready': True}

    def reserve(self, context, prompt, settings):
        return self.reservation

    def generate(self, context, prompt, cancel_event, settings):
        self.calls += 1
        self.started.set()
        self.release.wait(2)
        return {'text': 'fixture-private-result', 'input_tokens': 5, 'output_tokens': 3, 'cost_usd': 0.03}


class Handler:
    def __init__(self, path, body=None, headers=None, client='127.0.0.1'):
        self.path, self.client_address = path, (client, 55555)
        self.headers = {'Host': '127.0.0.1:48261', **(headers or {})}
        encoded = json.dumps(body).encode() if body is not None else b''
        self.rfile, self.wfile = io.BytesIO(encoded), io.BytesIO()
        self.headers.setdefault('Content-Length', str(len(encoded)))
        self.headers.setdefault('Content-Type', 'application/json')
        self.response_headers = {}
        self.code = None

    def send_response(self, code):
        self.code = code

    def send_header(self, key, value):
        self.response_headers[key] = value

    def end_headers(self):
        pass

    def json(self):
        return json.loads(self.wfile.getvalue())


class ServiceTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory(prefix='echo-ai-test-')
        self.addCleanup(self.folder.cleanup)
        self.service = AIService(Path(self.folder.name) / 'private', providers={'mock': MockProvider()})

    def wait(self, service, identifier):
        deadline = time.monotonic() + 3
        while time.monotonic() < deadline:
            with service.lock:
                if service.jobs[identifier]['_done']:
                    return service.get_job(identifier)
            time.sleep(0.005)
        self.fail('Job did not finish in time')

    def configure(self, service, provider='openai', **overrides):
        settings = {'enabled': True, 'provider': provider, 'dailyBudgetUsd': 0.1,
                    'monthlyBudgetUsd': 1, 'maxRequestUsd': 0.1,
                    'externalConfirmed': provider == 'openai',
                    'planConfirmed': provider == 'chatgpt',
                    'dailyRequestLimit': 10}
        service.update_settings({**settings, **overrides})

    def test_default_is_off_and_status_creates_no_files(self):
        result = self.service.status()
        self.assertEqual(result['settings'], DEFAULT_SETTINGS)
        self.assertFalse(self.service.state_dir.exists())
        with self.assertRaises(AIError) as error:
            self.service.create_job(payload())
        self.assertEqual(error.exception.code, 'ai_disabled')

    def test_mock_free_deterministic_and_only_metadata_persisted(self):
        self.service.update_settings({'enabled': True})
        first = self.wait(self.service, self.service.create_job(payload())['id'])
        second = self.wait(self.service, self.service.create_job(payload('test-request-2'))['id'])
        self.assertEqual(first['status'], 'completed')
        self.assertEqual(first['result'], second['result'])
        self.assertIn('MOCK DRAFT', first['result'])
        self.assertEqual(first['usage']['costUsd'], 0)
        persisted = (self.service.state_dir / 'service.json').read_text()
        for forbidden in ('fixture-confidential-text', 'fixture-private-prompt', first['result'], self.service.csrf_token, 'test-request-1'):
            self.assertNotIn(forbidden, persisted)
        self.assertEqual(self.service.state_dir.stat().st_mode & 0o777, 0o700)
        self.assertEqual((self.service.state_dir / 'service.json').stat().st_mode & 0o777, 0o600)
        self.assertNotIn('result', self.service.status()['jobs'][0])

    def test_unknown_fields_and_browser_credentials_rejected(self):
        for extra in ('apiKey', 'access_token', 'secret', 'endpoint', 'rawSnapshot'):
            with self.subTest(extra=extra), self.assertRaises(AIError):
                self.service.update_settings({extra: 'never-accept'})
        candidate = payload()
        candidate['apiKey'] = 'never-accept'
        with self.assertRaises(AIError):
            self.service.create_job(candidate)

    def test_context_projection_validation(self):
        mutations = [
            lambda c: c.update({'rawSnapshot': {}}),
            lambda c: c.update({'audience': {}}),
            lambda c: c.update({'audience': 'all'}),
            lambda c: c.update({'version': True}),
            lambda c: c.update({'records': {}}),
            lambda c: c['records'][0].update({'secret': 'hidden'}),
            lambda c: c['records'][0].update({'status': 'canonical'}),
            lambda c: c['records'][0].update({'status': []}),
            lambda c: c['records'][0].update({'basis': {}}),
            lambda c: c['records'][0].update({'basis': ' '}),
            lambda c: c['records'][0].update({'text': ''}),
            lambda c: c['records'].append(copy.deepcopy(c['records'][0])),
            lambda c: c['records'][0].update({'text': 'x' * 6001}),
        ]
        for mutation in mutations:
            candidate = context()
            mutation(candidate)
            with self.subTest(context=candidate), self.assertRaises(AIError):
                validate_context(candidate)

    def test_audience_requires_matching_subject(self):
        for audience, subject in [('dm', ''), ('player', ''), ('player', 'barthen'),
                                  ('player', 'party'), ('npc', 'pc-a'), ('npc', 'party')]:
            candidate = {**context(), 'audience': audience, 'subjectId': subject}
            with self.subTest(audience=audience, subject=subject), self.assertRaises(AIError):
                validate_context(candidate)
        for audience, subject in [('dm', 'campaign'), ('player', 'pc-a'), ('npc', 'barthen')]:
            candidate = {**context(), 'audience': audience, 'subjectId': subject}
            self.assertEqual(validate_context(candidate)['subjectId'], subject)

    def test_invalid_provenance_cannot_dispatch_or_consume_allowance(self):
        adapter = BlockingProvider('mock')
        service = AIService(Path(self.folder.name) / 'provenance', providers={'mock': adapter})
        service.update_settings({'enabled': True})
        candidate = payload()
        candidate['context']['records'][0]['basis'] = ''
        with self.assertRaises(AIError):
            service.create_job(candidate)
        self.assertEqual(adapter.calls, 0)
        self.assertEqual(service.status()['usage']['requestsToday'], 0)

    def test_duplicate_request_does_not_dispatch_twice(self):
        self.service.update_settings({'enabled': True})
        first = self.service.create_job(payload())
        second = self.service.create_job(payload())
        self.assertEqual(first['id'], second['id'])
        changed = payload()
        changed['prompt'] = 'different'
        with self.assertRaises(AIError) as error:
            self.service.create_job(changed)
        self.assertEqual(error.exception.code, 'request_conflict')
        self.wait(self.service, first['id'])
        self.assertEqual(self.service.status()['usage']['requestsToday'], 1)

    def test_cancel_wins_late_provider_response(self):
        adapter = BlockingProvider('mock')
        service = AIService(Path(self.folder.name) / 'cancel', providers={'mock': adapter})
        service.update_settings({'enabled': True})
        identifier = service.create_job(payload())['id']
        self.assertTrue(adapter.started.wait(1))
        self.assertEqual(service.cancel_job(identifier)['status'], 'cancelled')
        adapter.release.set()
        result = self.wait(service, identifier)
        self.assertEqual(result['status'], 'cancelled')
        self.assertIsNone(result['result'])

    def test_disable_cancels_running_and_prevents_new_dispatch(self):
        adapter = BlockingProvider('mock')
        service = AIService(Path(self.folder.name) / 'disable', providers={'mock': adapter})
        service.update_settings({'enabled': True})
        identifier = service.create_job(payload())['id']
        self.assertTrue(adapter.started.wait(1))
        service.update_settings({'enabled': False})
        with self.assertRaises(AIError):
            service.create_job(payload('test-request-2'))
        adapter.release.set()
        self.assertEqual(self.wait(service, identifier)['status'], 'cancelled')
        self.assertEqual(adapter.calls, 1)

    def test_external_requires_explicit_confirmation_and_positive_budgets(self):
        adapter = BlockingProvider()
        service = AIService(Path(self.folder.name) / 'confirmation', providers={'openai': adapter})
        service.update_settings({'enabled': True, 'provider': 'openai'})
        with self.assertRaises(AIError) as error:
            service.create_job(payload())
        self.assertEqual(error.exception.code, 'confirmation_required')
        with self.assertRaises(AIError):
            service.update_settings({'externalConfirmed': True})
        self.configure(service)
        service.update_settings({'dailyBudgetUsd': 0.2})
        self.assertFalse(service.settings['externalConfirmed'])
        self.assertEqual(adapter.calls, 0)

    def test_concurrent_admission_reserves_budget_atomically(self):
        adapter = BlockingProvider()
        service = AIService(Path(self.folder.name) / 'race', providers={'openai': adapter})
        self.configure(service)
        barrier = threading.Barrier(3)
        results, errors = [], []

        def start(index):
            barrier.wait()
            try:
                results.append(service.create_job(payload(f'test-request-{index}')))
            except AIError as exc:
                errors.append(exc.code)

        threads = [threading.Thread(target=start, args=(i,)) for i in range(2)]
        for thread in threads:
            thread.start()
        barrier.wait()
        for thread in threads:
            thread.join(2)
        self.assertEqual(len(results), 1)
        self.assertEqual(errors, ['spending_limit'])
        self.assertEqual(service.status()['usage']['dayUsd'], 0.06)
        adapter.release.set()
        self.wait(service, results[0]['id'])
        self.assertEqual(service.status()['usage']['dayUsd'], 0.03)

    def test_failed_external_request_retains_durable_reservation_without_secret_error(self):
        class Failing(BlockingProvider):
            def generate(self, *args):
                raise RuntimeError('secret-key-and-private-prompt')

        service = AIService(Path(self.folder.name) / 'failure', providers={'openai': Failing()})
        self.configure(service)
        job = self.wait(service, service.create_job(payload())['id'])
        self.assertEqual(job['status'], 'failed')
        self.assertNotIn('secret', json.dumps(job))
        self.assertEqual(service.status()['usage']['dayUsd'], 0.06)
        restored = AIService(service.state_dir, providers={'mock': MockProvider()})
        self.assertEqual(restored.status()['usage']['dayUsd'], 0.06)
        self.assertEqual(restored.status()['jobs'], [])

    def test_chatgpt_plan_is_unknown_and_request_limit_enforced(self):
        adapter = BlockingProvider('chatgpt')
        service = AIService(Path(self.folder.name) / 'plan', providers={'chatgpt': adapter})
        self.configure(service, provider='chatgpt', dailyRequestLimit=1,
                       dailyBudgetUsd=0, monthlyBudgetUsd=0, maxRequestUsd=0, model='test-chatgpt')
        first = service.create_job(payload())
        with self.assertRaises(AIError) as error:
            service.create_job(payload('test-request-2'))
        self.assertEqual(error.exception.code, 'daily_request_limit')
        adapter.release.set()
        result = self.wait(service, first['id'])
        self.assertIsNone(result['usage']['costUsd'])
        self.assertEqual(result['usage']['billing'], 'chatgpt-plan')
        self.assertEqual(service.status()['usage']['chatgptPlanUsage'], 'unknown')

    def test_chatgpt_reports_tokens_without_inventing_dollar_or_quota_usage(self):
        class Account:
            def generate(self, context, prompt, cancel_event, on_usage=None, model=None):
                on_usage({'input_tokens': 22, 'output_tokens': 11, 'access_token': 'never-return'})
                return 'ChatGPT fixture draft'

        result = ChatGPTAdapter(Account()).generate(context(), 'fixture', threading.Event(), DEFAULT_SETTINGS)
        self.assertEqual(result['input_tokens'], 22)
        self.assertEqual(result['output_tokens'], 11)
        self.assertIsNone(result['cost_usd'])
        self.assertNotIn('never-return', json.dumps(result))

    def test_disconnect_exposes_local_only_revocation_outcome(self):
        class Account:
            def disconnect(self):
                return {'remoteRevocationConfirmed': False,
                        'message': 'Disconnected locally. Remote sign-out was not confirmed.',
                        'access_token': 'never-return'}

        self.service.account = Account()
        request = Handler('/__echo_ai/auth/chatgpt/disconnect', {}, {
            'Origin': 'http://127.0.0.1:48261', 'X-Echo-CSRF': self.service.csrf_token})
        self.service.handle(request, 'POST')
        self.assertEqual(request.code, 200)
        self.assertFalse(request.json()['remoteRevocationConfirmed'])
        self.assertIn('Disconnected locally', request.json()['message'])
        self.assertNotIn('never-return', request.wfile.getvalue().decode())

    def test_invalid_private_ledger_fails_closed(self):
        self.service.state_dir.mkdir()
        (self.service.state_dir / 'service.json').write_text('{broken')
        restored = AIService(self.service.state_dir, providers={'mock': MockProvider()})
        self.assertFalse(restored.status()['storageReady'])
        with self.assertRaises(AIError):
            restored.update_settings({'enabled': True})

    def test_corrupt_optional_chatgpt_connection_keeps_mock_available(self):
        directory = Path(self.folder.name) / 'damaged-connection'
        directory.mkdir(mode=0o700)
        path = directory / 'chatgpt-connection.json'
        damaged = '{"version":1,"accounts":{"fixture":{}}}'
        path.write_text(damaged)
        path.chmod(0o600)
        service = AIService(directory, providers={'mock': MockProvider()})
        status = service.status()
        provider = next(row for row in status['providers'] if row['id'] == 'chatgpt')
        self.assertFalse(provider['ready'])
        self.assertIn('mock checks remain available', provider['message'])
        service.update_settings({'enabled': True})
        result = self.wait(service, service.create_job(payload())['id'])
        self.assertEqual(result['status'], 'completed')
        self.assertEqual(path.read_text(), damaged, 'Do not replace the damaged connection or silently reset credentials')

    def test_chatgpt_status_failure_does_not_break_other_providers(self):
        from ai_chatgpt import ChatGPTError
        class Account:
            def status(self):
                raise ChatGPTError('connection_storage', 'Private file could not be read.')

        self.service.providers['chatgpt'] = ChatGPTAdapter(Account())
        status = self.service.status()
        self.assertTrue(next(row for row in status['providers'] if row['id'] == 'mock')['ready'])
        self.assertFalse(next(row for row in status['providers'] if row['id'] == 'chatgpt')['ready'])

    def test_private_state_cannot_be_under_served_tree(self):
        with self.assertRaises(ValueError):
            AIService(Path(self.folder.name) / 'served' / 'private', served_root=Path(self.folder.name) / 'served')

    def test_storage_failure_cannot_dispatch(self):
        adapter = BlockingProvider()
        service = AIService(Path(self.folder.name) / 'disk', providers={'openai': adapter})
        self.configure(service)
        with patch('ai_service.os.replace', side_effect=OSError('disk full')):
            with self.assertRaises(AIError):
                service.create_job(payload())
        self.assertEqual(adapter.calls, 0)
        self.assertEqual(len(service.ledger), 0)
        self.assertTrue(service.storage_error)

    def test_host_origin_peer_and_csrf_are_enforced(self):
        bad = [
            Handler('/__echo_ai/status', headers={'Host': 'evil.example:48261'}),
            Handler('/__echo_ai/status', headers={'Origin': 'null'}),
            Handler('/__echo_ai/status', headers={'Origin': 'https://evil.example'}),
            Handler('/__echo_ai/status', headers={'Sec-Fetch-Site': 'cross-site'}),
            Handler('/__echo_ai/status', headers={'Sec-Fetch-Site': 'same-site'}),
            Handler('/__echo_ai/status', client='192.168.1.50'),
        ]
        for request in bad:
            self.service.handle(request, 'GET')
            self.assertEqual(request.code, 403)
            self.assertNotIn(self.service.csrf_token, request.wfile.getvalue().decode())
        good = Handler('/__echo_ai/status', headers={'Sec-Fetch-Site': 'same-origin'})
        self.service.handle(good, 'GET')
        self.assertEqual(good.code, 200)
        self.assertNotIn('Access-Control-Allow-Origin', good.response_headers)
        request = Handler('/__echo_ai/settings', {'enabled': True}, {'Origin': 'http://127.0.0.1:48261'})
        self.service.handle(request, 'POST')
        self.assertEqual(request.code, 403)
        self.assertFalse(self.service.settings['enabled'])
        request = Handler('/__echo_ai/settings', {'enabled': True}, {
            'Origin': 'http://127.0.0.1:48261', 'X-Echo-CSRF': self.service.csrf_token})
        self.service.handle(request, 'POST')
        self.assertEqual(request.code, 200)
        self.assertTrue(request.json()['settings']['enabled'])

    def test_same_host_is_required_even_for_localhost_alias(self):
        request = Handler('/__echo_ai/settings', {'enabled': True}, {
            'Origin': 'http://localhost:48261', 'X-Echo-CSRF': self.service.csrf_token})
        self.service.handle(request, 'POST')
        self.assertEqual(request.code, 403)

    def test_routes_errors_and_no_static_fallback(self):
        self.assertFalse(self.service.handle(Handler('/index.html'), 'GET'))
        for method, path, expected in [('GET', '/__echo_ai/not-found', 404), ('GET', '/__echo_ai/jobs/unknown', 404),
                                       ('OPTIONS', '/__echo_ai/status', 405)]:
            request = Handler(path)
            self.assertTrue(self.service.handle(request, method))
            self.assertEqual(request.code, expected)
            self.assertIn('error', request.json())

    def test_api_adapter_fixed_endpoint_credentials_server_only_and_no_tools(self):
        captured = []

        class Response:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def read(self, size):
                return json.dumps({'status': 'completed', 'output': [{'type': 'message', 'content': [{'type': 'output_text', 'text': 'A draft.'}]}],
                                   'usage': {'input_tokens': 100, 'output_tokens': 10}}).encode()

        class Opener:
            def open(self, req, timeout):
                captured.append(req)
                return Response()

        with patch.dict('os.environ', {'OPENAI_API_KEY': 'synthetic-never-real-key'}), patch('ai_service.urlrequest.build_opener', return_value=Opener()):
            adapter = OpenAIProvider()
            result = adapter.generate(context(), 'Help with this fixture', threading.Event(), DEFAULT_SETTINGS)
            self.assertTrue(adapter.status()['ready'])
            self.assertNotIn('synthetic-never-real-key', json.dumps(adapter.status()))
        self.assertEqual(len(captured), 1)
        self.assertEqual(captured[0].full_url, 'https://api.openai.com/v1/responses')
        body = json.loads(captured[0].data)
        self.assertEqual(body['model'], MODEL)
        self.assertFalse(body['store'])
        self.assertEqual(body['tools'], [])
        self.assertEqual(body['input'][0]['role'], 'developer')
        self.assertEqual(body['input'][0]['content'], DEVELOPER_INSTRUCTION)
        self.assertIn('untrusted', body['input'][0]['content'])
        self.assertNotIn('synthetic-never-real-key', captured[0].data.decode())
        self.assertEqual(result['text'], 'A draft.')


if __name__ == '__main__':
    unittest.main()
