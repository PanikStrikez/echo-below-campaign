/* Separate physical outputs and transient transport. Never exports devices or publishes a preview. */
(() => {
 function create(host){
  let node=null,url='',epoch=0,mode='idle',active=null,previewDevice=null,tableDevice=null,lastPublic=null;
  const devices=()=>navigator.mediaDevices;
  const emit=()=>host.changed?.({mode,active,previewDevice:previewDevice?.label||'',tableDevice:tableDevice?.label||'System default (table)'});
  function publish(value){lastPublic=value;host.publish(value);}
  function release(){host.duck(false);}
  function stop(){epoch++;const old=node;node=null;active=null;mode='idle';if(old){old.pause();old.removeAttribute('src');old.load();}if(url){URL.revokeObjectURL(url);url='';}release();if(lastPublic)publish(null);emit();}
  async function outputPicker(kind){
   // Chromium can expose permitted outputs through enumerateDevices even when it
   // has no native selectAudioOutput picker. Permission is requested only by click.
   return new Promise((resolve,reject)=>{
    const box=document.createElement('dialog');box.className='voice-output-picker';
    const add=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;box.append(n);return n;};
    add('h2',kind==='private'?'Choose private headphones':'Choose table speakers');
    add('p','Select a physical output. If names are hidden, your browser may need microphone permission to list them. The microphone is immediately stopped; nothing is recorded or transmitted.');
    const select=add('select','');select.setAttribute('aria-label','Audio output device');const note=add('p','');let outputs=[];
    const refresh=async permission=>{let stream;try{if(permission){stream=await devices().getUserMedia({audio:true});stream.getTracks().forEach(t=>t.stop());stream=null;}outputs=(await devices().enumerateDevices()).filter(d=>d.kind==='audiooutput'&&d.deviceId&&d.label);select.replaceChildren();for(const d of outputs){const o=document.createElement('option');o.value=d.deviceId;o.textContent=d.label;select.append(o);}note.textContent=outputs.length?'Private headphones must be separate from the computer’s default table output.':'No named outputs available. Allow device access or use subtitles and manual reading.';}catch(e){note.textContent='Device access was not granted: '+e.message;}finally{stream?.getTracks().forEach(t=>t.stop());}};
    const finish=value=>{box.close();box.remove();value?resolve(value):reject(Error('Output selection cancelled.'));};
    const allow=add('button','Allow device access and refresh');allow.onclick=()=>void refresh(true);
    const use=add('button','Use selected output');use.onclick=()=>{const d=outputs.find(x=>x.deviceId===select.value);if(d)finish(d);};
    const cancel=add('button','Cancel');cancel.onclick=()=>finish(null);box.oncancel=e=>{e.preventDefault();finish(null);};document.body.append(box);box.showModal();void refresh(false);
   });
  }
  async function choose(kind){stop();if(!devices()?.enumerateDevices||!HTMLMediaElement.prototype.setSinkId)throw Error('This browser cannot safely route private audio. Use a browser with audio-output selection and separate headphones. Table subtitles and manual reading still work.');const d=devices().selectAudioOutput?await devices().selectAudioOutput():await outputPicker(kind);if(kind==='private'){if(!d.deviceId||['default','communications'].includes(d.deviceId))throw Error('Choose named headphones, not the system-default output.');previewDevice=d;}else tableDevice=d;emit();return d;}
  async function privateSink(){
   if(!previewDevice||!HTMLMediaElement.prototype.setSinkId)throw Error('Choose private headphones before previewing.');
   const list=await devices().enumerateDevices(),p=list.find(d=>d.kind==='audiooutput'&&d.deviceId===previewDevice.deviceId);
   const t=list.find(d=>d.kind==='audiooutput'&&d.deviceId===(tableDevice?.deviceId||'default'));
   const system=list.find(d=>d.kind==='audiooutput'&&d.deviceId==='default');
   if(!p||!t||!p.groupId||!t.groupId||p.groupId===t.groupId||p.deviceId===t.deviceId)throw Error('Private headphones must be a different output from the table speakers. Select both outputs explicitly if the default cannot be verified.');
   // Older audio boards play on the system default. Keep previews separate from it too.
   if(!system?.groupId||p.groupId===system.groupId)throw Error('Set the computer’s default sound output to the table speakers before previewing through private headphones.');
   return p.deviceId;
  }
  const volume=()=>Math.min(1,Math.max(0,(host.mix()?.master??80)/100*(host.mix()?.narration??85)/100));
  async function play(blob,options={}){
   stop();const ticket=epoch;active={id:options.id,title:options.title,text:options.text};
   try{
    if(host.mix()?.muted)throw Error('Unmute audio before starting narration.');
    const sink=options.private?await privateSink():tableDevice?.deviceId||'';
    if(ticket!==epoch)return;
    const current=new Audio();node=current;mode=options.private?'preview-loading':'loading';emit();
    if(sink){if(!current.setSinkId)throw Error('This browser cannot use the chosen audio output.');await current.setSinkId(sink);}
    if(ticket!==epoch||host.mix()?.muted)return;
    url=URL.createObjectURL(blob);current.src=url;current.volume=volume();
    current.addEventListener('ended',()=>{if(ticket!==epoch)return;const done=options.onEnded;stop();done?.();},{once:true});
    current.addEventListener('error',()=>{if(ticket!==epoch)return;stop();host.error?.('The recording could not be played. Check its local file.');},{once:true});
    await current.play();if(ticket!==epoch){current.pause();return;}
    mode=options.private?'preview':'playing';
    if(!options.private){host.duck(true);publish({title:options.title,text:options.text,status:'playing'});}
    emit();
   }catch(e){if(ticket===epoch)stop();throw e;}
  }
  function subtitles(options){stop();active=options;mode='subtitles';publish({title:options.title,text:options.text,status:'subtitles'});emit();}
  function pause(){if(!node||!['playing','preview'].includes(mode))return;node.pause();const privateMode=mode==='preview';mode=privateMode?'preview-paused':'paused';release();if(!privateMode)publish({...lastPublic,status:'paused'});emit();}
  async function resume(){if(!node||!['paused','preview-paused'].includes(mode))return;const ticket=epoch,current=node,isPrivate=mode==='preview-paused';if(host.mix()?.muted)throw Error('Audio is muted.');if(isPrivate)await privateSink();if(ticket!==epoch)return;await current.play();if(ticket!==epoch){current.pause();return;}mode=isPrivate?'preview':'playing';if(!isPrivate){host.duck(true);publish({...lastPublic,status:'playing'});}emit();}
  function mixChanged(mix){if(mix?.muted){if(node||active)stop();}else if(node)node.volume=volume();}
  function routeChanged(){stop();previewDevice=null;tableDevice=null;host.error?.('Audio outputs changed. Choose private headphones again before previewing.');}
  devices()?.addEventListener?.('devicechange',routeChanged);window.addEventListener('pagehide',stop);window.addEventListener('echo-audio-state',e=>mixChanged(e.detail));
  return {choose,play,subtitles,pause,resume,stop,privateSink,mixChanged,state:()=>({mode,active,previewDevice:previewDevice?.label||'',tableDevice:tableDevice?.label||'System default (table)'})};
 }
 globalThis.ECHO_VOICE_STUDIO_AUDIO={create};
})();
