import sys,importlib.util,tempfile,json,threading,urllib.request,urllib.error,zipfile,io
from pathlib import Path
from http.server import ThreadingHTTPServer
base=Path(__file__).resolve().parents[1]/'launchers';sys.path.insert(0,str(base));import serve_campaign
with tempfile.TemporaryDirectory() as tmp:
 root=Path(tmp);(root/'output/campaign').mkdir(parents=True);(root/'output/campaign/Session-01-TV-Display.html').write_text('fixture');serve_campaign.ROOT=root
 server=ThreadingHTTPServer(('127.0.0.1',0),serve_campaign.Handler);threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/__echo_package';body=json.dumps({'format':'echo-below-campaign-v2','sessions':[{'id':'one','state':{}}]}).encode()
 try:
  try:urllib.request.urlopen(urllib.request.Request(url,data=body));raise AssertionError('Untrusted origin accepted')
  except urllib.error.HTTPError as e:assert e.code==403
  with urllib.request.urlopen(urllib.request.Request(url,data=body,headers={'Origin':'http://127.0.0.1:48261','Content-Type':'application/json'})) as r:
   assert r.headers.get_content_type()=='application/zip'
   with zipfile.ZipFile(io.BytesIO(r.read())) as z:assert z.read('output/campaign/Session-01-TV-Display.html')==b'fixture';assert 'campaign-backup.json' in z.namelist();assert 'Start-Campaign.command' in z.namelist()
 finally:server.shutdown();server.server_close()
print('Portable HTTP download passed: authorized download, app and state present, other origins rejected.')
