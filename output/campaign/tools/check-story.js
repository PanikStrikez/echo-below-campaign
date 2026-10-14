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
const archiveContext=vm.createContext({structuredClone,Map,saveQueue:Promise.resolve(),sessionCache:new Map(),activeCampaignId:'practice',activeSessionId:'one',DATA_VERSION:3,
  state:{schemaVersion:3,scene:'road',party:{'pc-trista':{hp:29,maxHp:29}}},
  campaignRegistry:{campaigns:[{id:'practice',name:'Practice'}]},campaignIndex:{sessions:[{id:'one',name:'One'}],story:JSON.parse(JSON.stringify(seed)),combatLibrary:[{id:'custom-creature'}],presentation:{media:[]},tableExtras:{},rules:{}},
  readRecord:async()=>null,campaignSessionKey:(id,campaign)=>campaign+':'+id,ECHO_RELIABILITY:{validateArchive:()=>({valid:true})},ECHO_PRESENTATION:{exportMedia:async()=>({})}});
vm.runInContext(app.slice(app.indexOf('  async function buildCampaignArchive()'),app.indexOf('  async function downloadCampaign()'))+';globalThis.capture=buildCampaignArchive;',archiveContext);
(async()=>{const captured=await archiveContext.capture();assert.equal(captured.story.sites.length,9);assert.equal(captured.story.npcs.length,9);assert.equal(captured.combatLibrary[0].id,'custom-creature');
  archiveContext.campaignIndex.story.sites[0].name='Changed later';archiveContext.state.party['pc-trista'].hp=1;
  assert.notEqual(captured.story.sites[0].name,'Changed later','Backup must be an immutable snapshot');assert.equal(captured.sessions[0].state.party['pc-trista'].hp,29);console.log('Story and creature library persist in a captured backup independently of later play.');})().catch(e=>{console.error(e);process.exitCode=1;});
require('../Session-01-Story-Data.js');
require('../Session-01-Reliability.js');
require('../Session-01-Recovery.js');
const archive={format:'echo-below-campaign-v2',schemaVersion:2,active:'practice',sessions:[{id:'practice',name:'Practice',state:{schemaVersion:2,scene:'road'}}],story:JSON.parse(JSON.stringify(seed)),presentation:{media:[]},mediaFiles:{}};
const original=JSON.stringify(archive);
const prepared=ECHO_RECOVERY.prepare(archive,value=>structuredClone(value));
assert.equal(prepared.index.story.sites.length,9);
assert.equal(prepared.index.story.npcs.length,9);
assert.equal(prepared.index.schemaVersion,ECHO_RELIABILITY.VERSION);
assert.equal(prepared.index.migrationReport.at(-1).from,2);
assert.equal(prepared.index.active,'practice');
assert.equal(JSON.stringify(archive),original,'Preparing restore must not mutate the source');
assert.throws(()=>ECHO_RECOVERY.prepare({...archive,schemaVersion:ECHO_RELIABILITY.VERSION+1},value=>value),/Update the app/);
assert.match(app,/filter\(entry => entry\.published\)/);
assert.match(app,/text: entry\.playerSaw/);
console.log('Story checks passed: nine sites, 23 floors, nine NPCs, branching, calendar, backup, and player journal controls.');
