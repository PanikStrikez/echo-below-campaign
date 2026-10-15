/* One DM review for linked campaign history. */
(() => {
 'use strict';
 let selected='',review=null,mode='records',query='';const openSections=new Set();
 const O=()=>globalThis.ECHO_OUTCOMES,C=()=>globalThis.ECHO_CONTINUITY;
 function start(host,values={},target=''){try{const d=host.continuity(),current=d.events.find(e=>e.id===target),existing=target&&d.outcomes.drafts.find(x=>x.target===target&&x.base===JSON.stringify(current));const activeDraft=existing||O().begin(d,{session:host.sessionName(),...values},target);selected=activeDraft.id;openSections.clear();if(values.downtime||current?.downtime)openSections.add('Downtime result and correspondence');if(values.mystery||current?.mystery)openSections.add('Evidence and research links');review=null;mode='records';host.save('Saved outcome draft');globalThis.ECHO_STORY_UI.open('outcomes');return activeDraft;}catch(e){host.toast(e.message);}}
 function fromNote(host,kind,n){const linked=O().linked(host.continuity(),kind,n.id);if(linked)return start(host,{},linked.id);
  start(host,{title:n.title||n.sessionName||'Session outcome',session:n.when||n.sessionName||host.sessionName(),detail:n.detail||n.text||[n.decisions,n.npcChanges,n.treasure,n.progress,n.hooks].filter(Boolean).join('\n\n'),playerText:n.playerSaw||n.text||'',source:n.source||'Existing session notes — DM review required',status:kind==='evidence'?(n.status==='Open'?'planned':n.status==='Observed'?'confirmed':'rumor'):'confirmed',basis:kind==='evidence'?n.status:'Claimed',origins:[{kind,id:n.id}]});
 }
 function render(root,host){const d=host.continuity(),o=d.outcomes,story=host.story(),roster=host.roster(),markers=host.continuityMarkers(),ctx={story,markers,objective:host.extras?.()?.playerHub?.objective};
  const el=(tag,text,p,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;p.append(n);return n;};
  const button=(p,text,fn)=>{const b=el('button',text,p);b.type='button';b.addEventListener('click',fn);return b;};
  const section=(title,note,p=root)=>{const s=el('section',null,p,'story-section');el('h3',title,s);if(note)el('p',note,s,'help');return s;};
  const refresh=()=>globalThis.ECHO_STORY_UI.render();
  const save=label=>{host.save(label);};
  const edit=fn=>{fn();review=null;save('Saved private outcome draft');};
  const field=(p,label,value,fn,multi=false,max=2500)=>{const l=el('label',label,p,'story-field'),i=el(multi?'textarea':'input',null,l);i.value=value||'';i.maxLength=max;if(multi)i.rows=3;else i.type='text';i.addEventListener('change',()=>edit(()=>fn(i.value)));return i;};
  const select=(p,label,value,options,fn)=>{const l=el('label',label,p,'story-field'),i=el('select',null,l);for(const [v,t]of options){const n=el('option',t,i);n.value=v;}i.setAttribute('aria-label',label);i.value=value;i.addEventListener('change',()=>{fn(i.value);refresh();});return i;};
  const check=(p,label,value,fn)=>{const l=el('label',null,p,'story-field'),i=el('input',null,l);i.type='checkbox';i.checked=!!value;el('span',label,l);i.addEventListener('change',()=>{edit(()=>fn(i.checked));refresh();});};
  const details=(p,title)=>{const s=el('details',null,p,'story-card'),key=title.replace(/ \(\d+\)$/, '');el('summary',title,s);s.open=openSections.has(key);s.addEventListener('toggle',()=>{if(s.isConnected){if(s.open)openSections.add(key);else openSections.delete(key);}});return s;};
  const names=new Map([['party','Everyone in the party'],...roster.map(n=>[n.id,n.name]),...story.npcs.map(n=>[n.id,n.name])]);
  const name=id=>names.get(id)||id;
  const done=label=>{selected='';review=null;save(label);refresh();};
  let s=section('Outcome review','Record → who knows → linked changes → review & apply. Drafts stay private and leave the approved record in place.');
  globalThis.ECHO_RECONCILIATION?.render(s);
  const nav=el('div',null,s,'button-row');
  for(const [id,title]of [['records','Outcomes'],['audit','Reconcile older notes']])button(nav,title,()=>{mode=id;selected='';review=null;refresh();}).setAttribute('aria-pressed',String(mode===id&&!selected));
  button(nav,'Undo outcome change',()=>{if(C().restore(d))done('Undid linked outcome changes');}).disabled=!d.undo.length;
  button(nav,'Redo',()=>{if(C().restore(d,true))done('Redid linked outcome changes');}).disabled=!d.redo.length;
  button(nav,'Recap from approved history',()=>{globalThis.ECHO_CONTINUITY_UI.selectTab('recap');globalThis.ECHO_STORY_UI.open('continuity');});
  if(!o.drafts.some(x=>x.id===selected)){selected='';review=null;}
  if(!selected&&mode==='audit'){
   s=section('Reconcile records','Approved outcomes drive the linked views. Original notes remain preserved. Similar wording is a review suggestion; it is never merged automatically.');
   const issues=O().audit(story);el('p',`${issues.length} review item${issues.length===1?'':'s'} · original pre-migration records retained in this campaign’s backup data.`,s);
   if(!issues.length)el('p','No duplicate text, conflicting quest values or unlinked notes found.',s);
   for(const issue of issues){const card=el('article',null,s,'story-card');el('strong',issue.title,card);
    if(issue.kind==='duplicate'){button(card,'Review this outcome',()=>start(host,{},issue.id));el('p','Under Linked records, choose which duplicate this outcome replaces. Both originals remain in history.',card,'help');}
    else if(issue.kind==='quest'){const change=O().questUpdates(d,issue.id).at(-1);button(card,'Review authoritative outcome',()=>start(host,{},change.eventId));}
    else if(issue.kind==='stale-summary'){button(card,'Review recap in journal',()=>globalThis.ECHO_STORY_UI.open('journal'));}
    else {const n=(story[issue.kind]||[]).find(n=>n.id===issue.id);if(n){button(card,'Review as an outcome',()=>fromNote(host,issue.kind,n));if(issue.other)button(card,'Link to matching outcome',()=>{start(host,{},issue.other);d.outcomes.drafts.find(x=>x.id===selected).event.origins.push({kind:issue.kind,id:issue.id});save('Linked original note to correction draft');refresh();});}}
   }return;
  }
  if(!selected){
   s=section('Record what happened',d.sessionNotes);
   const actions=el('div',null,s,'button-row');for(const kind of O().kinds)button(actions,({custody:'Item transfer',quest:'Quest result',other:'Other outcome'})[kind]||kind[0].toUpperCase()+kind.slice(1),()=>start(host,{kind,title:''}));
   if(globalThis.ECHO_STAGE6?.applies(d)){
    const prompts=section('After this Phandalin session','Choose a prompt for something that actually happened. Each opens a private draft; review the source, audience, quest links, custody, and map visibility before applying.');
    const quick=el('div',null,prompts,'button-row');
    for(const item of globalThis.ECHO_STAGE6.templates)button(quick,item.label,()=>start(host,globalThis.ECHO_STAGE6.draft(item.id)));
   }
   if(o.drafts.length){s=section('Continue a draft','No changes from these drafts have been applied.');for(const draft of [...o.drafts].reverse())button(s,`${draft.target?'Correction':'New'} · ${draft.event.title||'Untitled outcome'}`,()=>{selected=draft.id;review=null;refresh();});}
   s=section('Approved history');const searchLabel=el('label','Find an outcome',s,'story-field'),search=el('input',null,searchLabel);search.type='search';search.value=query;search.addEventListener('change',()=>{query=search.value;refresh();});
   const effective=new Set(O().effective(d).map(e=>e.id));
   for(const e of [...d.events].reverse().filter(e=>`${e.title} ${e.detail} ${e.session}`.toLowerCase().includes(query.toLowerCase()))){const card=el('article',null,s,'story-card');el('h4',e.title,card);el('p',`${e.session} · ${!e.approved?'Unapproved':!effective.has(e.id)?'Replaced by another outcome':e.status} · ${e.share==='party'?'Party wording shared':'Private'}`,card,'help');el('p',e.detail,card);globalThis.ECHO_ACTION_RECEIPTS?.render(card,{title:'Outcome review',status:e.approved&&effective.has(e.id)?'resolved':'unresolved',committed:['Reviewed '+e.status+' record saved',...(e.quests||[]).map(q=>'Quest '+q.id+' · '+q.state)],pending:[e.combatAftermath?.pending||''].filter(Boolean),details:[e.source||'DM-reviewed record'],undo:'conditional'});button(card,'Review / correct',()=>start(host,{},e.id));}
   return;
  }
  const draft=o.drafts.find(x=>x.id===selected),e=draft.event;
  const locations=host.outcomePlaces?.()||[];if(locations.length){const links=details(s,'Relevant locations');el('p','Association only: this does not record an arrival, visit, discovery or NPC presence.',links,'help');for(const place of locations)check(links,place.name+' · location link',(e.places||[]).includes(place.id),value=>{e.places=(e.places||[]).filter(id=>id!==place.id);if(value)e.places.push(place.id);});}
  if(draft.sceneGuide){const guide=section('Scene recording prompts · DM only','These are preparation questions, not recorded results. Fill the actual account below; keep unresolved answers open.');el('h4',draft.sceneGuide.title,guide);for(const prompt of draft.sceneGuide.prompts)el('p',prompt,guide);el('small','Reference: '+draft.sceneGuide.source,guide);}
  if(review){
   s=section('Review linked changes',draft.withdraw?'Withdrawing approval removes this outcome’s live effects. Originals and revisions remain saved.':draft.target?'This correction replaces the same outcome. Its previous version remains in revision history.':'This adds one authoritative outcome.');
   if(e.places?.length)el('p','Relevant locations: '+e.places.map(id=>locations.find(p=>p.id===id)?.name||id).join(', ')+' · association only, no visit recorded',s,'help');
   el('h4',e.title||'Untitled outcome',s);el('p',e.detail,s);el('p',`${e.session} · ${e.status} / ${e.basis} · Source: ${e.source}`,s,'help');
   el('p',`Who knows: ${e.knows.map(name).join(', ')||'DM only'}.`,s);
   el('p',draft.withdraw?'The before/after review below shows what will be withdrawn or restored.':e.status==='planned'?'Saved as a plan. It cannot confirm facts or advance quests; previous approved effects may be withdrawn as shown below.':e.share==='party'?'Shared journal wording reaches the TV journal and all phones.':e.recipients.length?`Private wording reaches only ${e.recipients.map(name).join(', ')}.`:'All wording stays private to the DM.',s,'story-note');
   if(e.share==='party'||e.recipients.length){el('h4',e.publicTitle,s);el('p',e.playerText,s);}
   const labels={objective:'Shared party objective · all phones',mystery:'Evidence and research links · DM only',downtime:'Downtime results and correspondence · DM only',relationships:'NPC relationship records · DM only',home:'Court visits, lodging and shared spaces · DM only',quests:'Quest and objective status',journal:'Shared journal / TV journal',privatePhones:'Private phone entries',tracks:'DM custody, promises and people',publicTracks:'Shared custody and obligations',knowledge:'Character and NPC knowledge',maps:'Map markers'};
   const describe=(kind,v)=>kind==='mystery'||kind==='downtime'||kind==='relationships'||kind==='home'?`${v.title}: ${v.text}`:['quests','objective'].includes(kind)?`${v[0]}: ${v[1]}`:kind==='journal'?`${v.title}: ${v.text}`:kind==='tracks'||kind==='publicTracks'?`${v.subject}: ${v.state} · ${v.holder||'holder unknown'}${v.owedTo?' · owed to '+v.owedTo:''}${v.note?' · '+v.note:''}`:kind==='maps'?`${markers.find(p=>p.scene===v.scene&&p.point===v.point)?.title||v.point}: ${v.reveal?'visible':'hidden'}${v.note?' · '+v.note:''}${v.disposition?' · DM state: '+v.disposition:''}`:JSON.stringify(v);
   const key=(kind,v)=>['quests','objective'].includes(kind)?v[0]:kind==='tracks'||kind==='publicTracks'?v.kind+':'+v.key:kind==='maps'?v.scene+':'+v.point:v.id;
   for(const [kind,diff]of Object.entries(review.changes)){const box=details(s,labels[kind]||kind);box.open=true;
    if(kind==='knowledge'||kind==='privatePhones'){for(const owner of new Set([...Object.keys(diff.before),...Object.keys(diff.after)])){const a=diff.before[owner]||[],b=diff.after[owner]||[];if(JSON.stringify(a)===JSON.stringify(b))continue;el('h4',name(owner),box);for(const old of a)if(!b.some(n=>JSON.stringify(n)===JSON.stringify(old)))el('p','Remove / replace: '+(old.text||old.title),box);for(const next of b)if(!a.some(n=>JSON.stringify(n)===JSON.stringify(next)))el('p','Add: '+(next.text||next.title),box);}}
    else {const a=new Map(diff.before.map(v=>[key(kind,v),v])),b=new Map(diff.after.map(v=>[key(kind,v),v]));for(const id of new Set([...a.keys(),...b.keys()])){if(JSON.stringify(a.get(id))===JSON.stringify(b.get(id)))continue;if(a.has(id))el('p','Before: '+describe(kind,a.get(id)),box);if(b.has(id))el('p','After: '+describe(kind,b.get(id)),box);}}
   }
   if(e.status==='rumor')el('p','This is an unverified account. It can enter the journal and selected characters’ knowledge, but cannot complete quests, change custody, or reveal markers.',s,'help');
   if(!Object.keys(review.changes).length)el('p','No linked display changes. The record and its source are still saved.',s);
   const affected=new Set([...(d.events.find(x=>x.id===draft.target)?.quests||[]),...e.quests,...d.events.filter(x=>e.replaces.includes(x.id)).flatMap(x=>x.quests)].map(q=>q.id));
   const pubs=[...affected].filter(id=>d.questGuide?.records[id]?.published);if(pubs.length)el('p','Published quest wording will be withdrawn for review: '+pubs.map(id=>O().questDefinitions(d).find(q=>q.id===id)?.title||id).join(', ')+'. Republish from Manage quests when ready.',s,'story-note');
   if(e.origins.length)el('p',`${e.origins.length} original note(s) will refer to this outcome; their separate journal copies are suppressed. Originals stay saved.`,s);
   if(e.replaces.length)el('p','Replaces: '+e.replaces.map(id=>d.events.find(x=>x.id===id)?.title||id).join(', ')+'. Their linked effects will be removed.',s);
   el('p','Map reveals set independently remain in place. Tracking a transfer records custody; quantities, money and character sheets are unchanged. Other quest objectives are unchanged.',s,'help');
   for(const error of review.errors)el('p',error,s,'story-note');
   if(e.combatAftermath)el('p','Aftermath · '+e.combatAftermath.ending+(e.combatAftermath.pending?' · Still open: '+e.combatAftermath.pending:''),s,'story-note');
   const buttons=el('div',null,s,'button-row');button(buttons,'Back to draft',()=>{draft.withdraw=false;review=null;refresh();});
   button(buttons,draft.withdraw?'Apply withdrawal':'Apply reviewed outcome',()=>{try{const applied=host.applyOutcome?.(draft.id,review,ctx);if(!applied)O().apply(d,draft.id,review,ctx);done(applied?.label||'Applied outcome and linked changes');host.toast('Outcome applied. Undo restores all linked changes.');if(e.combatAftermath)host.aftermathApplied?.(e.combatAftermath);}catch(err){host.toast(err.message);review=O().preview(host.continuity(),draft,{...ctx,story:host.story()});refresh();}}).disabled=!!review.errors.length;
   return;
  }
  s=section(draft.target?'Correct an outcome':'1 · What happened',draft.target?'The approved version stays live while you edit this draft.':'Choose a concrete event. Plans and rumors remain distinct from confirmed play.');
  if(e.combatAftermath){select(s,'Combat ending',e.combatAftermath.ending,globalThis.ECHO_COMBAT_AFTERMATH.endings.map(v=>[v,v[0].toUpperCase()+v.slice(1)]),v=>edit(()=>e.combatAftermath.ending=v));field(s,'Still open · aftermath',e.combatAftermath.pending,v=>e.combatAftermath.pending=v,true,1500);el('p','This is the same fight reference. Corrections replace its approved result; quantities and money change only through their dedicated reviewed tools.',s,'help');}
  field(s,'Outcome title',e.title,v=>e.title=v,false,120);
  select(s,'Outcome category',e.kind,O().kinds.map(x=>[x,x==='custody'?'Item transfer':x]),v=>edit(()=>e.kind=v));
  const row=el('div',null,s,'story-row');field(row,'Session / date',e.session,v=>e.session=v,false,80);
  select(row,'Evidence state',e.status,[['confirmed','Confirmed fact'],['completed','Completed event'],['rumor','Rumor / unverified account'],['planned','Plan — not yet played']],v=>edit(()=>e.status=v));
  field(s,'What happened · private DM record',e.detail,v=>e.detail=v,true);
  field(s,'Source / who confirmed it',e.source,v=>e.source=v,false,250);
  select(s,'Evidence basis',e.basis,['Observed','Claimed','Inferred','Open'].map(x=>[x,x]),v=>edit(()=>e.basis=v));
  s=section('2 · Who knows and who can see it','Knowledge does not publish anything by itself. Select the recipients and review the exact wording below.');
  check(s,'The whole party knows',e.knows.includes('party'),v=>{e.knows=e.knows.filter(x=>x!=='party');if(v)e.knows.push('party');});
  const people=details(s,'Individual characters and NPCs');
  for(const [id,n]of names)if(id!=='party')check(people,n,e.knows.includes(id),v=>{e.knows=e.knows.filter(x=>x!==id);if(v)e.knows.push(id);else e.recipients=e.recipients.filter(x=>x!==id);});
  select(s,'Publish wording to',e.share==='party'?'party':e.recipients.length?'selected':'private',[['private','DM only'],['selected','Selected character phones'],['party','Shared journal · TV and all phones']],v=>edit(()=>{e.share=v==='party'?'party':'private';if(v!=='selected')e.recipients=[];if(v==='selected'&&!e.recipients.length){const p=roster.find(p=>e.knows.includes(p.id));if(p)e.recipients=[p.id];}draft.phoneSelection=v==='selected';}));
  if(e.recipients.length||draft.phoneSelection){for(const p of roster)check(s,`Send private wording to ${p.name}`,e.recipients.includes(p.id),v=>{e.recipients=e.recipients.filter(x=>x!==p.id);if(v)e.recipients.push(p.id);});}
  field(s,'Player-safe title',e.publicTitle,v=>e.publicTitle=v,false,120);field(s,'Player-safe wording',e.playerText,v=>e.playerText=v,true,1800);
  s=section('3 · Optional linked changes','Link only what this outcome actually changes. Completing an objective never completes its parent quest automatically.');
  check(s,'Update the shared party objective with this outcome',Object.prototype.hasOwnProperty.call(e,'tableObjective'),v=>{if(v)e.tableObjective='';else delete e.tableObjective;});if(Object.prototype.hasOwnProperty.call(e,'tableObjective'))field(s,'Next objective · player-safe wording',e.tableObjective,v=>e.tableObjective=v,true,500);
  const quests=details(s,`Quests and objectives (${e.quests.length})`),defs=O().questDefinitions(d);
  button(quests,'Link a quest',()=>{edit(()=>e.quests.push({id:defs[0]?.id||'',state:'reference',stepId:''}));refresh();});
  e.quests.forEach((q,i)=>{const box=el('div',null,quests,'story-card');select(box,`Quest ${i+1}`,q.id,defs.map(q=>[q.id,q.title]),v=>edit(()=>{q.id=v;q.stepId='';q.state='reference';}));const def=defs.find(x=>x.id===q.id);
   select(box,`Objective ${i+1}`,q.stepId||'',[['','Whole quest'],...(def?.steps||[]).map(s=>[s.id,s.title])],v=>edit(()=>{q.stepId=v;q.state='reference';}));select(box,`Result ${i+1}`,q.state,(q.stepId?['reference','open','completed','failed','bypassed']:['reference','planned','active','paused','completed','failed','abandoned']).map(x=>[x,x==='reference'?'Reference only — no status change':x]),v=>edit(()=>q.state=v));button(box,'Remove quest link',()=>{edit(()=>e.quests.splice(i,1));refresh();});});
  const maps=details(s,`Map notes and reveals (${e.markers.length})`);if(markers.length)button(maps,'Link a map marker',()=>{edit(()=>e.markers.push({scene:markers[0].scene,point:markers[0].point,reveal:false}));refresh();});
  e.markers.forEach((m,i)=>{select(maps,`Map marker ${i+1}`,m.scene+'|'+m.point,markers.map(p=>[p.scene+'|'+p.point,p.title]),v=>edit(()=>{[m.scene,m.point]=v.split('|');}));select(maps,`DM marker state ${i+1}`,m.disposition||'',[['','Outcome recorded (after factual approval)'],['unresolved','Unresolved'],['postponed','Postponed'],['outcome-recorded','Outcome recorded']],v=>edit(()=>{if(v)m.disposition=v;else delete m.disposition;}));if(markers.find(p=>p.scene===m.scene&&p.point===m.point)?.revealable===false)el('p','Private source-layout marker · no player reveal',maps,'help');else check(maps,`Reveal marker ${i+1} to the party`,m.reveal,v=>m.reveal=v);button(maps,'Remove marker link',()=>{edit(()=>e.markers.splice(i,1));refresh();});});
  const tracks=details(s,`People, promises and important items (${e.tracks.length})`),existing=C().trackers(d);
  button(tracks,'Add tracked result',()=>{edit(()=>e.tracks.push({kind:'custody',key:'track-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),subject:'',holder:'',owedTo:'',state:'open',note:'',public:false}));refresh();});
  e.tracks.forEach((t,i)=>{const box=el('div',null,tracks,'story-card');select(box,`Update tracked record ${i+1}`,existing.some(x=>x.kind===t.kind&&x.key===t.key)?t.kind+'|'+t.key:'',[['','New tracked record'],...existing.map(x=>[x.kind+'|'+x.key,x.subject])],v=>edit(()=>{if(v){const old=existing.find(x=>x.kind+'|'+x.key===v);Object.assign(t,old,{public:false});}else t.key='track-'+Date.now();}));select(box,`Track type ${i+1}`,t.kind,C().TRACKS.map(x=>[x,x]),v=>edit(()=>t.kind=v));field(box,`Person, item or promise ${i+1}`,t.subject,v=>t.subject=v,false,120);field(box,`Holder / location / responsible person ${i+1}`,t.holder,v=>t.holder=v,false,120);field(box,`Owed to ${i+1}`,t.owedTo,v=>t.owedTo=v,false,120);select(box,`Tracking state ${i+1}`,t.state,['open','resolved','unknown'].map(x=>[x,x]),v=>edit(()=>t.state=v));field(box,`Terms or details ${i+1}`,t.note,v=>t.note=v,true,500);check(box,`Share tracking details ${i+1} when outcome is shared with party`,t.public,v=>t.public=v);button(box,'Remove tracked result',()=>{edit(()=>e.tracks.splice(i,1));refresh();});});
  const relations=details(s,`NPC relationship changes (${e.relationships?.length||0})`);
  el('p','These changes stay in the DM record. They do not teach an NPC anything or publish a journal entry. Tick only fields that changed; an empty updated field explicitly clears its previous value.',relations,'help');
  button(relations,'Add NPC relationship change',()=>{edit(()=>{e.relationships ||= [];e.relationships.push({npcId:story.npcs[0]?.id||'',changes:{},promiseKeys:[]});});refresh();});
  const relationshipLabels={wants:'What they want now',last:'Last interaction with the party',attitude:'Attitude toward the party',next:'Next intended action',whereabouts:'Current whereabouts'};
  const promised=[...new Map([...C().trackers(d),...e.tracks].filter(t=>t.kind==='promise').map(t=>[t.key,t])).values()];
  (e.relationships||[]).forEach((r,i)=>{const box=el('div',null,relations,'story-card');
   const npcOptions=story.npcs.map(n=>[n.id,n.name]);if(r.npcId&&!npcOptions.some(([id])=>id===r.npcId))npcOptions.push([r.npcId,r.npcId+' · missing person']);
   select(box,`NPC for relationship ${i+1}`,r.npcId,npcOptions,v=>edit(()=>r.npcId=v));
   for(const [key,label]of Object.entries(relationshipLabels)){const enabled=Object.prototype.hasOwnProperty.call(r.changes,key);check(box,`Update ${label.toLowerCase()} · relationship ${i+1}`,enabled,v=>{if(v)r.changes[key]='';else delete r.changes[key];});if(enabled){if(key==='attitude')select(box,`${label} · relationship ${i+1}`,r.changes[key],[['','Clear recorded attitude'],...['distant','known','trusted','strained','opposed'].map(x=>[x,x])],v=>edit(()=>r.changes[key]=v));else field(box,`${label} · relationship ${i+1}`,r.changes[key],v=>r.changes[key]=v,true,1500);}}
   const obligations=details(box,`Associated promises · relationship ${i+1}`);el('p','Link only promises this person actually made, received, or witnessed. Add or update the promise under People, promises and important items above.',obligations,'help');
   for(const t of promised)check(obligations,`${t.subject} · ${t.state}`,r.promiseKeys.includes(t.key),v=>{r.promiseKeys=r.promiseKeys.filter(key=>key!==t.key);if(v)r.promiseKeys.push(t.key);});
   for(const key of r.promiseKeys.filter(key=>!promised.some(t=>t.key===key))){el('p',`Unavailable promise reference: ${key}`,obligations,'help');button(obligations,'Remove missing promise '+key,()=>{edit(()=>r.promiseKeys=r.promiseKeys.filter(x=>x!==key));refresh();});}
   button(box,'Remove relationship change '+(i+1),()=>{edit(()=>e.relationships.splice(i,1));refresh();});
  });
  if(e.courtyard){const home=details(s,'Mending Court visit and home changes'),c=e.courtyard,D=globalThis.ECHO_COURTYARD_DATA||{};
   el('p','Record what actually happened. Selecting or staging a scene does not establish a visit, rent payment, friendship, or disturbance. These structured details remain private; only the reviewed player wording is shared.',home,'help');
   const beats=(D.beats||[]).map(b=>[b.id,b.title]);if(c.beatId&&!beats.some(([id])=>id===c.beatId))beats.push([c.beatId,c.beatId+' · unavailable scene']);
   select(home,'Related courtyard scene',c.beatId,[['','No scene link'],...beats],v=>edit(()=>c.beatId=v));
   select(home,'Visit type',c.visit,[['arrival','First arrival'],['return','Expedition return'],['visit','Ordinary visit / home update'],['disturbance','Disturbance actually witnessed']],v=>edit(()=>c.visit=v));
   field(home,'Visit or return key',c.returnKey,v=>c.returnKey=v,false,80);el('p','Use one stable key for the same visit, including corrections and additional notes. A separate key represents a different visit.',home,'help');
   const rows=(key,title,choices)=>{const group=details(home,title);button(group,'Add '+(key==='terms'?'lodging term':'space change'),()=>{edit(()=>c[key].push({id:choices[0]?.[0]||'',value:''}));refresh();});c[key].forEach((row,i)=>{const box=el('div',null,group,'story-card'),options=[...choices];if(row.id&&!options.some(([id])=>id===row.id))options.push([row.id,row.id+' · unavailable reference']);select(box,`${title} reference ${i+1}`,row.id,options,v=>edit(()=>row.id=v));field(box,`${title} result ${i+1}`,row.value,v=>row.value=v,true,1500);el('p','An empty result clears the previously recorded value for this term or space.',box,'help');button(box,'Remove '+(key==='terms'?'term':'space')+' change '+(i+1),()=>{edit(()=>c[key].splice(i,1));refresh();});});};
   const entries=value=>Array.isArray(value)?value:Object.entries(value||{}).map(([id,row])=>typeof row==='object'?{id,...row}:{id,title:String(row)});
   rows('terms','Lodging terms',entries(D.lodging?.terms||D.terms).map(x=>[x.id,x.title||x.label||x.name||x.id]));
   rows('spaces','Shared spaces',entries(D.layout?.spaces||D.layout).map(x=>[x.id,x.title||x.label||x.name||x.id]));
   button(home,'Remove courtyard visit and home changes',()=>{edit(()=>delete e.courtyard);refresh();});
  }
  if(e.downtime){const activity=details(s,'Downtime result and correspondence'),a=e.downtime;
   el('p','Review the actual result and any agreed costs. This outcome records the activity; it does not advance the clock, spend money, transfer stock, grant features, or send an external message. Advance shared elapsed time from Between expeditions and record payments or items with the existing party and shop tools.',activity,'help');
   const plans=story.downtime||{},ledger=host.extras?.()?.settlements;
   const preparation=(plans.activities||[]).find(x=>x.id===a.activityId),proposal=ledger?.jobs?.find(x=>x.id===a.jobId);
   const activityName=preparation?.title;
   for(const [label,value]of [['Proposed cost',preparation?.cost],['Prerequisites',preparation?.requirements||proposal?.requirements],['Uncertainty',preparation?.uncertainty],['Possible consequences',preparation?.consequences||proposal?.proposal]])if(value)el('p',label+': '+value,activity,'help');
   const letterName=(plans.letters||[]).find(x=>x.id===a.letterId)?.subject;
   const jobName=ledger?.jobs?.find(x=>x.id===a.jobId)?.title;
   for(const [label,id,title]of [['Activity',a.activityId,activityName],['Settlement plan',a.jobId,jobName],['Correspondence',a.letterId,letterName],['Town',a.town,ledger?.towns?.find(x=>x.id===a.town)?.name]])if(id)el('p',`${label}: ${title||id}`,activity);
   el('p',`Settlement clock reference: ${a.at} minutes. Links and clock reference remain attached to this original review.`,activity,'help');
   select(activity,'Reviewed activity result',a.result,[['completed','Completed'],['partial','Partial progress'],['failed','Unsuccessful attempt'],['declined','Declined / did not proceed']],v=>edit(()=>a.result=v));
   const duration=field(activity,'Work minutes recorded (blank = unknown)',a.minutes==null?'':String(a.minutes),v=>{const value=v.trim();a.minutes=value===''?null:/^\d+$/.test(value)&&Number.isSafeInteger(Number(value))?Number(value):value;},false,80);
   duration.inputMode='numeric';
   field(activity,'Reviewed cost / payment terms',a.cost,v=>a.cost=v,true,1200);
   el('p','Work minutes can overlap across characters. Record this activity’s effort here; advance only the shared elapsed block once. A recorded fee is not proof of payment unless the actual outcome says it was paid.',activity,'help');
  }
  globalThis.ECHO_MYSTERY_UI?.outcomeFields(s,{el,button,field,select,check,details,edit,refresh},e,d,story);
  const refs=details(s,'Linked originals and duplicate records');
  const originals=['evidence','journal','wrapUps'].flatMap(kind=>(story[kind]||[]).map(n=>({kind,id:n.id,title:n.title||n.sessionName||n.id})));
  for(const ref of e.origins){el('p','Original: '+(originals.find(x=>x.kind===ref.kind&&x.id===ref.id)?.title||ref.id),refs);button(refs,'Unlink original '+ref.id,()=>{edit(()=>e.origins=e.origins.filter(x=>x!==ref));refresh();});}
  select(refs,'Link an existing note','',[['','Choose a preserved note'],...originals.filter(n=>!e.origins.some(r=>r.kind===n.kind&&r.id===n.id)).map(n=>[n.kind+'|'+n.id,n.kind+' · '+n.title])],v=>{if(v)edit(()=>{const [kind,id]=v.split('|');e.origins.push({kind,id});});});
  select(refs,'Replace a duplicate outcome','',[['','Choose only a duplicate of this same outcome'],...O().effective(d).filter(x=>x.id!==e.id&&!e.replaces.includes(x.id)).map(x=>[x.id,x.title])],v=>{if(v)edit(()=>e.replaces.push(v));});
  for(const id of e.replaces)button(refs,'Keep separate: '+(d.events.find(x=>x.id===id)?.title||id),()=>{edit(()=>e.replaces=e.replaces.filter(x=>x!==id));refresh();});
  const history=details(s,'Previous approved versions');for(const r of [...o.revisions].reverse().filter(r=>r.eventId===e.id))el('p',`${r.at}: ${r.before?.detail||'New record'} → ${r.after?.approved?r.after.detail:'Approval withdrawn'}`,history);
  const controls=section('Ready to review');button(controls,'Preview linked changes',()=>{review=O().preview(d,draft,ctx);refresh();});button(controls,'Save draft & return',()=>{selected='';review=null;save('Saved outcome draft');refresh();});button(controls,'Discard this draft',()=>{o.drafts=o.drafts.filter(x=>x.id!==draft.id);done('Discarded outcome draft');});
  if(draft.target&&d.events.find(x=>x.id===draft.target)?.approved)button(controls,'Review withdrawal of approval',()=>{draft.withdraw=true;review=O().preview(d,draft,ctx);refresh();});
 }
 globalThis.ECHO_OUTCOMES_UI={render,start,fromNote};
})();
