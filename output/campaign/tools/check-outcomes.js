const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');global.window=global;global.location={hash:'',protocol:'file:'};
for(const f of ['Campaign-Quests-Data','Campaign-Quests','Campaign-Outcomes','Campaign-Continuity','Session-01-Story-Data'])require(path.join(root,f+'.js'));
const C=ECHO_CONTINUITY,O=ECHO_OUTCOMES,Q=ECHO_QUESTS;
const story=ECHO_STORY_DATA.normalize(),d=C.ensure(story),markers=[{scene:'region-lmop',point:'region-cragmaw-castle',title:'Castle'},{scene:'town-phandalin',point:'phandalin-manor',title:'Manor'},{scene:'region-lmop',point:'region-phandalin',title:'Phandalin'}],ctx={story,markers};
assert.equal(d.events.length,20);assert.equal(O.audit(story).length,0);assert(d.outcomes.original);assert(!C.recap(d).includes('BELOW'));
const migrationStory=ECHO_STORY_DATA.normalize(),older=C.ensure(migrationStory);
older.events=older.events.filter(e=>!e.id.startsWith('actual-redbrand-'));older.seedVersion=1;
older.events.push(C.event({id:'dm-custom-event',title:'A saved table note',detail:'Preserve this event',status:'confirmed',approved:true,source:'Table test'}));
Q.record(older.questGuide,'gundren').published={title:'Find Gundren',text:'Look for him at the castle.',state:'active',audience:'party',at:'before-migration'};
const oldUndo=older.undo.length;C.ensure(migrationStory);
assert.equal(older.seedVersion,3);assert.equal(older.events.filter(e=>e.id==='dm-custom-event').length,1);
assert.equal(older.events.filter(e=>e.id.startsWith('actual-redbrand-')).length,7);
assert.equal(older.undo.length,oldUndo+2);assert.equal(older.questGuide.records.gundren.published,null);
assert(!C.effective(older).some(e=>e.id==='actual-gundren-truth'));
assert(!C.publicJournal(older).some(e=>e.text.includes('Cragmaw Castle')));
C.ensure(migrationStory);assert.equal(older.events.filter(e=>e.id.startsWith('actual-redbrand-')).length,7);
const v2Story=ECHO_STORY_DATA.normalize(),v2=C.ensure(v2Story);
v2.seedVersion=2;v2.events=v2.events.filter(e=>!['actual-redbrand-gundren-at-inn','actual-redbrand-rat-with-trista','actual-redbrand-stop-barthens'].includes(e.id));
const v2Recovered=v2.events.find(e=>e.id==='actual-redbrand-gundren-with-party');
v2Recovered.title='Gundren is with the party';v2Recovered.publicTitle=v2Recovered.title;
v2Recovered.playerText='Glasstaff put Gundren to sleep. Gundren is with the party.';
v2Recovered.tracks[0].holder='With the party';
const v2Draft=v2Story.journal.find(j=>j.id==='actual-redbrand-recap-draft');
v2Draft.text=C.recap(v2,'Latest played Redbrand session');
C.ensure(v2Story);assert.equal(v2.seedVersion,3);
assert.equal(v2Recovered.playerText,'Glasstaff put Gundren to sleep. The party recovered him.');
assert.equal(C.trackers(v2).find(t=>t.key==='gundren').holder,'At an inn; specific inn unreported');
assert.equal(v2Draft.text,C.recap(v2,'Latest played Redbrand session'));
assert(!v2Draft.published);
const raw={points:[{id:'region-cragmaw-castle',visible:false,approved:false,clue:''}]};
const seeded=JSON.stringify(d.events),original=d.outcomes.original;
let draft=O.begin(d,{},'actual-s23-redbrands');draft.event.detail='Correction under review';assert.equal(JSON.stringify(d.events),seeded);d.outcomes.drafts=[];
// Private rescue: selected observer only, no implicit whole-quest closure or publication.
draft=O.begin(d,{kind:'rescue',title:'Private rescue',publicTitle:'Someone helped',detail:'SECRET witness rescued',playerText:'You helped a witness.',status:'completed',basis:'Observed',knows:['pc-trista','sildar'],recipients:['pc-trista'],quests:[{id:'gundren',state:'reference'}]});Object.assign(draft.event.tracks[0],{subject:'SECRET witness',holder:'Trista',state:'resolved'});
let rev=O.preview(d,draft,ctx);assert.deepEqual(rev.errors,[]);const privateId=O.apply(d,draft.id,rev,ctx).id;assert(!C.publicJournal(d).some(x=>x.text.includes('SECRET')));assert.equal(C.questCards(d).find(q=>q.id==='gundren').state,'active');assert(C.knowledge(d,'sildar').some(e=>e.id===privateId));assert(!C.knowledge(d,'barthen').some(e=>e.id===privateId));assert.equal(O.privateJournal(d,'pc-trista').length,1);assert.equal(O.privateJournal(d,'pc-pebble').length,0);
// Reviewed party discovery explicitly reveals one marker and one objective only.
draft=O.begin(d,{kind:'discovery',title:'Castle directions',publicTitle:'Directions found',detail:'SECRET informant gave the route',playerText:'The route to the castle is known.',status:'confirmed',basis:'Claimed',share:'party',knows:['party'],quests:[{id:'gundren',stepId:'gundren-1',state:'completed'}],markers:[{scene:'region-lmop',point:'region-cragmaw-castle',reveal:true}]});
const main=Q.record(d.questGuide,'echo-below');main.draft={title:'The Echo Below',text:'Follow the evidence.'};Q.publication(d,'echo-below','party');const side=Q.record(d.questGuide,'gundren');side.draft={title:'Find Gundren',text:'Find him.'};Q.publication(d,'gundren','party');
rev=O.preview(d,draft,ctx);const discoveryId=O.apply(d,draft.id,rev,ctx).id;assert(main.published);assert.equal(side.published,null);assert(C.projectMap(d,raw,'region-lmop').points[0].visible);assert.equal(Q.cards(d).find(q=>q.id==='gundren').status,'active');assert.equal(Q.cards(d).find(q=>q.id==='gundren').steps[0].state,'completed');assert.equal(Q.cards(d).find(q=>q.id==='gundren').steps[1].state,'open');assert(!JSON.stringify(O.journal(story)).includes('SECRET'));
// Correction moves knowledge, removes this reveal and objective result; undo/redo atomic.
draft=O.begin(d,{},discoveryId);Object.assign(draft.event,{share:'private',knows:['pc-pebble'],recipients:['pc-pebble'],markers:[],quests:[],publicTitle:'Pebble’s route',playerText:'You know a route.'});rev=O.preview(d,draft,ctx);assert(C.projectMap(d,raw,'region-lmop').points[0].visible);O.apply(d,draft.id,rev,ctx);assert(!C.projectMap(d,raw,'region-lmop').points[0].visible);assert.equal(Q.cards(d).find(q=>q.id==='gundren').steps[0].state,'open');assert(!C.knowledge(d,'pc-trista').some(e=>e.id===discoveryId));assert(C.knowledge(d,'pc-pebble').some(e=>e.id===discoveryId));assert(C.restore(d));assert(C.projectMap(d,raw,'region-lmop').points[0].visible);assert(C.restore(d,true));assert(!C.projectMap(d,raw,'region-lmop').points[0].visible);assert.equal(d.outcomes.original,original);
// Custody follows its stable tracked key; no unknown currency quantity is invented.
draft=O.begin(d,{kind:'custody',title:'Token transfer',detail:'Trista entrusted the token to Pebble.',source:'Table test',status:'completed',tracks:[{kind:'custody',key:'below-token',subject:'BELOW token',holder:'Pebble',state:'open',public:false}],knows:['pc-trista','pc-pebble']});O.apply(d,draft.id,O.preview(d,draft,ctx),ctx);assert.equal(C.trackers(d).find(x=>x.key==='below-token').holder,'Pebble');assert(!C.trackers(d,true).some(x=>x.key==='below-token'));assert.equal(C.trackers(d).find(x=>x.key==='hideout-coins').state,'unknown');C.restore(d);assert.equal(C.trackers(d).find(x=>x.key==='below-token').holder,'Trista');
// Conflict detection leaves all live data untouched.
draft=O.begin(d,{title:'Stale preview',detail:'A reviewed note',source:'Table',status:'confirmed'});rev=O.preview(d,draft,ctx);draft.event.detail='Changed after review';const oldCount=d.events.length;assert.throws(()=>O.apply(d,draft.id,rev,ctx),/changed after preview/);assert.equal(d.events.length,oldCount);
let other=O.begin(d,{title:'Bad sharing',detail:'Secret',status:'confirmed',share:'party',playerText:'Public',knows:[]});assert(O.preview(d,other,ctx).errors.some(x=>x.includes('party among')));other.event.status='rumor';other.event.knows=['party'];other.event.markers=[{...markers[0],reveal:true}];assert(O.preview(d,other,ctx).errors.some(x=>x.includes('Map reveals')));
// Shared rumor can be recorded without completing its requested quest or tracker.
other.event.markers=[];other.event.quests=[{id:'gundren',state:'completed'}];O.apply(d,other.id,O.preview(d,other,ctx),ctx);assert.equal(Q.cards(d).find(q=>q.id==='gundren').status,'active');
// Canonical note suppresses original duplicate without deleting it, including a private correction.
story.evidence.push({id:'old-note',title:'Duplicate',detail:'SECRET original',playerSaw:'Former public wording',published:true,status:'Observed'});draft=O.begin(d,{title:'Linked reference',detail:'Corrected private text',status:'confirmed',origins:[{kind:'evidence',id:'old-note'}]});rev=O.preview(d,draft,ctx);assert(rev.changes.journal.before.some(x=>x.id==='old-note'));assert(!rev.changes.journal.after.some(x=>x.id==='old-note'));O.apply(d,draft.id,rev,ctx);assert.equal(story.evidence.length,1);assert(!O.journal(story).some(x=>x.id==='old-note'));C.restore(d);assert(O.journal(story).some(x=>x.id==='old-note'));
// Withdrawal is itself previewed, undoable, and never republishes a superseded source note.
draft=O.begin(d,{title:'Private authoritative note',detail:'Corrected private fact',status:'confirmed',origins:[{kind:'evidence',id:'old-note'}]});const linkedId=O.apply(d,draft.id,O.preview(d,draft,ctx),ctx).id;
draft=O.begin(d,{},linkedId);draft.withdraw=true;rev=O.preview(d,draft,ctx);O.apply(d,draft.id,rev,ctx);assert(!d.events.find(e=>e.id===linkedId).approved);assert(!O.journal(story).some(j=>j.id==='old-note'));assert(C.restore(d));assert(d.events.find(e=>e.id===linkedId).approved);assert(C.restore(d));assert(O.journal(story).some(j=>j.id==='old-note'));
// Duplicate resolution and correction preserve original records and effects are applied once.
draft=O.begin(d,{},'actual-s1-sildar');draft.event.replaces=['actual-s1-hideout'];const count=d.events.length;O.apply(d,draft.id,O.preview(d,draft,ctx),ctx);assert.equal(d.events.length,count);assert(!O.effective(d).some(x=>x.id==='actual-s1-hideout'));C.restore(d);assert(O.effective(d).some(x=>x.id==='actual-s1-hideout'));
// Recap provenance: changing public source withdraws stale derived recap; undo restores it.
const summary=story.journal.find(x=>x.id==='actual-s23-recap-draft');summary.published=true;assert(O.journal(story).some(x=>x.id===summary.id));draft=O.begin(d,{},'actual-s23-stop');draft.event.playerText='A corrected stopping point.';O.apply(d,draft.id,O.preview(d,draft,ctx),ctx);assert(!O.journal(story).some(x=>x.id===summary.id));assert(O.audit(story).some(x=>x.kind==='stale-summary'));C.restore(d);assert(O.journal(story).some(x=>x.id===summary.id));
// Save/reload contains drafts, history, backup, privacy choices and original records.
const round=ECHO_STORY_DATA.normalize(JSON.parse(JSON.stringify(story)));assert.deepEqual(round.continuity,d);assert.equal(C.ensure(round).events.length,d.events.length);
// Existing guide conflicts cannot override confirmed history; authored historical steps import once.
const legacy=ECHO_STORY_DATA.normalize();C.ensure(legacy);delete legacy.continuity.outcomes;const gr=Q.record(legacy.continuity.questGuide,'gundren');gr.status='completed';gr.outcome='Stale conflicting summary';gr.steps['gundren-1']={state:'completed',result:'Existing actual directions',source:'Prior DM entry'};C.ensure(legacy);assert.equal(Q.cards(legacy.continuity).find(q=>q.id==='gundren').status,'active');assert(O.audit(legacy).some(x=>x.kind==='quest'));assert.equal(legacy.continuity.events.filter(e=>e.id==='import-gundren-gundren-1').length,1);C.ensure(legacy);assert.equal(legacy.continuity.events.filter(e=>e.id==='import-gundren-gundren-1').length,1);
console.log('Outcome engine passed: preserved seeds, draft isolation, reviewed multi-view apply, corrections, undo/redo, owner privacy, quest scope, custody, duplicate links, stale recaps, migration and reload.');
// Real production boundaries, including the travel projection order.
for(const f of ['Session-01-Travel-View','Session-01-Travel','Session-01-Map-Data','Session-01-Town-Maps','Session-01-Party-Data','Session-01-Combat-Data','Session-01-Combat-Run','Session-01-Reliability'])require(path.join(root,f+'.js'));
const source=fs.readFileSync(path.join(root,'Session-01-Battleboard.js'),'utf8'),boot=source.lastIndexOf('  if (IS_PLAYER) initPlayer();');vm.runInThisContext(source.slice(0,boot)+`\n globalThis.__outcomes={normalize,newCustomState,publicState,phoneSnapshot,setState:v=>state=v,setCampaign:v=>campaignIndex=v};\n})();`);
const production=ECHO_STORY_DATA.normalize(),ledger=C.ensure(production),extras={travel:ECHO_TRAVEL.normalize()};extras.travel.places.find(p=>p.id==='region-cragmaw-castle').status='rumored';
__outcomes.setCampaign({story:production,tableExtras:extras,rules:null,sessions:[{id:'session-01',name:'Isolated test'}],combatLibrary:[]});__outcomes.setState(__outcomes.normalize({...__outcomes.newCustomState(),scene:'region-lmop'}));
draft=O.begin(ledger,{title:'Known castle',publicTitle:'Directions',detail:'PRIVATE source',playerText:'Castle directions known.',status:'confirmed',share:'party',knows:['party'],markers:[{scene:'region-lmop',point:'region-cragmaw-castle',reveal:true}]});O.apply(ledger,draft.id,O.preview(ledger,draft));
let tv=__outcomes.publicState(),phone=__outcomes.phoneSnapshot();assert(tv.map.scenes['region-lmop'].points.some(p=>p.id==='region-cragmaw-castle'));assert(!JSON.stringify({tv,continuity:phone.continuity}).includes('PRIVATE'));assert.deepEqual(tv.journal,phone.continuity.journal);assert(!phone.continuity.quests.some(q=>q.id==='echo-below'));
console.log('Production projection passed: TV/phone journals match; travel does not overwrite an approved marker reveal; private details stay out of public payloads.');
