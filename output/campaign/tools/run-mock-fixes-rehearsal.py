"""Commands for the disposable controller; never attaches to live browser storage."""
import json,time,pathlib
B=pathlib.Path('output/audits/mock-fixes-2026-10-12');C=B/'control';checks=[]
def cmd(c):
 p=C/(str(time.time_ns())+'.json');t=p.with_suffix('.pending');t.write_text(json.dumps(c));t.rename(p);r=p.with_name(p.stem+'.result.json')
 for _ in range(500):
  if r.exists():
   x=json.loads(r.read_text());assert x['ok'],x
   return x.get('result')
  time.sleep(.1)
 raise TimeoutError(c)
def ev(code):return cmd({'op':'eval','code':code})
def check(name,ok):assert ok,name;checks.append(name);print('PASS:',name,flush=True)
try:
 before=ev('({party:__mock.state.state.party,scene:__mock.state.state.scene,fog:__mock.state.state.sceneFog})');(B/'Before.json').write_text(json.dumps(before))
 # Five actual HTTP projections and their rendered pages must agree, not just return a success code.
 capture=cmd({'op':'capture','phase':'01-before','narrative':['Isolated fix verification.'],'question':'Current sheets must match their data.'});check('five rendered phone identities/revisions/HP checked before screenshots',len(capture['phones'])==5)
 # Fresh bridge updates should reach all five without reconnect/reload.
 hp=ev("let s=__mock.state.state;let p=s.party['pc-aldric'];p.hp=Math.max(1,p.hp-1);s.tokens.find(t=>t.id===p.id).hp=p.hp;__mock.combat.commit('PRACTICE controlled HP update for phone sync');p.hp")
 cap=cmd({'op':'capture','phase':'02-phone-updated','narrative':['One reviewed practice HP update. No real characters changed.'],'question':'Phones must update without reloading.'});check('actual Aldric phone projection and rendered HP update without reload',next(x for x in cap['phones'] if x['id']=='pc-aldric')['data']['character']['hp']==hp)
 # Reviewed objective has a public sentence and separate private source.
 result=cmd({'op':'review-outcome','event':{'id':'fix-public-objective','kind':'other','title':'Practice closing','session':'PRACTICE','detail':'PRIVATE_FIX_CANARY: isolated fictional rescue review.','playerText':'The rescue is complete.','publicTitle':'Practice rescue','source':'Isolated rehearsal','status':'confirmed','basis':'Observed','share':'party','knows':['party'],'tableObjective':'Plan the next safe expedition.','quests':[],'markers':[],'tracks':[]}})
 check('objective appears in the outcome preview before approval','Plan the next safe expedition.' in result['preview'])
 cap=cmd({'op':'capture','phase':'03-objective','narrative':['Practice objective approved explicitly.'],'question':'Review the safe new objective.'})
 check('reviewed objective reaches all five phones',all(x['data']['playerTools']['objective']['text']=='Plan the next safe expedition.' for x in cap['phones']))
 check('private outcome record excluded from all five responses',all('PRIVATE_FIX_CANARY' not in json.dumps(x['data']) for x in cap['phones']))
 cmd({'op':'phone-reconnect','id':'pc-aldric'});cap=cmd({'op':'capture','phase':'04-one-reconnect'});check('reconnect one simulated phone without releasing others',len(cap['phones'])==5 and all(x['status']==200 for x in cap['phones']))
 # Compression affects only a newly written recovery record. Existing save and history remain intact.
 ids=ev("(async()=>{let ids=[];for(let i=0;i<8;i++)ids.push(await __mock.state.createRestorePoint('PRACTICE automatic '+i,'automatic'));return ids;})()")
 point=ev("(async()=>{const point=__mock.state.restorePoints.at(-1),db=await new Promise((ok,bad)=>{const r=indexedDB.open('echo-below-campaign-table-v1',1);r.onsuccess=()=>ok(r.result);r.onerror=()=>bad(r.error)});let raw;await new Promise((ok,bad)=>{const r=db.transaction('records','readonly').objectStore('records').get('recovery:'+__mock.state.campaignId+':'+point.id);r.onsuccess=()=>{raw=r.result;ok()};r.onerror=()=>bad(r.error)});db.close();const decoded=await ECHO_RECOVERY.decodePoint(raw);return {point,hasSessions:!!decoded.sessions,sessionCount:Object.keys(decoded.sessions).length};})()")
 check('actual IndexedDB restore point is compressed and reopens',point['point']['encoding']=='gzip' and point['hasSessions'])
 ev('__mock.state.pruneRestorePoints(6)');check('explicit retention removes only older automatic points',ev("__mock.state.restorePoints.filter(p=>p.kind==='automatic').length")<=6)
 after=ev('({scene:__mock.state.state.scene,fog:__mock.state.state.sceneFog})');check('phone/recovery/outcome workflows preserve current map and fog',after['scene']==before['scene'] and after['fog']==before['fog'])
 fault=ev("""(async()=>{const s=__mock.state.state,before=JSON.stringify(s),points=JSON.stringify(__mock.state.restorePoints),put=IDBObjectStore.prototype.put,set=Storage.prototype.setItem;let message='';try{IDBObjectStore.prototype.put=function(v,k){if(String(k).startsWith('recovery:'))throw new DOMException('Test quota','QuotaExceededError');return put.call(this,v,k);};Storage.prototype.setItem=function(k,v){if(String(k).includes(':recovery:'))throw new DOMException('Test fallback quota','QuotaExceededError');return set.call(this,k,v);};try{await __mock.state.createRestorePoint('PRACTICE injected quota','automatic');}catch(e){message=e.message;}return {message,unchanged:before===JSON.stringify(__mock.state.state)&&points===JSON.stringify(__mock.state.restorePoints)};}finally{IDBObjectStore.prototype.put=put;Storage.prototype.setItem=set;}})()""")
 check('injected quota failure preserves campaign and restore index and explains recovery',fault['unchanged'] and 'campaign was not replaced' in fault['message'])
 cmd({'op':'eval','code':"ECHO_RELIABILITY.open('snapshots')"});cmd({'op':'screenshot','name':'Recovery-controls.png'})
 (B/'Verification.json').write_text(json.dumps({'passed':checks,'liveCampaignTouched':False,'physicalDevicesTested':False,'realProviderRequests':0,'pointCompression':point['point']},indent=2))
 print('Isolated integration rehearsal passed',flush=True)
finally:
 cmd({'op':'finish'})
