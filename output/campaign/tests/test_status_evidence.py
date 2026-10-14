"""Version identity and read-only private status endpoint, using temporary files/stores."""
from pathlib import Path
import tempfile
import unittest
import sys
import shutil
import threading
import urllib.request
import urllib.error
import json
from http.server import ThreadingHTTPServer
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'launchers'))
from status_evidence import versions
import serve_campaign

class StatusTests(unittest.TestCase):
    def fixture(self,root):
        app=root/'output/campaign';app.mkdir(parents=True)
        for path,data in [('Main.js',b'code'),('map.png',b'art'),('tests/unit.test.cjs',b'test'),('books/local.pdf',b'personal book'),('secret.key',b'credential'),('group.sqlite3',b'database'),('Campaign-Status-Evidence.js',b'generated'),('readiness/history/report.html',b'history')]:
            p=app/path;p.parent.mkdir(exist_ok=True,parents=True);p.write_bytes(data)
        return app

    def test_versions_follow_files_not_reports_accounts_or_books(self):
        with tempfile.TemporaryDirectory() as a,tempfile.TemporaryDirectory() as b:
            app=self.fixture(Path(a));first=versions(app)
            for file in ['books/local.pdf','secret.key','group.sqlite3','Campaign-Status-Evidence.js','readiness/history/report.html']:
                (app/file).write_bytes(b'changed')
            self.assertEqual(first,versions(app))
            shutil.copytree(app,Path(b)/'app');self.assertEqual(first,versions(Path(b)/'app'))
            (app/'Main.js').write_text('changed code');second=versions(app);self.assertNotEqual(first['app'],second['app']);self.assertEqual(first['assets'],second['assets'])
            (app/'map.png').write_bytes(b'changed image');third=versions(app);self.assertNotEqual(second['assets'],third['assets'])
            (app/'tests/unit.test.cjs').write_text('new test');self.assertNotEqual(third['tests'],versions(app)['tests'])

    def test_endpoint_has_only_version_metadata_and_rejects_foreign_origin(self):
        with tempfile.TemporaryDirectory() as root:
            self.fixture(Path(root));prior=serve_campaign.ROOT;serve_campaign.ROOT=Path(root)
            server=ThreadingHTTPServer(('127.0.0.1',0),serve_campaign.Handler);thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            try:
                url=f'http://127.0.0.1:{server.server_port}/__echo_status'
                with urllib.request.urlopen(url) as response:
                    value=json.load(response);self.assertEqual(set(value),{'versions','at'});self.assertIn('no-store',response.headers['Cache-Control'])
                self.assertFalse(hasattr(server,'ai_service'));self.assertFalse(hasattr(server,'campaign_service'));self.assertNotIn('credential',json.dumps(value));self.assertNotIn('database',json.dumps(value))
                for headers in [{'Origin':'http://foreign.invalid'},{'Host':'foreign.invalid'},{'Sec-Fetch-Site':'cross-site'}]:
                    with self.assertRaises(urllib.error.HTTPError) as error:urllib.request.urlopen(urllib.request.Request(url,headers=headers))
                    self.assertEqual(error.exception.code,403)
            finally:server.shutdown();server.server_close();thread.join();serve_campaign.ROOT=prior
