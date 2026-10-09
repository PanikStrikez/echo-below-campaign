"""Private, opt-in stock-voice auditions using explicitly allowed included credits.

No browser credentials, clone endpoints, paid overages, retries, or player routes.
The transport is injectable for tests; synthetic audio is always labeled simulated.
"""
from __future__ import annotations

import copy
import hashlib
import json
import math
import os
from pathlib import Path
import re
import secrets
import stat
import tempfile
import threading
import time
from datetime import datetime, timezone
from urllib import error as urlerror, request as urlrequest
from urllib.parse import parse_qs, urlencode

from ai_service import AIError, _NoRedirect

MODEL = 'eleven_multilingual_v2'
SUPPORTED_MODELS = {'eleven_multilingual_v2', 'eleven_v3'}
FORMAT = 'mp3_44100_128'
MAX_TEXT = 5000
MAX_JOBS = 2000
MAX_AUDIO = 12_000_000
TERMINAL = {'completed', 'cancelled', 'failed'}
DEFAULT_SETTINGS = {'enabled': False, 'freeOnly': True,
                    'includedPlanCredits': None,
                    'providers': {'elevenlabs': {'accountConfirmed': False}}}
STYLE_KEYS = {'description', 'pace', 'pronunciation', 'emotionalRange'}


def fail(code, message, status=400):
    raise AIError(code, message, status)


def text(value, maximum, label, empty=False):
    if not isinstance(value, str) or len(value) > maximum or '\x00' in value or (not empty and not value.strip()):
        fail('invalid_voice_request', f'{label} must be plain text within its size limit.')
    try:
        value.encode('utf-8')
    except UnicodeError:
        fail('invalid_voice_request', f'{label} contains invalid text.')
    return value


def identifier(value, label):
    if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', value):
        fail('invalid_voice_request', f'{label} must be a safe identifier.')
    return value


def now():
    return datetime.now(timezone.utc).isoformat()


class AudioResult:
    def __init__(self, data, content_type):
        self.data, self.content_type = data, content_type


