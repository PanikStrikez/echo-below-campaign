"""Data contracts, physical preservation and phone-handler isolation; no running service accessed."""
from pathlib import Path
import json, hashlib, sys, time, collections, re
APP=Path(__file__).resolve().parents[1]; ROOT=APP.parents[1]
p=json.loads((APP/'map-audit/Location-Register.json').read_text()); locs={x['id']:x for x in p['locations']}; maps={m['id']:m for m in p['maps']}
assert p['confirmedStoppingPoint']['locationId'] in locs
assert sorted(r['nineNumber'] for r in locs.values() if r.get('nineNumber'))==list(range(1,10))
assert len(locs)==len(p['locations']) and len(maps)==len(p['maps'])
for r in locs.values():
 assert r['sourceRefs'] and r['placement']['basis'] and r['placement']['confidence']
 assert r['coordinate'] is None
 assert r['disclosure']['audience']=='dm-only-register'
 assert r['parentId'] is None or r['parentId'] in locs
 assert all(id in maps for id in r['mapIds'])
for item in p['checklist']:
 assert all(id in locs for id in item['locationIds'])
 assert all(id in maps for id in item['mapIds'])
for r in p['maps']:
 assert r['status'] in ['ready-to-reuse','needs-correction','missing','optional']
 if r['path']:assert hashlib.sha256((APP/r['path']).read_bytes()).hexdigest()==r['sha256']
for id in ['loc-tamoachan','loc-hidden-shrine-of-tamoachan','loc-doomvault']:
 assert locs[id]['geography']=='off-sword-coast'
assert locs['loc-hidden-shrine-of-tamoachan']['parentId']=='loc-tamoachan'
assert 'book-suggested' in locs['loc-khundrukar']['placement']['basis']
assert locs['loc-cragmaw-castle']['disclosure']['status']=='private-destination'
assert locs['loc-redbrand-hideout']['disclosure']['status']=='known-before-entry'
inv=json.loads((ROOT/'tmp/map-audit/existing-registrations.json').read_text())
expected={s['id'] for s in inv['registeredScenes'] if s['kind']=='map'}
assert expected <= {id for m in maps.values() for id in m['sceneIds']}
baseline=json.loads((ROOT/'tmp/map-audit/preservation-baseline.json').read_text())
assert all(hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==sha for path,sha in baseline.items())
# Runtime-independent phone router harness: calls the real routing and projection, no socket or production service.
sys.path.insert(0,str(APP/'launchers'))
import serve_phones as phones
class Harness(phones.Handler):
 def __init__(self,path):self.path=path;self.result=None;self.status=None
 def phone_id(self):return 'pc-trista'
 def error(self,message,status):self.status=status;self.result=message
 def json(self,value,status=200):self.status=status;self.result=value
blocked=['/map-audit/Location-Register.json','/map-audit/Map-Register-Data.js','/map-audit/Map-Audit.html','/Campaign-Map-Register-UI.js','/world-maps/Sword-Coast-Campaign-Map.png','/output/campaign/map-audit/Location-Register.json']
for route in blocked:
 h=Harness(route);h.do_GET();assert h.status==404,(route,h.result)
phones.TABLE.update(active=True,last_dm=time.time(),snapshot={'characters':{'pc-trista':{'id':'pc-trista','name':'Trista'}},'mapRegister':{'private':'PRIVATE_ATLAS_SENTINEL'},'public':{'mapRegister':{'private':'PRIVATE_ATLAS_SENTINEL'}}})
h=Harness('/api/state');h.do_GET();assert h.status==200,h.result
assert 'PRIVATE_ATLAS_SENTINEL' not in json.dumps(h.result)
result={'passed':True,'locationCount':len(locs),'existingMapAssets':sum(bool(m['path']) for m in maps.values()),'preservedOriginalFiles':len(baseline),'registeredMapSceneIdsPreserved':len(expected),'phoneRoutesBlocked':blocked,'phoneStateExcludesUnknownPrivateRegister':True,'phoneTestMethod':'real Handler invoked in isolated in-memory harness, not physical phone or live server'}
(APP/'map-audit/data-verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
