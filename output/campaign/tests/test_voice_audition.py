"""Isolated, no-network voice tests. Synthetic WAVs are transport fixtures, not voices."""
import copy
import io
import json
import os
from pathlib import Path
import sys
import tempfile
import threading
import time
import unittest
from unittest.mock import patch
import wave

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'launchers'))
from ai_service import AIService, AIError, MockProvider
from voice_audition import VoiceAuditionService, ElevenLabs, MODEL
from test_ai_service import Handler


def wav_fixture():
    output = io.BytesIO()
    with wave.open(output, 'wb') as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(8000)
        stream.writeframes(b'\0\0' * 800)
    return output.getvalue()


def payload(request_id='audition-one'):
    return {'requestId': request_id, 'provider': 'elevenlabs', 'voiceId': 'stock-1',
        'scriptId': 'barthen', 'text': 'Good morning. Fresh bread is on the shelf.',
        'style': {'description': 'A warm shopkeeper.', 'pace': 1,
                  'pronunciation': [{'term': 'Barthen', 'sayAs': 'BAR-then'}],
                  'emotionalRange': ['welcoming', 'concerned']}}


class FixtureProvider:
    simulated = True

    def __init__(self, remaining=10000, error=None, blocking=False):
        self.remaining, self.error, self.blocking = remaining, error, blocking
        self.started, self.release = threading.Event(), threading.Event()
        self.account_calls = self.catalog_calls = self.generation_calls = 0

    def configured(self):
        return True

    def account(self, allow_included_plan=False):
        self.account_calls += 1
        if self.error:
            raise self.error
        return {'provider': 'elevenlabs', 'tier': 'free', 'usedCharacters': 0,
                'limitCharacters': self.remaining, 'remainingCharacters': self.remaining,
                'periodId': 'period-fixture', 'checkedAt': 'fixture', 'verifiedFree': True,
                'verifiedIncludedCredits': True, 'overageDisabled': True}

    def catalog(self, allow_included_plan=False):
        self.catalog_calls += 1
        return [{'id': 'stock-1', 'name': 'Synthetic transport fixture', 'source': 'provider-stock', 'category': 'premade'}]

    def generate(self, voice, text, cancel, model=MODEL, delivery=None):
        self.generation_calls += 1
        self.started.set()
        if self.blocking:
            self.release.wait(3)
        return {'audio': wav_fixture(), 'format': 'wav_pcm_fixture', 'contentType': 'audio/wav',
                'providerReportedCharacters': len(text), 'providerReportedCostUsd': None,
                'providerRequestId': 'fixture-only', 'simulated': True}


class VoiceTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='echo-private-voice-test-')
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / 'private'
        self.provider = FixtureProvider()
        self.service = VoiceAuditionService(self.path, adapter=self.provider)

    def ready(self, service=None):
        service = service or self.service
        service.update_settings({'enabled': True, 'providers': {'elevenlabs': {'accountConfirmed': True}}})
        service.catalog()

    def wait(self, service, identifier):
        end = time.monotonic() + 4
        while time.monotonic() < end:
            with service.lock:
                if service.jobs[identifier]['_done']:
                    return service.get_job(identifier)
            time.sleep(0.005)
        self.fail('Fixture job timed out')

    def test_default_off_status_never_networks_or_writes(self):
        status = self.service.status()
        self.assertFalse(status['settings']['enabled'])
        self.assertEqual(status['usage']['paidSpendUsd'], 0)
        self.assertFalse(self.path.exists())
        self.assertEqual(self.provider.account_calls, 0)
        self.assertFalse(status['providers'][0]['connected'])
        with self.assertRaises(AIError):
            self.service.create_job(payload())
        with self.assertRaises(AIError):
            self.service.catalog()
        self.assertEqual(self.provider.account_calls, 0)

    def test_paid_or_credential_settings_fail_closed(self):
        for settings in ({'freeOnly': False}, {'apiKey': 'secret'}, {'totalBudgetUsd': 5},
                         {'providers': {'cartesia': {'accountConfirmed': True}}},
                         {'providers': {'elevenlabs': {'accountConfirmed': 1}}}):
            with self.subTest(settings=settings), self.assertRaises(AIError):
                self.service.update_settings(settings)

    def test_explicit_consent_and_enabled_are_independent(self):
        self.service.update_settings({'providers': {'elevenlabs': {'accountConfirmed': True}}})
        self.service.catalog()
        with self.assertRaises(AIError) as caught:
            self.service.create_job(payload())
        self.assertEqual(caught.exception.code, 'voice_disabled')
        self.assertEqual(self.provider.generation_calls, 0)

    def test_valid_wav_private_replay_and_metadata(self):
        self.ready()
        job = self.wait(self.service, self.service.create_job(payload())['id'])
        self.assertEqual(job['status'], 'completed')
        self.assertTrue(job['simulated'])
        self.assertEqual(job['model'], MODEL)
        self.assertIsInstance(job['generationMilliseconds'], int)
        self.assertEqual(len(job['scriptSha256']), 64)
        self.assertEqual(job['providerReportedCostUsd'], None)
        audio = self.service.audio(job['id'])
        self.assertEqual(audio.content_type, 'audio/wav')
        with wave.open(io.BytesIO(audio.data)) as stream:
            self.assertEqual(stream.getnframes(), 800)
        self.assertEqual((self.path / 'voices.json').stat().st_mode & 0o777, 0o600)
        self.assertEqual((self.path / 'voice-audio' / (job['id'] + '.audio')).stat().st_mode & 0o777, 0o600)
        self.assertEqual(self.path.stat().st_mode & 0o777, 0o700)
        self.assertEqual(self.service.status()['usage']['completedSamples'], 0)
        self.assertFalse(self.service.status()['providers'][0]['generationVerified'])
        restored = VoiceAuditionService(self.path, adapter=self.provider)
        self.assertEqual(restored.audio(job['id']).data, audio.data)
        self.assertEqual(restored.create_job(payload())['id'], job['id'])
        self.assertEqual(self.provider.generation_calls, 1)

    def test_no_automatic_retry_and_request_id_conflict(self):
        self.ready()
        first = self.service.create_job(payload())
        self.wait(self.service, first['id'])
        changed = payload()
        changed['text'] = 'Different text.'
        with self.assertRaises(AIError) as caught:
            self.service.create_job(changed)
        self.assertEqual(caught.exception.code, 'voice_request_conflict')
        self.assertEqual(self.provider.generation_calls, 1)

    def test_studio_delivery_is_retained_and_invalid_settings_fail(self):
        self.ready()
        data = payload('studio-delivery')
        data['delivery'] = {'stability': .6, 'speed': .9, 'style': .2}
        job = self.wait(self.service, self.service.create_job(data)['id'])
        self.assertEqual(job['status'], 'completed')
        self.assertEqual(job['delivery'], data['delivery'])
        for bad in ({'speed': .9}, {'stability': .6, 'speed': 9, 'style': .2}, {'stability': True, 'speed': 1, 'style': 0}):
            data['delivery'] = bad
            data['requestId'] = 'bad-delivery'
            with self.assertRaises(AIError):
                self.service.create_job(data)

    def test_unlisted_clone_or_other_provider_rejected(self):
        self.ready()
        for field, value in (('voiceId', 'cloned-voice'), ('provider', 'cartesia'), ('text', 'x' * 5001)):
            data = payload()
            data[field] = value
            with self.subTest(field=field), self.assertRaises(AIError):
                self.service.create_job(data)
        data = payload()
        data['rawCampaign'] = 'secret'
        with self.assertRaises(AIError):
            self.service.create_job(data)
        self.assertEqual(self.provider.generation_calls, 0)

    def test_account_checked_again_before_every_speech(self):
        self.ready()
        self.provider.error = AIError('free_tier_required', 'fixture paid tier rejected', 409)
        job = self.wait(self.service, self.service.create_job(payload())['id'])
        self.assertEqual(job['status'], 'failed')
        self.assertEqual(job['error']['code'], 'free_tier_required')
        self.assertFalse(job['dispatched'])
        self.assertEqual(job['reservedCharacters'], 0)
        self.assertEqual(self.provider.generation_calls, 0)
        self.assertIsNone(self.service.status()['account'])

    def test_failed_account_or_catalog_refresh_clears_stale_verification(self):
        self.ready()
        self.assertIsNotNone(self.service.status()['account'])
        self.provider.error = AIError('voice_auth', 'Fixture key revoked.', 401)
        with self.assertRaises(AIError):
            self.service.catalog()
        self.assertIsNone(self.service.status()['account'])
        self.assertEqual(self.service.stock, {})

    def test_included_plan_requires_explicit_positive_limits_and_keeps_legacy_mode(self):
        for allowance in (None, {}, {'perSampleLimit': 0, 'totalLimit': 100},
                          {'perSampleLimit': True, 'totalLimit': 100},
                          {'perSampleLimit': 101, 'totalLimit': 100}):
            with self.subTest(allowance=allowance), self.assertRaises(AIError):
                self.service.update_settings({'freeOnly': False, 'includedPlanCredits': allowance})
        self.ready()
        saved = json.loads((self.path / 'voices.json').read_text())
        saved['settings'].pop('includedPlanCredits')
        (self.path / 'voices.json').write_text(json.dumps(saved))
        restored = VoiceAuditionService(self.path, adapter=self.provider)
        self.assertTrue(restored.settings['freeOnly'])
        self.assertIsNone(restored.settings['includedPlanCredits'])

    def test_included_credit_sample_and_total_limits_precede_dispatch(self):
        self.ready()
        length = len(payload()['text'])
        self.service.update_settings({'freeOnly': False,
            'includedPlanCredits': {'perSampleLimit': length - 1, 'totalLimit': length * 2}})
        first = self.wait(self.service, self.service.create_job(payload())['id'])
        self.assertEqual(first['error']['code'], 'voice_credit_limit')
        self.assertFalse(first['dispatched'])
        self.service.update_settings({'includedPlanCredits': {'perSampleLimit': length, 'totalLimit': length}})
        second = self.wait(self.service, self.service.create_job(payload('permitted'))['id'])
        self.assertEqual(second['status'], 'completed')
        third = self.wait(self.service, self.service.create_job(payload('over-total'))['id'])
        self.assertEqual(third['error']['code'], 'voice_credit_limit')
        self.assertEqual(self.provider.generation_calls, 1)

    def test_explicit_model_survives_restore_and_unsupported_models_block(self):
        self.ready()
        data = {**payload(), 'model': 'eleven_v3'}
        job = self.wait(self.service, self.service.create_job(data)['id'])
        self.assertEqual(job['model'], 'eleven_v3')
        restored = VoiceAuditionService(self.path, adapter=self.provider)
        self.assertEqual(restored.get_job(job['id'])['model'], 'eleven_v3')
        for model in ('arbitrary-model', None, []):
            with self.subTest(model=model), self.assertRaises(AIError):
                self.service.create_job({**payload('invalid-model'), 'model': model})

    def test_corrupted_or_duplicated_reservation_records_fail_closed(self):
        self.ready()
        job = self.wait(self.service, self.service.create_job(payload())['id'])
        saved = json.loads((self.path / 'voices.json').read_text())
        for change in ('missing-character-count', 'lost-reservation', 'duplicate-id', 'invalid-status'):
            raw = copy.deepcopy(saved)
            if change == 'missing-character-count':
                del raw['jobs'][0]['characters']
            elif change == 'lost-reservation':
                raw['jobs'][0]['reservedCharacters'] = 0
            elif change == 'duplicate-id':
                raw['jobs'].append(copy.deepcopy(raw['jobs'][0]))
            else:
                raw['jobs'][0]['status'] = 'unexpected'
            (self.path / 'voices.json').write_text(json.dumps(raw))
            restored = VoiceAuditionService(self.path, adapter=self.provider)
            with self.subTest(change=change):
                self.assertFalse(restored.status()['storageReady'])
                self.assertEqual(restored.status()['jobs'], [])
                with self.assertRaises(AIError):
                    restored.update_settings({'enabled': True})

    def test_insufficient_quota_and_unicode_reservation(self):
        self.ready()
        self.provider.remaining = 3
        data = payload()
        data['text'] = '😀'
        job = self.wait(self.service, self.service.create_job(data)['id'])
        self.assertEqual(job['error']['code'], 'free_quota_insufficient')
        self.assertEqual(self.provider.generation_calls, 0)

    def test_stale_balance_cannot_reuse_credit_reservations(self):
        self.ready()
        self.provider.remaining = len(payload()['text']) + 2
        self.wait(self.service, self.service.create_job(payload())['id'])
        second = self.wait(self.service, self.service.create_job(payload('second-request'))['id'])
        self.assertEqual(second['error']['code'], 'free_quota_insufficient')
        self.assertEqual(self.provider.generation_calls, 1)

    def test_cancellation_wins_result_race_and_keeps_dispatched_reservation(self):
        self.provider.blocking = True
        self.ready()
        job = self.service.create_job(payload())
        self.assertTrue(self.provider.started.wait(1))
        cancelled = self.service.cancel_job(job['id'])
        self.assertEqual(cancelled['status'], 'cancelled')
        self.provider.release.set()
        final = self.wait(self.service, job['id'])
        self.assertEqual(final['status'], 'cancelled')
        self.assertGreater(final['reservedCharacters'], 0)
        self.assertIsNone(final['audioUrl'])
        self.assertFalse((self.path / 'voice-audio').exists())

    def test_disabling_fences_in_flight_generation(self):
        self.provider.blocking = True
        self.ready()
        job = self.service.create_job(payload())
        self.assertTrue(self.provider.started.wait(1))
        self.service.update_settings({'enabled': False})
        self.provider.release.set()
        self.assertEqual(self.wait(self.service, job['id'])['status'], 'cancelled')

    def test_unknown_exception_never_leaks_secrets(self):
        self.ready()
        self.provider.generate = lambda *args, **kwargs: (_ for _ in ()).throw(RuntimeError('sk-private-key-secret'))
        job = self.wait(self.service, self.service.create_job(payload())['id'])
        self.assertNotIn('sk-private', json.dumps(job))
        self.assertEqual(job['status'], 'failed')
        self.assertGreater(job['reservedCharacters'], 0)

    def test_unsafe_storage_and_corrupt_state_block(self):
        with self.assertRaises(ValueError):
            VoiceAuditionService(self.path, served_root=self.directory.name)
        self.path.mkdir()
        (self.path / 'voices.json').write_text('not json')
        broken = VoiceAuditionService(self.path, adapter=self.provider)
        self.assertFalse(broken.status()['storageReady'])
        with self.assertRaises(AIError):
            broken.update_settings({'enabled': True})

    def test_same_origin_audio_and_csrf_routes(self):
        ai = AIService(self.path, providers={'mock': MockProvider()})
        ai.voice_service = self.service
        settings = {'enabled': True, 'providers': {'elevenlabs': {'accountConfirmed': True}}}
        wrong = Handler('/__echo_ai/voices/settings', settings, {'Origin': 'http://127.0.0.1:48261'})
        ai.handle(wrong, 'POST')
        self.assertEqual(wrong.code, 403)
        right = Handler('/__echo_ai/voices/settings', settings, {'Origin': 'http://127.0.0.1:48261', 'X-Echo-CSRF': ai.csrf_token})
        ai.handle(right, 'POST')
        self.assertEqual(right.code, 200)
        self.service.catalog()
        job = self.wait(self.service, self.service.create_job(payload())['id'])
        for headers, client in (({'Sec-Fetch-Site': 'cross-site'}, '127.0.0.1'), ({'Host': '192.168.0.2:48262'}, '192.168.0.10'), ({'Origin': 'http://127.0.0.1:48262'}, '127.0.0.1')):
            handler = Handler(job['audioUrl'], headers=headers, client=client)
            ai.handle(handler, 'GET')
            self.assertEqual(handler.code, 403)
        valid = Handler(job['audioUrl'], headers={'Sec-Fetch-Site': 'same-origin'})
        ai.handle(valid, 'GET')
        self.assertEqual(valid.code, 200)
        self.assertEqual(valid.response_headers['Content-Type'], 'audio/wav')
        self.assertEqual(valid.response_headers['Cache-Control'], 'no-store')