class ElevenLabs:
    """Fixed first-party HTTPS endpoints. Keys are never returned in status or errors."""
    simulated = False

    def __init__(self, state_dir, opener=None):
        self.state_dir = Path(state_dir)
        self.opener = opener or urlrequest.build_opener(_NoRedirect)

    def _key(self):
        value = os.environ.get('ELEVENLABS_API_KEY', '').strip()
        if not value:
            path = self.state_dir / 'elevenlabs.key'
            try:
                info = path.lstat()
                if not stat.S_ISREG(info.st_mode) or info.st_mode & 0o077 or info.st_uid != os.getuid() or info.st_size > 1024:
                    fail('credential_permissions', 'The private ElevenLabs key file must be owned by you and readable only by you.', 409)
                # O_NOFOLLOW closes the symlink-swap gap after the permission check.
                fd = os.open(path, os.O_RDONLY | getattr(os, 'O_NOFOLLOW', 0))
                try:
                    opened = os.fstat(fd)
                    if opened.st_ino != info.st_ino or opened.st_dev != info.st_dev:
                        fail('credential_permissions', 'The private key file changed while opening. Try setup again.', 409)
                    value = os.read(fd, 1025).decode('utf-8').strip()
                finally:
                    os.close(fd)
            except FileNotFoundError:
                value = ''
            except (OSError, UnicodeError):
                fail('credential_unavailable', 'The private ElevenLabs key could not be read. Run local key setup again.', 409)
        if value and (len(value) > 1024 or any(ord(char) < 33 or ord(char) > 126 for char in value)):
            fail('credential_invalid', 'The local ElevenLabs key has an invalid format.', 409)
        return value

    def configured(self):
        try:
            return bool(self._key())
        except AIError:
            return False

    def _request(self, path, body=None, maximum=1_000_000):
        key = self._key()
        if not key:
            fail('voice_key_missing', 'Set up an ElevenLabs account and its private local API key first.', 409)
        req = urlrequest.Request('https://api.elevenlabs.io' + path,
            data=json.dumps(body).encode('utf-8') if body is not None else None,
            headers={'xi-api-key': key, 'Accept': 'audio/mpeg' if body else 'application/json',
                     'Content-Type': 'application/json'})
        try:
            with self.opener.open(req, timeout=45) as response:
                data = response.read(maximum + 1)
                headers = {key.lower(): value for key, value in response.headers.items()}
            if len(data) > maximum:
                fail('voice_response_large', 'The provider response exceeded the audition size limit.', 502)
            return data, headers
        except urlerror.HTTPError as exc:
            if exc.code in (401, 403):
                fail('voice_auth', 'ElevenLabs did not accept the local key or its permissions.', 401)
            if exc.code in (402, 429):
                fail('voice_quota', 'ElevenLabs reports insufficient credits or a rate limit. No retry was sent.', 429)
            fail('voice_provider_error', 'ElevenLabs could not finish this request. No retry was sent.', 502)
        except (urlerror.URLError, TimeoutError, OSError):
            fail('voice_unavailable', 'ElevenLabs could not be reached. No retry was sent.', 502)

    def account(self, allow_included_plan=False):
        data, _ = self._request('/v1/user/subscription')
        try:
            raw = json.loads(data)
            used, limit = raw.get('character_count'), raw.get('character_limit')
            reset = raw.get('next_character_count_reset_unix')
            tier = raw.get('tier')
            if tier != 'free' and not (allow_included_plan and tier == 'creator'):
                if allow_included_plan:
                    fail('voice_tier_unsupported', 'This audition supports included credits on Free or Creator accounts only.', 409)
                fail('free_tier_required', 'Free-only mode requires an ElevenLabs Free account. To use Creator, explicitly approve included-credit limits first.', 409)
            # Creator may be entitled to buy overages while its admin has set a
            # zero cap. The current cap is authoritative; the old flags are only
            # a fallback for Free accounts that omit the replacement field.
            if 'has_open_invoices' in raw and raw['has_open_invoices'] is not False:
                fail('free_tier_unverified', 'Automatic extra usage or account billing could not be ruled out. Generation is blocked.', 409)
            if 'max_credit_limit_extension' in raw:
                extension = raw['max_credit_limit_extension']
                if type(extension) is not int or extension != 0:
                    fail('free_tier_unverified', 'Usage-based billing must be disabled: max credit extension must be zero.', 409)
            elif tier != 'free' or raw.get('can_extend_character_limit') is not False or raw.get('allowed_to_extend_character_limit') is not False:
                fail('free_tier_unverified', 'The provider did not confirm that usage-based billing is disabled.', 409)
            if tier == 'free' and (raw.get('can_extend_character_limit') is not False
                    or 'allowed_to_extend_character_limit' in raw and raw['allowed_to_extend_character_limit'] is not False):
                fail('free_tier_unverified', 'The provider did not confirm a free account without extra usage.', 409)
            if type(used) is not int or type(limit) is not int or not 0 <= used <= limit:
                fail('free_quota_unverified', 'The provider did not return a usable credit allowance. Generation is blocked.', 409)
            if reset is not None and (type(reset) is not int or reset <= 0):
                fail('free_quota_unverified', 'The provider returned an unreadable free-credit reset time.', 409)
            return {'provider': 'elevenlabs', 'tier': tier, 'usedCharacters': used,
                    'limitCharacters': limit, 'remainingCharacters': limit - used,
                    'periodId': str(reset) if reset is not None else 'unknown', 'resetKnown': reset is not None,
                    'checkedAt': now(), 'verifiedFree': tier == 'free',
                    'verifiedIncludedCredits': True, 'overageDisabled': True}
        except (ValueError, TypeError, AttributeError):
            fail('free_quota_unverified', 'The provider returned an unreadable account allowance. Generation is blocked.', 502)

    def catalog(self, allow_included_plan=False):
        try:
            result = []
            page_token = None
            seen_pages = set()
            for _ in range(5):
                query = {'category': 'premade', 'include_custom_rates': 'false',
                         'page_size': '100', 'include_total_count': 'false'}
                if page_token:
                    query['next_page_token'] = page_token
                data, _ = self._request('/v2/voices?' + urlencode(query))
                raw = json.loads(data)
                for item in raw.get('voices', []):
                    if not isinstance(item, dict) or item.get('category') != 'premade' or item.get('is_legacy') is True or item.get('is_mixed') is True:
                        continue
                    tiers = item.get('available_for_tiers')
                    if isinstance(tiers, list) and tiers and not ({'free', 'creator'} if allow_included_plan else {'free'}).intersection(tiers):
                        continue
                    if not allow_included_plan and isinstance(item.get('sharing'), dict) and item['sharing'].get('free_users_allowed') is False:
                        continue
                    voice_id = item.get('voice_id')
                    if not isinstance(voice_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,100}', voice_id):
                        continue
                    result.append({'id': voice_id, 'name': str(item.get('name', 'Stock voice'))[:120],
                        'category': item['category'], 'source': 'provider-stock',
                        'labels': {str(key)[:60]: str(value)[:160] for key, value in item.get('labels', {}).items()
                                   if key in ('accent', 'gender', 'age', 'descriptive', 'use_case')},
                        'model': MODEL})
                if not raw.get('has_more'):
                    return result
                page_token = raw.get('next_page_token')
                if not isinstance(page_token, str) or len(page_token) > 500 or page_token in seen_pages:
                    fail('voice_catalog_error', 'The provider returned an unusable voice catalog page.', 502)
                seen_pages.add(page_token)
            fail('voice_catalog_error', 'The stock voice catalog exceeded the audition lookup limit.', 502)
            return result
        except (ValueError, TypeError, AttributeError):
            fail('voice_catalog_error', 'The provider returned an unreadable stock-voice catalog.', 502)

    def generate(self, voice_id, script, cancel_event, model=MODEL, delivery=None):
        if model not in SUPPORTED_MODELS:
            fail('voice_model_unsupported', 'Choose one of the supported audition models.')
        if cancel_event.is_set():
            fail('cancelled', 'Audition cancelled.', 409)
        body = {'text': script, 'model_id': model, 'voice_settings': delivery or {'stability': 0.5}}
        data, headers = self._request('/v1/text-to-speech/' + voice_id + '?output_format=' + FORMAT,
                                     body=body, maximum=MAX_AUDIO)
        mime = headers.get('content-type', '').split(';')[0].strip()
        if mime not in ('audio/mpeg', 'audio/mp3', 'application/octet-stream') or not (data.startswith(b'ID3') or (len(data) > 2 and data[0] == 255 and data[1] & 224 == 224)):
            fail('voice_audio_invalid', 'The provider returned no valid MP3 audition. It was not saved.', 502)
        reported = headers.get('character-cost')
        reported_chars = int(reported) if isinstance(reported, str) and reported.isdigit() else None
        request_id = headers.get('request-id')
        return {'audio': data, 'format': FORMAT, 'contentType': 'audio/mpeg',
                'providerReportedCharacters': reported_chars,
                'providerRequestId': request_id[:160] if isinstance(request_id, str) else None,
                'providerReportedCostUsd': None, 'simulated': False}


