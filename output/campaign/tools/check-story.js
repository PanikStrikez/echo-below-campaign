const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const sandbox = { globalThis: {} };
vm.runInNewContext(fs.readFileSync(path.join(root,'Session-01-Story-Data.js'),'utf8'),sandbox);
const api = sandbox.globalThis.ECHO_STORY_DATA;
const seed = api.normalize();
assert.equal(seed.sites.length,9);
assert.equal(seed.sites[0].name,'Undermountain — The Prime Echo');
assert.equal(seed.sites[8].name,'The Hollow Mountain');
assert.equal(seed.npcs.length,9);
assert(seed.npcs.some(n=>n.name.includes('Dracuseth') && /Waterdeep/i.test(n.source)));
assert.equal(seed.npcs.filter(n=>n.source.startsWith('BOOK NPC')).length,1);
assert.equal(seed.floors.length,23);
assert.equal(api.PHANDELVER_PACKS.length,5);
assert.equal(api.PHANDELVER_PACKS.find(pack=>pack.id==='redbrand').scenes.find(([name])=>name.startsWith('12 ·'))[1],25);
assert.equal(api.CRAGMAW_PAGES.klarg,12);
assert.equal(api.FLOOR_PAGES.length,23);
assert.equal(api.FLOOR_PAGES[0],13);
assert.equal(api.FLOOR_MAPS[0],15);
assert.equal(api.FLOOR_AFTERMATH[22],302);
assert.equal(api.FLOOR_LEVELS[0],5);
for(const pack of api.PHANDELVER_PACKS) assert.ok(pack.mapPage,`Missing marked map page for ${pack.id}`);
for(const file of ['lmop-cragmaw-hideout.jpg','lmop-phandalin.jpg','lmop-redbrand-hideout.jpg',
  'lmop-thundertree.jpg','lmop-cragmaw-castle.jpg','lmop-wave-echo-cave.jpg',
  'madmage-floor-1.jpg','madmage-floor-2.jpg','madmage-floor-3.jpg'])
  assert.ok(fs.statSync(path.join(root,'private-maps',file)).size>100000,`Missing DM map ${file}`);
assert.equal(api.ELDER_RUNES.length,9);
assert(seed.routes.some(route=>route.to==='Skullport' && route.status==='possible'));
assert.match(seed.floors[19].echoOverlay,/amplify/i);
assert.equal(seed.journal.length,0);
const stored = api.normalize({ ...seed,
  evidence:[{id:'clue',title:'A mark',detail:'DM theory',whoKnows:'Selise',playerSaw:'The players saw a worn circle.',status:'Observed',published:true}],
  journal:[{id:'j',title:'Next lead',text:'Go to Phandalin.',published:false}],
  sessionPlans:{'session-01':{nextBeat:'ambush',order:['prep','ambush'],extraBeats:[{id:'optional',title:'Optional stop',scene:'road',read:['A wagon creaks.']}],beats:{ambush:{optional:true,trigger:'If they scout',next:'optional'}}}},
  calendar:{day:12,clocks:[{id:'f',name:'Faction plan',current:2,max:4}]}
});
assert.equal(stored.adventureProgress.phandalin,'ready');
assert.equal(api.normalize({sourceHandouts:{'echo-document-1':{status:'Observed',whoKnows:'Party',shown:true}}}).sourceHandouts['echo-document-1'].shown,true);
assert.equal(stored.evidence[0].status,'Observed');
assert.equal(stored.sessionPlans['session-01'].extraBeats[0].read[0],'A wagon creaks.');
assert.equal(stored.sessionPlans['session-01'].beats.ambush.next,'optional');
assert.equal(stored.calendar.day,12);
assert.equal(stored.calendar.clocks[0].current,2);
const html=fs.readFileSync(path.join(root,'Session-01-TV-Display.html'),'utf8');
for(const id of ['open-story','story-drawer','story-scrim','story-content','story-tool','player-journal','player-journal-button'])assert.ok(html.includes(`id="${id}"`));
assert(html.includes('value="adventures"') && html.includes('value="handouts"'));
const handoutSandbox={globalThis:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'Session-01-Handout-Data.js'),'utf8'),handoutSandbox);
assert.equal(handoutSandbox.globalThis.ECHO_SOURCE_HANDOUTS.filter(item=>item.kind==='Echo recovered document').length,6);
assert.equal(handoutSandbox.globalThis.ECHO_SOURCE_HANDOUTS.filter(item=>item.kind==='Mad Mage secret card').length,18);
const app=fs.readFileSync(path.join(root,'Session-01-Battleboard.js'),'utf8');
assert.match(app,/combatLibrary: campaignIndex\.combatLibrary, story: campaignIndex\.story/);
assert.match(app,/ECHO_RECOVERY.prepare\(archive,normalize\)/);
assert.match(fs.readFileSync(path.join(root,'Session-01-Recovery.js'),'utf8'),/story:ECHO_STORY_DATA.normalize\(archive.story\)/);
assert.match(app,/filter\(entry => entry\.published\)/);
assert.match(app,/text: entry\.playerSaw/);
console.log('Story checks passed: nine sites, 23 floors, nine NPCs, branching, calendar, backup, and player journal controls.');
