"""Real HTTP filtering of a browser-produced fictional snapshot; ephemeral service only."""
from pathlib import Path
from http.server import ThreadingHTTPServer
import sys,json,threading,urllib.request,urllib.error
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'launchers'))
import serve_phones as phone
snapshot=json.loads(Path(sys.argv[1]).read_text())
assert set(snapshot['characters'])=={'pc-mira','pc-oswin'}
server=ThreadingHTTPServer(('127.0.0.1',0),phone.Handler);phone.PORT=server.server_address[1];phone.lan_address=lambda:'127.0.0.1'
threading.Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{phone.PORT}'
def call(route,data=None,cookie=None,dm=False,expected=200):
 headers={'Content-Type':'application/json','Origin':'http://127.0.0.1:48261' if dm else base}
 if cookie:headers['Cookie']=cookie
 req=urllib.request.Request(base+route,data=json.dumps(data).encode() if data is not None else None,headers=headers)
 try:r=urllib.request.urlopen(req,timeout=5)
 except urllib.error.HTTPError as e:r=e
 raw=r.read();assert r.status==expected,(route,r.status,raw[:200]);return r,json.loads(raw)
try:
 _,opened=call('/api/dm/open',{},dm=True);call('/api/dm/state',{'snapshot':snapshot},dm=True)
 cookies={}
 for id_ in snapshot['characters']:
  r,_=call('/api/join',{'code':opened['code'],'id':id_});cookies[id_]=r.headers['Set-Cookie'].split(';',1)[0]
  _,v=call('/api/state',cookie=cookies[id_]);assert v['character']['id']==id_;assert v['character']['attacks'][0]['name']=='Quarterstaff';assert [q['title'] for q in v['quests']]==['Deliver the parcel']
  assert 'Restore the crossing' not in json.dumps(v)
  assert ('A letter for Mira' in json.dumps(v))==(id_=='pc-mira')
  for forbidden in ['Trista','Pebble','Aldric','Halaster','Looking Glass','Gundren']:assert forbidden not in json.dumps(v)
 empty={'campaign':'boundary-empty-other','characters':{},'public':{'scene':'black','tokens':[],'map':{}}}
 call('/api/dm/state',{'snapshot':empty},dm=True)
 for cookie in cookies.values():call('/api/state',cookie=cookie,expected=401)
 _,status=call('/api/dm/status',dm=True);assert not status['claims'];assert phone.TABLE['roster']==[]
 print(json.dumps({'passed':True,'checks':['real HTTP owner filtering','shared side quest only','fictional sheets/actions','campaign switch invalidates old joins and empties roster'],'physicalPhones':False}))
finally:server.shutdown();server.server_close()
