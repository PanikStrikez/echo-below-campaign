/* One private backup for browser state, service records and required media. */
(() => {
 'use strict';let host,token='';
 async function api(path,body,binary=false){
  if(globalThis.ECHO_BOOT?.echo===false&&['default','echo-below'].includes(host.context().campaignId))throw Error('Start a separate copy of this older blank table before linking its complete backup; browser-only export remains available.');
  if(location.protocol!=='http:'||!['127.0.0.1','localhost'].includes(location.hostname))throw Error('Open your desktop app to back up or restore both campaign stores. Legacy browser-only recovery remains under Other recovery tools.');
  if(!token){const r=await fetch('/__echo_campaign/bootstrap');if(!r.ok)throw Error('Desktop campaign service is unavailable.');token=(await r.json()).token;}
  const upload=body instanceof Blob,headers={'Content-Type':upload?'application/zip':'application/json','X-Echo-Campaign-Token':token,'X-Echo-Campaign-Id':host.context().campaignId};
  const r=await fetch('/__echo_campaign'+path,{method:'POST',headers,body:upload?body:JSON.stringify(body)});
  if(!r.ok){if(r.status===403)token='';let e;try{e=await r.json();}catch{}throw Error(e?.error?.message||'Complete recovery needs the updated desktop service. Reopen the desktop app after its service update.');}
  return binary?r.blob():r.json();
 }
 async function download(){const archive=await host.archive();await globalThis.ECHO_RECOVERY.rehearse(archive,host.normalize);host.toast('Building a verified backup of both stores and artwork. Large media may take a few minutes.');
  const blob=await api('/backup/create',{archive},true),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='Echo-Whole-Campaign-'+archive.campaign.id+'.zip';link.click();setTimeout(()=>URL.revokeObjectURL(url),60000);host.toast('Complete campaign backup downloaded. Books and accounts remain separate.');}
 async function preview(file){return api('/backup/upload',file);}
 function summary(root,value){const p=value.preview,el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;root.append(n);return n;};
  el('h3',p.campaign.name+' · restore preview');el('p',`Original identity: ${p.campaign.id}. Restore creates a separate campaign; the current table stays open.`);
  el('p',`${p.sessions} sessions · scene: ${p.currentScene} · ${p.structuredRecords} structured records.`);
  for(const c of p.characters)el('p',`${c.name} · level ${c.level??'unknown'} · HP ${c.hp??'?'} / ${c.maxHp??'?'}`);
  const quests=document.createElement('details');root.append(quests);const label=document.createElement('summary');label.textContent=`Quests (${p.quests.length})`;quests.append(label);
  for(const q of p.quests){const n=document.createElement('p');n.textContent=`${q.id}: ${q.status||'unassigned'} · ${q.published?'published':'private / unpublished'}`;quests.append(n);}
  el('p',`Browser version ${p.browserVersion}; database version ${p.databaseVersion}: ${p.databaseCompatible?'compatible':'incompatible'}.`);
  el('p',`${p.requiredMedia} required media verified in the ZIP. ${p.missingMedia.length} absent locally will be installed; ${p.conflictingMedia.length} conflicting files will block restore.`);
  for(const file of [...p.missingMedia,...p.conflictingMedia])el('p',file);
  el('p',p.linkedStores?'Both outcome stores matched when captured.':'Both stores are included, but their outcome heads did not match. Review linked outcomes after restore.');
  el('p','Provider credentials, accounts, phone assignments, personal books and rebuildable book indexes are excluded.');
 }
 async function openRestore(file){
  host.toast('Checking backup hashes, both store versions and required media…');let value;
  try{value=await preview(file);await globalThis.ECHO_RECOVERY.rehearse(value.archive,host.normalize);}
  catch(e){if(value?.ticket)await api('/backup/cancel',{ticket:value.ticket}).catch(()=>{});throw e;}
  host.content('Restore whole campaign',root=>{
   summary(root,value);const status=document.createElement('p');status.setAttribute('role','status');root.append(status);
   const action=document.createElement('button');action.type='button';action.textContent='Restore as separate campaign';action.className='primary';action.disabled=!value.preview.databaseCompatible||value.preview.conflictingMedia.length>0;root.append(action);
   const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Cancel restore';root.append(cancel);
   cancel.onclick=async()=>{action.disabled=true;await api('/backup/cancel',{ticket:value.ticket}).catch(()=>{});status.textContent='Cancelled. Current campaign unchanged.';cancel.disabled=true;};
   action.onclick=async()=>{
    action.disabled=true;cancel.disabled=true;let staged=false,registered=false;
    const id=`campaign-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    try{
     status.textContent='Preparing and verifying a separate database…';
     const prepared=await api('/backup/prepare',{ticket:value.ticket,targetCampaignId:id});
     status.textContent='Storing browser sessions and imported media in one transaction…';
     await host.stageBrowser(value.archive,id,prepared,value.preview);staged=true;
     status.textContent='Installing verified media and committing the separate service store…';
     await api('/backup/commit',{ticket:value.ticket,targetCampaignId:id});
     await host.register(id,value.archive.campaign.name,value.archive.campaign.id);registered=true;
     status.textContent='Both campaign stores restored and verified. Your current table is still open.';
     const open=document.createElement('button');open.type='button';open.textContent='Open restored campaign';root.append(open);open.onclick=()=>host.open(id);
     action.remove();await api('/backup/cancel',{ticket:value.ticket}).catch(()=>{});
    }catch(e){if(!registered)await host.discard(id);await api('/backup/cancel',{ticket:value.ticket}).catch(()=>{});status.textContent=e.message+' The original campaign remains usable. Keep your backup ZIP.';}
   };
  });
 }
 globalThis.ECHO_WHOLE_BACKUP=Object.freeze({init:value=>{host=value;},download,preview,openRestore,check:()=>api('/backup/check',{})});
})();
