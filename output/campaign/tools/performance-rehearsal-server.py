"""Disposable desktop/phone servers for browser timing. No production state or listeners."""
from pathlib import Path
import sys,tempfile,os,threading,json
from http.server import ThreadingHTTPServer
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'launchers'))
import serve_campaign,serve_phones
from ai_service import AIService
with tempfile.TemporaryDirectory(prefix='echo-browser-performance-') as private:
 os.environ['ECHO_CAMPAIGN_STATE_DIR']=str(Path(private)/'campaign')
 desktop=ThreadingHTTPServer(('127.0.0.1',0),serve_campaign.Handler)
 desktop.ai_service=AIService(private,served_root=serve_campaign.ROOT,port=desktop.server_port)
 phone=ThreadingHTTPServer(('127.0.0.1',0),serve_phones.Handler)
 serve_phones.PORT=phone.server_port;serve_phones.lan_address=lambda:'127.0.0.1'
 serve_phones.DM_ORIGINS.add(f'http://127.0.0.1:{desktop.server_port}')
 for server in [desktop,phone]:threading.Thread(target=server.serve_forever,daemon=True).start()
 print(json.dumps({'desktop':f'http://127.0.0.1:{desktop.server_port}','phone':f'http://127.0.0.1:{phone.server_port}'}),flush=True)
 try:threading.Event().wait()
 finally:
  for server in [desktop,phone]:server.shutdown();server.server_close()