class VoiceAuditionService:
    def __init__(self, state_dir, served_root=None, adapter=None):
        self.state_dir = Path(state_dir).expanduser().resolve()
        if served_root and self.state_dir.is_relative_to(Path(served_root).resolve()):
            raise ValueError('Voice data must remain outside the served tree.')
        self.lock = threading.RLock()
        self.settings = copy.deepcopy(DEFAULT_SETTINGS)
        self.jobs = {}
        self.storage_error = False
        self.adapter = adapter or ElevenLabs(self.state_dir)
        self.last_account = None
        self.stock = {}
        self._load()

    def _load(self):
        path = self.state_dir / 'voices.json'
        if not path.exists():
            return
        try:
            raw = json.loads(path.read_text())
            if set(raw) != {'version', 'settings', 'jobs'} or raw['version'] != 1 or not isinstance(raw['jobs'], list) or len(raw['jobs']) > MAX_JOBS:
                raise ValueError()
            self.settings = self._settings(raw['settings'])
            request_ids = set()
            for job in raw['jobs']:
                if not isinstance(job, dict):
                    raise ValueError()
                for key in ('id', 'requestId', 'voiceId', 'scriptId'):
                    identifier(job[key], key)
                if job['id'] in self.jobs or job['requestId'] in request_ids:
                    raise ValueError()
                request_ids.add(job['requestId'])
                # A damaged usage record must not silently lose a reservation or
                # appear as a working connection on the next status request.
                if (job['provider'] != 'elevenlabs' or job['model'] not in SUPPORTED_MODELS
                        or job['status'] not in TERMINAL | {'queued', 'checking_account', 'running'}
                        or type(job['dispatched']) is not bool or type(job['simulated']) is not bool
                        or type(job['characters']) is not int or job['characters'] < 1
                        or type(job['reservedCharacters']) is not int or job['reservedCharacters'] < 0
                        or not isinstance(job['digest'], str) or not re.fullmatch(r'[a-f0-9]{64}', job['digest'])
                        or job['periodId'] is not None and not isinstance(job['periodId'], str)):
                    raise ValueError()
                script = text(job['text'], MAX_TEXT, 'Saved audition script')
                if job['characters'] != len(script):
                    raise ValueError()
                if job['dispatched'] and job['reservedCharacters'] < len(script.encode('utf-8')):
                    raise ValueError()
                if job['dispatched'] and not job['periodId']:
                    raise ValueError()
                if job['status'] == 'completed' and (not job['dispatched'] or job['contentType'] not in ('audio/mpeg', 'audio/wav')):
                    raise ValueError()
                if job['status'] not in TERMINAL:
                    job['status'] = 'failed'
                    job['error'] = {'code': 'service_restarted', 'message': 'The service restarted; no automatic retry was made. Dispatched credits remain reserved.'}
                if not job['dispatched']:
                    job['reservedCharacters'] = 0
                job.update({'_done': True, '_cancel': threading.Event()})
                self.jobs[job['id']] = job
        except (ValueError, OSError, KeyError, TypeError, AIError):
            self.settings = copy.deepcopy(DEFAULT_SETTINGS)
            self.jobs = {}
            self.storage_error = True

    def _save(self):
        try:
            self.state_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
            self.state_dir.chmod(0o700)
            rows = [{key: value for key, value in job.items() if not key.startswith('_')}
                    for job in self.jobs.values()]
            body = json.dumps({'version': 1, 'settings': self.settings, 'jobs': rows}, ensure_ascii=False)
            fd, temporary = tempfile.mkstemp(prefix='.voices-', dir=self.state_dir)
            try:
                os.fchmod(fd, 0o600)
                with os.fdopen(fd, 'w') as stream:
                    stream.write(body)
                    stream.flush()
                    os.fsync(stream.fileno())
                os.replace(temporary, self.state_dir / 'voices.json')
            finally:
                if os.path.exists(temporary):
                    os.unlink(temporary)
        except OSError:
            self.storage_error = True
            fail('voice_storage_error', 'Private audition storage could not be saved. Generation is blocked.', 503)

    @staticmethod
    def _settings(patch, old=None):
        base = copy.deepcopy(old or DEFAULT_SETTINGS)
        if not isinstance(patch, dict) or set(patch) - set(DEFAULT_SETTINGS):
            fail('invalid_voice_settings', 'Only enabled, freeOnly, includedPlanCredits, and approved provider account settings are accepted.')
        if 'providers' in patch:
            providers = patch['providers']
            if not isinstance(providers, dict) or set(providers) != {'elevenlabs'} or not isinstance(providers['elevenlabs'], dict) or set(providers['elevenlabs']) != {'accountConfirmed'} or type(providers['elevenlabs']['accountConfirmed']) is not bool:
                fail('invalid_voice_settings', 'Confirm the ElevenLabs account explicitly; credentials do not belong in settings.')
        base.update(copy.deepcopy(patch))
        if type(base['enabled']) is not bool or type(base['freeOnly']) is not bool:
            fail('free_only_required', 'Choose free-only or an explicitly limited included-credit audition. Additional spending remains disabled.')
        allowance = base['includedPlanCredits']
        if allowance is not None and (not isinstance(allowance, dict)
                or set(allowance) != {'perSampleLimit', 'totalLimit'}
                or any(type(allowance[key]) is not int or not 1 <= allowance[key] <= 1_000_000 for key in allowance)
                or allowance['perSampleLimit'] > allowance['totalLimit']):
            fail('invalid_credit_allowance', 'Set positive per-sample and total credit limits; the sample limit cannot exceed the total.')
        if not base['freeOnly'] and allowance is None:
            fail('credit_allowance_required', 'Set a per-sample and total included-credit limit before using a Creator plan.')
        return base

    def _configured(self):
        return bool(self.adapter.configured())

    def _public(self, job):
        result = {key: copy.deepcopy(value) for key, value in job.items() if not key.startswith('_')}
        result.pop('digest', None)
        result['audioUrl'] = '/__echo_ai/voices/audio/' + job['id'] if job['status'] == 'completed' else None
        return result

    def status(self):
        with self.lock:
            rows = list(self.jobs.values())
            simulated = bool(getattr(self.adapter, 'simulated', False))
            return {'settings': copy.deepcopy(self.settings), 'providers': [{
                'id': 'elevenlabs', 'label': 'ElevenLabs', 'configured': self._configured(),
                'connected': self.last_account is not None and not simulated,
                'generationVerified': any(row['status'] == 'completed' and not row['simulated'] for row in rows),
                'model': MODEL, 'supportedModels': sorted(SUPPORTED_MODELS),
                'billing': 'free-credits-only' if self.settings['freeOnly'] else 'included-plan-credits-only', 'simulated': simulated,
                'note': 'A configured key is not a tested connection. Account, allowance, and disabled overage are checked before each request.'}],
                'usage': {'paidSpendUsd': 0, 'additionalSpendUsd': 0,
                    'submittedCharacters': sum(row['characters'] for row in rows if row['dispatched'] and not row['simulated']),
                    'reservedCharacters': sum(row['reservedCharacters'] for row in rows if not row['simulated']),
                    'completedSamples': sum(row['status'] == 'completed' and not row['simulated'] for row in rows),
                    'dispatchedRequests': sum(row['dispatched'] and not row['simulated'] for row in rows),
                    'simulatedSamples': sum(row['status'] == 'completed' and row['simulated'] for row in rows),
                    'providerReportedCostUsd': None},
                'account': copy.deepcopy(self.last_account), 'jobs': [self._public(row) for row in rows[-30:]],
                'storageReady': not self.storage_error,
                'notes': ['Only provider-stock voices are accepted; cloning is unavailable.',
                    'Cancellation discards audio, but dispatched included credits may still be consumed.',
                    'No account keys, source books, campaign records, or phone data are sent with these original audition scripts.']}

    def update_settings(self, patch):
        with self.lock:
            if self.storage_error:
                fail('voice_storage_error', 'Private audition storage needs repair before enabling generation.', 503)
            previous = self.settings
            self.settings = self._settings(patch, previous)
            try:
                self._save()
            except AIError:
                self.settings = previous
                raise
            if previous != self.settings:
                for job in self.jobs.values():
                    self._cancel(job)
                self._save()
            if not self.settings['providers']['elevenlabs']['accountConfirmed']:
                self.last_account, self.stock = None, {}
            return self.status()

    def _approved(self):
        if self.storage_error:
            fail('voice_storage_error', 'Private audition storage is unavailable.', 503)
        if not self.settings['providers']['elevenlabs']['accountConfirmed']:
            fail('voice_account_confirmation', 'Confirm the ElevenLabs account before contacting the provider.', 409)
        if not self._configured():
            fail('voice_key_missing', 'Connect your ElevenLabs account using private local key setup first.', 409)

    def _account(self):
        account = self.adapter.account(allow_included_plan=not self.settings['freeOnly'])
        if self.settings['freeOnly']:
            verified = account.get('tier') == 'free' and account.get('verifiedFree') is True
        else:
            verified = (account.get('tier') in ('free', 'creator')
                        and account.get('verifiedIncludedCredits') is True
                        and account.get('overageDisabled') is True)
        if not verified:
            fail('voice_allowance_unverified', 'The selected account allowance could not be verified. No speech request was sent.', 409)
        return account

    def account(self):
        with self.lock:
            # A failed recheck must replace the old successful status, too.
            self.last_account = None
            self._approved()
        account = self._account()
        with self.lock:
            self._approved()
            self.last_account = account
        return {'account': copy.deepcopy(account)}

    def catalog(self):
        with self.lock:
            self.stock = {}
        self.account()  # verifies the approved account mode even for this read-only setup path
        voices = self.adapter.catalog(allow_included_plan=not self.settings['freeOnly'])
        with self.lock:
            self._approved()
            self.stock = {row['id']: row for row in voices if row.get('source') == 'provider-stock'}
            return {'provider': 'elevenlabs', 'model': MODEL, 'voices': copy.deepcopy(list(self.stock.values()))}

    def create_job(self, payload):
        keys = {'requestId', 'provider', 'voiceId', 'scriptId', 'text', 'style'}
        if not isinstance(payload, dict) or not keys <= set(payload) or set(payload) - keys - {'model', 'delivery'} or payload['provider'] != 'elevenlabs':
            fail('invalid_voice_request', 'Send only an ElevenLabs stock voice, original script, and style notes.')
        model = payload.get('model', MODEL)
        if not isinstance(model, str) or model not in SUPPORTED_MODELS:
            fail('voice_model_unsupported', 'Choose one of the supported audition models.')
        delivery = payload.get('delivery')
        if delivery is not None:
            if model != 'eleven_multilingual_v2':
                fail('voice_delivery_model', 'Use Multilingual v2 for studio delivery controls.')
            if not isinstance(delivery, dict) or set(delivery) != {'stability', 'speed', 'style'}:
                fail('voice_delivery_invalid', 'Delivery accepts only stability, speed and style.')
            for key, lower, upper in [('stability', 0, 1), ('speed', .7, 1.2), ('style', 0, 1)]:
                if type(delivery[key]) not in (int, float) or not math.isfinite(delivery[key]) or not lower <= delivery[key] <= upper:
                    fail('voice_delivery_invalid', 'Delivery settings are outside the supported range.')
        for key in ('requestId', 'voiceId', 'scriptId'):
            identifier(payload[key], key)
        script = text(payload['text'], MAX_TEXT, 'Original audition script')
        style = payload['style']
        if not isinstance(style, dict) or set(style) != STYLE_KEYS:
            fail('invalid_voice_request', 'Style notes must include description, pace, pronunciation, and emotionalRange.')
        text(style['description'], 800, 'description', empty=True)
        if type(style['pace']) not in (int, float) or not math.isfinite(style['pace']) or not 0.7 <= style['pace'] <= 1.2:
            fail('invalid_voice_request', 'Pace must be a number from 0.7 to 1.2.')
        if not isinstance(style['pronunciation'], list) or len(style['pronunciation']) > 20:
            fail('invalid_voice_request', 'Use at most 20 pronunciation notes.')
        for row in style['pronunciation']:
            if not isinstance(row, dict) or set(row) != {'term', 'sayAs'}:
                fail('invalid_voice_request', 'Each pronunciation note needs term and sayAs.')
            text(row['term'], 120, 'pronunciation term')
            text(row['sayAs'], 160, 'pronunciation guidance')
        if not isinstance(style['emotionalRange'], list) or len(style['emotionalRange']) > 12:
            fail('invalid_voice_request', 'Use at most 12 emotional range notes.')
        for value in style['emotionalRange']:
            text(value, 120, 'emotional range')
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
        with self.lock:
            for prior in self.jobs.values():
                if prior['requestId'] == payload['requestId']:
                    if prior['digest'] != digest:
                        fail('voice_request_conflict', 'This audition request identifier was already used for different content.', 409)
                    return self._public(prior)
            self._approved()
            if not self.settings['enabled']:
                fail('voice_disabled', 'Enable the approved included-credit audition before generating.', 409)
            if payload['voiceId'] not in self.stock:
                fail('stock_voice_required', 'Load the provider stock-voice catalog and choose a voice from it first.', 409)
            if any(not job['_done'] for job in self.jobs.values()):
                fail('voice_busy', 'Wait for the current audition or cancel it before starting another.', 429)
            if len(self.jobs) >= MAX_JOBS:
                fail('voice_history_full', 'The private generation history has reached its 2,000-request limit. Existing local recordings still play; archive this history before extending the service limit.', 409)
            job_id = secrets.token_urlsafe(18)
            job = {'id': job_id, 'requestId': payload['requestId'], 'provider': 'elevenlabs', 'model': model,
                'voiceId': payload['voiceId'], 'voiceName': self.stock[payload['voiceId']]['name'],
                'scriptId': payload['scriptId'], 'text': script, 'scriptSha256': hashlib.sha256(script.encode()).hexdigest(),
                'delivery': copy.deepcopy(delivery), 'style': copy.deepcopy(style), 'appliedStyle': 'Natural stability (0.5). Other style, pacing, emotion, and pronunciation notes are saved directions for review; they are not sent as hidden script changes.',
                'status': 'queued', 'createdAt': now(), 'finishedAt': None, 'error': None, 'characters': len(script),
                # UTF-8 bytes conservatively cover Unicode/code-unit accounting.
                'reservedCharacters': len(script.encode('utf-8')), 'dispatched': False, 'periodId': None,
                'generationMilliseconds': None, 'format': None, 'contentType': None,
                'providerReportedCharacters': None, 'providerReportedCostUsd': None, 'providerRequestId': None,
                'simulated': bool(getattr(self.adapter, 'simulated', False)), 'digest': digest,
                '_cancel': threading.Event(), '_done': False}
            if delivery is not None:
                job['appliedStyle'] = 'Applied explicit stability, speed and style controls; text sent unchanged.'
            self.jobs[job_id] = job
            try:
                self._save()
            except AIError:
                del self.jobs[job_id]
                raise
            initial = self._public(job)
            threading.Thread(target=self._run, args=(job,), daemon=True).start()
            return initial

    def _run(self, job):
        try:
            with self.lock:
                if job['_cancel'].is_set():
                    return
                job['status'] = 'checking_account'
                self.last_account = None
            account = self._account()
            with self.lock:
                self._approved()
                if job['_cancel'].is_set() or not self.settings['enabled']:
                    self._cancel(job)
                    return
                self.last_account = account
                job['periodId'] = account['periodId']
                # Double-counting previously consumed credits is intentional. A stale
                # provider balance must not allow another generation beyond free quota.
                used_here = sum(row['reservedCharacters'] for row in self.jobs.values()
                                if row['id'] != job['id'] and (account['periodId'] == 'unknown'
                                    or row['periodId'] in (account['periodId'], 'unknown')))
                allowance = self.settings['includedPlanCredits'] if not self.settings['freeOnly'] else None
                if allowance is not None:
                    reserved_total = sum(row['reservedCharacters'] for row in self.jobs.values() if row['id'] != job['id'])
                    if job['reservedCharacters'] > allowance['perSampleLimit'] or job['reservedCharacters'] + reserved_total > allowance['totalLimit']:
                        fail('voice_credit_limit', 'This sample exceeds the approved per-sample or total credit limit. No speech request was sent.', 429)
                if job['reservedCharacters'] + used_here > account['remainingCharacters']:
                    fail('free_quota_insufficient', 'This sample exceeds the conservatively available included credits. No speech request was sent.', 429)
                job['status'] = 'running'
                job['dispatched'] = True
                self._save()  # durable reservation precedes the potentially billable call
            started = time.monotonic()
            answer = self.adapter.generate(job['voiceId'], job['text'], job['_cancel'], model=job['model'], **({'delivery': job['delivery']} if job.get('delivery') is not None else {}))
            elapsed = round((time.monotonic() - started) * 1000)
            with self.lock:
                job['generationMilliseconds'] = elapsed
                if job['_cancel'].is_set():
                    self._cancel(job)
                    return
                if not isinstance(answer.get('audio'), bytes) or not 44 <= len(answer['audio']) <= MAX_AUDIO:
                    fail('voice_audio_invalid', 'No usable audio was returned; the sample was not saved.', 502)
                if bool(answer.get('simulated')) != job['simulated']:
                    fail('voice_audio_invalid', 'The provider returned inconsistent simulation metadata.', 502)
                self._write_audio(job['id'], answer['audio'])
                for key in ('format', 'contentType', 'providerReportedCharacters', 'providerReportedCostUsd', 'providerRequestId'):
                    job[key] = answer.get(key)
                job['status'] = 'completed'
        except Exception as exc:
            with self.lock:
                if job['_cancel'].is_set():
                    self._cancel(job)
                else:
                    job['status'] = 'failed'
                    job['error'] = {'code': exc.code, 'message': str(exc)} if isinstance(exc, AIError) else {
                        'code': 'voice_provider_error', 'message': 'The audition could not finish. No retry was sent.'}
        finally:
            with self.lock:
                job['_done'] = True
                job['finishedAt'] = now()
                if not job['dispatched']:
                    job['reservedCharacters'] = 0
                try:
                    self._save()
                except AIError:
                    # The reservation remains durable. Do not expose audio if metadata
                    # cannot be committed; restore then fails closed.
                    job['status'] = 'failed'
                    job['error'] = {'code': 'voice_storage_error', 'message': 'The private sample metadata could not be saved.'}

    def _write_audio(self, job_id, data):
        directory = self.state_dir / 'voice-audio'
        if directory.is_symlink():
            fail('voice_storage_error', 'Private audio storage must not be a linked directory.', 503)
        directory.mkdir(mode=0o700, exist_ok=True)
        directory.chmod(0o700)
        fd, temporary = tempfile.mkstemp(prefix='.audio-', dir=directory)
        try:
            os.fchmod(fd, 0o600)
            with os.fdopen(fd, 'wb') as stream:
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temporary, directory / (job_id + '.audio'))
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)

    def get_job(self, job_id):
        with self.lock:
            if job_id not in self.jobs:
                fail('voice_job_missing', 'This private audition could not be found.', 404)
            return self._public(self.jobs[job_id])

    def _cancel(self, job):
        if job['status'] in TERMINAL:
            return
        job['_cancel'].set()
        job['status'] = 'cancelled'
        job['finishedAt'] = now()

    def cancel_job(self, job_id):
        with self.lock:
            self.get_job(job_id)
            self._cancel(self.jobs[job_id])
            self._save()
            return self._public(self.jobs[job_id])

    def audio(self, job_id):
        with self.lock:
            job = self.get_job(job_id)
            if job['status'] != 'completed':
                fail('voice_audio_missing', 'No completed audio exists for this audition.', 404)
            try:
                directory = self.state_dir / 'voice-audio'
                path = directory / (job_id + '.audio')
                if directory.is_symlink() or not stat.S_ISREG(path.lstat().st_mode):
                    fail('voice_audio_missing', 'Private audio must be a regular local file.', 404)
                data = path.read_bytes()
            except OSError:
                fail('voice_audio_missing', 'The private audio file could not be opened.', 404)
            return AudioResult(data, job['contentType'])

    def dispatch(self, method, path, payload=None, query=''):
        if method == 'GET' and path == '/voices/status':
            return self.status()
        if method == 'POST' and path == '/voices/settings':
            return self.update_settings(payload)
        if method == 'GET' and path in ('/voices/catalog', '/voices/account'):
            if parse_qs(query).get('provider', ['elevenlabs']) != ['elevenlabs']:
                fail('voice_provider_unsupported', 'Only the approved ElevenLabs audition is implemented.', 400)
            return self.catalog() if path.endswith('/catalog') else self.account()
        if method == 'POST' and path == '/voices/jobs':
            return {'job': self.create_job(payload)}
        if method == 'GET' and re.fullmatch(r'/voices/jobs/[A-Za-z0-9_-]+', path):
            return {'job': self.get_job(path.rsplit('/', 1)[1])}
        if method == 'POST' and re.fullmatch(r'/voices/jobs/[A-Za-z0-9_-]+/cancel', path):
            if payload != {}:
                fail('invalid_voice_request', 'Cancellation accepts an empty object.')
            return {'job': self.cancel_job(path.split('/')[3])}
        if method == 'GET' and re.fullmatch(r'/voices/audio/[A-Za-z0-9_-]+', path):
            return self.audio(path.rsplit('/', 1)[1])
        fail('voice_route_missing', 'This voice audition route does not exist.', 404)
