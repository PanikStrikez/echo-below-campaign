/* One DM-only right panel; model prose is an editable suggestion, never an action. */
(() => {
 'use strict';let host,root,mode='scene',npcId='',characterId='',question='',present=['party'],withhold=[],result=null,extra=[],error='',job=null,requestEpoch=0,loading=false;
 const A=()=>ECHO_CAMPAIGN_ASSISTANT,el=(t,text,p)=>{const n=document.createElement(t);if(text!=null)n.textContent=text;p?.append(n);return n;};
 const btn=(p,t,fn)=>{const n=el('button',t,p);n.type='button';n.onclick=()=>Promise.resolve().then(fn).catch(e=>{error=e.message;render();});return n;};
 const details=(p,t)=>{const d=el('details',null,p);el('summary',t,d);return d;};
 function field(p,t,value,fn,multi=false){const l=el('label',t,p),n=el(multi?'textarea':'input',null,l);n.setAttribute('aria-label',t);n.value=value||'';n.maxLength=multi?3000:1200;if(multi)n.rows=4;n.oninput=()=>fn(n.value);return n;}
 function select(p,t,values,value,fn){const l=el('label',t,p),n=el('select',null,l);n.setAttribute('aria-label',t);for(const [id,title]of values){const o=el('option',title,n);o.value=id;}n.value=value;n.onchange=()=>fn(n.value);return n;}
 function checkbox(p,t,value,fn){const l=el('label',null,p),n=el('input',null,l);n.type='checkbox';n.checked=value;n.setAttribute('aria-label',t);el('span',t,l);n.onchange=()=>fn(n.checked);return n;}
 function clear(){result=null;extra=[];error='';void cancel();}
 function ctx(){return host.context();}
 function current(){if(!result||result.signature!==A().signature(ctx()))throw Error('The scene, rules, party or approved records changed. Refresh this answer before using it.');return result;}
 function open(options={}){void cancel();mode=options.mode||mode;npcId=options.npcId||npcId;result=null;extra=[];error='';host.content(mode==='dialogue'?'NPC dialogue':'DM assistant',r=>{root=r;r.classList.add('ai-settings','campaign-assistant');render();});}
 function local(){void cancel();const c=ctx();error='';extra=[];result=mode==='dialogue'?A().dialogue(c,{npcId,question,present,withhold,approach:delivery}):A().answer(c,mode,question,{npcId,characterId,present,withhold});render();}
 let delivery='friendly';
 async function cancel(){requestEpoch++;const prior=job;job=null;loading=false;if(prior&&['queued','running'].includes(prior.status))try{await ECHO_AI_SERVICE.cancel(prior.id);}catch(e){host.toast('Cancellation requested locally; the provider may still count a dispatched request. '+e.message);}}
 async function ask(packet,approved){
  if(!approved)throw Error('Review the exact outgoing context and check its approval box first.');current();if(loading)return;
  const c=ctx(),r=result,type=mode==='dialogue'?'npc':'dm',ticket=++requestEpoch;loading=true;error='';render();
  try{const status=await ECHO_AI_SERVICE.status();if(!status.settings.enabled)throw Error('AI is off. Local answers work now; use AI settings to enable your selected provider.');
   if(ticket!==requestEpoch)return;current();job=await ECHO_AI_SERVICE.start(packet,A().prompt(r,type));
   if(ticket!==requestEpoch){await ECHO_AI_SERVICE.cancel(job.id);job=null;return;}
   while(['queued','running'].includes(job.status)){renderProgress();await new Promise(resolve=>setTimeout(resolve,450));if(ticket!==requestEpoch)return;job=await ECHO_AI_SERVICE.job(job.id);}
   if(job.status!=='completed')throw Error(job.error?.message||'The request did not finish. The local answer remains available.');
   if(ticket!==requestEpoch)return;if(c.campaignId!==ctx().campaignId||r.signature!==A().signature(ctx()))throw Error('Campaign context changed during generation. This response was discarded.');
   if(status.settings.provider==='mock'){error='Mock transport completed. It does not generate campaign answers; the local grounded suggestions remain available.';return;}
   extra=A().parse(typeof job.result==='string'?job.result:job.result?.text,packet,type);
  }finally{if(ticket===requestEpoch){loading=false;job=null;render();}}
 }
 function renderProgress(){const n=root?.querySelector('[data-assistant-progress]');if(n)n.textContent=loading?'AI request: '+(job?.status||'starting')+' · no campaign changes':'';}
 function showRecord(p,r){const d=details(p,r.title+' · '+r.status);if(r.epistemic)el('strong',`${r.epistemic} · ${r.reveal?'permitted for this conversation':'withheld from dialogue'}`,d);if(r.private)el('small','DM only / not shared with the whole party',d);el('p',r.text,d);el('small',r.sourceId+' · '+r.basis,d);
  if(r.book&&r.page)btn(d,'Open source book · '+r.page,()=>host.book(r.book,r.page));
  if(r.eventId)btn(d,'Review original outcome',()=>{current();host.correct(r.eventId);});
 }
 function propose(kind,text){current();host.outcome(A().proposal(kind,text,npcId));}
 function dialogueCard(p,v,i){const d=el('section',null,p);d.className='assistant-response';el('h4',v.approach+(v.origin==='ai'?' · AI draft':' · grounded draft'),d);el('small',v.uncertain?'Uncertain / performance suggestion':'Uses recorded knowledge; wording remains a suggestion',d);let value=v.text,approved=!!v.reviewed,newChange=v.proposedChange||'';
  const approval=()=>{approved=false;v.reviewed=false;if(check)check.checked=false;};let check;
  field(d,'Response '+(i+1),value,t=>{value=t;v.text=t;approval();},true);
  const motive=details(d,'Private motivation & supporting records');el('p',v.motivation,motive);for(const ref of v.sourceIds){const r=result.knowledge.find(r=>r.sourceId===ref);if(r)showRecord(motive,{...r,text:r.publicText});}for(const r of result.motives)showRecord(motive,r);
  select(d,'Proposed change in response '+(i+1),[['','No new promise, price, revelation or relationship change'],['promise','New promise'],['price','Price or bargain'],['revelation','New revelation'],['relationship','Relationship change']],newChange,kind=>{newChange=kind;v.proposedChange=kind;approval();});
  btn(d,'Review consequences of response '+(i+1),()=>propose(newChange||'dialogue',value));
  check=checkbox(d,'I reviewed response '+(i+1)+' for everyone at the table; it contains no unreviewed new commitment or disclosure',approved,on=>{approved=on;v.reviewed=on;});
  btn(d,'Send response '+(i+1)+' to Voice Studio',()=>{const r=current();if(!r.tableSafe)throw Error('This is a private conversation. Perform it privately, or approve whole-party disclosure through outcome review before table narration.');if(newChange)throw Error('Send the proposed change to outcome review first. No agreement or disclosure has been recorded.');if(!approved)throw Error('Review the exact wording for the whole table first.');ECHO_VOICE_STUDIO.open({draft:{title:r.name+' · reviewed dialogue',actor:{id:r.npcId,name:r.name},script:value,source:{kind:'npc',id:r.npcId}}});});
  el('small','You can perform this wording yourself. Nothing is spoken, published or recorded as an event until you choose the relevant action.',d);
 }
 function render(){if(!root?.isConnected)return;root.replaceChildren();const c=ctx();el('p',mode==='dialogue'?'Draft dialogue privately. Only permitted knowledge enters suggested speech; motives stay in the DM panel.':'Use the current scene and saved campaign records. Suggestions never roll dice, spend resources, reveal clues or complete quests.',root);
  if(error)el('p',error,root).className='ai-error';
  select(root,'Assistant action',[['scene','Help me run this scene'],['npc','What does this NPC know?'],['clues','Which clues are available here?'],['rules','Find the relevant rule'],['next','Suggest the next useful action'],['question','Ask about campaign history'],['dialogue','Draft NPC dialogue']],mode,v=>{clear();mode=v;render();});
  if(['npc','dialogue'].includes(mode)){select(root,'NPC',[['','Choose an NPC'],...c.story.npcs.map(n=>[n.id,n.name])],npcId,v=>{clear();npcId=v;withhold=[];render();});const audience=details(root,'Who can hear?');checkbox(audience,'Everyone in the party',present.includes('party'),v=>{clear();present=v?['party']:[];render();});if(!present.includes('party'))for(const n of Object.values(c.state.party||{}))checkbox(audience,n.name,present.includes(n.id),v=>{clear();present=v?[...present,n.id]:present.filter(id=>id!==n.id);});
   const others=details(audience,'Other NPCs present');for(const n of c.story.npcs.filter(n=>n.id!==npcId))checkbox(others,n.name,present.includes(n.id),v=>{clear();present=v?[...present,n.id]:present.filter(id=>id!==n.id);});
   if(mode==='dialogue')select(root,'Conversation approach',[['friendly','Friendly conversation'],['deception','Respond to a possibly deceptive claim'],['negotiation','Negotiate without making an agreement']],delivery,v=>{clear();delivery=v;});
  }
  if(mode==='rules')select(root,'Character exception',[['','Whole party / general rule'],...Object.values(c.state.party||{}).map(p=>[p.id,p.name])],characterId,v=>{clear();characterId=v;});
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
   for(const v of extra){const d=el('section',null,root);el('h4','AI interpretation · unverified draft',d);el('p',v.text,d);el('small',v.sourceIds.join(', '),d);btn(d,'Review this suggestion',()=>propose('assistant suggestion',v.text));}
  }
  const packet=A().context(c,result,mode==='dialogue'?'npc':'dm'),external=details(root,'Optional AI draft · review outgoing context');el('p','Uses the provider and allowance already configured in AI settings. Source books remain local. Retrieved text and player statements are reference data, not instructions. AI wording still needs DM review.',external);el('pre',JSON.stringify(packet,null,2),external);let consent=false;checkbox(external,'I approve sending this displayed context and question',false,v=>consent=v);btn(external,'Ask configured AI',()=>ask(packet,consent)).disabled=loading||stale;
  const progress=el('p','',root);progress.dataset.assistantProgress='';renderProgress();if(loading)btn(root,'Cancel assistant request',async()=>{await cancel();error='Cancelled. No campaign changes were made.';render();});
  const proposals=details(root,'Create a reviewable proposal');let kind='other',note='';select(proposals,'Proposal type',[['other','Scene / other plan'],['promise','Promise'],['price','Price or bargain'],['revelation','Revelation'],['relationship','Relationship change']],kind,v=>kind=v);field(proposals,'Proposed wording',note,v=>note=v,true);btn(proposals,'Open outcome review',()=>propose(kind,note));
 }
 function init(h){host=h;new MutationObserver(()=>{if(loading&&root&&!root.isConnected)void cancel();}).observe(document.body,{childList:true,subtree:true});btn(document.getElementById('cockpit-tools-Session'),'DM assistant',()=>open());}
 globalThis.ECHO_CAMPAIGN_ASSISTANT_UI={init,open,refresh:local,cancel};
})();
