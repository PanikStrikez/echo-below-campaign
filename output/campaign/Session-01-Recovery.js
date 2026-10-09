/* Restore preparation and a throwaway IndexedDB rehearsal. Never touches live keys. */
(() => {
 function prepare(archive,normalize){
  const report=ECHO_RELIABILITY.validateArchive(archive);if(!report.valid)throw Error('Missing media: '+report.missingMedia.join(', '));
  if(archive.sessions.length>500)throw Error('A backup may contain at most 500 sessions.');
  if(new Set(archive.sessions.map(s=>s.id)).size!==archive.sessions.length)throw Error('Duplicate session IDs in backup.');
  const sessions=archive.sessions.map(s=>{if(!/^[A-Za-z0-9_-]{1,80}$/.test(s.id))throw Error('Invalid session ID: '+s.id);return {id:s.id,name:s.name.slice(0,80),packId:s.packId||s.state.contentPackId||'',state:normalize({...structuredClone(s.state),preservePartyProgression:true},s.packId||s.state.contentPackId||'')};});
  const index={schemaVersion:archive.schemaVersion||2,active:sessions.some(s=>s.id===archive.active)?archive.active:sessions[0].id,sessions:sessions.map(({id,name,packId})=>({id,name,packId})),restorePoints:[],rules:globalThis.ECHO_RULES_UI?.normalizeSettings(archive.rules)||null,combatLibrary:globalThis.ECHO_COMBAT_DATA?.normalizeCombat({library:archive.combatLibrary},[]).library||[],story:ECHO_STORY_DATA.normalize(archive.story),presentation:globalThis.ECHO_PRESENTATION?.normalizeLibrary(archive.presentation),ergonomics:globalThis.ECHO_ERGONOMICS?.normalizeSettings(archive.ergonomics),tableExtras:globalThis.ECHO_TABLE?.normalize(archive.tableExtras)};
  return {sessions,index};
 }
 async function rehearse(archive,normalize){
  const prepared=prepare(archive,normalize),name='echo-restore-rehearsal-'+Date.now()+'-'+Math.random(),open=()=>new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('records');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}),run=(db,mode,fn)=>new Promise((resolve,reject)=>{const t=db.transaction('records',mode);fn(t.objectStore('records'));t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('Rehearsal storage aborted'));});let db;
  try{db=await open();const records=new Map([['index',JSON.stringify(prepared.index)],...prepared.sessions.map(s=>['session:'+s.id,JSON.stringify(s.state)])]);
   await ECHO_PRESENTATION.importMedia(archive.mediaFiles,prepared.index.presentation,async(key,blob)=>records.set(key,blob));
   await run(db,'readwrite',store=>{for(const [key,value]of records)store.put(value,key);});db.close();db=await open();
   for(const [key,expected]of records){let actual;await run(db,'readonly',store=>{const r=store.get(key);r.onsuccess=()=>actual=r.result;});if(expected instanceof Blob){if(!(actual instanceof Blob)||actual.size!==expected.size||actual.type!==expected.type)throw Error('Media restore mismatch: '+key);const a=new Uint8Array(await actual.arrayBuffer()),b=new Uint8Array(await expected.arrayBuffer());if(a.some((v,i)=>v!==b[i]))throw Error('Media bytes differ: '+key);}else if(actual!==expected)throw Error('Restore mismatch: '+key);if(key.startsWith('session:'))normalize(JSON.parse(actual));}
   return `${prepared.sessions.length} sessions reopened and normalized; ${[...records.values()].filter(v=>v instanceof Blob).length} imported media files verified byte-for-byte. Live campaign unchanged. External artwork is covered by the full package, not this data rehearsal.`;
  }finally{db?.close();await new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase(name);r.onsuccess=resolve;r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close the rehearsal database before cleanup.'));});}
 }
 globalThis.ECHO_RECOVERY={prepare,rehearse};
})();
