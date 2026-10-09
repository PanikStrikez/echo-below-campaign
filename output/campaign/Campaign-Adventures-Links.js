/* Private references only. Loading packages never starts a quest, encounter or visit. */
(() => {
 'use strict';const A=globalThis.ECHO_ADVENTURES,P=globalThis.ECHO_QUEST_PREP_DATA;
 const pack=A.pack();if(!globalThis.ECHO_CONTENT_PACKS.some(p=>p.id===pack.id))globalThis.ECHO_CONTENT_PACKS.push(pack);
 // Existing primary leads and their history stay intact; authored chapters are extra selectable approaches.
 for(const qid of new Set([...A.chapters(),...A.sites()].map(x=>x.questId))){const old=P.records[qid]||{};P.records[qid]={...old,beats:[...new Set([...(old.beats||[]),...A.beatsForQuest(qid)])]};}
 const old=P.records['silent-library']||{};P.records['silent-library']={...old,scenes:['wd-research','sl-library-map','city-waterdeep','mc-court'],npcs:[...new Set([...(old.npcs||[]),'selise'])],media:['recorded-investigation'],tool:'chapters',next:'Review access and the residents’ needs; use the four archive room cards and choose custody together.',alternatives:[...(old.alternatives||[]),'Request copies from a willing custodian, commission a bounded inspection, or keep investigating independent dungeon records. The Library is optional.']};
})();
