(() => {
  'use strict';
  const text=(v,n=1500)=>String(v??'').slice(0,n);
  const list=(v,n=200)=>Array.isArray(v)?v.slice(-n):[];
  const valid=v=>typeof v==='string'&&!['__proto__','constructor','prototype'].includes(v)&&/^[-A-Za-z0-9_]{1,100}$/.test(v);
  const statuses=['offered','played','deferred','declined'];
  const editable=['title','trigger','say','dm','evidence','followup','fallback','choices'];
  const catalog=()=>globalThis.ECHO_CHARACTER_STORIES?.arcs||[];
  const uid=()=>`spot-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  function normalize(raw={}) {
    raw=raw&&typeof raw==='object'?raw:{};
    const d={version:1,profiles:{},attendance:{},overrides:{},log:[],undo:[],redo:[]};
    for(const [id,v] of Object.entries(raw.profiles||{}).slice(0,80))if(valid(id)&&v&&typeof v==='object')d.profiles[id]={interests:text(v.interests,800),avoid:text(v.avoid,800),notes:text(v.notes,2000),paused:v.paused===true};
    for(const [id,v] of Object.entries(raw.attendance||{}).slice(-500))if(valid(id))d.attendance[id]=list(v,80).filter(valid);
    for(const [id,v] of Object.entries(raw.overrides||{}).slice(0,300))if(valid(id)&&v&&typeof v==='object')d.overrides[id]=Object.fromEntries(editable.filter(k=>Object.hasOwn(v,k)).map(k=>[k,k==='choices'?list(v[k],8).map(s=>text(s,1200)):text(v[k],k==='title'?140:3000)]));
    d.log=[...new Map(list(raw.log,1000).filter(v=>v&&valid(v.id)&&valid(v.characterId)&&valid(v.sessionId)&&statuses.includes(v.status)).map(v=>[v.id,{id:v.id,characterId:v.characterId,beatId:text(v.beatId,100),title:text(v.title,140),sessionId:v.sessionId,sessionName:text(v.sessionName,100),status:v.status,note:text(v.note,2500),minutes:Math.max(0,Math.min(180,Number(v.minutes)||0)),at:text(v.at,40),continuityId:text(v.continuityId,100)}])).values()];
    for(const key of ['undo','redo'])d[key]=list(raw[key],8).filter(v=>typeof v==='string'&&v.length<2000000);
    return d;
  }
  function ensure(story){return story.characterStories ||= normalize();}
  function profile(d,id){return d.profiles[id] ||= {interests:'',avoid:'',notes:'',paused:false};}
  function beat(d,id){for(const a of catalog()){const b=a.beats.find(b=>b.id===id);if(b)return {...b,...d.overrides[id],characterId:a.id};}return null;}
  const attendance=(d,session,id)=>!(d.attendance[session]||[]).includes(id);
  function summary(d,session,roster){return catalog().filter(a=>!roster||roster.some(p=>p.id===a.id)).map(a=>{
    const all=d.log.filter(l=>l.characterId===a.id),now=all.filter(l=>l.sessionId===session),played=all.filter(l=>l.status==='played');
    return {id:a.id,name:a.name,present:attendance(d,session,a.id),paused:d.profiles[a.id]?.paused===true,played:now.filter(l=>l.status==='played').length,offered:now.filter(l=>l.status==='offered').length,declined:now.filter(l=>l.status==='declined').length,total:played.length,minutes:now.filter(l=>l.status==='played').reduce((n,l)=>n+l.minutes,0),last:played.at(-1)?.sessionName||'No played moment recorded',lastAt:played.at(-1)?.at||''};
  });}
  function suggest(d,session,stage,roster){return summary(d,session,roster).filter(p=>p.present&&!p.paused).map(p=>({...p,beat:catalog().find(a=>a.id===p.id).beats.find(b=>b.stage===stage)})).filter(p=>p.beat&&!d.log.some(l=>l.characterId===p.id&&l.beatId===p.beat.id&&(l.status==='played'||(l.sessionId===session&&['declined','deferred','offered'].includes(l.status))))).sort((a,b)=>a.played-b.played||a.total-b.total||a.lastAt.localeCompare(b.lastAt));}
  const current=(d,session,id,beatId)=>d.log.find(l=>l.sessionId===session&&l.characterId===id&&l.beatId===beatId);
  function record(d,raw){
    if(!valid(raw.characterId)||!valid(raw.sessionId)||!statuses.includes(raw.status))throw Error('Choose a character, session, and result.');
    if(raw.status==='played'&&!String(raw.note||'').trim())throw Error('Write what actually happened before marking this played.');
    let row=current(d,raw.sessionId,raw.characterId,raw.beatId);
    if(row?.status==='played'&&raw.status!=='played')throw Error('This moment is already played. Remove or edit its record in history to correct it.');
    const value={id:row?.id||uid(),characterId:raw.characterId,beatId:text(raw.beatId,100),title:text(raw.title,140),sessionId:raw.sessionId,sessionName:text(raw.sessionName,100),status:raw.status,note:text(raw.note,2500),minutes:Math.max(0,Math.min(180,Number(raw.minutes)||0)),at:new Date().toISOString(),continuityId:row?.continuityId||''};
    if(row)Object.assign(row,value);else{d.log.push(value);row=value;}return row;
  }
  function continuityDraft(row){if(row.status!=='played'||!row.note.trim())throw Error('Only a played moment with an actual outcome can become a continuity draft.');
    return globalThis.ECHO_CONTINUITY.event({id:`spotlight-${row.id}`,session:row.sessionName,title:row.title,detail:row.note,source:'DM-recorded character spotlight; awaiting continuity review',status:'completed',basis:'Observed',share:'private',knows:[row.characterId],approved:false,playerText:''});}
  const snapshot=d=>JSON.stringify({version:1,profiles:d.profiles,attendance:d.attendance,overrides:d.overrides,log:d.log});
  function checkpoint(d){d.undo.push(snapshot(d));d.undo=d.undo.slice(-8);d.redo=[];}
  function restore(d,redo=false){const from=redo?d.redo:d.undo;if(!from.length)return false;const saved=normalize(JSON.parse(from.pop())),now=snapshot(d),undo=d.undo,forward=d.redo;Object.assign(d,saved,{undo,redo:forward});(redo?d.undo:d.redo).push(now);return true;}
  globalThis.ECHO_SPOTLIGHTS={normalize,ensure,profile,beat,summary,suggest,current,record,continuityDraft,checkpoint,restore,editable,statuses};
})();
