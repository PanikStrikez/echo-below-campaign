const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..');for(const f of ['Session-01-Party-Data.js','Session-01-Character-Tools.js','Session-01-Player-Tools.js','Session-01-Combat-Data.js','Campaign-Continuity.js','Campaign-Outcomes.js','Session-01-DM-Desk.js','Session-01-Recovery.js'])require(path.join(root,f));
test('compressed restore points round-trip all history and accept old JSON; corrupted payloads fail safely',async()=>{
 const archive={schemaVersion:5,index:JSON.stringify({active:'practice',restorePoints:[]}),sessions:{practice:JSON.stringify({party:{a:{hp:7}},fog:['1,2'],undoStack:Array.from({length:500},()=>({notes:'preserve this exact history'}))})}};
 const before=structuredClone(archive),encoded=await ECHO_RECOVERY.encodePoint(archive);assert.equal(encoded.encoding,'gzip');assert(encoded.bytes<encoded.originalBytes/3);
 assert.deepEqual(await ECHO_RECOVERY.decodePoint(encoded.raw),archive);assert.deepEqual(await ECHO_RECOVERY.decodePoint(JSON.stringify(archive)),archive);
 const bad=JSON.parse(encoded.raw);bad.originalBytes--;await assert.rejects(()=>ECHO_RECOVERY.decodePoint(JSON.stringify(bad)),/size/);assert.deepEqual(archive,before);
});
test('cleanup candidates protect manual and migration originals and retain chosen automatic points',()=>{
 const points=[{id:'manual',kind:'manual'},{id:'migration',kind:'migration'},...Array.from({length:8},(_,i)=>({id:String(i),kind:'automatic'}))],before=structuredClone(points);
 assert.deepEqual(ECHO_RECOVERY.pruneCandidates(points,6).map(x=>x.id),['0','1']);assert.deepEqual(points,before);assert.throws(()=>ECHO_RECOVERY.pruneCandidates(points,0));
});
test('inactive enemy expiry stays in inbox but is marked nonblocking; PCs and repeat saves remain urgent',()=>{
 const s={tokens:[{id:'dead',team:'enemy',hp:0,scene:'map'},{id:'pc',team:'pc',hp:0,scene:'map'}],combat:{effects:[{id:'slow',tokenId:'dead',name:'Ray of Frost',due:true},{id:'save',tokenId:'dead',name:'Repeat save',repeatSave:true,due:true},{id:'regeneration',tokenId:'dead',name:'Regeneration',due:true},{id:'death',tokenId:'pc',name:'Death save',due:true} ]},scene:'map'};
 const out=ECHO_DM_DESK.inbox(s,{},{});assert(out.find(x=>x.id==='slow').inactiveTarget);assert(!out.find(x=>x.id==='save').inactiveTarget);assert(!out.find(x=>x.id==='death').inactiveTarget);assert(!out.find(x=>x.id==='regeneration').inactiveTarget);
});
test('objective publication requires shared confirmed review and supports correction, withdrawal and private rejection',()=>{
 const d=ECHO_CONTINUITY.normalize({seedVersion:999});d.events=[];ECHO_OUTCOMES.ensure({},d);const ctx={objective:{text:'Find Nundro'},markers:[]};
 const event={id:'rescue-test',title:'Rescue',detail:'Nundro rescued in isolated test',source:'test',status:'confirmed',share:'party',knows:['party'],publicTitle:'Rescue',playerText:'Nundro is safe',tableObjective:'Plan a return expedition'};
 const draft=ECHO_OUTCOMES.begin(d,event),review=ECHO_OUTCOMES.preview(d,draft,ctx);assert.equal(review.errors.length,0);assert.equal(review.changes.objective.before[0][1],'Find Nundro');assert.equal(ECHO_OUTCOMES.tableObjective(d,ctx.objective).text,'Find Nundro');
 ECHO_OUTCOMES.apply(d,draft.id,review,ctx);assert.equal(ECHO_OUTCOMES.tableObjective(d).text,'Plan a return expedition');
 const correction=ECHO_OUTCOMES.begin(d,{...event,tableObjective:'Visit the inn'},event.id);correction.event.tableObjective='Visit the inn';const r=ECHO_OUTCOMES.preview(d,correction,ctx);ECHO_OUTCOMES.apply(d,correction.id,r,ctx);assert.equal(ECHO_OUTCOMES.tableObjective(d).text,'Visit the inn');
 ECHO_OUTCOMES.retire(d,event.id);assert.equal(ECHO_OUTCOMES.tableObjective(d,ctx.objective).text,'Find Nundro');
 const secret=ECHO_OUTCOMES.begin(d,{...event,id:'secret',share:'private',knows:['pc-a'],playerText:'',tableObjective:'Hidden castle route'});assert(ECHO_OUTCOMES.preview(d,secret,ctx).errors.some(x=>/whole party/.test(x)));assert(!JSON.stringify(ECHO_OUTCOMES.tableObjective(d,ctx.objective)).includes('castle'));
});

