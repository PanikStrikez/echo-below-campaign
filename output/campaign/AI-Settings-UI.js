/* One compact settings panel. Context previews are local; diagnostics use a synthetic campaign. */
(() => {
 'use strict';let host,root,statusData=null,lastError='',job=null,poll=null,busy=false,models=[];
 const S=()=>globalThis.ECHO_AI_SERVICE,C=()=>globalThis.ECHO_AI_CONTEXT;
 const el=(tag,text,parent)=>{const n=document.createElement(tag);if(text!=null)n.textContent=String(text);parent?.append(n);return n;};
 function button(parent,text,fn){const n=el('button',text,parent);n.type='button';n.addEventListener('click',fn);return n;}
 function field(parent,title,type,value,id){const label=el('label',null,parent);const caption=el('span',title,label);caption.id=id+'-label';label.htmlFor=id;const input=el('input',null,label);input.id=id;input.setAttribute('aria-labelledby',caption.id);input.type=type;if(type==='checkbox')input.checked=!!value;else input.value=value??'';return input;}
 function select(parent,title,values,value,id){const label=el('label',null,parent);const caption=el('span',title,label);caption.id=id+'-label';label.htmlFor=id;const n=el('select',null,label);n.id=id;n.setAttribute('aria-labelledby',caption.id);for(const [key,text]of values){const o=el('option',text,n);o.value=key;}n.value=value;return n;}
 function details(parent,title){const d=el('details',null,parent);el('summary',title,d);return d;}
 const explain=msg=>{lastError=msg;render();};
 async function refresh(){try{statusData=await S().status();lastError='';}catch(e){lastError=e.message;}render();}
 function init(h){host=h;const b=button(document.getElementById('cockpit-tools-Settings'),'AI assistance',open);b.id='open-ai-settings';}
 function open(){host.content('AI assistance',r=>{root=r;r.classList.add('ai-settings');render();});void refresh();schedule();}
 function diagnosticContext(){return {version:1,audience:'dm',subjectId:'practice-ai-foundation',records:[
  {sourceId:'practice:arrival',kind:'outcome',title:'Isolated rehearsal',text:'A fictional party reached the village. No real campaign data is used in this request.',status:'confirmed',basis:'Observed'},
  {sourceId:'practice:bridge',kind:'plan',title:'Possible route',text:'The fictional group may choose to inspect a bridge next.',status:'planned',basis:'Open'}]};}
 async function startTest(){busy=true;lastError='';render();try{job=await S().start(diagnosticContext(),'Report which record is confirmed and which is a future plan. This is a mock foundation check.');schedule();}catch(e){lastError=e.message;}finally{busy=false;render();}}
 function schedule(){clearTimeout(poll);if(!job||!['queued','running'].includes(job.status))return;poll=setTimeout(async()=>{try{job=await S().job(job.id);renderJob();if(['queued','running'].includes(job.status))schedule();else{statusData=await S().status();renderUsage();}}catch(e){lastError=e.message;render();}},450);}
 async function cancel(){try{job=await S().cancel(job.id);renderJob();schedule();}catch(e){explain(e.message);}}
 function renderUsage(){const box=root?.querySelector('#ai-usage');if(!box)return;box.replaceChildren();const u=statusData?.usage||{};
  el('p',`Requests today (UTC): ${u.requestsToday??0} · Estimated/reserved API cost today: $${Number(u.dayUsd||0).toFixed(4)} · this month: $${Number(u.monthUsd||0).toFixed(4)}`,box);
  el('small','Mock requests are free. ChatGPT requests use your plan allowance; dollar figures are conservative local API estimates, including uncertain or cancelled requests. These local controls do not set your provider account limits.',box);
 }
 function renderJob(){const run=root?.querySelector('#ai-run-mock');if(run){run.textContent=busy?'Starting…':'Run mock foundation check';run.disabled=busy||!statusData?.settings.enabled||statusData?.settings.provider!=='mock'||['queued','running'].includes(job?.status);}const box=root?.querySelector('#ai-job');if(!box)return;box.replaceChildren();if(!job){el('small','No diagnostic run in this panel yet.',box);return;}
  el('strong',`Mock check: ${job.status}`,box);if(job.result)el('p',typeof job.result==='string'?job.result:JSON.stringify(job.result),box);if(job.error)el('p',job.error.message,box).className='ai-error';
  if(['queued','running'].includes(job.status))button(box,'Cancel request',cancel);if(!['queued','running'].includes(job.status))el('small','Result is a suggestion only. No campaign record was changed.',box);
 }
 function render(){if(!root?.isConnected)return;root.replaceChildren();
  const settings=statusData?.settings||{enabled:false,provider:'mock'},providers=statusData?.providers||[];
  el('p','Set up AI here. Campaign context previews stay on this computer. The foundation check uses a fictional campaign.',root);
  const badge=el('p',!statusData?'Local preview only':!settings.enabled?'AI is off':settings.provider==='mock'?'Mock mode · no external generation':settings.provider==='chatgpt'?'ChatGPT plan selected':'OpenAI API selected',root);badge.className='ai-status';badge.setAttribute('role','status');
  if(lastError)el('p',lastError,root).className='ai-error';
  const row=el('div',null,root);row.className='button-row';button(row,'Refresh connection',refresh);button(row,'Back to settings',()=>{clearTimeout(poll);host.settings();});
  button(row,'Voice studio',()=>globalThis.ECHO_VOICE_STUDIO.open());
  button(row,'Voice auditions',()=>{clearTimeout(poll);globalThis.ECHO_VOICE_UI.open();});
  const form=el('form',null,root);form.id='ai-settings-form';
  const enabled=field(form,'Enable AI requests','checkbox',settings.enabled,'ai-enabled');enabled.disabled=!statusData;
  const provider=select(form,'Provider',[['mock','Mock · local rehearsal'],['chatgpt','ChatGPT plan'],['openai','OpenAI API · separate billing']],settings.provider,'ai-provider');provider.disabled=!statusData;
  let dailyLimit,planConsent,model,day,month,per,paidConsent,maxOut;
  const specific=el('div',null,form);specific.className='ai-provider-options';
  function providerFields(){specific.replaceChildren();dailyLimit=planConsent=model=day=month=per=paidConsent=maxOut=null;
   const type=provider.value;
   if(type==='mock'){el('small','A deterministic demonstration verifies the request workflow. It does not answer campaign questions or contact a provider.',specific);return;}
   const pinfo=providers.find(p=>p.id===type)||{};
   if(type==='chatgpt'){
    el('p',pinfo.ready?'ChatGPT account connected. Choose a model and request allowance below.':'Connect your own eligible ChatGPT account. Signing in alone does not enable generation.',specific);
    button(specific,'Continue with ChatGPT',async()=>{const tab=window.open('about:blank','echo-chatgpt-signin','popup,width=760,height=800');try{const response=await S().beginChatGPT();const raw=response.authorizationUrl||response.url;const u=new URL(raw);if(u.origin!=='https://auth.openai.com')throw Error('The service returned an unexpected sign-in address.');if(tab)tab.location.href=u.href;else{explain('Allow the sign-in popup, then select Continue with ChatGPT again.');}}catch(e){tab?.close();explain(e.message);}}).disabled=!statusData;
    button(specific,'Disconnect ChatGPT',async()=>{try{const result=await S().disconnectChatGPT();models=[];await refresh();if(result.message)host.toast(result.message);}catch(e){explain(e.message);}}).disabled=!pinfo.connected;
    button(specific,'Load my available models',async()=>{try{const r=await S().models();models=(r.models||[]).map(m=>[m.slug||m.id,m.display_name||m.name||m.slug||m.id]);providerFields();}catch(e){explain(e.message);}}).disabled=!pinfo.ready;
    model=select(specific,'Model',[['','Choose after signing in'],...models,...(settings.model&&!models.some(m=>m[0]===settings.model)?[[settings.model,settings.model]]:[])],settings.model||'','ai-model');
    dailyLimit=field(specific,'Maximum ChatGPT requests per day','number',settings.dailyRequestLimit||0,'ai-daily-requests');dailyLimit.min=0;dailyLimit.max=1000;
    planConsent=field(specific,'I approve this app using my ChatGPT plan within this request limit','checkbox',false,'ai-plan-consent');
    el('small','The limit starts at zero. Set the app’s percentage allowance and credit preferences in ChatGPT settings as well. No automatic fallback to paid API billing is used. Voices and transcription need separate provider support.',specific);
   }else{
    el('p',pinfo.ready?'API credential is available to the local service.':'Configure OPENAI_API_KEY in the local service environment. Do not put a key in a campaign file, phone page, or chat.',specific);
    model=select(specific,'API model',[['gpt-4.1-mini-2025-04-14','GPT-4.1 mini · fixed pricing profile']], 'gpt-4.1-mini-2025-04-14','ai-model');
    const limits=details(specific,'Spending and request limits');limits.open=true;
    day=field(limits,'Daily API budget (USD)','number',settings.dailyBudgetUsd||0,'ai-budget-day');
    month=field(limits,'Monthly API budget (USD)','number',settings.monthlyBudgetUsd||0,'ai-budget-month');
    per=field(limits,'Maximum API cost reserved per request (USD)','number',settings.maxRequestUsd||0,'ai-budget-request');
    for(const i of [day,month,per]){i.min=0;i.step='0.01';}
    maxOut=field(limits,'Maximum output tokens','number',settings.maxOutputTokens||800,'ai-max-output');maxOut.min=64;maxOut.max=4000;
    dailyLimit=field(limits,'Maximum requests per day','number',settings.dailyRequestLimit||0,'ai-daily-requests');dailyLimit.min=0;dailyLimit.max=1000;
    paidConsent=field(limits,'I approve paid API requests with these limits','checkbox',false,'ai-paid-consent');
    el('small','No paid request is made by this foundation check. The service must be able to reserve a safe cost before any later API request can run.',specific);
   }
  }
  provider.addEventListener('change',providerFields);providerFields();
  const save=el('button','Save AI settings',form);save.type='submit';save.disabled=!statusData;
  form.addEventListener('submit',async e=>{e.preventDefault();const values={enabled:enabled.checked,provider:provider.value};
   if(model)values.model=model.value;
   if(dailyLimit)values.dailyRequestLimit=Number(dailyLimit.value);
   if(planConsent)values.planConfirmed=planConsent.checked;
   if(paidConsent)Object.assign(values,{externalConfirmed:paidConsent.checked,dailyBudgetUsd:Number(day.value),monthlyBudgetUsd:Number(month.value),maxRequestUsd:Number(per.value),maxOutputTokens:Number(maxOut.value)});
   try{statusData=await S().configure(values);lastError='';render();host.toast('AI settings saved on this computer.');}catch(err){explain(err.message);}
  });
  const preview=details(root,'Preview what AI can see');preview.id='ai-context-section';
  el('p','This builds a bounded selection of campaign references locally. Nothing is sent to a provider. Older or excess records may be omitted; an omitted fact is not disproved. Drafts and unknown facts remain labeled.',preview);
  const audience=select(preview,'Audience',[['dm','Dungeon Master'],['player','One player'],['npc','NPC speaking to the party']],'dm','ai-audience');
  const subject=el('div',null,preview),output=el('div',null,preview);output.id='ai-context-preview';let who;
  function choose(){subject.replaceChildren();output.replaceChildren();const ctx=host.context();
   if(audience.value==='player')who=select(subject,'Character',Object.entries(ctx.state?.party||{}).filter(([,p])=>p.role==='pc').map(([id,p])=>[id,p.name]),'','ai-subject');
   else if(audience.value==='npc')who=select(subject,'NPC',(ctx.story?.npcs||[]).map(n=>[n.id,n.name]),'','ai-subject');else who=null;
   if(who&&who.options.length)who.selectedIndex=0;
  }
  audience.addEventListener('change',choose);choose();
  button(preview,'Build local preview',()=>{output.replaceChildren();try{const ctx=host.context();const value=audience.value==='dm'?C().buildDM(ctx):audience.value==='player'?C().buildPlayer({...ctx,characterId:who?.value}):C().buildNPC({...ctx,npcId:who?.value,recipients:['party']});
   const valid=C().validate(value);if(!valid.valid)throw Error(valid.errors.join(' '));
   el('p',`${value.records.length} source records · ${value.audience} context`,output);
   for(const record of value.records){const d=details(output,record.title||record.sourceId);el('small',`${record.status} · ${record.basis} · ${record.sourceId}`,d);el('p',record.text,d);}
   if(!value.records.length)el('p','No permitted source records for this audience yet. Publish or approve the relevant information in the existing campaign tools.',output);
  }catch(e){el('p',e.message,output).className='ai-error';}});
  const diagnostics=details(root,'Foundation check and usage');diagnostics.open=!!job;diagnostics.id='ai-diagnostics';
  el('p','Run a cancellable mock request against an isolated fictional context. No saves, character values, audio, or phone assignments are changed.',diagnostics);
  const run=button(diagnostics,busy?'Starting…':'Run mock foundation check',startTest);run.id='ai-run-mock';run.disabled=busy||!settings.enabled||settings.provider!=='mock'||['queued','running'].includes(job?.status);
  if(!settings.enabled||settings.provider!=='mock')el('small','Enable Mock mode and save to run this check.',diagnostics);
  const jobBox=el('div',null,diagnostics);jobBox.id='ai-job';jobBox.setAttribute('role','status');renderJob();
  const use=el('div',null,diagnostics);use.id='ai-usage';renderUsage();
  el('small','Credentials and service settings stay outside campaign saves and portable packages. AI output remains a suggestion until an existing review workflow approves it.',root);
 }
 globalThis.ECHO_AI_UI={init,open,diagnosticContext};
})();
