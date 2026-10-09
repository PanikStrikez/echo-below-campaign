/* Desktop-only client. Credentials/settings/usage never enter campaign records. */
(() => {
 'use strict';
 const PREFIX='/__echo_ai'; let csrf='';
 const message='AI service is unavailable. Reopen the desktop launcher to load the updated local service. Your campaign still works.';
 async function request(path,body,options={}) {
  if(location.protocol!=='http:' || !['127.0.0.1','localhost'].includes(location.hostname)) throw Error('Open the app through the desktop launcher to use AI settings. Local context previews still work here.');
  if(body!==undefined&&!csrf)await status();
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),options.timeout||12000);
  const abort=()=>controller.abort();options.signal?.addEventListener('abort',abort,{once:true});
  try {
   const r=await fetch(PREFIX+path,{method:body===undefined?'GET':'POST',headers:{Accept:'application/json',...(body===undefined?{}:{'Content-Type':'application/json','X-Echo-CSRF':csrf})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',credentials:'same-origin',signal:controller.signal});
   const value=await r.json().catch(()=>null);
   if(!r.ok||!value){if(r.status===403)csrf='';const error=Error(value?.error?.message||message);error.code=value?.error?.code||'service_unavailable';throw error;}
   if(value.csrfToken)csrf=value.csrfToken;
   return value;
  } catch(error) {if(error.name==='AbortError')throw Error('The AI service did not respond in time. Refresh status before retrying; the request may still be running.');if(error instanceof TypeError)throw Error(message);throw error;}
  finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}
 }
 const status=()=>request('/status');
 const job=async id=>(await request('/jobs/'+encodeURIComponent(id))).job;
 const start=async (context,prompt,{requestId}={})=>{
  const checked=globalThis.ECHO_AI_CONTEXT.validate(context);if(!checked.valid)throw Error(checked.errors.join(' '));
  return (await request('/jobs',{requestId:requestId||crypto.randomUUID(),context,prompt})).job;
 };
 globalThis.ECHO_AI_SERVICE={status,configure:settings=>request('/settings',settings),start,job,
  cancel:async id=>(await request('/jobs/'+encodeURIComponent(id)+'/cancel',{})).job,
  beginChatGPT:()=>request('/auth/chatgpt/begin',{}),disconnectChatGPT:()=>request('/auth/chatgpt/disconnect',{}),models:()=>request('/models?provider=chatgpt')};
 Object.assign(globalThis.ECHO_AI_SERVICE,{
  voiceStatus:()=>request('/voices/status'),voiceConfigure:values=>request('/voices/settings',values),
  voiceAccount:()=>request('/voices/account?provider=elevenlabs',undefined,{timeout:45000}),
  voiceCatalog:()=>request('/voices/catalog?provider=elevenlabs',undefined,{timeout:45000}),
  voiceStart:payload=>request('/voices/jobs',{requestId:crypto.randomUUID(),...payload}),
  voiceJob:id=>request('/voices/jobs/'+encodeURIComponent(id)),
  voiceCancel:id=>request('/voices/jobs/'+encodeURIComponent(id)+'/cancel',{})
 });
})();