test('reviewed ammunition transfer uses tracked quantity, updates both sheets and rejects stale review',()=>{
 const party=ECHO_PARTY_DATA.seedParty(),sh=party['pc-ringgo'],row=sh.equipment.find(x=>/arrows/i.test(x.name)),stock=sh.resources.find(x=>/arrows/i.test(x.name));stock.current=7;row.quantity=40;
 const c={party,extras:{inventory:[],clues:[]},turn:{},queue:{},scene:'map'},before=structuredClone(party),index=sh.equipment.indexOf(row),M=ECHO_PLAYER_TOOLS;
 M.receive(c.extras,c.party,{kind:'item-request',characterId:sh.id,requestId:'ammo-transfer',verb:'transfer',source:'sheet',itemId:String(index),itemName:row.name,targetId:'pc-pebble',quantity:3});
 const review=M.prepare(c,'ammo-transfer');assert.deepEqual(party,before,'preview does not repair or rewrite a live sheet');const next=M.apply(c,review);
 assert.equal(next.party[sh.id].resources.find(x=>x.id===stock.id).current,4);assert.equal(next.party[sh.id].equipment.find(x=>x.name===row.name).quantity,4);
 assert.equal(next.party['pc-pebble'].resources.find(x=>x.name===row.name).current,3);assert.equal(next.party['pc-pebble'].equipment.find(x=>x.name===row.name).quantity,3);
 stock.current--;assert.throws(()=>M.apply(c,review),/changed/);
});
test('prepared source-map binding survives normalization and governs later waves without changing default maps',()=>{
 const C=ECHO_COMBAT_DATA;assert.equal(C.expectedScene('road'),'road');const normalized=C.normalizeCombat({plans:{road:{sceneId:'prepared-source-road'}}},[{id:'road'}]);
 assert.equal(C.expectedScene('road',normalized.plans),'prepared-source-road');assert.equal(C.expectedScene('road',{}),'road');
 assert.equal(C.expectedScene('road',C.normalizeCombat({plans:{road:{sceneId:'../../bad'}}},[{id:'road'}]).plans),'road');
});

test('a newer DM-reviewed player objective remains usable after an older outcome publication',()=>{
 const d={events:[ECHO_CONTINUITY.event({id:'old',approved:true,status:'confirmed',approvedAt:'2026-10-12T01:00:00Z',share:'party',knows:['party'],tableObjective:'Older objective'})]};
 assert.equal(ECHO_OUTCOMES.tableObjective(d,{text:'Newer approved request',at:'2026-10-12T02:00:00Z'}).text,'Newer approved request');
 assert.equal(ECHO_OUTCOMES.tableObjective(d,{text:'Old hub',at:'2026-10-11T01:00:00Z'}).text,'Older objective');
});

test('level review surfaces unchanged manual bonuses instead of silently replacing confirmed statistics',()=>{
 const sh=ECHO_PARTY_DATA.normalizeSheet(ECHO_PARTY_DATA.levelFourSheet(ECHO_PARTY_DATA.seedParty()['pc-ringgo']));sh.skills.Investigation.override=9;const before=structuredClone(sh);
 const review=ECHO_CHARACTER_TOOLS.level(sh,{die:8,hpRoll:5,className:'Rogue 5',summary:'isolated review'});assert.equal(review.after.skills.Investigation.override,9);assert(review.warnings.some(w=>w.includes('Investigation')&&w.includes('preserved')));assert.deepEqual(sh,before);
});

test('stored formations cannot cross map geometry; new captures retain their scene provenance',()=>{
 const C=ECHO_COMBAT_DATA,wave={positions:{foe:{x:12,y:34}}};assert.deepEqual(C.positionFor(wave,'foe','road','road'),{x:12,y:34});assert.equal(C.positionFor(wave,'foe','source-road','road'),null);
 wave.positionSceneId='source-road';const plan=C.normalizePlan({waves:[wave]},'road');assert.equal(plan.waves[0].positionSceneId,'source-road');assert.deepEqual(C.positionFor(plan.waves[0],'foe','source-road','road'),{x:12,y:34});
});
