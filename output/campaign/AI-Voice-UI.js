/* Private voice auditions. Only explicit profile saves change campaign records. */
(() => {
 'use strict';
 let host,root,chosen='barthen',status=null,catalog=[],account=null,error='',busy=false,poll=0,audio=null,audioURL='',privateOutput=false,previewEpoch=0,panelObserver,budgetDraft=null,freshAllowance=false;
 const heard=new Set(),staged=new Map(),M=()=>globalThis.ECHO_AI_VOICE_CAST,S=()=>globalThis.ECHO_AI_SERVICE;
 const running=j=>['queued','checking_account','running'].includes(j.status);
 const el=(tag,text,parent)=>{const n=document.createElement(tag);if(text!=null)n.textContent=String(text);parent?.append(n);return n;};
 const button=(parent,text,action)=>{const b=el('button',text,parent);b.type='button';b.addEventListener('click',action);return b;};
 const details=(parent,title,open=false)=>{const d=el('details',null,parent);d.open=open;el('summary',title,d);return d;};
 function field(parent,title,value,id,type='textarea'){
  const l=el('label',null,parent),caption=el('span',title,l);caption.id=id+'-label';l.htmlFor=id;
  const n=el(type==='textarea'?'textarea':'input',null,l);n.id=id;n.setAttribute('aria-labelledby',caption.id);
  if(type==='checkbox'){n.type=type;n.checked=!!value;}else{if(type!=='textarea')n.type=type;n.value=value??'';}
  if(type==='textarea')n.rows=3;return n;
 }
 function select(parent,title,options,value,id){
  const l=el('label',null,parent),caption=el('span',title,l);caption.id=id+'-label';l.htmlFor=id;
  const n=el('select',null,l);n.id=id;n.setAttribute('aria-labelledby',caption.id);
  for(const [key,text]of options){const o=el('option',text,n);o.value=key;}n.value=value;return n;
 }
 function link(parent,title,url){const a=el('a',title,parent);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
 const cast=()=>M().normalize(host.get());
 const connectionLabel=()=>{const p=status?.providers?.find(p=>p.id==='elevenlabs');return `ElevenLabs · ${status?.settings?.freeOnly===false?'included plan credits only':'free credits only'} · ${p?.generationVerified?'local speech generation verified':p?.connected?'account checked; local speech untested':p?.configured?'key saved; connection untested':'account setup needed'}`;};
 function renderAccount(){const box=root?.querySelector('#voice-account-summary');if(box){box.hidden=!account;box.textContent=account?`${account.verifiedIncludedCredits||account.verifiedFree?'Verified '+account.tier+' allowance':'Account not eligible'} · ${account.remainingCharacters??'unknown'} credits remaining at the last check. The service checks again before each generation.`:'';}const badge=root?.querySelector('.ai-status');if(badge)badge.textContent=connectionLabel();}
 function stop(){globalThis.ECHO_VOICE_STUDIO?.stopPreview();previewEpoch++;if(audio){audio.pause();audio.src='';audio=null;}if(audioURL){URL.revokeObjectURL(audioURL);audioURL='';}}
 function init(value){host=value;freshAllowance=false;globalThis.ECHO_AI_PLUGIN_AUDITIONS?.init({get:host.get,blank:host.blank,save,localStatus:sample=>ECHO_VOICE_STUDIO.auditionAvailability(sample),prepareAudition:sample=>ECHO_VOICE_STUDIO.prepareAudition(sample)});window.addEventListener('echo-audio-state',e=>{if(e.detail?.muted)stop();else if(audio)audio.volume=Math.min(.8,Number(e.detail?.master??80)/100);});window.addEventListener('pagehide',stop);}
 function open(id){chosen=M().catalog.some(p=>p.id===id)?id:chosen;stop();privateOutput=false;panelObserver?.disconnect();host.content('Voice auditions',r=>{root=r;r.classList.add('ai-settings','voice-auditions');render();});panelObserver=new MutationObserver(()=>{if(!root?.isConnected){stop();privateOutput=false;clearTimeout(poll);panelObserver.disconnect();}});panelObserver.observe(root.parentElement,{childList:true});void refresh();}
 async function action(fn){if(busy)return;busy=true;error='';render();try{await fn();}catch(e){error=e.message;}finally{busy=false;render();}}
 async function refresh(){try{status=await S().voiceStatus();account=status.account;error='';}catch(e){error=e.message;}render();schedule();}
 function schedule(){clearTimeout(poll);if(!root?.isConnected||!(status?.jobs||[]).some(running))return;poll=setTimeout(async()=>{try{status=await S().voiceStatus();account=status.account;renderAccount();renderJobs();schedule();}catch(e){error=e.message;render();}},650);}
 async function save(next,label){await host.set(next);host.toast(label);render();}
 function setup(parent){
  const d=details(parent,'Account & audition budget',false);
  const ol=el('ol',null,d);let li=el('li',null,ol);link(li,'Open your ElevenLabs account','https://elevenlabs.io/');
  li=el('li',null,ol);link(li,'Open Developers → API Keys','https://elevenlabs.io/app/developers/api-keys');el('span',' and make an Echo Below key. Allow speech generation and read access to voices, models, and your account/subscription. Keep top-ups off.',li);
  li=el('li','On this Mac, double-click Set-Up-ElevenLabs.command in the app’s launchers folder. Paste the key into the hidden local prompt. Keep it out of chat and campaign files.',ol);
  li=el('li','Return here, refresh, choose the credit allowance, then check the account and load its stock voices.',ol);
  el('small','The setup helper saves a private key outside campaign backups. No account is created and no subscription is purchased by this app.',d);
  el('small','This app connection is separate from the ElevenLabs plugin in your chat. Plugin samples and usage are not included in the local totals below.',d);
  const draft=budgetDraft||status?.settings||{};
  const mode=select(d,'Credit source',[['free','Free account credits only'],['included','Creator included credits only']],draft.freeOnly===false?'included':'free','voice-credit-source');
  const allowance=el('div',null,d),limits=draft.includedPlanCredits;
  const per=field(allowance,'Maximum included credits per sample',limits?.perSampleLimit||'','voice-limit-sample','number');
  const total=field(allowance,'Maximum included credits for this local audition history',limits?.totalLimit||'','voice-limit-total','number');
  for(const input of [per,total]){input.min=1;input.max=1000000;input.step=1;}
  el('small','These limits reserve credits conservatively. Dispatched requests still count if cancelled or failed. Previous local auditions count toward the total. Paid overage must be disabled in ElevenLabs.',allowance);
  const check=field(d,'I approve this app checking my account and using only the credit allowance above',draft.providers?.elevenlabs?.accountConfirmed,'voice-account-confirm','checkbox');
  const enable=field(d,'Enable voice auditions',draft.enabled,'voice-enabled','checkbox');
  const values=()=>({enabled:enable.checked,freeOnly:mode.value==='free',includedPlanCredits:mode.value==='included'?{perSampleLimit:Number(per.value),totalLimit:Number(total.value)}:null,providers:{elevenlabs:{accountConfirmed:check.checked}}});
  const rememberBudget=()=>{budgetDraft=values();};
  const changeAllowance=()=>{allowance.hidden=mode.value!=='included';check.checked=false;rememberBudget();};
  mode.addEventListener('change',changeAllowance);per.addEventListener('input',changeAllowance);total.addEventListener('input',changeAllowance);
  check.addEventListener('change',rememberBudget);enable.addEventListener('change',rememberBudget);allowance.hidden=mode.value!=='included';
  button(d,'Save audition setup',()=>action(async()=>{status=await S().voiceConfigure(values());account=status.account;budgetDraft=null;freshAllowance=!!status.settings?.enabled&&status.settings?.providers?.elevenlabs?.accountConfirmed===true;host.toast('Audition settings saved.');})).disabled=busy||!status;
  button(d,'Check account allowance',()=>action(async()=>{account=null;try{const r=await S().voiceAccount();account=r.account;}finally{status=await S().voiceStatus();}})).disabled=busy||!freshAllowance||!status?.settings?.providers?.elevenlabs?.accountConfirmed;
  button(d,'Load stock voices',()=>action(async()=>{try{const r=await S().voiceCatalog();catalog=r.voices||[];}finally{status=await S().voiceStatus();account=status.account;}})).disabled=busy||!freshAllowance||!status?.settings?.providers?.elevenlabs?.accountConfirmed;
  el('p','',d).id='voice-account-summary';renderAccount();
 }
 function render(){if(!root?.isConnected)return;const expanded=new Set([...root.querySelectorAll('details[open]')].map(d=>d.querySelector('summary')?.textContent));root.replaceChildren();
  el('p','Four original audition scripts. Samples stay on this DM computer. Voice choices remain proposed until you explicitly select one.',root);
  const provider=status?.providers?.find(p=>p.id==='elevenlabs');
  el('p',connectionLabel(),root).className='ai-status';
  if(error)el('p',error,root).className='ai-error';
  const row=el('div',null,root);button(row,'Refresh voices',refresh);button(row,'Back to Voice Studio',()=>{stop();ECHO_VOICE_STUDIO.open();});button(row,'Back to AI settings',()=>{stop();clearTimeout(poll);globalThis.ECHO_AI_UI.open();});button(row,'Stop preview',stop);
  if(host.blank?.()){el('p','This four-person audition cast belongs to The Echo Below. No cast has been added to this blank campaign.',root);return;}
  el('p',freshAllowance?'New local allowance approved for this app session. Provider limits still apply.':'Cached recordings only · approve a new allowance before live generation.',root).className='ai-status';
  const state=cast(),profile=M().profile(state,chosen);
  const people=select(root,'Audition character',state.profiles.map(p=>[p.id,p.name]),chosen,'voice-character');people.addEventListener('change',()=>{stop();chosen=people.value;render();});
  el('h3',profile.name,root);
  el('p',profile.voice.status==='selected'?`Selected by you: ${profile.voice.voiceName} (${profile.voice.provider})`:'Voice: not selected · direction is proposed',root);
  el('blockquote',profile.script,root).id='voice-script';
  el('small',`${profile.scriptWords} words · script revision ${profile.scriptRevision} · original hypothetical audition, not a campaign event.`,root);
  globalThis.ECHO_AI_PLUGIN_AUDITIONS?.render(root,chosen);
  setup(root);
  const direction=details(root,'Direction, pronunciation & listening notes');
  const style=field(direction,'Speaking style',profile.style,'voice-style');style.maxLength=800;
  const pacing=field(direction,'Pacing guidance',profile.pacing,'voice-pacing');pacing.maxLength=1200;
  const names=field(direction,'Proposed pronunciations (name = sounds like)',profile.pronunciation.map(p=>p.term+' = '+p.sayAs).join('\n'),'voice-pronunciation');
  const emotions=field(direction,'Emotional range (one per line)',profile.emotionalRange.join('\n'),'voice-emotions');
  const notes=field(direction,'Private listening notes',profile.notes,'voice-notes');notes.maxLength=1600;
  el('small','Listen for clear names, warmth, restraint, distinctness, and consistent emotion. These are proposed direction notes. Auditions use the unchanged script; pronunciation dictionaries and pacing targets are not applied automatically.',direction);
  button(direction,'Save voice profile',()=>action(()=>save(M().updateProfile(cast(),chosen,{style:style.value,pacing:pacing.value,pronunciation:names.value.split('\n').map(line=>{const [term,...rest]=line.split('=');return {term:term.trim(),sayAs:rest.join('=').trim()};}),emotionalRange:emotions.value.split('\n').map(v=>v.trim()).filter(Boolean),notes:notes.value},{at:new Date().toISOString()}),'Saved proposed voice direction.')));
  button(direction,'Undo last voice edit',()=>action(()=>save(M().undo(cast()),'Undid the last voice edit.'))).disabled=!state.history.length;
  if(profile.voice.status==='selected')button(direction,'Clear selected voice',()=>action(()=>save(M().clearSelection(cast(),chosen,{at:new Date().toISOString()}),'Voice selection cleared.')));
  const sources=details(direction,'Character references');for(const s of profile.sourceRefs)el('p',`${s.id} — ${s.note}`,sources);
  const proposed=staged.get(chosen)||{};
  const candidate=select(root,'Proposed stock voice',[['','Choose after loading stock voices'],...catalog.map(v=>[v.id||v.voiceId||v.voice_id,v.name||v.voiceName||v.id])],proposed.voiceId||'','voice-candidate');
  const model=select(root,'Speech model',[['eleven_multilingual_v2','Multilingual v2 · consistent delivery'],['eleven_v3','Eleven v3 · expressive delivery']],proposed.model||'eleven_multilingual_v2','voice-model');
  const remember=()=>staged.set(chosen,{voiceId:candidate.value,model:model.value});candidate.addEventListener('change',remember);model.addEventListener('change',remember);
  el('small','Selecting a candidate here only stages an audition. It does not assign the voice to this character.',root);
  button(root,'Generate this audition · included credits only',()=>action(async()=>{
   if(!freshAllowance)throw Error('Approve a new account allowance in setup before requesting speech.');
   if(!candidate.value)throw Error('Load stock voices and choose a proposed candidate first.');
   const current=M().audition(cast(),chosen);
   await S().voiceStart({provider:'elevenlabs',voiceId:candidate.value,model:model.value,scriptId:chosen,text:current.script,
    style:{description:current.direction.style.slice(0,800),pace:1,pronunciation:current.direction.pronunciation.map(({term,sayAs})=>({term,sayAs})),emotionalRange:current.direction.emotionalRange.map(v=>v.slice(0,120))}});
   status=await S().voiceStatus();schedule();
  })).disabled=busy||!freshAllowance||!status?.settings?.enabled||!provider?.configured;
  button(root,'Choose private headphones',()=>action(()=>globalThis.ECHO_VOICE_STUDIO.choosePrivate()));
  const ready=field(root,'Headphones or another private computer output are ready',privateOutput,'voice-private-output','checkbox');ready.addEventListener('change',()=>{privateOutput=ready.checked;if(!privateOutput)stop();renderJobs();});
  el('small','Previews require the named private headphones selected above. They stop if outputs change and never fall back to table speakers. Mute all also stops previews.',root);
  el('div',null,root).id='voice-job-list';renderJobs();
  const compare=details(root,'Provider comparison · not an audible test');
  el('p','ElevenLabs is selected for this first audition. Cartesia remains an alternative for a later identical-script comparison. No provider has been judged by listening until a sample is generated and reviewed.',compare);
  link(compare,'ElevenLabs expressive speech models','https://elevenlabs.io/docs/overview/models');el('br',null,compare);link(compare,'Cartesia models and controls','https://docs.cartesia.ai/build-with-cartesia/tts-models/latest');
  for(const d of root.querySelectorAll('details'))if(expanded.has(d.querySelector('summary')?.textContent))d.open=true;
  el('p','Use provider stock voices. This workflow has no cloning feature. Retain provider and model information with each take; usage rights depend on the account plan used when it was generated.',compare);
 }
 function renderJobs(){const box=root?.querySelector('#voice-job-list');if(!box)return;box.replaceChildren();
  const jobs=(status?.jobs||[]).filter(j=>j.scriptId===chosen).slice().reverse();
  el('p',`${status?.usage?.completedSamples??0} real samples generated locally · ${status?.usage?.dispatchedRequests??0} local speech requests dispatched · additional paid spending: $0`,box);
  if(status?.settings?.freeOnly===false)el('small',`${status?.usage?.reservedCharacters??0} credits reserved against the ${status.settings.includedPlanCredits?.totalLimit??0}-credit local limit. Plugin generations are tracked separately.`,box);
  if(!jobs.length)el('p','No audio yet. Audible differences, generation time, and actual credit usage are pending a successful request.',box);
  for(const job of jobs){const d=details(box,`${job.voiceName||job.voiceId} · ${job.simulated?'MOCK transport test · ':''}${job.status}`,true);
   el('small',`${job.model} · ${job.characters} submitted characters · ${job.generationMilliseconds==null?'time not measured':(job.generationMilliseconds/1000).toFixed(2)+' seconds generation'} · ${job.providerReportedCharacters==null?'provider usage not reported':job.providerReportedCharacters+' provider-reported characters'}`,d);
   if(job.error)el('p',job.error.message,d).className='ai-error';
   if(running(job))button(d,'Cancel audition',()=>action(async()=>{await S().voiceCancel(job.id);status=await S().voiceStatus();schedule();}));
   if(job.status==='completed'&&job.audioUrl){
    el('small','Cached by the local service. Copy into Voice Studio to include this file in campaign backup and offline browser replay.',d);
    button(d,'Copy cached audition to Voice Studio',()=>action(()=>ECHO_VOICE_STUDIO.cacheAudition(job,M().profile(cast(),chosen))));
    button(d,'Preview on this computer',()=>action(async()=>{
      if(!privateOutput)throw Error('Confirm a private sound output before listening.');
      if(host.audioState?.().muted)throw Error('Audio is muted. Use the existing Mute all control to unmute before previewing.');
      const url=new URL(job.audioUrl,location.href);
      if(url.origin!==location.origin||!/^\/__echo_ai\/voices\/audio\/[A-Za-z0-9_-]+$/.test(url.pathname))throw Error('Unexpected audio address.');
      stop();const epoch=previewEpoch,response=await fetch(url,{cache:'no-store',credentials:'same-origin'});if(!response.ok)throw Error('This audition audio is unavailable on this computer. Generate a new sample.');
      const blob=await response.blob();if(epoch!==previewEpoch||!root?.isConnected||!privateOutput||host.audioState?.().muted)return;
      await globalThis.ECHO_VOICE_STUDIO.previewBlob(blob,()=>{heard.add(job.id);renderJobs();});
    })).disabled=!privateOutput;
    const current=M().profile(cast(),chosen),sameText=current.script===job.text;
    button(d,'Use this voice for '+current.name,()=>action(()=>save(M().selectVoice(cast(),chosen,{provider:job.provider,voiceId:job.voiceId,voiceName:job.voiceName,model:job.model,scriptHash:current.scriptHash,rights:'provider-stock',auditionId:job.id},true,{at:new Date().toISOString()}),'Voice selected for this character.'))).disabled=!!job.simulated||!heard.has(job.id)||!sameText;
    if(!heard.has(job.id))el('small','Listen to the complete sample before selecting it. Selection remains your decision.',d);
   }
  }
 }
 globalThis.ECHO_VOICE_UI={init,open,stop,liveApproved:()=>freshAllowance,revokeAllowance:()=>{freshAllowance=false;}};
})();
