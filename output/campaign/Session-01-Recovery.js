/* Restore preparation and a throwaway IndexedDB rehearsal. Never touches live keys. */
(() => {
 function prepare(archive,normalize){
  const report=ECHO_RELIABILITY.validateArchive(archive);if(!report.valid)throw Error('Missing media: '+report.missingMedia.join(', '));
  if(globalThis.ECHO_BOUNDARY && globalThis.ECHO_BOOT && ECHO_BOUNDARY.key(ECHO_BOUNDARY.packs(archive))!==ECHO_BOOT.key)return ECHO_BOUNDARY.handoff(archive);
  if(archive.sessions.length>500)throw Error('A backup may contain at most 500 sessions.');
  if(new Set(archive.sessions.map(s=>s.id)).size!==archive.sessions.length)throw Error('Duplicate session IDs in backup.');
  const sessions=archive.sessions.map(s=>{if(!/^[A-Za-z0-9_-]{1,80}$/.test(s.id))throw Error('Invalid session ID: '+s.id);return {id:s.id,name:s.name.slice(0,80),packId:s.packId||s.state.contentPackId||'',state:normalize({...structuredClone(s.state),preservePartyProgression:true},s.packId||s.state.contentPackId||'')};});
  const sourceVersion=ECHO_RELIABILITY.versionOf(archive);
  const migrationReport=Array.isArray(archive.migrationReport)?archive.migrationReport.slice(-29):[];
  if(sourceVersion<ECHO_RELIABILITY.VERSION)migrationReport.push({at:new Date().toISOString(),from:sourceVersion,to:ECHO_RELIABILITY.VERSION,session:archive.active||sessions[0].id,restorePoint:'Original backup file',note:'Imported and normalized an older campaign backup; keep its original file.'});
  const index={schemaVersion:ECHO_RELIABILITY.VERSION,installedPacks:globalThis.ECHO_BOUNDARY?.packs(archive)||archive.installedPacks,active:sessions.some(s=>s.id===archive.active)?archive.active:sessions[0].id,sessions:sessions.map(({id,name,packId})=>({id,name,packId})),restorePoints:[],migrationReport,rules:globalThis.ECHO_RULES_UI?.normalizeSettings(archive.rules)||null,combatLibrary:globalThis.ECHO_COMBAT_DATA?.normalizeCombat({library:archive.combatLibrary},[]).library||[],story:ECHO_STORY_DATA.normalize(archive.story),presentation:globalThis.ECHO_PRESENTATION?.normalizeLibrary(archive.presentation),ergonomics:globalThis.ECHO_ERGONOMICS?.normalizeSettings(archive.ergonomics),tableExtras:globalThis.ECHO_TABLE?.normalize(archive.tableExtras)};
  return {sessions,index};
 }
 const characterTotals=state=>Object.fromEntries(Object.entries(state.party||{}).map(([id,s])=>[id,{hp:s.hp,maxHp:s.maxHp,tempHp:s.tempHp,resources:(s.resources||[]).map(r=>[r.id,r.current,r.max])}]));
 const questVisibility=story=>JSON.stringify({events:(story?.continuity?.events||[]).map(e=>[e.id,e.approved,e.share,e.recipients,e.knows]),publications:story?.continuity?.questGuide?.records||{},journal:(story?.journal||[]).map(j=>[j.id,j.published])});
 async function mediaHash(blob){const bytes=await blob.arrayBuffer();if(!globalThis.crypto?.subtle)throw Error('Media hash verification is unavailable in this browser.');const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');}
 async function rehearse(archive,normalize){
  const prepared=prepare(archive,normalize),name='echo-restore-rehearsal-'+Date.now()+'-'+Math.random(),open=()=>new Promise((resolve,reject)=>{const r=indexedDB.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('records');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}),run=(db,mode,fn)=>new Promise((resolve,reject)=>{const t=db.transaction('records',mode);fn(t.objectStore('records'));t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||Error('Rehearsal storage aborted'));});let db;
  try{db=await open();const identity={id:String(archive.campaign?.id||''),name:String(archive.campaign?.name||'Campaign')};const records=new Map([['campaign',JSON.stringify(identity)],['index',JSON.stringify(prepared.index)],...prepared.sessions.map(s=>['session:'+s.id,JSON.stringify(s.state)])]);
   await ECHO_PRESENTATION.importMedia(archive.mediaFiles,prepared.index.presentation,async(key,blob)=>records.set(key,blob));
   await run(db,'readwrite',store=>{for(const [key,value]of records)store.put(value,key);});db.close();db=await open();
   let mediaCount=0,characterCount=0;for(const [key,expected]of records){let actual;await run(db,'readonly',store=>{const r=store.get(key);r.onsuccess=()=>actual=r.result;});if(expected instanceof Blob){if(!(actual instanceof Blob)||actual.size!==expected.size||actual.type!==expected.type)throw Error('Media restore mismatch: '+key);if(await mediaHash(actual)!==await mediaHash(expected))throw Error('Media SHA-256 mismatch: '+key);mediaCount++;}else if(actual!==expected)throw Error('Restore mismatch: '+key);
    if(key.startsWith('session:')){const source=JSON.parse(expected),cross=globalThis.ECHO_BOUNDARY&&globalThis.ECHO_BOOT&&ECHO_BOUNDARY.key(ECHO_BOUNDARY.packs(archive))!==ECHO_BOOT.key,restored=cross?JSON.parse(actual):normalize(JSON.parse(actual));if(JSON.stringify(characterTotals(restored))!==JSON.stringify(characterTotals(source)))throw Error('Character totals changed on restore: '+key);if(restored.scene!==source.scene)throw Error('Current scene changed on restore: '+key);characterCount+=Object.keys(source.party||{}).length;}
    if(key==='index'){const restored=JSON.parse(actual);if(restored.active!==prepared.index.active||questVisibility(restored.story)!==questVisibility(prepared.index.story))throw Error('Quest visibility or active session changed on restore.');}
   }
   return `${prepared.sessions.length} sessions reopened and normalized; campaign identity, ${characterCount} character records, quest visibility, and current scenes matched; ${mediaCount} imported media SHA-256 hashes matched. Live campaign unchanged. External artwork is covered by the full package, not this data rehearsal.`;
  }finally{db?.close();await new Promise((resolve,reject)=>{const r=indexedDB.deleteDatabase(name);r.onsuccess=resolve;r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close the rehearsal database before cleanup.'));});}
 }
 async function encodePoint(value){
  const raw=JSON.stringify(value),bytes=new TextEncoder().encode(raw);
  if(!globalThis.CompressionStream)return {raw,bytes:bytes.length,originalBytes:bytes.length,encoding:'json'};
  const zipped=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  let binary='';for(let i=0;i<zipped.length;i+=8192)binary+=String.fromCharCode(...zipped.subarray(i,i+8192));
  const packed=JSON.stringify({recoveryEncoding:'gzip-base64-v1',originalBytes:bytes.length,data:btoa(binary)});
  return packed.length<raw.length?{raw:packed,bytes:new TextEncoder().encode(packed).length,originalBytes:bytes.length,encoding:'gzip'}:{raw,bytes:bytes.length,originalBytes:bytes.length,encoding:'json'};
 }
 async function decodePoint(raw){const value=typeof raw==='string'?JSON.parse(raw):raw;if(value?.recoveryEncoding!=='gzip-base64-v1')return value;
  if(!globalThis.DecompressionStream)throw Error('This browser cannot decompress the restore point. Open it in a current browser; the original campaign is unchanged.');
  if(!Number.isSafeInteger(value.originalBytes)||value.originalBytes<0||value.originalBytes>512*1048576||typeof value.data!=='string')throw Error('Invalid compressed restore point.');
  const bytes=Uint8Array.from(atob(value.data),c=>c.charCodeAt(0));const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')),reader=stream.getReader();let parts=[],length=0;
  while(true){const {done,value:chunk}=await reader.read();if(done)break;length+=chunk.length;if(length>value.originalBytes){await reader.cancel();throw Error('Restore point exceeds its recorded size.');}parts.push(chunk);}
  if(length!==value.originalBytes)throw Error('Incomplete compressed restore point.');return JSON.parse(await new Blob(parts).text());
 }
 function pruneCandidates(points,keep){if(!Number.isInteger(keep)||keep<1||keep>30)throw Error('Keep between 1 and 30 automatic restore points.');return points.filter(p=>p.kind==='automatic').slice(0,-keep);}
 globalThis.ECHO_RECOVERY={prepare,rehearse,mediaHash,encodePoint,decodePoint,pruneCandidates};
})();
