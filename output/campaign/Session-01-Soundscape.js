/* DM audio only. Reuses local media and follows the existing master mute and read-aloud controls. */
(() => {
 'use strict';let host,armed=false,mix={muted:false,master:80,ambience:70,duck:30,ducking:false},revision=0,mode='subtle',intensity=50,rows=[],entries=new Map(),retiring=new Set();
 const gain=e=>Math.max(0,Math.min(1,(mix.muted||mode==='off'?0:1)*mix.master/100*mix.ambience/100*(mix.ducking?mix.duck/100:1)*intensity/100*(mode==='subtle'?.65:1)*e.volume/100*e.fade));
 function apply(e){e.node.volume=gain(e);if(mix.muted||mode==='off')e.node.pause();}
 function retire(e){if(!e)return;const start=performance.now(),from=e.fade,duration=(mix.fade??1)*1000;retiring.add(e);const tick=now=>{if(!retiring.has(e))return;e.fade=duration?from*(1-Math.min(1,(now-start)/duration)):0;apply(e);if(e.fade>0)requestAnimationFrame(tick);else{e.node.pause();retiring.delete(e);}};requestAnimationFrame(tick);}
 async function update(nextRows,nextIntensity,nextMode){rows=nextRows;intensity=nextIntensity;mode=nextMode;if(!armed)return;const gen=++revision,wanted=new Set(rows.filter(r=>r.enabled&&r.mediaId).map(r=>r.id));for(const [id,e]of entries)if(!wanted.has(id)){entries.delete(id);retire(e);}for(const row of rows.filter(r=>r.enabled&&r.mediaId)){
  let e=entries.get(row.id);if(e?.mediaId===row.mediaId){e.volume=row.volume;apply(e);if(!mix.muted&&mode!=='off'&&e.node.paused)void e.node.play().catch(err=>host.error(err.message));continue;}
  const url=await host.url(row.mediaId);if(gen!==revision||!armed)return;if(!url){host.error('A soundscape file is unavailable. Choose another layer.');continue;}
  const old=entries.get(row.id);if(old)retire(old);const node=new Audio(url);e={node,mediaId:row.mediaId,volume:row.volume,fade:0};node.loop=true;entries.set(row.id,e);apply(e);
  const start=performance.now(),duration=(mix.fade??1)*1000;const tick=now=>{if(entries.get(row.id)!==e||!armed)return;e.fade=duration?Math.min(1,(now-start)/duration):1;apply(e);if(e.fade<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);
  if(!mix.muted&&mode!=='off')void node.play().catch(err=>{if(armed&&entries.get(row.id)===e)host.error(`Could not play a layer: ${err.message}. Click Play soundscape again.`);});
 }
 }
 function setMix(value){const wasSilent=mix.muted||mode==='off';mix={...mix,...value};for(const e of [...entries.values(),...retiring])apply(e);if(wasSilent&&!mix.muted&&mode!=='off'&&armed)for(const e of entries.values())void e.node.play().catch(err=>host?.error(err.message));}
 function stop(){armed=false;revision++;for(const e of [...entries.values(),...retiring])e.node.pause();entries.clear();retiring.clear();}
 globalThis.ECHO_SOUNDSCAPE={init:h=>host=h,setMix,update,start:(r,i,m)=>{armed=true;return update(r,i,m);},stop,status:()=>({armed,layers:entries.size,muted:mix.muted,ducking:mix.ducking})};
})();
