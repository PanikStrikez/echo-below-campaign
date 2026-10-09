(() => {
 'use strict';
 let selected='echo-below',filter='now',query='',previewAudience='tv',previewStatus='active';
 function render(root,host){const A=globalThis.ECHO_QUESTS,d=host.continuity(),g=d.questGuide,refresh=()=>globalThis.ECHO_STORY_UI.render();
  const el=(tag,text,p,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;p.append(n);return n;};
  const button=(p,text,fn)=>{const n=el('button',text,p);n.type='button';n.addEventListener('click',fn);return n;};
  const mutate=(fn,label)=>{globalThis.ECHO_CONTINUITY.checkpoint(d);try{fn();host.save(label);refresh();}catch(e){globalThis.ECHO_CONTINUITY.restore(d);host.toast(e.message);refresh();}};
  const select=(p,label,value,choices,fn)=>{const l=el('label',label,p,'story-field'),s=el('select',null,l);s.setAttribute('aria-label',label);for(const [v,t]of choices){const o=el('option',t,s);o.value=v;}s.value=value;s.addEventListener('change',()=>fn(s.value));return s;};
  const field=(p,label,value,multi=false)=>{const l=el('label',label,p,'story-field'),n=el(multi?'textarea':'input',null,l);n.value=value||'';n.maxLength=multi?2400:500;if(multi)n.rows=4;return n;};
  const section=(title,note)=>{const s=el('section',null,root,'story-section');el('h3',title,s);if(note)el('p',note,s,'help');return s;};
  let s=section('Quest guide','DM-only plans. Choose a lead, record what happened, then review exactly what players may see. No quest moves the map or advances the story automatically.');
  if(!g.enabled){button(s,'Use the Echo Below quest guide in this campaign',()=>mutate(()=>g.enabled=true,'Enabled quest guide'));return;}
  const toolbar=el('div',null,s,'button-row');
  button(toolbar,'Undo quest change',()=>{if(globalThis.ECHO_CONTINUITY.restore(d)){host.save('Undo quest change');refresh();}}).disabled=!d.undo.length;
  button(toolbar,'Redo',()=>{if(globalThis.ECHO_CONTINUITY.restore(d,true)){host.save('Redo quest change');refresh();}}).disabled=!d.redo.length;
  if(g.contentProfile==='blank'){const create=el('details',null,s);el('summary','Add a quest',create);const name=field(create,'Quest name',''),goal=field(create,'Private objective','',true),kind=select(create,'Quest audience','side',[['main','Main · TV'],['side','Side · shared phones'],['character','Character · owner phone']],()=>{}),owner=select(create,'Quest owner','',[['','Choose a character'],...Object.values(host.expeditionContext?.().state?.party||{}).filter(p=>p.id?.startsWith('pc-')).map(p=>[p.id,p.name])],()=>{});button(create,'Create private quest',()=>mutate(()=>{if(!name.value.trim()||!goal.value.trim())throw Error('Add a name and objective.');if(kind.value==='main'&&g.customQuests.some(q=>q.kind==='main'))throw Error('Edit the existing main quest.');if(kind.value==='character'&&!owner.value)throw Error('Choose a character. Add them in Party first if the list is empty.');selected='custom-'+Date.now();g.customQuests.push({id:selected,title:name.value,goal:goal.value,kind:kind.value,owner:kind.value==='character'?owner.value:'',act:'custom',steps:[],requires:[],leads:[],dm:'',reward:'',fallback:'',source:'Custom campaign'});A.record(g,selected).status='active';},'Created private quest'));}
  if(g.contentProfile!=='blank') select(s,'Current act',g.currentAct,globalThis.ECHO_QUEST_CATALOG.acts.map(a=>[a.id,a.title]),v=>mutate(()=>{g.currentAct=v;A.log(g,'act-'+v,'Selected current act; no objectives completed automatically.');},'Changed current act'));
  const leads=section('Next leads','Up to six suggestions. Pins stay near the top; you can take another path.');
  const leadButtons=el('div',null,leads,'button-row');
  for(const q of A.recommendations(d)){const b=button(leadButtons,q.title,()=>{selected=q.id;refresh();});b.title=q.steps.find(x=>x.state==='open')?.title||'Review the outcome';b.setAttribute('aria-pressed',String(q.id===selected));}
  s=section('Browse quests');
  select(s,'Show',filter,[['now','Current act and active quests'],['main','Main quest'],['act','Act quests'],['side','Side quests'],['character','Character quests'],['all','All quests'],['finished','Resolved quests']],v=>{filter=v;refresh();});
  const search=field(s,'Find a quest',query);search.addEventListener('change',()=>{query=search.value;refresh();});
  const all=A.cards(d),rows=all.filter(q=>(filter==='all'||filter==='now'&&(q.act===g.currentAct||q.status==='active'||q.record.pinned)||filter==='finished'&&['completed','failed','abandoned'].includes(q.status)||q.kind===filter)&&`${q.title} ${q.goal} ${q.owner}`.toLowerCase().includes(query.toLowerCase()));
  select(s,`${rows.length} quests`,rows.some(q=>q.id===selected)?selected:'',[['','Choose a quest'],...rows.map(q=>[q.id,`${q.title} · ${q.status}`])],v=>{if(v){selected=v;refresh();}});
  const q=all.find(q=>q.id===selected);if(!q)return;const r=A.record(g,q.id);
  s=section(q.title,`${q.kind} · ${q.status}${q.owner?' · '+q.owner.replace('pc-',''):''} · ${q.steps.filter(x=>x.state!=='open').length}/${q.steps.length} objectives reviewed`);
  el('p',q.goal,s);if(globalThis.ECHO_QUEST_PREP_UI)button(s,'Prepare a session from this quest',()=>globalThis.ECHO_QUEST_PREP_UI.openQuest(q.id));button(s,r.pinned?'Unpin from next leads':'Pin to next leads',()=>mutate(()=>r.pinned=!r.pinned,'Changed quest pin'));
  if(q.requires.length)el('p','Suggested preparation: '+q.requires.map(id=>all.find(q=>q.id===id)?.title||id).join(', ')+'. The DM may proceed out of order.',s,'help');
  if(q.legacy?.events.length){const e=el('details',null,s);el('summary','Existing campaign evidence',e);for(const event of q.legacy.events)el('p',`${event.approved?'Approved':'Draft'} · ${event.status}: ${event.title} — ${event.detail}`,e);}
  for(const step of q.steps){const box=el('details',null,s,'story-card');el('summary',`${step.title} · ${step.state}`,box);el('p',step.guide,box);if(step.result)el('p',`Recorded: ${step.result} (${step.source})`,box);
   const status=select(box,'Objective result',step.state,A.stepStates.map(x=>[x,x]),()=>{}),result=field(box,'What happened / next lead',step.result,true),source=field(box,'Source, session or witness',step.source||host.sessionName());
   button(box,'Record this objective',()=>{if(globalThis.ECHO_OUTCOMES_UI){globalThis.ECHO_OUTCOMES_UI.start(host,{kind:'quest',title:q.title+' · '+step.title,detail:result.value,source:source.value,status:'confirmed',basis:'Observed',quests:[{id:q.id,stepId:step.id,state:status.value}]});return;}mutate(()=>A.change(d,q.id,'step',{id:step.id,state:status.value,result:result.value},source.value),'Recorded quest objective');});
  }
  const detail=el('details',null,s);el('summary','DM preparation, alternatives and rewards',detail);
  for(const [label,text]of [['Opening leads',q.leads.join('\n')],['Private preparation',q.dm],['Reward / consequence',q.reward],['If declined or missed',q.fallback],['Source',q.source]]){el('h4',label,detail);el('p',text,detail);}
  const links=el('div',null,detail,'button-row');button(links,'Open session runbook',()=>globalThis.ECHO_STORY_UI.open('runbook'));button(links,'Open NPCs',()=>globalThis.ECHO_STORY_UI.open('people'));button(links,'Open Nine sites',()=>globalThis.ECHO_STORY_UI.open('sites'));button(links,'Open dungeon reference',()=>globalThis.ECHO_STORY_UI.open('dungeon'));
  const notes=field(detail,'Private session notes',r.notes,true);notes.maxLength=6000;button(detail,'Save private notes',()=>mutate(()=>r.notes=notes.value.slice(0,6000),'Saved quest notes'));
  const outcome=el('details',null,s);el('summary','Change quest status / close quest',outcome);
  const state=select(outcome,'New status',q.status,A.statuses.map(x=>[x,x]),()=>{}),result=field(outcome,'Actual outcome or reason',r.outcome,true),source=field(outcome,'Source / session',host.sessionName());
  el('p','Open objectives do not prevent an alternate resolution. Explain it here. Closing a quest does not award loot, move tokens, reveal locations or advance the act.',outcome,'help');
  button(outcome,globalThis.ECHO_OUTCOMES_UI?'Review quest outcome':'Apply reviewed status',()=>{if(globalThis.ECHO_OUTCOMES_UI){globalThis.ECHO_OUTCOMES_UI.start(host,{kind:'quest',title:q.title,detail:result.value,source:source.value,status:'confirmed',basis:'Observed',quests:[{id:q.id,state:state.value}]});return;}if(!result.value.trim()||!source.value.trim()){host.toast('Add the actual outcome and source.');return;}if(!confirm(`Set “${q.title}” to ${state.value}?\n\n${result.value}\n\nNo rewards or next acts will be applied automatically. Published wording will be withdrawn until reviewed.`))return;mutate(()=>{
   A.change(d,q.id,'status',{status:state.value,result:result.value},source.value);
   if(['completed','failed'].includes(state.value))d.events.push(globalThis.ECHO_CONTINUITY.event({id:`quest-result-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,title:`Quest outcome: ${q.title}`,detail:result.value,source:source.value,session:host.sessionName(),status:'completed',basis:'Observed',approved:true,approvedAt:new Date().toISOString(),share:'private',quests:q.legacy?[{id:q.legacy,state:state.value}]:[]}));
  },'Recorded reviewed quest outcome');});
  if(q.kind==='act'){el('p','Act quests guide the DM. Publish the party’s current objective through the main quest.',s,'help');return;}
  const destination=q.kind==='main'?'TV':q.kind==='character'?'this character’s phone':'party phones';
  s=section('Player preview · '+destination,'Only this reviewed title and text are sent. Future chapters, DM notes, sources and rewards stay private. Changes to progress withdraw the published version until you review it again.');
  const title=field(s,'Player-safe title',r.draft.title),text=field(s,'Current objective and known leads',r.draft.text,true);title.maxLength=120;
  const preview=el('div',null,s,'story-card');preview.setAttribute('aria-live','polite');const paint=()=>{preview.replaceChildren();el('h4',title.value||'Add a player-safe title',preview);el('p',text.value||'Write only what this audience knows.',preview);};title.addEventListener('input',paint);text.addEventListener('input',paint);paint();
  const store=()=>{r.draft={title:title.value.slice(0,120),text:text.value.slice(0,2400)};};
  button(s,'Save private draft',()=>mutate(()=>{store();r.published=null;},'Saved private quest draft'));
  const publish=audience=>{if(!title.value.trim()||!text.value.trim()){host.toast('Add a player-safe title and objective.');return;}if(!confirm(`Publish to ${destination}:\n\n${title.value}\n${text.value}`))return;mutate(()=>{store();A.publication(d,q.id,audience);},'Published reviewed quest wording');};
  button(s,q.kind==='main'?'Show main quest on TV':q.kind==='character'?'Send only to this character’s phone':'Publish side quest to party phones',()=>publish(q.kind==='character'?q.owner:'party'));
  if(r.published){el('p',`Published to ${destination} · ${r.published.at}`,s);button(s,q.kind==='main'?'Hide main quest from TV':'Withdraw published quest',()=>mutate(()=>{r.published=null;A.log(g,q.id,'Withdrew published quest.');},'Withdrew quest publication'));}
  const history=section('Recent quest changes');for(const h of [...g.history].reverse().slice(0,12))el('p',`${h.at.slice(0,16)} · ${all.find(q=>q.id===h.quest)?.title||h.quest}: ${h.text} · ${h.source}`,history);
 }
 function renderPreview(root,host){
  const A=globalThis.ECHO_QUESTS,d=host.continuity();
  const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;parent.append(n);return n;};
  const button=(p,title,fn)=>{const b=el('button',title,p);b.type='button';b.addEventListener('click',fn);return b;};
  const section=(title)=>{const s=el('section',null,root,'story-section');el('h3',title,s);return s;};
  const edit=id=>{selected=id;globalThis.ECHO_STORY_UI.open('quests');};
  let s=section('Quests · what players see');
  el('p','Preview the published quest wording sent to each screen. Switching this preview does not change the TV or publish anything. Connection health is shown separately on the DM screen.',s,'help');
  const nav=el('div',null,s,'button-row');
  const roster=host.roster?.()||[];
  const people=globalThis.ECHO_QUEST_CATALOG.quests.filter(q=>q.kind==='character').map(q=>({id:q.owner,name:roster.find(p=>p.id===q.owner)?.name||q.owner.replace('pc-','').replace(/^./,c=>c.toUpperCase())}));
  const audiences=[['tv','TV · main quest'],['party','Phones · shared quests'],...people.map(p=>[p.id,p.name+'’s phone'])];
  if(!audiences.some(([id])=>id===previewAudience))previewAudience='tv';
  for(const [id,label]of audiences){const b=button(nav,label,()=>{previewAudience=id;globalThis.ECHO_STORY_UI.render();});b.setAttribute('aria-pressed',String(id===previewAudience));}
  const finished=q=>['completed','failed','abandoned'].includes(q.state);
  const matches=q=>previewStatus==='completed'?finished(q):!finished(q);
  const visible=previewAudience==='tv'?[A.tvQuest(d)].filter(Boolean):[...A.phoneQuests(d),...(previewAudience==='party'?[]:A.privateClues(d,previewAudience))];
  const tabs=el('div',null,s,'button-row');tabs.setAttribute('aria-label','Quest status');
  for(const [id,label]of [['active','Active'],['completed','Completed']]){const count=visible.filter(q=>id==='completed'?finished(q):!finished(q)).length;const b=button(tabs,`${label} (${count})`,()=>{previewStatus=id;globalThis.ECHO_STORY_UI.render();});b.setAttribute('aria-pressed',String(previewStatus===id));}
  el('p',previewStatus==='completed'?'Finished quests retain their recorded outcome, including failed or abandoned quests.':'Current published quests, including paused quests. Unpublished plans remain in the DM quest guide.',s,'help');
  if(globalThis.ECHO_OUTCOMES_UI)button(s,'Record an outcome',()=>globalThis.ECHO_STORY_UI.open('outcomes'));
  if(globalThis.ECHO_QUEST_PREP_UI)button(s,'Quest preparation workspace',()=>globalThis.ECHO_STORY_UI.open('quest-workspace'));
  button(s,'Manage quests & publication',()=>globalThis.ECHO_STORY_UI.open('quests'));
  if(previewAudience==='tv'){
   s=section('On the TV');const published=A.tvQuest(d),q=published&&matches(published)?published:null;
   if(q){const card=el('article',null,s,'story-card quest-screen-preview');el('small','MAIN QUEST',card);el('h2',q.title,card);el('p',q.text,card);button(s,'Edit main quest',()=>edit('echo-below'));}
   else {el('p',`No ${previewStatus} main quest is currently published to the TV.`,s);button(s,'Prepare the main quest',()=>edit('echo-below'));}
   el('p','Only the main quest is routed to the TV. Older manually added TV text cards are managed in TV text controls.',s,'help');return;
  }
  s=section('Party side quests');const shared=A.phoneQuests(d).filter(matches);
  if(!shared.length)el('p',`No ${previewStatus} side quests are currently published to phones.`,s);
  for(const q of shared){const card=el('article',null,s,'story-card quest-screen-preview');el('h4',`${q.title} · ${q.state}`,card);el('p',q.goal,card);const id=q.id.replace(/^guide-/,'');if(globalThis.ECHO_QUEST_CATALOG.quests.some(q=>q.id===id))button(card,'Edit this quest',()=>edit(id));}
  if(previewAudience==='party'){el('p','These quests are shared with every phone. Select a character above to also inspect their private quest.',s,'help');return;}
  s=section('Your character quests');const privateQuests=A.privateClues(d,previewAudience).filter(matches);
  if(!privateQuests.length)el('p',`No character quest is currently published in ${previewStatus} for this phone.`,s);
  for(const q of privateQuests){const card=el('article',null,s,'story-card quest-screen-preview');el('h4',q.title,card);el('p',q.text,card);el('small','Private quest · your DM updates this objective',card);}
  const own=globalThis.ECHO_QUEST_CATALOG.quests.find(q=>q.owner===previewAudience);if(own)button(s,privateQuests.length?'Edit this character’s quest':'Prepare this character’s quest',()=>edit(own.id));
 }
 globalThis.ECHO_QUESTS_UI={render,renderPreview,open:id=>{selected=id||selected;globalThis.ECHO_STORY_UI.open('quests');}};
})();
