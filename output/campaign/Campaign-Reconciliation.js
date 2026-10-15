/* DM-only outcome mirror. Browser saves are the durable outbox; no player transport. */
(() => {
 'use strict';
 const fields=['id','title','detail','publicTitle','playerText','session','kind','status','basis','source','approved','approvedAt','share','knows','recipients','replaces','quests','markers','tracks','relationships','serviceLink'];
 const copy=v=>JSON.parse(JSON.stringify(v));
 let host,token='',busy=false,lastError='',generation=0,reschedule=false;
 const acknowledgedSignatures=new Map();
 const mounted=new Set();
 function normalize(raw={}) { return {version:1,enabled:raw?.enabled===true,head:/^[a-f0-9]{64}$/.test(raw?.head)?raw.head:'',revision:Number.isSafeInteger(raw?.revision)&&raw.revision>=0?raw.revision:0,at:typeof raw?.at==='string'?raw.at.slice(0,40):''}; }
 function metadata(story) { return story.reconciliation ||= normalize(); }
 function snapshot(context) {
  const events=(context.story.continuity?.events||[]).map(raw=>{
   const e=globalThis.ECHO_CONTINUITY.event(raw);
   return Object.fromEntries(fields.filter(k=>e[k]!==undefined).map(k=>[k,copy(e[k])]));
  });
  return {version:1,campaignId:context.campaignId,events};
 }
 const signature=context=>JSON.stringify(snapshot(context));
 function updateStatuses(){for(const view of mounted){if(!view.summary.isConnected){mounted.delete(view);continue;}const c=host.context(),meta=metadata(c.story);
  const state=busy?'updating':lastError?'needs attention':!meta.enabled?'review required':acknowledgedSignatures.get(c.campaignId)!==signature(c)?'update pending':'linked';
  view.summary.textContent='Linked campaign service · '+state;
  if(!view.reviewing)view.status.textContent=lastError||(state==='update pending'?'Browser outcomes are saved. The service has not acknowledged this version yet.':meta.at?'Last linked update: '+meta.at:'No linked update has been approved.');
 }}
 const current=c=>host&&host.context().campaignId===c.campaignId&&signature(host.context())===signature(c);
 async function api(context,path,body) {
  if(globalThis.ECHO_BOOT?.echo===false&&['default','echo-below'].includes(context.campaignId))throw Error('This older blank table has a reserved campaign identity. Start a separate copy before linking it. Its saved data is unchanged.');
  if(location.protocol!=='http:'||!['127.0.0.1','localhost'].includes(location.hostname))throw Error('Open the local desktop app to link the campaign service. Your browser outcomes remain saved.');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try {
   if(!token){const r=await fetch('/__echo_campaign/bootstrap',{signal:controller.signal});if(!r.ok)throw Error('Campaign service is unavailable.');token=(await r.json()).token;}
   const r=await fetch('/__echo_campaign'+path,{method:'POST',headers:{'Content-Type':'application/json','X-Echo-Campaign-Token':token,'X-Echo-Campaign-Id':context.campaignId},body:JSON.stringify(body),signal:controller.signal});
   const value=await r.json();if(!r.ok){if(r.status===403)token='';throw Error(value.error?.message||value.message||'Campaign service rejected the update. Review again.');}return value;
  } catch(e){if(e.name==='AbortError')throw Error('Campaign service timed out. Outcomes are saved locally; retry the linked update.');throw e;}
  finally{clearTimeout(timer);}
 }
 async function acknowledged(context,result) {
  if(host.context().campaignId!==context.campaignId)return;
  const meta=metadata(host.context().story),revision=result.receipt?.revision??result.revision??meta.revision;
  if(revision<meta.revision)return;
  Object.assign(meta,{enabled:true,head:result.hash,revision,at:result.receipt?.at||new Date().toISOString()});
  await host.persist();acknowledgedSignatures.set(context.campaignId,signature(context));lastError='';updateStatuses();
 }
 async function sync() {
  if(!host||busy)return;
  const c=copy(host.context());if(!metadata(c.story).enabled)return;
  busy=true;updateStatuses();const ticket=++generation;
  try{
   const review=await api(c,'/outcomes/preview',{snapshot:snapshot(c)});
   if(!current(c))return;
   if(review.baseHash!==metadata(c.story).head||review.conflicts.length){lastError='Linked records disagree. Review conflicts before updating the service.';return;}
   const result=review.unchanged?{hash:review.hash,revision:review.expectedRevision,receipt:{at:metadata(c.story).at}}:await api(c,'/outcomes/apply',application(review));
   if(ticket===generation)await acknowledged(c,result);
  }catch(e){if(host.context().campaignId===c.campaignId)lastError=e.message;}finally{busy=false;updateStatuses();host?.refresh?.();const queued=reschedule;reschedule=false;if(queued||host&&host.context().campaignId===c.campaignId&&!current(c)&&!lastError)notify();}
 }
 function application(review,resolveIds=[]) {return {snapshot:review.snapshot,baseHash:review.baseHash,expectedRevision:review.expectedRevision,reviewToken:review.reviewToken,approved:true,resolveIds};}
 function notify(){if(!host)return;const c=host.context();if(acknowledgedSignatures.get(c.campaignId)===signature(c))return;if(busy){reschedule=true;return;}void sync();}
 function render(root) {
  if(!host)return;
  const c=host.context(),meta=metadata(c.story);
  const el=(tag,text,p=root)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;p.append(n);return n;};
  const box=el('details'),summary=el('summary','Linked campaign service',box);
  el('p','Approved browser outcomes drive quests, knowledge, journals, maps and recaps. The service mirrors them for search. Sheets, quantities, token positions, source books and reference profiles keep their existing authority.',box);
  const status=el('p',lastError|| (meta.at?'Last linked update: '+meta.at:'No linked update has been approved.'),box);status.setAttribute('role','status');
  const view={summary,status,reviewing:false};mounted.add(view);updateStatuses();
  const body=el('div',null,box),button=el('button','Review linked updates',box);button.type='button';
  button.addEventListener('click',async()=>{
   button.disabled=true;view.reviewing=true;body.replaceChildren();status.textContent='Loading comparison…';
   try{
    const reviewedContext=copy(host.context()),review=await api(reviewedContext,'/outcomes/preview',{snapshot:snapshot(reviewedContext)});
    if(!current(reviewedContext))throw Error('Browser outcomes changed. Review again.');
    status.textContent=`${review.changes.length} linked record changes · ${review.conflicts.length} conflicts. No HP, money, rewards or quantities will be applied.`;
    const consent=[];
    for(const change of review.changes){const card=el('details',null,body);el('summary',`${change.op==='delete'?'Withdraw':'Update'} · ${change.after?.name||change.before?.name||change.id}`,card);
     el('p','Stable record: '+change.id,card);
     if(change.before)el('pre','Before: '+JSON.stringify(change.before,null,2),card);
     if(change.after)el('pre','After: '+JSON.stringify(change.after,null,2),card);
     if(review.conflicts.some(r=>r.id===change.id)){const label=el('label',null,card),check=el('input',null,label);check.type='checkbox';el('span',' Preserve the service version in private history and use this reviewed browser outcome.',label);consent.push({id:change.id,check});card.open=true;}
    }
    const apply=el('button',review.unchanged?'Confirm linked records':'Apply reviewed linked updates',body);apply.type='button';
    apply.addEventListener('click',async()=>{
     if(consent.some(v=>!v.check.checked)){status.textContent='Review each conflict before applying.';return;}
     apply.disabled=true;
     try{
      if(!current(reviewedContext))throw Error('Browser outcomes changed. Review again.');
      await host.persist(); // Never mirror an unsaved local ledger.
      if(!current(reviewedContext))throw Error('Browser outcomes changed while saving. Review again.');
      const result=await api(reviewedContext,'/outcomes/apply',application(review,consent.map(v=>v.id)));
      await acknowledged(reviewedContext,result);status.textContent='Linked records saved. Future approved corrections sync after their browser save.';body.replaceChildren();
     }catch(e){lastError=e.message;status.textContent=e.message;}finally{apply.disabled=false;}
    });
   }catch(e){lastError=e.message;status.textContent=e.message;}finally{button.disabled=false;}
  });
  const history=el('button','View linked revision history',box);history.type='button';
  history.addEventListener('click',async()=>{try{const value=await api(c,'/outcomes/history',{});body.replaceChildren();for(const row of value.history){const entry=el('details',null,body);el('summary',`Revision ${row.sequence} · ${row.created_at}`,entry);el('pre',JSON.stringify(row.receipt,null,2),entry);const inspect=el('button','Inspect preserved version',entry);inspect.type='button';inspect.addEventListener('click',async()=>{try{const detail=await api(c,'/outcomes/history',{sequence:row.sequence});el('pre',JSON.stringify(detail.entry,null,2),entry);inspect.disabled=true;}catch(e){status.textContent=e.message;}});}if(!value.history.length)el('p','No linked revisions yet.',body);}catch(e){status.textContent=e.message;}});
 }
 function currentRecords(data) {
  const rows=new Map();for(const e of globalThis.ECHO_CONTINUITY.effective(data).filter(e=>e.approved&&['confirmed','completed'].includes(e.status))){
   const add=(key,title,text)=>rows.set(key,{sourceId:'current:'+key,kind:'current-situation',title,text,status:e.basis==='Observed'?'confirmed':'unconfirmed',basis:`Current linked state from outcome:${e.id}; ${e.basis}. Historical events can describe an earlier situation; no unrecorded changes are inferred.`});
   for(const t of e.tracks)add(`track:${t.kind}:${t.key}`,t.subject,`${t.state} · ${t.holder||'holder not recorded'}${t.owedTo?' · owed to '+t.owedTo:''}${t.note?' · '+t.note:''}`);
   for(const q of e.quests)if(q.state!=='reference')add(`quest:${q.id}:${q.stepId||'status'}`,q.id,q.state);
   for(const r of e.relationships||[])for(const [field,text] of Object.entries(r.changes))add(`npc:${r.npcId}:${field}`,`${r.npcId} · ${field}`,text);
  }return [...rows.values()].reverse();
 }
 async function stageServiceRecords(records,origin) {
  const c=host.context(),d=globalThis.ECHO_CONTINUITY.ensure(c.story,c.campaignId);globalThis.ECHO_OUTCOMES.ensure(c.story,d);
  const values=[];
  for(const record of records){
   const text=(record.facts||[]).map(f=>f.text).filter(Boolean).join('\n\n');
   if(!text||text.length>2500)throw Error('Choose records with 1–2,500 characters of facts; split longer records before Outcome review.');
   const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
   const identity=await hash(JSON.stringify({campaign:c.campaignId,origin,recordId:record.id})),signature=await hash(JSON.stringify(record));
   values.push({id:'service-'+identity.slice(0,32),kind:'other',title:(record.name||record.id).slice(0,120),detail:text,source:`Structured service ${origin} / ${record.id}`.slice(0,250),session:'Service record · DM review required',status:'confirmed',basis:'Claimed',share:'private',knows:[],recipients:[],serviceLink:{origin,recordId:record.id,signature}});
  }
  // Validate the whole selection before adding any drafts; no partial staging.
  const missing=[];for(const v of values){
   const old=d.events.find(e=>e.id===v.id),pending=d.outcomes.drafts.find(x=>x.event.id===v.id);
   if(old?.serviceLink?.signature===v.serviceLink.signature||pending?.event.serviceLink?.signature===v.serviceLink.signature)continue;
   if(pending)throw Error('This service record already has a different draft. Review or discard it before staging newer facts.');
   missing.push({value:v,target:old?.id||''});
  }
  if(host.context().campaignId!==c.campaignId)throw Error('The campaign changed while staging. Try again in the intended campaign.');
  if(d.outcomes.drafts.length+missing.length>100)throw Error('Finish existing outcome drafts before staging this selection.');
  for(const item of missing){const draft=globalThis.ECHO_OUTCOMES.begin(d,item.value,item.target);if(item.target)Object.assign(draft.event,item.value);}
  host.saveDraft?.('Staged service records for authoritative Outcome review');
  await host.persist();return {added:missing.length,existing:values.length-missing.length};
 }
 globalThis.ECHO_RECONCILIATION=Object.freeze({normalize,snapshot,currentRecords,stageServiceRecords,render,notify,init(value){host=value;lastError='';generation++;},status:()=>({busy,error:lastError})});
})();