class FakeResponse:
    def __init__(self, body, headers=None):
        self.body, self.headers = body, headers or {'Content-Type': 'application/json'}
    def __enter__(self):
        return self
    def __exit__(self, *args):
        pass
    def read(self, limit):
        return self.body[:limit]


class FakeOpener:
    def __init__(self, response):
        self.response, self.requests = response, []
    def open(self, request, timeout):
        self.requests.append(request)
        return self.response


class AdapterTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='echo-key-test-')
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name)
        self.env = patch.dict(os.environ, {'ELEVENLABS_API_KEY': 'test-local-secret-only'})
        self.env.start()
        self.addCleanup(self.env.stop)

    def adapter(self, data):
        self.opener = FakeOpener(FakeResponse(json.dumps(data).encode()))
        return ElevenLabs(self.path, opener=self.opener)

    def test_free_account_contract_and_unknown_or_paid_block(self):
        valid = {'tier': 'free', 'character_count': 2, 'character_limit': 10000,
                 'next_character_count_reset_unix': 1800000000,
                 'max_credit_limit_extension': 0,
                 'can_extend_character_limit': False, 'allowed_to_extend_character_limit': False}
        self.assertEqual(self.adapter(valid).account()['remainingCharacters'], 9998)
        self.assertEqual(self.adapter({**valid, 'next_character_count_reset_unix': None}).account()['periodId'], 'unknown')
        for changes in ({'tier': 'starter'}, {'tier': None}, {'character_count': None},
                        {'can_extend_character_limit': True}, {'can_extend_character_limit': None},
                        {'can_extend_character_limit': 'false'}, {'allowed_to_extend_character_limit': 'false'},
                        {'has_open_invoices': 0}, {'character_limit': 1}, {'next_character_count_reset_unix': 'unknown'},
                        {'max_credit_limit_extension': 'unlimited'}, {'max_credit_limit_extension': False},
                        {'max_credit_limit_extension': 1}):
            with self.subTest(changes=changes), self.assertRaises(AIError):
                self.adapter({**valid, **changes}).account()

    def test_stock_catalog_excludes_clones_generated_and_community(self):
        voices = [{'voice_id': category, 'name': category, 'category': category, 'labels': {'gender': 'fixture', 'other': 'not-projected'}}
                  for category in ('premade', 'default', 'cloned', 'generated', 'professional', 'community')]
        voices.extend([{'voice_id': 'old-stock', 'category': 'premade', 'is_legacy': True},
                       {'voice_id': 'paid-stock', 'category': 'premade', 'available_for_tiers': ['starter']},
                       {'voice_id': 'restricted-stock', 'category': 'premade', 'sharing': {'free_users_allowed': False}}])
        result = self.adapter({'voices': voices}).catalog()
        self.assertEqual([row['id'] for row in result], ['premade'])
        self.assertNotIn('other', result[0]['labels'])
        self.assertIn('/v2/voices?category=premade&include_custom_rates=false', self.opener.requests[0].full_url)

    def test_creator_requires_explicit_mode_and_zero_overage_cap(self):
        valid = {'tier': 'creator', 'character_count': 100, 'character_limit': 100000,
                 'can_extend_character_limit': True, 'allowed_to_extend_character_limit': False,
                 'max_credit_limit_extension': 0, 'has_open_invoices': False}
        with self.assertRaises(AIError):
            self.adapter(valid).account()
        result = self.adapter(valid).account(allow_included_plan=True)
        self.assertEqual(result['remainingCharacters'], 99900)
        self.assertFalse(result['verifiedFree'])
        self.assertTrue(result['verifiedIncludedCredits'])
        for changes in ({'max_credit_limit_extension': 1}, {'max_credit_limit_extension': None},
                        {'max_credit_limit_extension': 'unlimited'}, {'character_limit': None},
                        {'tier': 'pro'}, {'has_open_invoices': True}):
            with self.subTest(changes=changes), self.assertRaises(AIError):
                self.adapter({**valid, **changes}).account(allow_included_plan=True)
        del valid['max_credit_limit_extension']
        with self.assertRaises(AIError):
            self.adapter(valid).account(allow_included_plan=True)

    def test_supported_models_send_exact_original_script(self):
        for model in ('eleven_multilingual_v2', 'eleven_v3'):
            opener = FakeOpener(FakeResponse(b'ID3' + b'\0' * 100, {'Content-Type': 'audio/mpeg'}))
            ElevenLabs(self.path, opener).generate('voice1', 'Original unchanged text.', threading.Event(), model=model)
            body = json.loads(opener.requests[0].data)
            self.assertEqual(body['model_id'], model)
            self.assertEqual(body['text'], 'Original unchanged text.')

    def test_exact_generation_contract_no_hidden_text_or_credentials_in_body(self):
        opener = FakeOpener(FakeResponse(b'ID3' + b'\0' * 100, {'Content-Type': 'audio/mpeg', 'character-cost': '12', 'request-id': 'provider-fixture'}))
        adapter = ElevenLabs(self.path, opener)
        result = adapter.generate('voice1', 'Hello world.', threading.Event())
        request = opener.requests[0]
        self.assertEqual(request.full_url, 'https://api.elevenlabs.io/v1/text-to-speech/voice1?output_format=mp3_44100_128')
        self.assertEqual(json.loads(request.data), {'text': 'Hello world.', 'model_id': MODEL, 'voice_settings': {'stability': 0.5}})
        self.assertNotIn('test-local-secret', request.data.decode())
        self.assertEqual(result['providerReportedCharacters'], 12)
        self.assertFalse(result['simulated'])

    def test_missing_or_invalid_audio_and_pre_cancel_block(self):
        adapter = ElevenLabs(self.path, FakeOpener(FakeResponse(b'error-json', {'Content-Type': 'audio/mpeg'})))
        with self.assertRaises(AIError):
            adapter.generate('voice1', 'Hello.', threading.Event())
        cancel = threading.Event()
        cancel.set()
        with self.assertRaises(AIError):
            adapter.generate('voice1', 'Hello.', cancel)

    def test_key_file_must_be_private_regular_owned_and_not_symlink(self):
        os.environ['ELEVENLABS_API_KEY'] = ''
        key = self.path / 'elevenlabs.key'
        key.write_text('fixture-local-key')
        key.chmod(0o600)
        self.assertTrue(ElevenLabs(self.path).configured())
        key.chmod(0o644)
        self.assertFalse(ElevenLabs(self.path).configured())
        key.chmod(0o600)
        key.rename(self.path / 'actual.key')
        key.symlink_to(self.path / 'actual.key')
        self.assertFalse(ElevenLabs(self.path).configured())


if __name__ == '__main__':
    unittest.main()
