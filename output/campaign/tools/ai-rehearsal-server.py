"""Isolated browser-test server. Never opens the production AI store or phone service."""
from pathlib import Path
import sys
import os
import tempfile
from http.server import ThreadingHTTPServer

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'launchers'))
from serve_campaign import Handler, ROOT
from ai_service import AIService

with tempfile.TemporaryDirectory(prefix='echo-ai-rehearsal-') as private:
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    server.ai_service = AIService(private, served_root=ROOT, port=server.server_port)
    if os.environ.get('ECHO_TEST_VOICE_FIXTURE') == '1':
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tests'))
        from test_voice_audition import FixtureProvider
        from voice_audition import VoiceAuditionService
        import io
        import wave
        class BrowserFixture(FixtureProvider):
            def account(self, allow_included_plan=False):
                result = super().account(allow_included_plan)
                if allow_included_plan:
                    result.update(tier='creator', verifiedFree=False)
                return result

            def generate(self, voice, text, cancel, model='eleven_multilingual_v2', delivery=None):
                if text.startswith('CANCEL FIXTURE'):
                    cancel.wait(4)
                result = super().generate(voice, text, cancel, model=model)
                output = io.BytesIO()
                with wave.open(output, 'wb') as stream:
                    stream.setnchannels(1)
                    stream.setsampwidth(2)
                    stream.setframerate(8000)
                    stream.writeframes(b'\0\0' * 40000)
                result['audio'] = output.getvalue()
                return result
        server.ai_service.voice_service = VoiceAuditionService(private, served_root=ROOT, adapter=BrowserFixture())
    print(server.server_port, flush=True)
    try:
        server.serve_forever()
    finally:
        server.server_close()
