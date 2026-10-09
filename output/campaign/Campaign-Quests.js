(() => {
 'use strict';
 const catalog=d=>d?.questGuide?.contentProfile==='blank'?(d.questGuide.customQuests||[]):globalThis.ECHO_QUEST_CATALOG?.quests||[], copy=v=>JSON.parse(JSON.stringify(v)), clip=(v,n=2500)=>String(v??'').slice(0,n);
 const statuses=['planned','active','paused','completed','failed','abandoned'];
 const stepStates=['open','completed','failed','bypassed'];
 const validId=s=>typeof s==='string'&&/^[a-z0-9-]{1,90}$/.test(s)&&!['__proto__','constructor','prototype'].includes(s);
 function normalize(raw={}){raw=raw&&typeof raw==='object'?raw:{};
  const records={};for(const [id,r]of Object.entries(raw.records||{}).slice(0,150)){if(!validId(id)||!r||typeof r!=='object')continue;
   const steps={};for(const [key,v]of Object.entries(r.steps||{}).slice(0,40))if(validId(key)&&v&&typeof v==='object')steps[key]={state:stepStates.includes(v.state)?v.state:'open',result:clip(v.result),source:clip(v.source,500),at:clip(v.at,40)};
   const p=r.published;records[id]={status:statuses.includes(r.status)?r.status:'',pinned:r.pinned===true,notes:clip(r.notes,6000),outcome:clip(r.outcome),steps,
    draft:{title:clip(r.draft?.title,120),text:clip(r.draft?.text,2400)},published:p&&p.title&&p.text?{title:clip(p.title,120),text:clip(p.text,2400),state:statuses.includes(p.state)?p.state:'active',audience:p.audience==='party'?'party':clip(p.audience,80),at:clip(p.at,40)}:null};
  }
  return {version:1,contentProfile:raw.contentProfile==='blank'?'blank':'echo-below',customQuests:(Array.isArray(raw.customQuests)?raw.customQuests:[]).slice(0,150).filter(q=>validId(q?.id)).map(q=>({id:q.id,title:clip(q.title,120),goal:clip(q.goal,2400),kind:['main','side','character'].includes(q.kind)?q.kind:'side',owner:clip(q.owner,80),act:'custom',steps:[],requires:[],leads:[],dm:clip(q.dm,6000),reward:'',fallback:'',source:'Custom campaign'})),routingVersion:Number(raw.routingVersion)||0,enabled:raw.enabled===true,initialized:raw.initialized===true,currentAct:globalThis.ECHO_QUEST_CATALOG?.acts.some(a=>a.id===raw.currentAct)?raw.currentAct:'prologue',records,
   history:(Array.isArray(raw.history)?raw.history:[]).slice(-200).map(h=>({at:clip(h.at,40),quest:clip(h.quest,90),text:clip(h.text),source:clip(h.source,500)}))};
 }
 function ensure(d,campaign){if(!d.questGuide)d.questGuide=normalize();const g=d.questGuide;
  if(!g.initialized){g.initialized=true;g.enabled=campaign==='default';if(g.enabled){record(g,'echo-below').status='active';record(g,'act-prologue').status='active';record(g,'echo-below').pinned=true;}}
  if(g.enabled&&!(g.routingVersion>=1)){
   g.routingVersion=1;
   const main=record(g,'echo-below');
   if(!main.published&&!['completed','failed','abandoned','paused'].includes(main.status)){
    const known=globalThis.ECHO_CONTINUITY.questCards(d,true).filter(q=>q.state==='active'&&['gundren','redbrands','black-spider','wave-echo'].includes(q.id));
    const atInn=d.events.some(e=>e.id==='actual-redbrand-gundren-at-inn'&&e.approved);
    const text=atInn?'Follow the evidence uncovered in Phandalin and choose the next lead together.':known.length?'Current leads: '+known.map(q=>q.title).join('; ')+'. Follow the evidence the party has discovered.':'Investigate the discoveries connected to Phandalin and follow the party’s confirmed leads.';
    main.draft={title:'The Echo Below',text};main.published={...main.draft,state:'active',audience:'party',at:new Date().toISOString()};
    log(g,'echo-below','Enabled main quest TV display using party-known quest titles.');
   }
  }
  return g;
 }
 function record(g,id){if(!validId(id))throw Error('Invalid quest identifier.');return g.records[id]||= {status:'',pinned:false,notes:'',outcome:'',steps:{},draft:{title:'',text:''},published:null};}
 function view(d,q){const g=d.questGuide||normalize(),r=g.records[q.id]||{},legacy=q.legacy?globalThis.ECHO_CONTINUITY.questCards(d).find(x=>x.id===q.legacy):null;
  const update=globalThis.ECHO_OUTCOMES?.questUpdates(d,q.id).at(-1);
  const state=update?.state||(d.outcomes?.migrated&&r.outcome?'':r.status)||(['active','completed','failed'].includes(legacy?.state)?legacy.state:'planned');
  return {...q,status:state,record:r,steps:q.steps.map(s=>{const change=globalThis.ECHO_OUTCOMES?.questUpdates(d,q.id,s.id).at(-1);return {...s,...(!d.outcomes?.migrated?r.steps?.[s.id]:{}),...(change?{state:change.state,result:change.result,source:change.source,at:change.at,eventId:change.eventId}:{}),state:change?.state||(!d.outcomes?.migrated?r.steps?.[s.id]?.state:'')||'open'};}),legacy};
 }
 function cards(d){return catalog(d).map(q=>view(d,q));}
 function log(g,id,text,source='DM quest review'){g.history.push({at:new Date().toISOString(),quest:id,text:clip(text),source:clip(source,500)});g.history=g.history.slice(-200);}
 function change(d,id,action,value,source=''){const q=catalog(d).find(q=>q.id===id);if(!q)throw Error('Quest not found.');const g=d.questGuide;
  if(action==='status'&&(!statuses.includes(value.status)||!value.result?.trim()||!source.trim()))throw Error('Record an outcome or reason and its source.');
  if(action==='step'&&(!q.steps.some(s=>s.id===value.id)||!stepStates.includes(value.state)||!value.result?.trim()||!source.trim()))throw Error('Choose an objective, result and source.');
  if(globalThis.ECHO_OUTCOMES&&['status','step'].includes(action)){const O=globalThis.ECHO_OUTCOMES,draft=O.begin(d,{kind:'quest',title:q.title,detail:value.result,source,session:source,status:'confirmed',basis:'Observed',quests:[{id,state:action==='step'?value.state:value.status,stepId:action==='step'?value.id:''}]});O.apply(d,draft.id,O.preview(d,draft));return;}
  const r=record(g,id);
  if(action==='status'){r.status=value.status;r.outcome=clip(value.result);r.published=null;log(g,id,`${value.status}: ${value.result}`,source);}
  if(action==='step'){r.steps[value.id]={state:value.state,result:clip(value.result),source:clip(source,500),at:new Date().toISOString()};r.published=null;log(g,id,`${value.state} · ${q.steps.find(s=>s.id===value.id).title}: ${value.result}`,source);}
 }
 function publication(d,id,audience){const q=catalog(d).find(q=>q.id===id),g=d.questGuide,r=record(g,id);
  if(!q||q.kind==='act'||audience!==(q.kind==='character'?q.owner:'party'))throw Error('Main quests go to the TV, side quests to party phones, and character quests to their owner.');
  if(!r.draft.title.trim()||!r.draft.text.trim())throw Error('Write a player-safe title and current objective before sharing.');
  r.published={title:clip(r.draft.title,120),text:clip(r.draft.text,2400),state:view(d,q).status,audience,at:new Date().toISOString()};log(g,id,`Published reviewed wording to ${audience}.`);
 }
 function publicCards(d){if(!d.questGuide?.enabled)return [];return catalog(d).flatMap(q=>{const p=d.questGuide.records[q.id]?.published;return q.kind==='side'&&p?.audience==='party'?[{id:`guide-${q.id}`,title:p.title,goal:p.text,state:p.state}]:[];});}
 function phoneQuests(d){return [...globalThis.ECHO_CONTINUITY.questCards(d,true).filter(q=>!d.questGuide?.records?.[q.id]?.published&&globalThis.ECHO_CONTINUITY.QUESTS.some(x=>x.id===q.id)).map(q=>({id:q.id,title:q.title,state:q.state,goal:q.goal})),...publicCards(d)];}
 function privateClues(d,id){if(!d.questGuide?.enabled)return [];return catalog(d).flatMap(q=>{const p=d.questGuide.records[q.id]?.published;return q.kind==='character'&&q.owner===id&&p?[{id:`quest-guide-${q.id}`,title:p.title,state:p.state,text:`${p.state}\n\n${p.text}`,image:'',saved:false,at:p.at}]:[];});}
 function tvQuest(d){if(!d.questGuide?.enabled)return null;const main=catalog(d).find(q=>q.kind==='main'&&d.questGuide.records[q.id]?.published);const p=main&&d.questGuide.records[main.id]?.published;return p?{title:p.title,text:p.text,state:p.state}:null;}
 function recommendations(d){if(!d.questGuide?.enabled)return [];const all=cards(d);return all.filter(q=>!['completed','failed','abandoned','paused'].includes(q.status)&&(q.kind==='main'||q.id==='act-'+d.questGuide.currentAct||q.record.pinned||q.status==='active'||q.act===d.questGuide.currentAct&&q.kind==='side')).sort((a,b)=>(b.record.pinned?1:0)-(a.record.pinned?1:0)||(['main','act','character','side'].indexOf(a.kind)-['main','act','character','side'].indexOf(b.kind))).slice(0,6);}
 globalThis.ECHO_QUESTS={normalize,ensure,record,cards,view,change,publication,publicCards,phoneQuests,privateClues,tvQuest,recommendations,statuses,stepStates,log};
})();
