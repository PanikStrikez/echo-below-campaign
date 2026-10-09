/* Private intervention preparation, actual-evidence review and open epilogues. */
(() => {
 'use strict';
 let tab='review',approachId='',requirementId='',sceneId='',categoryId='';
 const expanded=new Set(),drafts=new WeakMap();
 const engine=()=>globalThis.ECHO_FINALE;
 function open(id){
  if(engine().approaches().some(a=>a.id===id)){approachId=id;requirementId='';tab='review';}
  else if(engine().scenes().some(s=>s.id===id)){sceneId=id;tab='scenes';}
  else if(engine().data().epilogues?.some(e=>e.id===id)){categoryId=id;tab='epilogue';}
  globalThis.ECHO_STORY_UI.open('finale');
 }
 function render(root,host){
  const A=engine(),data=A.data(),story=host.story(),d=host.continuity(),p=A.ensure(story),actual=A.actual(d),roster=host.roster();
  if(!drafts.has(story))drafts.set(story,{reviews:{},results:{},plan:null});
  const local=drafts.get(story),refresh=()=>globalThis.ECHO_STORY_UI.render(true),save=label=>host.save(label);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;parent.append(n);return n;};
  const button=(parent,label,fn)=>{const b=el('button',label,parent);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn();}catch(e){host.toast(e.message);}finally{if(b.isConnected)b.disabled=false;}};return b;};
  const section=(title,note,parent=root)=>{const s=el('section',null,parent,'story-section');el('h3',title,s);if(note)el('p',note,s,'help');return s;};
  const details=(parent,title,key=title)=>{const box=el('details',null,parent,'story-card');el('summary',title,box);box.open=expanded.has(key);box.ontoggle=()=>{if(box.isConnected)box.open?expanded.add(key):expanded.delete(key);};return box;};
  const select=(parent,label,value,choices,fn)=>{const l=el('label',label,parent,'story-field'),s=el('select',null,l);s.setAttribute('aria-label',label);for(const [id,name] of choices){const o=el('option',name,s);o.value=id;}s.value=value;s.onchange=()=>fn(s.value);return s;};
  const field=(parent,label,value,fn,limit=2400)=>{const l=el('label',label,parent,'story-field'),i=el('textarea',null,l);i.rows=3;i.maxLength=limit;i.value=value||'';i.setAttribute('aria-label',label);i.oninput=()=>fn(i.value);return i;};
  const check=(parent,label,value,fn)=>{const l=el('label',null,parent,'story-field'),i=el('input',null,l);i.type='checkbox';i.checked=value;el('span',label,l);i.onchange=()=>fn(i.checked);return i;};
  const name=id=>id==='party'?'Whole party':roster.find(x=>x.id===id)?.name||story.npcs?.find(x=>x.id===id)?.name||id;
  const title=id=>A.approaches().find(a=>a.id===id)?.title||id;
  const label=key=>key.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());
  const lines=(parent,heading,values)=>{if(values==null||values===''||(Array.isArray(values)&&!values.length))return;if(heading)el('h4',heading,parent);for(const v of Array.isArray(values)?values:[values]){if(typeof v==='string'||typeof v==='number')el('p',String(v),parent);else if(v&&typeof v==='object'){const sub=details(parent,v.title||v.name||'Details');for(const [key,value]of Object.entries(v))if(!['id','title','name'].includes(key))lines(sub,label(key),value);}}};
  const warnings=(parent,items)=>{for(const issue of items||[])el('p',issue,parent,'story-note');};
  const outcomeLabel=e=>`${e.title} · ${e.status} / ${e.basis} · ${(e.knows||[]).map(name).join(', ')||'DM only'}`;
  function record(parent,e){
   if(!e){el('p','This outcome is unavailable. Choose a current approved record or remove the link.',parent,'story-note');return;}
   el('h4',e.title,parent);el('p',e.detail,parent);el('p',`${e.status} · ${e.basis} · Source: ${e.source||'Not recorded'}`,parent,'help');
   el('p','Recorded knowledge: '+((e.knows||[]).map(name).join(', ')||'DM only'),parent,'help');
   if(e.basis!=='Observed')el('p','This record retains its '+e.basis.toLowerCase()+' basis. A linked claim or inference is not automatically a demonstrated result.',parent,'help');
   button(parent,'Review / correct · '+e.title,()=>globalThis.ECHO_OUTCOMES_UI.start(host,{},e.id));
  }
  function sources(parent,rows,key){
   if(!rows?.length){el('p','No actual evidence is linked yet.',parent,'help');return;}
   for(const row of rows){const box=details(parent,row.event?.title||'Unavailable evidence',key+'-'+row.ref?.eventId);record(box,row.event);warnings(box,row.issues);if(row.event&&!row.partyKnown)el('p','No player character is recorded as knowing this evidence. This private link shares nothing.',box,'story-note');else if(row.event&&!row.wholeParty)el('p','Knowledge is limited to the named people. It is not recorded as known to the whole party.',box,'help');}
  }
  function sourceEditor(parent,eventIds,changed,key){
   if(!actual.length)el('p','No approved actual history is available. Record what happened through Outcome review before supporting a prerequisite or linking an epilogue.',parent,'help');
   select(parent,'Add an approved actual outcome','',[['','Choose a recorded outcome'],...actual.filter(e=>!eventIds.includes(e.id)).map(e=>[e.id,outcomeLabel(e)])],id=>{if(id){eventIds.push(id);changed();}});
   for(const id of eventIds){const e=actual.find(e=>e.id===id),box=details(parent,e?.title||'Unavailable outcome: '+id,key+'-'+id);record(box,e);button(box,'Remove this draft link',()=>{eventIds.splice(eventIds.indexOf(id),1);changed();});}
   el('p','Choose the specific observations, testimony or tests that bear on this decision. Saving accepts the current versions shown here; it does not change their basis, audience or quest progress.',parent,'help');
  }
  function reviewRoute(parent){
   const routes=A.approaches();if(!routes.some(a=>a.id===approachId))approachId=p.primary||routes[0]?.id;
   select(parent,'Approach to review',approachId,routes.map(a=>[a.id,a.title]),id=>{approachId=id;requirementId='';refresh();});
   const r=A.assessRoute(story,d,approachId),a=r.approach;if(!a)return;
   el('h4',a.title,parent);el('p',a.summary,parent);button(parent,'Open this approach in session workspace',()=>globalThis.ECHO_QUEST_PREP_UI.openQuest(a.questId));
   const established=r.requirements.filter(x=>x.established).length;
   el('p',`${established} of ${r.requirements.length} prerequisites have a supporting DM review and a current observation known to at least one player character. This is an evidence summary; the outcome remains a table decision.`,parent,'story-note');
   const checklist=details(parent,'All prerequisites at a glance','finale-checklist-'+a.id);
   for(const x of r.requirements){el('p',x.requirement.label+' — '+x.label,checklist);warnings(checklist,x.issues);}
   if(!r.requirements.some(x=>x.requirement.id===requirementId))requirementId=r.requirements.find(x=>!x.established)?.requirement.id||r.requirements[0]?.requirement.id||'';
   if(r.requirements.length){
    select(parent,'Prerequisite to review',requirementId,r.requirements.map(x=>[x.requirement.id,x.requirement.label]),id=>{requirementId=id;refresh();});
    const item=r.requirements.find(x=>x.requirement.id===requirementId),condition=item.requirement;
    el('p',condition.detail,parent);el('p','Saved assessment: '+item.label,parent,'story-note');if(item.saved?.note)el('p','Review reason and limits: '+item.saved.note,parent);warnings(parent,item.issues);
    const current=details(parent,'Saved supporting records','finale-saved-'+condition.id);sources(current,item.sources,'finale-support-'+condition.id);
    if(!local.reviews[condition.id])local.reviews[condition.id]={assessment:item.saved?.assessment||'unreviewed',note:item.saved?.note||'',eventIds:(item.saved?.refs||[]).map(ref=>ref.eventId)};
    const edit=local.reviews[condition.id],editor=details(parent,'Edit this prerequisite review','finale-edit-'+condition.id);
    select(editor,'DM assessment',edit.assessment,[['unreviewed','Not reviewed'],['supported','Supported by the linked evidence'],['uncertain','Uncertain / still speculative'],['not-met','Not currently met']],value=>edit.assessment=value);
    field(editor,'Reason, limits and what would change this assessment',edit.note,value=>edit.note=value);
    sourceEditor(editor,edit.eventIds,refresh,'finale-edit-source-'+condition.id);
    const actions=el('div',null,editor,'button-row');
    button(actions,'Save prerequisite review',()=>{A.saveReview(story,d,condition.id,clone(edit));delete local.reviews[condition.id];save('Reviewed intervention prerequisite');refresh();});
    button(actions,'Discard unsaved prerequisite edits',()=>{delete local.reviews[condition.id];refresh();});
    el('p','Supported requires a reason and a linked source. Changed or withdrawn sources, knowledge held only by the DM, and claims or inferences remain visible as limits; selecting Supported never makes an event happen.',editor,'help');
    if(condition.conclusionIds?.length){const evidence=details(parent,'Related evidence questions','finale-condition-questions-'+condition.id);for(const id of condition.conclusionIds){const c=globalThis.ECHO_MYSTERY?.conclusions().find(c=>c.id===id);button(evidence,c?.title||id,()=>globalThis.ECHO_MYSTERY_UI.open(id));}}
   }
   const guidance=details(parent,'Allies, uncertainty, costs and failure conditions','finale-guidance-'+a.id);
   for(const ally of a.allies||[]){const box=details(guidance,ally.name);for(const key of ['role','condition','limits'])lines(box,label(key),ally[key]);}
   for(const [key,heading]of [['uncertainties','Still uncertain'],['costs','Potential costs'],['failures','Failure and stop conditions'],['alternatives','If this approach is unavailable']])lines(guidance,heading,a[key]);
   if(a.evidence?.length){const ev=details(guidance,'What supporting evidence must establish');for(const e of a.evidence){const c=globalThis.ECHO_MYSTERY?.conclusions().find(c=>c.id===e.conclusionId);el('h4',c?.title||e.conclusionId,ev);lines(ev,'Use',e.use);lines(ev,'Limit',e.limit);button(ev,'Inspect evidence · '+(c?.title||e.conclusionId),()=>globalThis.ECHO_MYSTERY_UI.open(e.conclusionId));}}
   const compatible=details(parent,'Compatible approaches and prepared scenes','finale-compatible-'+a.id);
   for(const id of a.compatible||[])button(compatible,'Consider · '+title(id),()=>{approachId=id;requirementId='';refresh();});
   for(const id of a.sceneIds||[]){const s=A.scenes().find(x=>x.id===id);if(s)button(compatible,'Scene · '+s.title,()=>{tab='scenes';sceneId=id;refresh();});}
  }
  let s=section('Intervention & finale','Private DM preparation. Build a plan from reviewed actual evidence, keep alternatives available, and let play decide the ending.');
  const nav=el('div',null,s,'button-row');for(const [id,text]of [['review','Review'],['scenes','Run scenes'],['epilogue','Epilogue']])button(nav,text,()=>{tab=id;refresh();}).setAttribute('aria-pressed',String(tab===id));
  const controls=details(s,'History and preparation controls');
  const history=el('div',null,controls,'button-row');
  button(history,'Undo finale preparation',()=>{if(A.restore(story)){drafts.delete(story);save('Undid finale preparation');refresh();}}).disabled=!p.undo?.length;
  button(history,'Redo finale preparation',()=>{if(A.restore(story,true)){drafts.delete(story);save('Redid finale preparation');refresh();}}).disabled=!p.redo?.length;
  button(controls,'Approved outcome history & corrections',()=>globalThis.ECHO_STORY_UI.open('outcomes'));
  button(controls,'Evidence & research',()=>globalThis.ECHO_MYSTERY_UI.open());
  el('p','Preparation undo affects this private plan. Use Outcome history to correct actual events or publication. Staged session notes remain editable in Scene notes.',controls,'help');
  if(data.principles?.length){const guidance=details(controls,'Finale preparation guidance','finale-principles');lines(guidance,'',data.principles);}
  if(tab==='review'){
   const plan=details(s,'Primary plan, alternatives and table briefing','finale-plan');
   if(!local.plan)local.plan={primary:p.primary||'',fallbacks:[...(p.fallbacks||[])],briefs:clone(p.briefs||{activation:'',threat:'',limits:''}),notes:p.notes||''};
   const edit=local.plan;
   select(plan,'Primary approach',edit.primary,[['','Not chosen'],...A.approaches().map(a=>[a.id,a.title])],id=>{edit.primary=id;edit.fallbacks=edit.fallbacks.filter(x=>x!==id);refresh();});
   el('h4','Alternative approaches to keep available',plan);
   el('p','Some alternatives require separate equipment or a different sequence; review each approach’s compatibility before combining them.',plan,'help');
   for(const a of A.approaches().filter(a=>a.id!==edit.primary))check(plan,a.title,edit.fallbacks.includes(a.id),checked=>{edit.fallbacks=edit.fallbacks.filter(x=>x!==a.id);if(checked)edit.fallbacks.push(a.id);});
   field(plan,'Activation briefing · what is actually ready and who controls it',edit.briefs.activation,value=>edit.briefs.activation=value);
   field(plan,'Threat briefing · people, places and warning signs',edit.briefs.threat,value=>edit.briefs.threat=value);
   field(plan,'Limits briefing · boundaries, abort signals and unknowns',edit.briefs.limits,value=>edit.briefs.limits=value);
   field(plan,'Private planning notes',edit.notes,value=>edit.notes=value);
   const actions=el('div',null,plan,'button-row');button(actions,'Save intervention plan',()=>{A.updatePlan(story,clone(edit));local.plan=null;save('Saved private intervention plan');refresh();});button(actions,'Discard unsaved plan edits',()=>{local.plan=null;refresh();});
   el('p','This records a proposal. It does not spend resources, recruit an ally, begin activation, publish a briefing, or complete a quest.',plan,'help');
   s=section('Evidence before commitment','Review one approach and one prerequisite at a time. Party knowledge, source quality and uncertainty remain visible.');reviewRoute(s);return;
  }
  if(tab==='scenes'){
   s=section('Prepared finale scenes','Stage the scene you need as private notes. Choose and review any TV visual separately.');
   const all=A.scenes();if(!all.length){el('p','No finale scenes are available.',s);return;}if(!all.some(x=>x.id===sceneId))sceneId=all[0].id;
   select(s,'Finale scene',sceneId,all.map(x=>[x.id,x.title]),id=>{sceneId=id;refresh();});const scene=all.find(x=>x.id===sceneId);
   lines(s,'Say aloud only when reached',scene.read);
   const running=details(s,'Run this scene · choices and branches','finale-scene-'+scene.id);
   for(const [key,heading]of [['run','Run'],['checks','Checks and alternatives'],['choices','Player choices'],['consequences','Possible consequences'],['fallback','If unavailable or declined']])lines(running,heading,scene[key]);
   lines(running,'Source',scene.source);
   const actions=el('div',null,s,'button-row');button(actions,'Add this scene to current session notes',()=>{const count=A.stageScene(story,host.sessionId(),scene.id,host.scenes().map(x=>x.id));save('Staged private finale scene');host.toast(count?'Scene notes added. The TV has not changed.':'These notes are already present; your edits were kept.');refresh();});
   if(host.beats().some(b=>b.id===scene.id))button(actions,'Open these live scene notes',()=>{globalThis.ECHO_STORY_UI.close();host.selectBeat(scene.id);});
   if(scene.evidenceIds?.length){const clues=details(s,'Related evidence questions','finale-scene-evidence-'+scene.id);for(const id of scene.evidenceIds){const c=globalThis.ECHO_MYSTERY?.conclusions().find(c=>c.id===id);button(clues,c?.title||id,()=>globalThis.ECHO_MYSTERY_UI.open(id));}}
   const operations=section('People and apparatus','These are options and planning references. Establish the actual route, permissions, conditions and stakes at the table.');
   for(const [key,heading]of [['warnings','Warning signs'],['residentDecisions','Resident decisions'],['routes','Evacuation and return routes'],['apparatusObjectives','Apparatus objectives'],['negotiations','Negotiations'],['encounterBranches','Encounter branches']]){
    const box=details(operations,heading,'finale-operations-'+key);for(const item of data[key]||[]){const card=details(box,item.title,'finale-operation-'+item.id);for(const [property,value]of Object.entries(item))if(!['id','title'].includes(property))lines(card,label(property),value);}
   }
   const rules=details(operations,data.halasterRules?.title||'Halaster and the apparatus have separate outcomes','finale-halaster-rules');
   if(data.halasterRules){lines(rules,'Published rule',data.halasterRules.summary);lines(rules,'Limits and adjudication',data.halasterRules.limits);lines(rules,'Source',data.halasterRules.source);if(data.halasterRules.printedPage)el('p','Printed page '+data.halasterRules.printedPage,rules,'help');if(host.openPrinted)button(rules,'Open Halaster’s published stat block',()=>host.openPrinted('madMage',310));}
   el('p','Review Halaster’s fate separately from the apparatus, rescued people and preserved work. A combat defeat alone does not establish permanent death or resolve the experiment.',rules,'story-note');
   return;
  }
  s=section('Epilogue from actual outcomes','Choose an aspect of the ending, link what was actually approved, then use the questions to invite the players’ answers.');
  const ends=A.epilogue(story,d);if(!ends.length){el('p','No epilogue categories are available.',s);return;}if(!ends.some(x=>x.id===categoryId))categoryId=ends[0].id;
  select(s,'Epilogue topic',categoryId,ends.map(x=>[x.id,x.title]),id=>{categoryId=id;refresh();});const end=ends.find(x=>x.id===categoryId);
  el('p',end.missing?'No current confirmed observation has been linked for this topic. Leave its outcome open; claims, inferences and stale records remain context below.':'The current confirmed observations below are the starting point. Their limits and unanswered questions remain part of the epilogue.',s,'story-note');
  const approved=details(s,'Current confirmed observations','finale-epilogue-sources-'+end.id);sources(approved,end.established,'finale-epilogue-record-'+end.id);
  if(end.unresolved?.length){const unresolved=details(s,'Unresolved claims, inferences or sources needing review','finale-epilogue-unresolved-'+end.id);sources(unresolved,end.unresolved,'finale-epilogue-unresolved-record-'+end.id);}
  for(const row of end.records||[])warnings(s,row.issues);
  if(!local.results[end.id])local.results[end.id]=(p.results?.[end.id]||[]).map(ref=>ref.eventId);
  const editor=details(s,'Choose or correct the outcome links','finale-epilogue-edit-'+end.id),ids=local.results[end.id];sourceEditor(editor,ids,refresh,'finale-result-'+end.id);
  const actions=el('div',null,editor,'button-row');button(actions,'Save epilogue links',()=>{A.linkResult(story,d,end.id,[...ids]);delete local.results[end.id];save('Linked actual finale outcomes');refresh();});button(actions,'Discard unsaved epilogue links',()=>{delete local.results[end.id];refresh();});
  button(s,'Record an actual outcome for this topic',()=>globalThis.ECHO_OUTCOMES_UI.start(host,A.resultDraft(end.id)));
  lines(s,'Questions to answer after play',end.prompts);
  el('p','These questions choose no ending and publish no epilogue. Record the answers, custody decisions and future commitments in Outcome review, with their actual witnesses and intended audience.',s,'help');
 }
 globalThis.ECHO_FINALE_UI={open,render};
})();
