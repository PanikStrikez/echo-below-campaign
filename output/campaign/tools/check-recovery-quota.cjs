/* Deterministic storage fault in the actual coordinator, entirely in memory. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
require('./check-travel.js');require('../Session-01-Recovery.js');
globalThis.document={getElementById:()=>null};const records=new Map();let fail=true,failIndex=false,notice='';globalThis.ECHO_STORAGE={create:()=>({readRecord:async k=>records.get(k)||null,writeRecord:async(k,v)=>{if((fail&&k.startsWith('recovery:'))||(failIndex&&k.endsWith(':index')))throw Error('Injected quota exceeded');records.set(k,v);},deleteRecord:async k=>records.delete(k)})};
const oldNotice=ECHO_RELIABILITY.setRecoveryIssue;ECHO_RELIABILITY.setRecoveryIssue=m=>{notice=m;oldNotice(m);};
const source=fs.readFileSync(path.resolve(__dirname,'../Session-01-Battleboard.js'),'utf8'),boot=source.lastIndexOf('  if (IS_PLAYER) initPlayer();');
vm.runInThisContext(source.slice(0,boot)+`
renderDM=()=>{};sendToPlayer=()=>{};saveLocal=()=>{};toast=()=>{};
globalThis.__quota={capture:captureRestorePoint,current:()=>JSON.stringify({state,index:campaignIndex}),points:()=>campaignIndex.restorePoints};
})();`);
(async()=>{const before=__quota.current();await assert.rejects(()=>__quota.capture('Failure test','automatic'),/campaign was not replaced/);assert.equal(__quota.current(),before);assert.equal(records.size,0);assert(notice.includes('Download a backup'),'persistent recovery explanation is raised');
 fail=false;failIndex=true;await assert.rejects(()=>__quota.capture('Index failure test','automatic'),/could not be indexed/);assert.equal(__quota.current(),before);assert.equal(records.size,0,'uncommitted new point cleaned up; no original records removed');failIndex=false;const id=await __quota.capture('Success test','automatic'),point=__quota.points().find(p=>p.id===id);assert.equal(point.encoding,'gzip');const raw=[...records.entries()].find(([key])=>key.endsWith(':'+id))[1];const decoded=await ECHO_RECOVERY.decodePoint(raw);assert(Object.keys(decoded.sessions).length);console.log('Coordinator quota check passed: failed record and index writes preserve state/index, recovery explanation is raised, later compressed restore point reopens. In-memory storage fault; no browser or live records touched.');})().catch(e=>{console.error(e);process.exitCode=1;});
