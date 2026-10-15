/* Private evidence model. Historical reports never establish a campaign fact. */
(() => {
 'use strict';
 if(globalThis.location?.hash==='#player')return;
 const copy=structuredClone,clip=(v,n=600)=>String(v??'').slice(0,n);
 const stable=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.entries(x).sort(([a],[b])=>a.localeCompare(b))):x);
 const hash=v=>{let h=2166136261;for(const c of stable(v)){h=Math.imul(h^c.charCodeAt(0),16777619);}return (h>>>0).toString(16).padStart(8,'0');};
 const features=[
  {id:'startup',title:'Startup & session flow',checks:['check-stage9-browser.cjs','check-evening-path-browser.js']},
  {id:'combat',title:'Combat, token movement & undo',checks:['check-hybrid-combat-browser.js','check-phone-actions.js']},
  {id:'party',title:'Five character action cards',checks:['JavaScript unit suite','check-party-actions-browser.cjs']},
  {id:'outcomes',title:'Outcomes, quests, knowledge & recaps',checks:['check-outcomes-browser.js','check-reconciliation-browser.cjs']},
  {id:'privacy',title:'TV / phone audience privacy',checks:['check-stage4-five-phones.py','check-atlas-asset-boundary.py','check-phone-service.py']},
  {id:'maps',title:'Atlas, maps & persistent exploration',checks:['check-atlas-preservation.cjs','check-expedition-persistence.cjs','check-dungeon.js']},
  {id:'recovery',title:'Both-store backup & isolated restoration',checks:['check-whole-backup-browser.cjs','check-stage3-recovery-browser.js','check-stage9-package.py']}
 ];
 const human=[
  {id:'prep',title:'Next session content and fallback',kind:'reviewed',help:'Review the selected objective, opening text, leads, encounters and an alternative. Preparation does not establish a visit.'},
  {id:'sheets',title:'Current party choices and action limits',kind:'reviewed',help:'Check the recorded sheets and the Reviewed roll / Choose details / Manual ruling labels. Do not assign missing choices.'},
  {id:'map-review',title:'Selected maps and disclosure',kind:'reviewed',help:'Review source geometry, map scale, hidden areas, and the exact staged player view.'},
  {id:'physical-tv',title:'Flat TV at the real table',kind:'physical',help:'Personally check safe edges, rotation, grid size, token/ruler contrast and readability from every seat.'},
  {id:'physical-phones',title:'Real phones on table Wi-Fi',kind:'physical',help:'Check the intended players, their character assignments, a private clue, one request, and one phone disconnect/reconnect.'},
  {id:'physical-audio',title:'Private preview and public speakers',kind:'physical',help:'Check headphone preview stays private, table playback is audible, narration ducking works, and Stop sound / Mute work.'}
 ];
 function normalize(raw){return {version:1,records:(Array.isArray(raw?.records)?raw.records:[]).slice(-300).filter(r=>human.some(h=>h.id===r.id&&h.kind===r.kind)&&r.at&&r.scope).map(r=>({id:r.id,kind:r.kind,at:clip(r.at,40),scope:clip(r.scope,200),note:clip(r.note,1500),revoked:r.revoked===true}))};}
 function saveVersion(c){return hash({campaignId:c.campaignId,sessionId:c.sessionId,schemaVersion:c.state?.schemaVersion||3,commandRevision:c.state?.commandRevision||0,scene:c.state?.scene,party:c.state?.party,events:c.events,linkedStore:c.linkedStore});}
 function scope(c,versions){return 'status-'+hash({campaign:c.campaignId,session:c.sessionId,save:saveVersion(c),app:versions?.app?.sha256,assets:versions?.assets?.sha256,display:c.state?.map?.display||{}});}
 function sameVersions(a,b){return !!a&&!!b&&['app','assets'].every(k=>a[k]?.sha256&&a[k].sha256===b[k]?.sha256);}
 function mark(raw,c,versions,id,note,now=new Date().toISOString()){const row=human.find(r=>r.id===id);if(!row)throw Error('Choose a DM review or physical table check.');if(!String(note||'').trim())throw Error('Record what you actually checked.');const d=normalize(raw);d.records.push({id,kind:row.kind,at:now,scope:scope(c,versions),note:clip(note,1500),revoked:false});return normalize(d);}
 function revoke(raw,c,versions,id,now=new Date().toISOString()){const d=normalize(raw);const row=human.find(r=>r.id===id);if(!row)throw Error('Unknown check.');d.records.push({id,kind:row.kind,at:now,scope:scope(c,versions),note:'Review withdrawn; check again.',revoked:true});return normalize(d);}
 function humanRows(raw,c,versions,now=Date.now()){
  const records=normalize(raw).records,current=scope(c,versions);
  return human.map(r=>{const record=[...records].reverse().find(x=>x.id===r.id),fresh=record&&!record.revoked&&record.scope===current&&now-Date.parse(record.at)<(r.kind==='physical'?15*60000:24*60*60000)&&Date.parse(record.at)<=now;
   return {...r,status:fresh?'passed':record&&!record.revoked?'stale':'unchecked',label:fresh?r.kind==='physical'?'Physical table tested':'DM reviewed':'Not checked',record:record||null,detail:fresh?record.note:record&&!record.revoked?'Prior check retained as history; its save, build, display scope or time window changed.':r.help};});
 }
 function view(evidence,c,verified,raw,table,now=Date.now()){
  const release=evidence?.release,current=!!verified&&sameVersions(release?.versions,verified)&&sameVersions(evidence?.versions,verified),complete=current&&release?.coreGatePassed===true&&release.profile==='core release gate';
  const checks=features.map(f=>{const tests=f.checks.map(name=>release?.checks?.find(t=>t.name===name)),failed=current&&tests.some(t=>t?.passed===false),passed=complete&&tests.every(t=>t?.passed===true);return {...f,status:passed?'passed':failed?'failed':'unchecked',label:passed?'Automated check passed':failed?'Automated check failed':'Not checked',at:release?.at||'',detail:passed?'Isolated tests, simulated browsers or temporary local services; not physical table certification.':!verified?'Current files have not been compared with the report.':!current?'Files changed or the report has no matching version evidence. Run release checks.':'A required release check is missing or failed.'};});
  const humanChecks=humanRows(raw,c,verified||evidence?.versions,now),freshTable=!!table&&!table.running&&!table.expired&&now-table.started<=15*60000&&table.campaignId===c.campaignId&&table.sessionId===c.sessionId;
  const tablePassed=freshTable&&['tv','phones','audio','assets','storage','backup'].every(k=>table.checks?.[k]?.status==='ready'),allHuman=humanChecks.every(r=>r.status==='passed');
  const ready=complete&&checks.every(r=>r.status==='passed')&&allHuman&&tablePassed;
  const facts=(Array.isArray(c.events)?c.events:[]).filter(e=>e.approved===true&&['confirmed','completed'].includes(e.status)).slice(-6).map(e=>({id:e.id,title:e.title,text:e.detail,at:e.approvedAt,source:e.source,session:e.session,visibility:e.share==='private'?'DM only':'Approved record'}));
  return {ready,headline:ready?'Ready for this table session':complete?'Automated checks passed · table review still needed':'Current evidence needs checking',
   versions:verified||evidence?.versions||{},filesVerified:!!verified,evidenceCurrent:current,saveVersion:saveVersion(c),checks,humanChecks,tablePassed,
   next:!verified?'Verify current app and asset files':!complete?'Run the release checks for this build':humanChecks.find(r=>r.status!=='passed')?.title||(!tablePassed?'Run the current table check':'Ready'),facts,
   selectedScene:c.sceneTitle||c.state?.scene||'No scene selected',selectedSceneBasis:'Selected/prepared scene; not proof of an arrival or visit.',
   historicalProvider:evidence?.historicalProvider||null,reports:evidence?.reports||[],release};
 }
 globalThis.ECHO_CURRENT_STATUS={features,human,normalize,mark,revoke,scope,saveVersion,sameVersions,view};
})();
