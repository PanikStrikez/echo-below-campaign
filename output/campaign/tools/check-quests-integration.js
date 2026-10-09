const assert=require('node:assert/strict');
require('../Campaign-Quests-Data.js');require('../Campaign-Quests.js');require('../Campaign-Continuity.js');require('./check-travel.js');
const C=ECHO_CONTINUITY,Q=ECHO_QUESTS,d=C.ensure(ECHO_STORY_DATA.normalize());
C.ensure=()=>d;
let r=Q.record(d.questGuide,'character-trista');r.notes='SECRET DM CONTRACT';r.draft={title:'Private appointment',text:'Meet your contact discreetly.'};Q.publication(d,'character-trista','pc-trista');
r=Q.record(d.questGuide,'echo-below');r.draft={title:'Current party objective',text:'Investigate the Redbrands.'};Q.publication(d,'echo-below','party');
const phone=__travel.phoneSnapshot(),tv=__travel.publicState();
assert(!JSON.stringify(tv).includes('Private appointment'));assert(!JSON.stringify(tv).includes('SECRET DM'));assert(!JSON.stringify(phone).includes('SECRET DM'));assert(!JSON.stringify(phone).includes('Ilyra'));assert(!phone.continuity.quests.some(q=>q.title==='Current party objective'));assert.equal(tv.mainQuest.title,'Current party objective');
assert(phone.privateClues['pc-trista'].some(q=>q.title==='Private appointment'));
for(const [id,clues]of Object.entries(phone.privateClues))if(id!=='pc-trista')assert(!clues.some(q=>q.title==='Private appointment'));
r=Q.record(d.questGuide,'character-trista');r.published=null;assert(!JSON.stringify(__travel.phoneSnapshot()).includes('Private appointment'));
console.log('Quest production integration passed: real TV and phone projection, party objective, character-only delivery, withdrawal and no future-story or DM-note leakage.');

const side=Q.record(d.questGuide,'route');side.draft={title:'Survey a route',text:'Map the agreed passage.'};Q.publication(d,'route','party');assert(__travel.phoneSnapshot().continuity.quests.some(q=>q.title==='Survey a route'));assert(!JSON.stringify(__travel.publicState()).includes('Survey a route'));d.questGuide.records['echo-below'].published=null;assert.equal(__travel.publicState().mainQuest,null);console.log('Destination checks passed: main on TV only, side on phones only, character only to owner, main hide propagates.');
