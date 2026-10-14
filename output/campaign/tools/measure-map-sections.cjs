/* Decode measurements and pixel comparison; no application state or map IDs changed. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const app=path.resolve(__dirname,'..'),manifest=JSON.parse(fs.readFileSync(path.join(app,'town-maps/sections/phandalin/Sections.json'))),browser=await chromium.launch({headless:true,channel:'chrome'});try{
 const p=await browser.newPage();await p.goto('about:blank');
 const inputs=[{name:'full',file:manifest.source},...manifest.sections.map(s=>({name:s.id,file:s.image}))].map(s=>({...s,data:fs.readFileSync(path.join(app,s.file)).toString('base64'),bytes:fs.statSync(path.join(app,s.file)).size}));
 const results=await p.evaluate(async({inputs,sections})=>{
  const bytes=inputs.map(i=>Uint8Array.from(atob(i.data),c=>c.charCodeAt(0))),rows=inputs.map(i=>({name:i.name,bytes:i.bytes,samples:[]}));
  for(let run=0;run<9;run++)for(let offset=0;offset<inputs.length;offset++){
   const index=(run+offset)%inputs.length,url=URL.createObjectURL(new Blob([bytes[index]],{type:'image/png'})),i=new Image(),t=performance.now();i.src=url;await i.decode();rows[index].samples.push(performance.now()-t);rows[index].nativePixels=[i.naturalWidth,i.naturalHeight];URL.revokeObjectURL(url);
  }
  const images=[];for(const b of bytes){const url=URL.createObjectURL(new Blob([b],{type:'image/png'})),i=new Image();i.src=url;await i.decode();images.push(i);URL.revokeObjectURL(url);}
  const canvas=document.createElement('canvas');canvas.width=images[0].naturalWidth;canvas.height=images[0].naturalHeight;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(images[0],0,0);
  for(let j=0;j<sections.length;j++){const [x,y,w,h]=sections[j].sourcePixelRect,s=document.createElement('canvas');s.width=w;s.height=h;const sc=s.getContext('2d',{willReadFrequently:true});sc.drawImage(images[j+1],0,0);const a=c.getImageData(x,y,w,h).data,b=sc.getImageData(0,0,w,h).data;for(let k=0;k<a.length;k++)if(a[k]!==b[k])throw Error('Saved crop differs from original pixel '+k);}
  return rows.map(r=>({...r,medianDecodeMs:+r.samples.sort((a,b)=>a-b)[4].toFixed(2)}));
 },{inputs,sections:manifest.sections});
 assert.equal(results.length,5);const report={at:new Date().toISOString(),browser:await browser.version(),method:'Real headless Chrome, nine interleaved fresh blob-image decodes per file; excludes network transfer and scene rendering.',results,losslessSavedPixelComparison:true,originalPixelsUnchanged:true,scope:'Optional clean terrain crops. Not auto-staged or assigned new live scene IDs. All four crops combined are larger than the original PNG; load one relevant section only.'};
 const out=path.resolve(app,'../audits/performance/map-sections.json');fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
