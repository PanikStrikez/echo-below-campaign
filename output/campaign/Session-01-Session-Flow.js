/* Private evening records. Game rules, public displays and approved outcomes keep their existing owners. */
(() => {
 'use strict';
 const rows=x=>Array.isArray(x)?x:[],copy=x=>JSON.parse(JSON.stringify(x)),text=(x,n=6000)=>String(x??'').slice(0,n),safe=k=>!['__proto__','constructor','prototype'].includes(k);
 const categories={resources:'HP & resources',treasure:'Treasure & custody',discoveries:'Discoveries & quests',promises:'Promises & debts',npcs:'NPC outcomes',other:'Other changes'};
 const dict=(x,limit=3000,n=30000)=>Object.fromEntries(Object.entries(x||{}).filter(([k])=>safe(k)).slice(-limit).map(([k,v])=>[text(k,200),text(v,n)]));
 function blank(){return {phase:'before',started:'',closed:'',runId:'',baseline:null,recap:'',recapSource:'',recapReviewed:'',objectivesReviewed:'',exception:'',checks:null,notes:{},carry:{},stop:'',next:'',reviewed:'',history:[]};}
 function normalize(raw={}){return {version:1,sessions:Object.fromEntries(Object.entries(raw?.sessions||{}).filter(([k])=>safe(k)).slice(-200).map(([k,v])=>{v=v||{};return [k,{...blank(),phase:['before','live','closed'].includes(v.phase)?v.phase:'before',started:text(v.started,40),closed:text(v.closed,40),runId:text(v.runId,100),baseline:v.baseline?{values:dict(v.baseline.values),events:dict(v.baseline.events,1000,20000)}:null,recap:text(v.recap),recapSource:text(v.recapSource,20000),recapReviewed:text(v.recapReviewed,20000),objectivesReviewed:text(v.objectivesReviewed,20000),exception:text(v.exception,1000),checks:v.checks?copy(v.checks):null,notes:dict(v.notes,12,6000),carry:dict(v.carry,500,2000),stop:text(v.stop,2000),next:text(v.next,2000),reviewed:text(v.reviewed,100),...(v.advancement?{advancement:dict(v.advancement,80,2000)}:{}),history:rows(v.history).slice(-30).map(r=>({id:text(r.id,100),at:text(r.at,40),text:text(r.text,60000)}))}];}))};}
 function session(extras,id){const d=extras.sessionFlow ||= normalize();return d.sessions[id] ||= blank();}
 const events=story=>globalThis.ECHO_CONTINUITY.effective(story.continuity);
 function snapshot(c){const values=globalThis.ECHO_TABLE_FLOW.snapshot(c.state,c.extras,c.story),put=(k,v)=>values[k]=text(JSON.stringify(v??null),30000);
  for(const [id,p]of Object.entries(c.state.party||{}))if(p.role==='pc'){for(const key of ['hitDice','inspiration','level','ac','attunement','features','spells'])put(`${p.name} [${id}] · ${key}`,p[key]);}
  for(const q of globalThis.ECHO_QUEST_PREP?.cards(c.story.continuity)||[])put('Quest · '+q.title+' ['+q.id+']',{status:q.status,steps:q.steps});
  for(const t of globalThis.ECHO_CONTINUITY.trackers(c.story.continuity))put('Promise / custody · '+t.subject+' ['+t.kind+':'+t.key+']',t);
  for(const [id,p]of Object.entries(c.state.combat?.plans||{}))for(const [key,value]of Object.entries({...p.wrap,outcome:p.outcome}))put('Encounter note · '+id+' · '+key,value);
  for(const w of rows(c.story.wrapUps))for(const key of ['decisions','npcChanges','treasure','progress','hooks','recap'])put('Session note · '+w.id+' · '+key,w[key]);
  put('Scratchpad',c.state.ergonomics?.scratch||'');
  return {values,events:Object.fromEntries(events(c.story).map(e=>[e.id,JSON.stringify(e)]))};
 }
 function category(label){if(/^(Encounter note|Session note)/.test(label)){const key=label.split(' · ').at(-1);return ['loot','lootCustody','treasure','wagon'].includes(key)?'treasure':key==='promises'?'promises':['casualties','consequences','npcChanges'].includes(key)?'npcs':key==='resources'?'resources':['clues','progress','advancement'].includes(key)?'discoveries':'other';}if(label==='Scratchpad')return 'other';return /^(Loot|Party purse|Private clue|Promise \/ custody)/.test(label)?'treasure':/^NPC/.test(label)?'npcs':/^(Event|Evidence|Quest|Party objective)/.test(label)?'discoveries':'resources';}
 function collect(c,s){const now=snapshot(c),changed=globalThis.ECHO_TABLE_FLOW.differences(s.baseline?.values||now.values,now.values),groups=Object.fromEntries(Object.keys(categories).map(k=>[k,[]]));
  for(const r of changed){let k=category(r.label);if(/^Promise \/ custody/.test(r.label)&&/"kind":"(?:promise|debt)"/.test(r.after+r.before))k='promises';if(/^Promise \/ custody/.test(r.label)&&/"kind":"(?:rescue|escape)"/.test(r.after+r.before))k='npcs';groups[k].push(r);}
  const updated=events(c.story).filter(e=>s.baseline&&s.baseline.events[e.id]!==JSON.stringify(e));
  const sources={action:c.state.phoneActions?.requests,phone:c.state.phoneRequests,inventory:c.extras.playerHub?.requests,travel:c.extras.travel?.requests,search:c.extras.dungeon?.requests,save:c.state.combatPlus?.saves,reaction:c.state.combatPlus?.pauses,damage:c.state.combatPlus?.damage};
  const pending=c.pending.map(r=>({...r,revision:digest(rows(sources[r.kind]).find(n=>n.id===r.id)||r)}));for(const d of rows(c.story.continuity.outcomes?.drafts))pending.push({key:'outcome:'+d.id,kind:'outcome',title:'Unapproved outcome · '+(d.event?.title||'Untitled'),id:d.id,revision:digest(d)});
  return {groups,updated,pending,now,tracked:!!s.baseline};
 }
 // Closing summaries project approved records only; they never create consequences or grant levels.
 function payoff(c,s){
  const a=collect(c,s),facts=a.updated.filter(e=>e.approved&&['confirmed','completed'].includes(e.status)),claims=a.updated.filter(e=>e.approved&&e.status==='rumor');
  const open=globalThis.ECHO_CONTINUITY.trackers(c.story.continuity).filter(t=>!['completed','closed','resolved','fulfilled','returned','cancelled'].includes(t.state));
  const consequences=facts.filter(e=>e.combatAftermath||rows(e.tracks).some(t=>['rescue','escape','promise','debt','custody'].includes(t.kind))||rows(e.npcs).length);
  const characters=Object.entries(c.state.party||{}).filter(([,p])=>p.role==='pc').map(([id,p])=>({id,name:p.name,records:facts.filter(e=>rows(e.knows).includes(id)||rows(e.tracks).some(t=>t.holder===id||t.holder===p.name))}));
  return {facts,claims,consequences,open,characters,pending:a.pending};
 }
 function advancement(c,s){return Object.entries(c.state.party||{}).filter(([,p])=>p.role==='pc').map(([id,p])=>{
  const key=Object.keys(s.baseline?.values||{}).find(k=>k.endsWith(' ['+id+'] · level'));let start=null;try{start=JSON.parse(s.baseline.values[key]);}catch{}
  if(!Number.isInteger(start)||start<1||start>20)start=null;
  const target=start===null?null:Math.min(20,start+1),current=Number.isInteger(p.level)?p.level:null,record=rows(p.levelHistory).find(h=>h.level===current&&h.snapshot?.level===start&&/^Level [0-9]+:/.test(h.summary||''));
  const state=target===null?'Starting level unknown':start===20?'At level cap':current<start?'Level changed backwards — review':current===target&&record?'Approved advancement recorded':current>=target?'Level changed — verify choices':s.advancement?.[id]?.trim()?'Deferred — choices remain open':'Needs advancement review';
  return {id,name:p.name,start,current,target,state,note:s.advancement?.[id]||'',complete:state==='Approved advancement recorded'||start===20};
 });}
 // Stable digest is a change detector, not a security hash.
 function digest(value){let n=2166136261;for(const char of JSON.stringify(value)){n^=char.charCodeAt(0);n=Math.imul(n,16777619);}return (n>>>0).toString(16);}
 const pendingKey=r=>digest([r.key,r.title,r.scene||'',r.revision||'']);
 const words={hp:'HP',maxHp:'Maximum HP',tempHp:'Temporary HP',hitDice:'Hit dice',ac:'Armor class',npcChanges:'NPC changes',lootCustody:'Loot carrier',concentration:'Concentration',inspiration:'Inspiration',death:'Death saves',current:'remaining',max:'maximum',successes:'successes',failures:'failures',stable:'stable'};
 const readableKey=k=>words[k]||String(k).replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ');
 const label=value=>value.replace(/ \[[^\]]+\]/g,'').split(' · ').map(readableKey).join(' · ');
 function describe(value){let v;try{v=JSON.parse(value);}catch{return value;}if(v==null)return 'Not recorded';if(typeof v==='boolean')return v?'Yes':'No';if(typeof v!=='object')return String(v);
  if(Array.isArray(v))return v.length?v.map(x=>typeof x==='object'&&x!==null?x.name?x.name+(x.quantity!=null?' ×'+x.quantity:''):x.title?x.title+(x.state?' · '+x.state:''):describe(JSON.stringify(x)):String(x)).join('; '):'None';
  if(v.title&&v.detail)return `${v.status||'Record'} · ${v.title}: ${v.detail}`;
  if(v.subject&&v.kind)return `${v.subject} · ${v.state||''}${v.holder?' · '+v.holder:''}${v.owedTo?' · owed to '+v.owedTo:''}${v.note?' · '+v.note:''}`;
  return Object.entries(v).map(([k,x])=>readableKey(k)+': '+describe(JSON.stringify(x))).join('; ');
 }
 function signature(c,s){const a=collect(c,s);return digest([a.now,a.pending,s.notes,s.advancement||{},s.carry,s.stop,s.next,s.recap,c.state.scene,c.state.runbook]);}
 function opening(c){const shared=events(c.story).filter(e=>globalThis.ECHO_CONTINUITY.shared(e));const latest=shared.at(-1)?.session;return {text:latest?globalThis.ECHO_CONTINUITY.recap(c.story.continuity,latest):'No approved party recap yet. Ask the players what they remember.',source:digest(shared),label:latest||'No approved recap'};}
 const recapKey=(c,s)=>digest([opening(c).source,s.recap]);
 const objectiveKey=c=>digest([c.objective,c.lead,c.activeQuests]);
 function tableIssues(c){const r=c.checks;if(!r||r.campaignId!==c.campaignId||r.sessionId!==c.sessionId)return ['Table check has not run for this campaign and session'];if(r.running)return ['Table check is still running'];const issues=[];if(Date.now()-r.started>15*60000)issues.push('Table check is older than 15 minutes');for(const k of ['tv','phones','audio','assets','backup'])if(r.checks[k]?.status!=='ready')issues.push(k+': '+(r.checks[k]?.detail||'not checked'));return issues;}
 function startErrors(c,s){const errors=[];if(s.phase!=='before')errors.push('Prepare a new evening or continue the current one');if(s.recapReviewed!==recapKey(c,s))errors.push('Review the opening recap');if(s.objectivesReviewed!==objectiveKey(c))errors.push('Review the party objectives');if(tableIssues(c).length&&!s.exception.trim())errors.push('Run the table check or record how you will handle its warnings');return errors;}
 function begin(c,s){const errors=startErrors(c,s);if(errors.length)throw Error(errors.join('. '));s.baseline=snapshot(c);s.started=new Date().toISOString();s.closed='';s.runId='evening-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);s.phase='live';s.checks=copy(c.checks||null);s.reviewed='';return s;}
 function closeErrors(c,s){const errors=[];if(s.phase!=='live')errors.push('Start an evening before closing it');if(!s.stop.trim())errors.push('Record where play stopped');if(!s.next.trim())errors.push('Record where to resume');for(const r of collect(c,s).pending)if(s.carry[r.key]!==pendingKey(r))errors.push('Review or carry forward: '+r.title);if(s.reviewed!==signature(c,s))errors.push('Review the latest changes');return errors;}
 function report(c,s){const a=collect(c,s);return [`${c.sessionName} · private evening review`,`Started: ${s.started}`,`Stopping point: ${s.stop}`,`Next time: ${s.next}`,`Objective: ${c.objective||'Not selected'}`,...Object.entries(categories).flatMap(([k,title])=>['',title,...a.groups[k].map(r=>`${label(r.label)}: ${describe(r.before)} → ${describe(r.after)}`),s.notes[k]||'']), '\nUNRESOLVED · carried forward',...a.pending.map(r=>r.title),'\nRECAP NOTES · private until separately reviewed and published',s.notes.recap||'No recap drafted','\nAPPROVED ACCOMPLISHMENTS',...payoff(c,s).facts.map(e=>e.id+' · '+e.title),'\nCONSEQUENCES TO FOLLOW UP · approved references, not new developments',...payoff(c,s).consequences.map(e=>e.id+' · '+e.title),'\nOPEN PROMISES / CUSTODY / NPC QUESTIONS',...payoff(c,s).open.map(t=>describe(JSON.stringify(t))+' · '+t.eventId),'\nCHARACTER OPPORTUNITIES · approved references',...payoff(c,s).characters.map(p=>p.name+': '+(p.records.map(e=>e.id+' · '+e.title).join('; ')||'No new owner-linked outcome; review invitations with the player.')),'\nADVANCEMENT · one level after each played session; no automatic changes',...advancement(c,s).map(p=>p.name+': '+p.state+' · '+p.current+' → '+(p.target??'unknown')+(p.note?' · '+p.note:'')),'\nOPENING CHECK EXCEPTIONS',s.exception||'None recorded'].join('\n');}
 function finish(c,s){const errors=closeErrors(c,s);if(errors.length)throw Error(errors.join('. '));const entry={id:s.runId,at:new Date().toISOString(),text:report(c,s)};s.history=s.history.filter(r=>r.id!==entry.id);s.history.push(entry);s.history=s.history.slice(-30);s.phase='closed';s.closed=entry.at;return entry;}
 function newEvening(s){if(s.phase!=='closed')throw Error('Close the current evening first');const history=s.history,next=s.next;Object.assign(s,blank(),{history,next});}
 globalThis.ECHO_SESSION_FLOW={normalize,session,snapshot,collect,payoff,advancement,categories,digest,pendingKey,label,describe,signature,opening,recapKey,objectiveKey,tableIssues,startErrors,begin,closeErrors,report,finish,newEvening};
})();
