/* Floor sections are views of one saved map. No room, creature or fog cloning. */
(() => {
  'use strict';
  const clamp=(v,a,b,d)=>Number.isFinite(Number(v))?Math.max(a,Math.min(b,Number(v))):d;
  function resolution(raw){return raw&&Number.isInteger(raw.cols)&&Number.isInteger(raw.rows)&&raw.cols>=32&&raw.cols<=500&&raw.rows>=20&&raw.rows<=334?{cols:raw.cols,rows:raw.rows}:null;}
  function focus(master,section){
    const a=master?.viewBox,b=section?.sectionBounds||section?.viewBox;
    if(!a||!b||[...a,...b].some(x=>!Number.isFinite(x))||a[2]<=0||a[3]<=0||b[2]<=0||b[3]<=0)throw Error('This section has no verified floor coordinates.');
    const zoom=clamp(Math.min(a[2]/b[2],a[3]/b[3]),1,12,1);
    return {zoom,panX:clamp((.5-(b[0]+b[2]/2-a[0])/a[2])*100*zoom,-550,550,0),panY:clamp((.5-(b[1]+b[3]/2-a[1])/a[3])*100*zoom,-550,550,0)};
  }
  function cleanKeys(keys,size){return [...new Set((Array.isArray(keys)?keys:[]).filter(k=>{if(typeof k!=='string'||!/^\d{1,3},\d{1,3}$/.test(k))return false;const[r,c]=k.split(',').map(Number);return r<size.rows&&c<size.cols;}))];}
  function cell(point,size){return `${Math.max(0,Math.min(size.rows-1,Math.floor(point.y*size.rows/100)))},${Math.max(0,Math.min(size.cols-1,Math.floor(point.x*size.cols/100)))}`;}
  function paint(canvas,keys,size,dm){
    canvas.width=size.cols*4;canvas.height=size.rows*4;
    const ctx=canvas.getContext('2d');ctx.fillStyle=dm?'rgba(4,10,16,.38)':'#142019';ctx.fillRect(0,0,canvas.width,canvas.height);
    for(const key of keys){const[r,c]=key.split(',').map(Number);ctx.clearRect(c*4,r*4,4,4);}
  }
  // The public image is already irreversibly masked. Legacy clients receive a
  // fully transparent coarse overlay, never the private dense reveal ledger.
  const publicOverlay=()=>Array.from({length:640},(_,i)=>`${Math.floor(i/32)},${i%32}`);
  globalThis.ECHO_FLOOR_MAPS={resolution,focus,cleanKeys,cell,paint,publicOverlay};
})();
