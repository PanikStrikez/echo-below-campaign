/* Approved outcome ledger. Drafts never alter live projections. */
(() => {
 'use strict';
 const C=()=>globalThis.ECHO_CONTINUITY,copy=v=>JSON.parse(JSON.stringify(v)),text=(v,n=2500)=>String(v??'').slice(0,n),list=v=>Array.isArray(v)?v:[];
 const id=()=>`outcome-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
 const factual=e=>e.approved&&['confirmed','completed'].includes(e.status);
 const kinds=['discovery','rescue','escape','promise','debt','custody','quest','other'];
 function normalize(raw={}){raw=raw&&typeof raw==='object'?raw:{};return {version:1,migrated:raw.migrated===true,original:typeof raw.original==='string'?raw.original:'',
  drafts:list(raw.drafts).slice(-100).filter(x=>x&&x.id).map(x=>({id:text(x.id,80),target:text(x.target,80),withdraw:x.withdraw===true,base:text(x.base,100000),event:C().event(x.event),created:text(x.created,40)})),
  revisions:list(raw.revisions).slice(-500).filter(Boolean).map(x=>({eventId:text(x.eventId,80),at:text(x.at,40),before:x.before?C().event(x.before):null,after:x.after?C().event(x.after):null})),
  summaries:list(raw.summaries).slice(-500).filter(Boolean).map(x=>({id:text(x.id,80),session:text(x.session,80),fingerprint:text(x.fingerprint,100000)}))};}
 function ensure(story,d){d.outcomes ||= normalize();const o=d.outcomes;if(o.migrated)return o;
  // Retain the original normalized records before consolidating old manual quest values.
  o.original=JSON.stringify({events:d.events,quests:d.quests,questGuide:d.questGuide});o.migrated=true;
  for(const q of globalThis.ECHO_QUEST_CATALOG?.quests||[]){const r=d.questGuide?.records[q.id];if(!r)continue;
   const add=(state,result,source,stepId='')=>{
    if(!result||questUpdates(d,q.id,stepId).length)return;
    d.events.push(C().event({id:`import-${q.id}-${stepId||'status'}`,kind:'quest',title:`Existing quest record: ${q.title}`,detail:result,source:source||'Preserved DM quest record; imported without inferring new play',session:'Imported quest record',status:'confirmed',basis:'Observed',approved:true,approvedAt:new Date().toISOString(),quests:[{id:q.id,state,stepId}],share:'private'}));
   };
   if(r.outcome&&r.status)add(r.status,r.outcome,[...(d.questGuide.history||[])].reverse().find(h=>h.quest===q.id)?.source);
   for(const [stepId,s]of Object.entries(r.steps||{}))if(s.result&&s.state!=='open')add(s.state,s.result,s.source,stepId);
  }
  for(const j of story.journal||[])if(j.kind==='recap'){const session=j.id==='actual-s23-recap-draft'?'Sessions 2–3 · combined record':j.when;if(j.text===C().recap(d,session))o.summaries.push({id:j.id,session,fingerprint:fingerprint(d,session)});}
  return o;
 }
 function effective(d){const hidden=new Set(d.events.filter(e=>e.approved&&e.status!=='planned').flatMap(e=>e.replaces||[]));return d.events.filter(e=>!hidden.has(e.id));}
 function begin(d,values={},target=''){const o=d.outcomes ||= normalize();if(o.drafts.length>=100)throw Error('Finish or discard an older outcome draft first.');
  const old=target?d.events.find(e=>e.id===target):null;if(target&&!old)throw Error('The original outcome is no longer available.');
  const draft={id:id(),target,withdraw:false,base:old?JSON.stringify(old):'',created:new Date().toISOString(),event:C().event(old||{id:id(),kind:'other',title:'New outcome',status:'confirmed',source:'DM table record',...values})};
  if(!old&&values.kind&&['rescue','escape','promise','debt','custody'].includes(values.kind)&&!draft.event.tracks.length)draft.event.tracks=[{kind:values.kind,key:id(),subject:'',holder:'',owedTo:'',state:values.kind==='rescue'?'resolved':'open',note:'',public:false}];
  o.drafts.push(draft);return draft;
 }
 function validate(d,draft,ctx={}){const e=C().event(draft.event),old=draft.target?d.events.find(e=>e.id===draft.target):null,errors=[];
  if(draft.target&&JSON.stringify(old)!==draft.base)errors.push('The original record changed. Reopen it before applying a correction.');
  if(draft.withdraw){if(!draft.target)errors.push('Choose an existing outcome to withdraw.');return errors;}
  if(!draft.target&&d.events.some(x=>x.id===e.id))errors.push('This outcome ID is already recorded.');
  if(!e.title.trim()||!e.detail.trim()||!e.source.trim())errors.push('Add a title, what happened, and the source.');
  if((e.share==='party'||e.recipients.length)&&(!e.publicTitle.trim()||!e.playerText.trim()))errors.push('Add a player-safe title and wording for the chosen audience.');
  if(e.share==='party'&&!e.knows.includes('party'))errors.push('Choose the party among those who know this before sharing with everyone.');
  if(e.recipients.some(p=>!p.startsWith('pc-')||!e.knows.includes(p)&&!e.knows.includes('party')))errors.push('Private recipients must be characters who know this outcome.');
  const qs=questDefinitions(d);for(const l of e.quests){const q=qs.find(q=>q.id===l.id);if(!q)errors.push('A linked quest is unavailable.');if(l.stepId&&!q?.steps?.some(s=>s.id===l.stepId))errors.push('A linked objective is unavailable.');if(l.stepId&&!['open','completed','failed','bypassed','reference'].includes(l.state))errors.push('Choose a valid objective result.');if(!l.stepId&&!['planned','active','paused','completed','failed','abandoned','reference'].includes(l.state))errors.push('Choose a valid quest status.');}
  if(e.tracks.some(t=>!t.subject.trim()||!t.key.trim()))errors.push('Name each tracked person, item or promise.');
  if(e.markers.some(m=>m.reveal)&&!(e.share==='party'&&e.knows.includes('party')&&['confirmed','completed'].includes(e.status)))errors.push('Map reveals require a factual outcome shared with the party.');
  if(ctx.markers&&e.markers.some(m=>!ctx.markers.some(p=>p.scene===m.scene&&p.point===m.point)))errors.push('A map marker is no longer available.');
  for(const ref of e.origins){const previous=linked(d,ref.kind,ref.id);if(previous&&previous.id!==e.id&&!e.replaces.includes(previous.id))errors.push('An original note already belongs to another outcome. Correct that outcome or explicitly replace the duplicate.');if(ctx.story&&!list(ctx.story[ref.kind]).some(x=>x.id===ref.id))errors.push('An original note is no longer available.');}
  for(const key of e.replaces){const replaced=d.events.find(x=>x.id===key);if(!replaced||key===e.id||replaced.replaces?.length||d.events.some(x=>x.id!==e.id&&x.approved&&x.replaces?.includes(key)))errors.push('Choose an available original record to replace; replacement chains are not supported.');}
  if(e.status==='planned'&&e.replaces.length)errors.push('A plan cannot replace an actual outcome.');
  if(!draft.target&&d.events.length>=5000)errors.push('Export the campaign before adding more than 5,000 outcomes.');
  errors.push(...(globalThis.ECHO_COURTYARD?.validate(e)||[]));
  errors.push(...(globalThis.ECHO_DOWNTIME?.validate(d,e)||[]));
  errors.push(...(globalThis.ECHO_MYSTERY?.validate(d,e,ctx.story)||[]));
  return [...new Set(errors)];
 }
 function questDefinitions(d){return [...new Map([...d.quests,...(d.questGuide?.contentProfile==='blank'?d.questGuide.customQuests||[]:globalThis.ECHO_QUEST_CATALOG?.quests||[])].map(q=>[q.id,q])).values()];}
 function questUpdates(d,qid,stepId=''){return effective(d).filter(factual).flatMap(e=>e.quests.filter(q=>q.id===qid&&(q.stepId||'')===stepId&&q.state!=='reference').map(q=>({...q,eventId:e.id,result:e.detail,source:e.source,session:e.session,at:e.approvedAt})));}
 function preview(d,draft,ctx={}){const e=C().event({...draft.event,approved:!draft.withdraw,approvedAt:draft.withdraw?'':'preview'}),next=copy(d),index=next.events.findIndex(x=>x.id===draft.target);if(index<0)next.events.push(e);else next.events[index]=e;
  const projection=x=>({mystery:globalThis.ECHO_MYSTERY?.projection(x)||[],downtime:globalThis.ECHO_DOWNTIME?.projection(x)||[],relationships:globalThis.ECHO_COURTYARD?.relationshipProjection(x)||[],home:globalThis.ECHO_COURTYARD?.homeProjection(x)||[],quests:questDefinitions(x).flatMap(q=>[[q.title,questUpdates(x,q.id).at(-1)?.state||'planned'],...(q.steps||[]).map(s=>[q.title+' / '+s.title,questUpdates(x,q.id,s.id).at(-1)?.state||'open'])]),journal:ctx.story?journal({...ctx.story,continuity:x}):C().publicJournal(x),privatePhones:Object.fromEntries([...new Set([...effective(d),...effective(next)].flatMap(e=>e.recipients||[]))].map(owner=>[owner,privateJournal(x,owner)])),tracks:C().trackers(x),publicTracks:C().trackers(x,true),knowledge:Object.fromEntries([...new Set([...effective(d),...effective(next)].flatMap(x=>x.knows))].map(k=>[k,C().knowledge(x,k).map(e=>({id:e.id,text:e.detail}))])),maps:(ctx.markers||[]).map(p=>{const entry=C().projectMap(x,{points:[{id:p.point,visible:p.visible===true,approved:p.approved===true,clue:p.clue||''}]},p.scene).points[0];return {scene:p.scene,point:p.point,reveal:entry.visible,note:entry.clue||''};})});
  const before=projection(d),after=projection(next),diff={};for(const k of Object.keys(before))if(JSON.stringify(before[k])!==JSON.stringify(after[k]))diff[k]={before:before[k],after:after[k]};
  return {event:e,errors:validate(d,draft,ctx),changes:diff,active:e.status!=='planned',signature:JSON.stringify({events:d.events,event:draft.event,withdraw:draft.withdraw===true,base:draft.base,guide:d.questGuide,notes:ctx.story&&[ctx.story.journal,ctx.story.evidence,ctx.story.wrapUps],research:ctx.story?.mystery,markers:ctx.markers}),before,after};
 }
 function apply(d,key,review,ctx={}){const draft=d.outcomes.drafts.find(x=>x.id===key);if(!draft)throw Error('This draft is no longer available.');const fresh=preview(d,draft,ctx);if(fresh.errors.length)throw Error(fresh.errors.join(' '));if(review.signature!==fresh.signature)throw Error('The record or linked history changed after preview. Review the changes again.');
  const e=C().event({...draft.event,approved:!draft.withdraw,approvedAt:draft.withdraw?'':new Date().toISOString()}),i=d.events.findIndex(x=>x.id===draft.target),before=i>=0?copy(d.events[i]):null;
  C().checkpoint(d);if(i<0)d.events.push(e);else d.events[i]=e;
  d.outcomes.revisions.push({eventId:e.id,at:new Date().toISOString(),before,after:copy(e)});d.outcomes.revisions=d.outcomes.revisions.slice(-500);d.outcomes.drafts=d.outcomes.drafts.filter(x=>x.id!==key);
  // A changed result withdraws only explicitly affected publications until wording is reviewed.
  const affected=new Set([...(before?.quests||[]),...e.quests,...d.events.filter(x=>e.replaces.includes(x.id)).flatMap(x=>x.quests)].map(q=>q.id));for(const q of affected)if(d.questGuide?.records[q])d.questGuide.records[q].published=null;
  return e;
 }
 function retire(d,eventId){const old=d.events.find(e=>e.id===eventId);if(!old)throw Error('Outcome unavailable.');const before=copy(old);C().checkpoint(d);old.approved=false;old.approvedAt='';d.outcomes.revisions.push({eventId,at:new Date().toISOString(),before,after:copy(old)});for(const q of old.quests)if(d.questGuide?.records[q.id])d.questGuide.records[q.id].published=null;}
 function linked(d,kind,id){const matches=e=>e?.origins?.some(o=>o.kind===kind&&o.id===id);return effective(d).find(e=>matches(e)||(e.replaces||[]).some(key=>matches(d.events.find(old=>old.id===key))));}
 function fingerprint(d,session){return JSON.stringify(C().publicJournal(d).filter(e=>session==='all'||e.when===session));}
 function journal(story){const d=story.continuity,canonical=C().publicJournal(d),seen=new Set(canonical.map(j=>j.text.trim())),rows=[...canonical];
  for(const j of story.journal||[]){if(!j.published||linked(d,'journal',j.id))continue;const summary=d.outcomes?.summaries.find(x=>x.id===j.id);if(summary&&summary.fingerprint!==fingerprint(d,summary.session))continue;if(!seen.has(j.text.trim())){rows.push({id:j.id,title:j.title,text:j.text,kind:j.kind,when:j.when});seen.add(j.text.trim());}}
  for(const j of story.evidence||[]){if(j.published&&j.playerSaw&&!linked(d,'evidence',j.id)&&!seen.has(j.playerSaw.trim())){rows.push({id:j.id,title:j.title,text:j.playerSaw,kind:j.status,when:''});seen.add(j.playerSaw.trim());}}
  return rows;
 }
 function privateJournal(d,owner){return effective(d).filter(e=>e.approved&&e.status!=='planned'&&e.share!=='party'&&e.recipients?.includes(owner)&&(e.knows.includes(owner)||e.knows.includes('party'))&&e.playerText).map(e=>({id:`outcome-${e.id}`,title:(e.status==='rumor'?'Rumor · ':'')+e.publicTitle,text:e.playerText,image:'',saved:true,at:e.approvedAt}));}
 function audit(story){const d=story.continuity,issues=[];const seen=new Map();for(const e of effective(d)){const key=e.detail.trim().toLowerCase();if(e.approved&&key){if(seen.has(key))issues.push({kind:'duplicate',id:e.id,other:seen.get(key),title:`Possible repeated outcome: ${e.title}`});else seen.set(key,e.id);}}
  for(const q of questDefinitions(d)){const saved=d.questGuide?.records[q.id],live=questUpdates(d,q.id).at(-1);if(saved?.status&&live&&saved.status!==live.state)issues.push({kind:'quest',id:q.id,title:`${q.title}: old guide value ${saved.status}; approved record ${live.state}. Approved record takes precedence.`});}
  for(const kind of ['evidence','journal','wrapUps'])for(const n of story[kind]||[]){if(linked(d,kind,n.id)||(kind==='journal'&&d.outcomes?.summaries.some(x=>x.id===n.id)))continue;const body=(n.detail||n.text||n.decisions||'').trim();if(body)issues.push({kind,id:n.id,other:seen.get(body.toLowerCase())||'',title:`${n.published?'Published':'Unlinked'} ${kind==='wrapUps'?'session notes':kind}: ${n.title||n.sessionName||n.id}`});}
  for(const ref of d.outcomes?.summaries||[])if(ref.fingerprint!==fingerprint(d,ref.session))issues.push({kind:'stale-summary',id:ref.id,title:'A linked recap needs review after its source outcomes changed.'});
  return issues;
 }
 globalThis.ECHO_OUTCOMES={kinds,normalize,ensure,effective,begin,preview,apply,retire,questDefinitions,questUpdates,journal,privateJournal,linked,fingerprint,audit};
})();
