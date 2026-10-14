const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'scene-art-refresh');
const register=JSON.parse(fs.readFileSync(path.join(dir,'Scene-Art-Register.json')));
const briefs=JSON.parse(fs.readFileSync(path.join(dir,'Room-Art-Briefs.json')));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const priorFile=path.join(dir,'Generation-Progress.json');
const prior=fs.existsSync(priorFile)?JSON.parse(fs.readFileSync(priorFile)):[];
const style='Wide landscape 3:2 player-facing fantasy story illustration. Cohesive campaign art: refined hand-painted watercolor and gouache with subtle ink edges, weathered earthy materials, muted forest greens and stone grays, restrained amber highlights, realistic grounded scale. Clear observable scene composition at visitor eye level, not a tactical map, no cutaway through closed walls. Room facts and creature anatomy take priority over spectacle. Bright enough to read on a flat table TV while respecting the specified lighting; any off-frame visitor lamp is illustrative and does not establish an actual party light source. No UI, frame, grid, labels, readable documents, watermark, player figures, unexplained magic, invented entrances, hidden loot or secret mechanisms.';
const rows=register.rows.filter(r=>r.type==='illustration'&&r.id!=='cover').map(r=>{
 const brief=briefs[r.catalog?.key||r.id];if(!brief)throw new Error('Missing brief: '+r.id);
 return {id:r.id,title:r.title,image:r.image,key:r.catalog?.key||r.id,chapter:r.catalog?.chapter||'Session 1 / campaign',reveal:r.catalog?.reveal||'DM stages explicitly after discovery',sourceRecordIds:r.contexts.map(x=>x.id),sourceRecords:r.contexts.map(x=>({id:x.id,title:x.title,read:x.read,source:x.source})),brief,prompt:style+'\n\nScene: '+r.title+'\nObservable scene and constraints: '+brief+'\nDo not illustrate a consequence, revelation or creature not specified in this brief. The picture is a prepared view, never evidence that play happened.',originalHash:hash(path.join(root,r.image)),status:'pending',...(prior.find(p=>p.id===r.id)||{})};
});
fs.writeFileSync(path.join(dir,'Generation-Progress.json'),JSON.stringify(rows,null,2));
fs.writeFileSync(path.join(dir,'Map-Invariants.json'),JSON.stringify(register.rows.filter(r=>r.type==='map').map(r=>({id:r.id,image:r.image,sha256:hash(path.join(root,r.image))})),null,2));
fs.mkdirSync(path.join(dir,'candidates'),{recursive:true});
console.log(JSON.stringify({queued:rows.length,missingContext:rows.filter(r=>!r.sourceRecordIds.length).map(r=>r.id),mapInvariants:register.rows.filter(r=>r.type==='map').length}));
