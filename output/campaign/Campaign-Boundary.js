/* Select content BEFORE loading it. The app schema and pack versions are separate. */
(() => {
 'use strict';
 const catalog=Object.freeze({
  'echo-below':{id:'echo-below',name:'Echo Below',version:'1.0.0'},
  'echo-below-party':{id:'echo-below-party',name:'Current Echo Below party migrations',version:'1.0.0'},
  'lantern-ferry':{id:'lantern-ferry',name:'Lantern Ferry · fictional example',version:'1.0.0'}
 });
 const legacyEcho=()=>['echo-below','echo-below-party'].map(id=>({...catalog[id]}));
 function packs(record){
  if(record?.installedPacks!==undefined){
   if(!Array.isArray(record.installedPacks)||record.installedPacks.length>20)throw Error('Invalid installed campaign packs. The original save was left untouched.');
   const seen=new Set();const result=record.installedPacks.map(p=>{if(!p||!catalog[p.id]||p.version!==catalog[p.id].version||seen.has(p.id))throw Error('Missing or unsupported campaign pack '+String(p?.id||'')+' '+String(p?.version||'')+'. Keep the original save and matching release.');seen.add(p.id);return {id:p.id,name:catalog[p.id].name,version:p.version};});
   if(seen.has('echo-below')!==seen.has('echo-below-party')||seen.has('echo-below')&&seen.has('lantern-ferry'))throw Error('These campaign packs have incompatible or missing dependencies. Keep the original save.');
   return result;
  }
  return record?.story?.contentProfile==='blank'||record?.contentProfile==='blank'?[]:legacyEcho();
 }
 const key=p=>JSON.stringify(p.map(v=>[v.id,v.version]).sort());
 const echo=p=>p.some(v=>v.id==='echo-below');
 async function inspect(){
  const store=ECHO_STORAGE.create('echo-below-campaign-table-v1');
  const parse=raw=>raw?JSON.parse(raw):null;
  const registry=parse(await store.readRecord('campaigns:registry:v2'));
  let record=registry?parse(await store.readRecord(`campaign:${registry.active}:index`)):parse(await store.readRecord('campaign:index'));
  if(!record&&!registry){let legacy;try{legacy=localStorage.getItem('echo-below-session-01-battleboard-v1');}catch{}if(legacy)record=parse(legacy);}
  const start=new URLSearchParams(location.search).get('start');
  const selected=record?packs(record):registry?(()=>{throw Error('The active campaign index is missing. Keep your backup and recover this campaign.');})():start==='blank'?[]:start==='example'?[{...catalog['lantern-ferry']}]:legacyEcho();
  return Object.freeze({installedPacks:selected,echo:echo(selected),key:key(selected),firstStart:!record&&!registry,start});
 }
 function handoff(archive){
  // Cross-pack restore preserves raw campaign payloads for normalization only
  // AFTER their pack is selected. The public schema/media validator runs first.
  const validated=ECHO_RELIABILITY.validateArchive(archive);if(!validated.valid)throw Error('Backup is incomplete.');
  const installedPacks=packs(archive);if(archive.sessions.length>500||new Set(archive.sessions.map(s=>s.id)).size!==archive.sessions.length)throw Error('Invalid session list.');
  const sessions=archive.sessions.map(s=>{if(!/^[A-Za-z0-9_-]{1,80}$/.test(s.id)||typeof s.name!=='string')throw Error('Invalid session identity.');return {id:s.id,name:s.name.slice(0,80),packId:s.packId||s.state.contentPackId||'',state:{...structuredClone(s.state),preservePartyProgression:true}};});
  const index={schemaVersion:archive.schemaVersion||3,installedPacks,active:sessions.some(s=>s.id===archive.active)?archive.active:sessions[0].id,sessions:sessions.map(({id,name,packId})=>({id,name,packId})),restorePoints:[],migrationReport:structuredClone(archive.migrationReport||[])};
  for(const k of ['rules','combatLibrary','story','presentation','ergonomics','tableExtras'])if(archive[k]!==undefined)index[k]=structuredClone(archive[k]);
  return {index,sessions};
 }
 function reload(message){try{sessionStorage.setItem('campaign-boundary-notice',String(message||'Opened campaign.'));}catch{}location.reload();}
 function notice(){try{const v=sessionStorage.getItem('campaign-boundary-notice');sessionStorage.removeItem('campaign-boundary-notice');return v;}catch{return '';}}
 globalThis.ECHO_BOUNDARY={version:1,catalog,packs,key,echo,inspect,handoff,reload,notice};
})();
