/* One DM-only right panel; model prose is an editable suggestion, never an action. */
(() => {
 'use strict';let host,root,mode='scene',npcId='',characterId='',question='',present=['party'],withhold=[],result=null,extra=[],error='',job=null,requestEpoch=0,loading=false,selected=[],purpose='narration',statusData=null,statusError='',lastRequest=null;
 const A=()=>ECHO_CAMPAIGN_ASSISTANT,el=(t,text,p)=>{const n=document.createElement(t);if(text!=null)n.textContent=text;p?.append(n);return n;};
 const btn=(p,t,fn)=>{const n=el('button',t,p);n.type='button';n.onclick=()=>Promise.resolve().then(fn).catch(e=>{error=e.message;render();});return n;};
 const details=(p,t)=>{const d=el('details',null,p);el('summary',t,d);return d;};
 function field(p,t,value,fn,multi=false){const l=el('label',t,p),n=el(multi?'textarea':'input',null,l);n.setAttribute('aria-label',t);n.value=value||'';n.maxLength=multi?3000:1200;if(multi)n.rows=4;n.oninput=()=>fn(n.value);return n;}
 function select(p,t,values,value,fn){const l=el('label',t,p),n=el('select',null,l);n.setAttribute('aria-label',t);for(const [id,title]of values){const o=el('option',title,n);o.value=id;}n.value=value;n.onchange=()=>fn(n.value);return n;}
 function checkbox(p,t,value,fn){const l=el('label',null,p),n=el('input',null,l);n.type='checkbox';n.checked=value;n.setAttribute('aria-label',t);el('span',t,l);n.onchange=()=>fn(n.checked);return n;}
 function clear(){result=null;extra=[];selected=[];error='';void cancel();}
 function ctx(){return host.context();}
 function current(){if(!result||result.signature!==A().signature(ctx()))throw Error('The scene, rules, party or approved records changed. Refresh this answer before using it.');return result;}
 function open(options={}){clear();mode=options.mode||mode;npcId=options.npcId||npcId;host.content(mode==='dialogue'?'NPC dialogue':'DM assistant',r=>{root=r;r.classList.add('ai-settings','campaign-assistant');render();});void refreshStatus();}
 function local(){void cancel();const c=ctx();error='';extra=[];selected=[];result=mode==='dialogue'?A().dialogue(c,{npcId,question,present,withhold,approach:delivery}):mode==='player'?A().player(c,characterId,question):mode==='draft'?A().draft(c,purpose,question):A().answer(c,mode,question,{npcId,characterId,present,withhold});render();}
 function audience(){return mode==='dialogue'?'npc':mode==='player'?'player':'dm';}
 async function refreshStatus(){try{statusData=await ECHO_AI_SERVICE.status();statusError='';}catch(e){statusData=null;statusError=e.message||'Provider status unavailable';}renderUsage();}
 function renderUsage(){const n=root?.querySelector('[data-assistant-usage]');if(!n)return;const s=statusData?.settings,u=statusData?.usage;const provider=statusData?.providers?.find(p=>p.id===s?.provider);n.textContent=!s?'Local records available · '+(statusError||'Checking AI connection…'):!s.enabled?(s.provider==='chatgpt'&&provider?.ready?'ChatGPT connected · generation is switched off. Open AI connection & limits to enable it.':'AI generation is switched off · local records available'):provider?.ready===false?'AI provider is not connected. Open AI connection & limits to reconnect.':s.provider==='mock'?'Mock rehearsal · no provider connection':s.provider==='chatgpt'?`ChatGPT ready · ${Math.max(0,s.dailyRequestLimit-(u?.chatgptRequestsToday||0))} of ${s.dailyRequestLimit} app requests remaining today (UTC) · no API billing`:`API estimate · $${u.dayUsd.toFixed(3)}/$${s.dailyBudgetUsd} today · $${u.monthUsd.toFixed(3)}/$${s.monthlyBudgetUsd} this month`;
  if(lastRequest)n.textContent+=` · last request ${lastRequest.status}, ${lastRequest.seconds}s${lastRequest.tokens!=null?', '+lastRequest.tokens+' output tokens':''}`;
 }
 let delivery='friendly';
 async function cancel(){requestEpoch++;const prior=job;job=null;loading=false;if(prior&&['queued','running'].includes(prior.status))try{await ECHO_AI_SERVICE.cancel(prior.id);}catch(e){host.toast('Cancellation requested locally; the provider may still count a dispatched request. '+e.message);}}
 async function ask(packet,approved){
  if(!approved)throw Error('Review the exact outgoing context and check its approval box first.');current();if(loading)return;
  packet=ECHO_AI_CONTEXT.wrap(packet).reference;
  const c=ctx(),r=result,type=audience(),ticket=++requestEpoch,started=Date.now(),deadline=started+(host.requestTimeoutMs||60000);let ownedJob=null;loading=true;error='';render();
  try{const status=await ECHO_AI_SERVICE.status();if(!status.settings.enabled)throw Error('AI is off. Local answers work now; use AI settings to enable your selected provider.');
   if(ticket!==requestEpoch)return;current();ownedJob=await ECHO_AI_SERVICE.start(packet,A().prompt(r,type));
   if(ticket!==requestEpoch){await ECHO_AI_SERVICE.cancel(ownedJob.id);return;}job=ownedJob;
   while(['queued','running'].includes(ownedJob.status)){renderProgress();if(Date.now()>=deadline){ownedJob=await ECHO_AI_SERVICE.cancel(ownedJob.id);job=ownedJob;throw Error('The assistant took too long and was cancelled. Local records remain available. A dispatched request may still count toward your allowance.');}await new Promise(resolve=>setTimeout(resolve,450));if(ticket!==requestEpoch)return;ownedJob=await ECHO_AI_SERVICE.job(ownedJob.id);if(ticket!==requestEpoch)return;job=ownedJob;}
   if(job.status!=='completed')throw Error(job.error?.message||'The request did not finish. The local answer remains available.');
   if(ticket!==requestEpoch)return;if(c.campaignId!==ctx().campaignId||r.signature!==A().signature(ctx()))throw Error('Campaign context changed during generation. This response was discarded.');
   if(status.settings.provider==='mock'){error='Mock transport completed. It does not generate campaign answers; the local grounded suggestions remain available.';return;}
   extra=A().parse(typeof job.result==='string'?job.result:job.result?.text,packet,type);
  }catch(e){if(ownedJob&&['queued','running'].includes(ownedJob.status))try{await ECHO_AI_SERVICE.cancel(ownedJob.id);}catch{}if(ticket===requestEpoch)throw e;
  }finally{if(ticket===requestEpoch){lastRequest={status:job?.status||'failed',seconds:((Date.now()-started)/1000).toFixed(1),tokens:job?.usage?.outputTokens};loading=false;job=null;render();void refreshStatus();}}
 }
 function renderProgress(){const n=root?.querySelector('[data-assistant-progress]');if(n)n.textContent=loading?'AI request: '+(job?.status||'starting')+' · no campaign changes':'';}
 function showRecord(p,r){const d=details(p,r.title+' · '+A().label(r));el('small','Saved status: '+r.status,d);if(r.epistemic)el('strong',`${r.epistemic} · ${r.reveal?'permitted for this conversation':'withheld from dialogue'}`,d);if(r.private)el('small','DM only / not shared with the whole party',d);el('p',r.text,d);el('small',r.sourceId+' · '+r.basis,d);
  if(r.book&&r.page)btn(d,'Open source book · '+r.page,()=>host.book(r.book,r.page));
  if(r.eventId)btn(d,'Review original outcome',()=>{current();host.correct(r.eventId);});
 }
 function propose(kind,text){current();host.outcome(A().proposal(kind,text,['npc','dialogue'].includes(mode)?npcId:''));}
 function draftCard(p,v,i){const d=el('section',null,p);d.className='assistant-response';el('h4',(v.origin==='ai'?'AI':'Local')+' draft '+(i+1)+' · Suggested',d);el('small','Citations show its basis, not proof. Review the wording and its audience.',d);let check;
  field(d,'Draft wording '+(i+1),v.text,t=>{v.text=t;v.reviewed=false;if(check)check.checked=false;},true);
  const refs=details(d,'Supporting records');const rows=v.references||result.sections.flatMap(s=>s.rows);for(const id of v.sourceIds){const r=rows.find(r=>r.sourceId===id);if(r)showRecord(refs,r);}if(!v.sourceIds.length)el('p','No supporting record. Treat this as uncertain and verify it.',refs);
  btn(d,'Review draft '+(i+1)+' as a proposed change',()=>propose(result.purpose||'assistant suggestion',v.text));
  if(mode==='player'){el('small','Owner-only assistance stays in this private review. Use the existing private handout or journal review to send approved wording to its owner.',d);return;}
  check=checkbox(d,'I approve draft '+(i+1)+' for everyone at the table',!!v.reviewed,on=>v.reviewed=on);
  const reviewed=()=>{current();if(!v.text.trim()||v.text.length>3000)throw Error('Use a nonempty draft of at most 3,000 characters. Split longer wording into separate parts.');if(!v.reviewed)throw Error('Review and approve this exact wording for everyone at the table first.');};
  btn(d,'Preview draft '+(i+1)+' for TV',()=>{reviewed();ECHO_TV_TEXT.preview('Reviewed '+(result.purpose||'assistant draft'),v.text,{validate:current});});
  btn(d,'Send draft '+(i+1)+' to Voice Studio',()=>{reviewed();ECHO_VOICE_STUDIO.open({draft:{title:'Reviewed '+(result.purpose||'assistant draft'),actor:{id:'narrator',name:'Narrator'},script:v.text,source:{kind:'assistant',id:'assistant-'+crypto.randomUUID(),fingerprint:result.signature}}});});
  el('small','Handoff prepares a draft or preview. It does not record an event, play audio, or change the map.',d);
 }
 function dialogueCard(p,v,i){const d=el('section',null,p);d.className='assistant-response';el('h4',v.approach+(v.origin==='ai'?' · AI draft':' · grounded draft'),d);el('small',v.uncertain?'Uncertain / performance suggestion':'Uses recorded knowledge; wording remains a suggestion',d);let value=v.text,approved=!!v.reviewed,newChange=v.proposedChange||'';
  const approval=()=>{approved=false;v.reviewed=false;if(check)check.checked=false;};let check;
  field(d,'Response '+(i+1),value,t=>{value=t;v.text=t;approval();},true);
  const motive=details(d,'Private motivation & supporting records');el('p',v.motivation,motive);for(const ref of v.sourceIds){const r=result.knowledge.find(r=>r.sourceId===ref);if(r)showRecord(motive,{...r,text:r.publicText});}for(const r of result.motives)showRecord(motive,r);
  select(d,'Proposed change in response '+(i+1),[['','No new promise, price, revelation or relationship change'],['promise','New promise'],['price','Price or bargain'],['revelation','New revelation'],['relationship','Relationship change']],newChange,kind=>{newChange=kind;v.proposedChange=kind;approval();});
  btn(d,'Review consequences of response '+(i+1),()=>propose(newChange||'dialogue',value));
  check=checkbox(d,'I reviewed response '+(i+1)+' for everyone at the table; it contains no unreviewed new commitment or disclosure',approved,on=>{approved=on;v.reviewed=on;});
  btn(d,'Send response '+(i+1)+' to Voice Studio',()=>{const r=current();if(!r.tableSafe)throw Error('This is a private conversation. Perform it privately, or approve whole-party disclosure through outcome review before table narration.');if(newChange)throw Error('Send the proposed change to outcome review first. No agreement or disclosure has been recorded.');if(!approved)throw Error('Review the exact wording for the whole table first.');ECHO_VOICE_STUDIO.open({draft:{title:r.name+' · reviewed dialogue',actor:{id:r.npcId,name:r.name},script:value,source:{kind:'assistant',id:'assistant-'+crypto.randomUUID(),fingerprint:r.signature}}});});
  el('small','You can perform this wording yourself. Nothing is spoken, published or recorded as an event until you choose the relevant action.',d);
 }
 function render(){if(!root?.isConnected)return;root.replaceChildren();const c=ctx();el('p',mode==='dialogue'?'Draft dialogue privately. Only permitted knowledge enters suggested speech; motives stay in the DM panel.':'Use campaign records to gather local references. For AI wording, review the outgoing context below and choose Ask configured AI. Suggestions never change campaign state.',root);
  const usage=el('p','',root);usage.dataset.assistantUsage='';usage.setAttribute('role','status');renderUsage();btn(root,'AI connection & limits',()=>ECHO_AI_UI.open());
  if(error)el('p',error,root).className='ai-error';
  select(root,'Assistant action',[['scene','Help me run this scene'],['npc','What does this NPC know?'],['clues','Which clues are available here?'],['rules','Find the relevant rule'],['next','Suggest the next useful action'],['question','Ask about campaign history'],['dialogue','Draft NPC dialogue'],['draft','Draft narration, recap or options'],['player','Preview one player’s help']],mode,v=>{clear();mode=v;render();});
  if(mode==='draft')select(root,'Draft purpose',[['narration','Scene narration'],['recap','Recap from approved public events'],['improv','Improv options'],['consequence','Proposed consequences']],purpose,v=>{clear();purpose=v;render();});
  if(['npc','dialogue'].includes(mode)){select(root,'NPC',[['','Choose an NPC'],...c.story.npcs.map(n=>[n.id,n.name])],npcId,v=>{clear();npcId=v;withhold=[];render();});const audience=details(root,'Who can hear?');checkbox(audience,'Everyone in the party',present.includes('party'),v=>{clear();present=v?['party']:[];render();});if(!present.includes('party'))for(const n of Object.values(c.state.party||{}))checkbox(audience,n.name,present.includes(n.id),v=>{clear();present=v?[...present,n.id]:present.filter(id=>id!==n.id);});
   const others=details(audience,'Other NPCs present');for(const n of c.story.npcs.filter(n=>n.id!==npcId))checkbox(others,n.name,present.includes(n.id),v=>{clear();present=v?[...present,n.id]:present.filter(id=>id!==n.id);});
   if(mode==='dialogue')select(root,'Conversation approach',[['friendly','Friendly conversation'],['deception','Respond to a possibly deceptive claim'],['negotiation','Negotiate without making an agreement']],delivery,v=>{clear();delivery=v;});
  }
  if(['rules','player'].includes(mode))select(root,mode==='player'?'Player receiving help':'Character exception',[['',mode==='player'?'Choose a player':'Whole party / general rule'],...Object.values(c.state.party||{}).filter(p=>mode!=='player'||p.id.startsWith('pc-')).map(p=>[p.id,p.name])],characterId,v=>{clear();characterId=v;render();});
  field(root,mode==='dialogue'?'What does the player say?':'Question or focus',question,v=>{question=v;clear();},mode==='dialogue');
  btn(root,mode==='dialogue'?'Draft grounded responses':'Use campaign records',local);btn(root,'AI settings',()=>ECHO_AI_UI.open());
  if(!result)return;
  const stale=result.signature!==A().signature(c);if(stale)el('p','This answer is outdated. Refresh before using it.',root).className='ai-error';
  if(mode==='dialogue'){
   const knowledgeBox=details(root,'Knowledge and disclosure · DM only');for(const r of result.knowledge){showRecord(knowledgeBox,r);checkbox(knowledgeBox,'Withhold '+r.title,withhold.includes(r.eventId),v=>{withhold=v?[...withhold,r.eventId]:withhold.filter(id=>id!==r.eventId);local();});}if(!result.knowledge.length)el('p','No approved NPC knowledge is recorded. Preparation and party knowledge have not been granted to this NPC.',knowledgeBox);
   [...result.variants,...extra].forEach((v,i)=>dialogueCard(root,v,i));
  }else{
   el('p',result.unknown?'No supported answer was found. Check the source or record the missing information; no answer was invented.':result.notice,root);
   for(const section of result.sections){el('h4',section.title,root);for(const r of section.rows)showRecord(root,r);}
   for(const s of result.suggestions){el('p','Suggestion: '+s.text,root);el('small',s.sourceIds.join(', '),root);btn(root,'Review as a proposed plan',()=>propose('next action',s.text));}
   [...(result.drafts||[]),...extra].forEach((v,i)=>draftCard(root,v,i));
  }
  const available=A().context(c,result,audience()),external=details(root,'Optional AI draft · review outgoing context');let packet=A().context(c,result,audience(),selected),consent=false,approval,packetPreview;external.open=!!statusData?.settings?.enabled;
  el('p','Choose only the records needed. Books and indexed rule text stay local. This audience filter runs before transport. The quoted question is also sent; inspect it for private information.',external);
  const sources=details(external,'Select outgoing records · '+selected.length+' selected');
  for(const r of available.records){const choice=checkbox(sources,'Send '+r.title,selected.includes(r.sourceId),on=>{selected=on?[...selected,r.sourceId]:selected.filter(id=>id!==r.sourceId);packet=A().context(c,result,audience(),selected);packetPreview.textContent=JSON.stringify(packet,null,2);sources.querySelector('summary').textContent='Select outgoing records · '+selected.length+' selected';consent=false;approval.checked=false;});choice.disabled=loading;}
  packetPreview=el('pre',JSON.stringify(packet,null,2),external);el('pre',A().prompt(result,audience()),external);approval=checkbox(external,'I approve sending this displayed context and question',false,v=>consent=v);btn(external,'Ask configured AI',()=>ask(packet,consent)).disabled=loading||stale;
  const progress=el('p','',root);progress.dataset.assistantProgress='';renderProgress();if(loading)btn(root,'Cancel assistant request',async()=>{await cancel();error='Cancelled. No campaign changes were made.';render();});
  const proposals=details(root,'Create a reviewable proposal');let kind='other',note='';select(proposals,'Proposal type',[['other','Scene / other plan'],['promise','Promise'],['price','Price or bargain'],['revelation','Revelation'],['relationship','Relationship change']],kind,v=>kind=v);field(proposals,'Proposed wording',note,v=>note=v,true);btn(proposals,'Open outcome review',()=>propose(kind,note));
 }
 function init(h){host=h;new MutationObserver(()=>{if(loading&&root&&!root.isConnected)void cancel();}).observe(document.body,{childList:true,subtree:true});btn(document.getElementById('cockpit-tools-Session'),'DM assistant',()=>open());}
 globalThis.ECHO_CAMPAIGN_ASSISTANT_UI={init,open,refresh:local,cancel};
})();
