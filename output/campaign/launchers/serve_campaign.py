"""Serve this campaign's local files to its desktop browser on loopback only."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import re
import json
import tempfile
import shutil
import threading
import os
from urllib.parse import urlsplit
from portable_package import build
from ai_service import AIService, PREFIX
from campaign_service import CampaignService, PREFIX as CAMPAIGN_PREFIX

ROOT = Path(__file__).resolve().parents[3]
HOST = '127.0.0.1'
PORT = 48261
_AI_INIT_LOCK = threading.Lock()

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _ai(self, method):
        path = urlsplit(self.path).path
        if path != PREFIX and not path.startswith(PREFIX + '/'):
            return False
        try:
            with _AI_INIT_LOCK:
                if not hasattr(self.server, 'ai_service'):
                    self.server.ai_service = AIService(Path.home() / '.echo-below-ai',
                        served_root=ROOT, port=self.server.server_port)
            return self.server.ai_service.handle(self, method)
        except Exception:
            # Initialization errors must not prevent the existing campaign from opening,
            # or expose filesystem paths/credentials through an exception body.
            AIService._respond(self, 503, b'{"error":{"code":"service_unavailable","message":"The private local AI service is unavailable."}}')
            return True

    def _campaign(self, method):
        path = urlsplit(self.path).path
        if path != CAMPAIGN_PREFIX and not path.startswith(CAMPAIGN_PREFIX + '/'):
            return False
        try:
            with _AI_INIT_LOCK:
                if not hasattr(self.server, 'ai_service'):
                    self.server.ai_service = AIService(Path.home() / '.echo-below-ai',
                        served_root=ROOT, port=self.server.server_port)
                if not hasattr(self.server, 'campaign_service'):
                    private = Path(os.environ.get('ECHO_CAMPAIGN_STATE_DIR', str(Path.home() / '.echo-below-campaign')))
                    self.server.campaign_service = CampaignService(private, ROOT,
                        port=self.server.server_port, ai_service=self.server.ai_service)
            return self.server.campaign_service.handle(self, method)
        except Exception:
            AIService._respond(self, 503, b'{"error":{"code":"service_unavailable","message":"The private campaign service is unavailable. Check the local storage setup."}}')
            return True

    def log_message(self, format, *args):
        if urlsplit(self.path).path.startswith((PREFIX, CAMPAIGN_PREFIX)):
            return  # OAuth query strings and request identifiers never enter access logs.
        super().log_message(format, *args)

    def do_POST(self):
        if self._campaign('POST') or self._ai('POST'):
            return
        if self.path != '/__echo_package':
            return self.send_error(404)
        if self.headers.get('Origin') not in ('http://127.0.0.1:48261', 'http://localhost:48261'):
            return self.send_error(403, 'Open the local desktop app first')
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0 < length <= 300_000_000:
                return self.send_error(413, 'Campaign export is too large')
            archive=json.loads(self.rfile.read(length))
            with tempfile.TemporaryDirectory(prefix='echo-portable-') as folder:
                path=Path(folder)/'Echo-Below-Portable.zip'
                build(ROOT,archive,path)
                self.send_response(200)
                self.send_header('Content-Type','application/zip')
                self.send_header('Content-Disposition','attachment; filename="Echo-Below-Portable.zip"')
                self.send_header('Content-Length',str(path.stat().st_size))
                self.end_headers()
                with path.open('rb') as source: shutil.copyfileobj(source,self.wfile,1024*1024)
        except (ValueError, OSError) as error:
            self.send_error(500, str(error))

    def do_GET(self):
        if self._campaign('GET') or self._ai('GET'):
            return
        if self.path == '/__echo_health':
            data = b'echo-below-campaign\n'
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain; charset=utf-8')
            self.send_header('X-Echo-Package-Policy', '2')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        super().do_GET()

    def do_HEAD(self):
        if not self._campaign('HEAD') and not self._ai('HEAD'):
            super().do_HEAD()

    def do_OPTIONS(self):
        if not self._campaign('OPTIONS') and not self._ai('OPTIONS'):
            self.send_error(405)

    def send_head(self):
        path = Path(self.translate_path(self.path))
        # Private state is outside this tree. Also refuse accidental in-tree copies.
        if (any(part.startswith('.') for part in path.relative_to(ROOT).parts)
                or path.suffix.lower() in ('.sqlite', '.sqlite3', '.db', '.key')
                or path.name.endswith(('-wal', '-shm'))):
            self.send_error(404)
            return None
        if path.suffix.lower() != '.pdf' or not path.is_file():
            return super().send_head()
        size = path.stat().st_size
        requested = self.headers.get('Range', '')
        match = re.fullmatch(r'bytes=(\d+)-(\d*)', requested)
        if requested and not match:
            self.send_error(416, 'Unsupported PDF byte range')
            return None
        start = int(match.group(1)) if match else 0
        end = min(int(match.group(2)), size - 1) if match and match.group(2) else size - 1
        if start >= size or end < start:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return None
        self._remaining = end - start + 1
        stream = path.open('rb')
        stream.seek(start)
        self.send_response(206 if match else 200)
        self.send_header('Content-Type', 'application/pdf')
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(self._remaining))
        if match:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        return stream

    def copyfile(self, source, outputfile):
        if not hasattr(self, '_remaining'):
            return super().copyfile(source, outputfile)
        while self._remaining:
            chunk = source.read(min(128 * 1024, self._remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            self._remaining -= len(chunk)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

if __name__ == '__main__':
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
