/* Link authored plans; never activate quests or publish their drafts on load. */
(() => {
  'use strict';
  const A=globalThis.ECHO_UNDERMOUNTAIN_ARC,P=globalThis.ECHO_QUEST_PREP_DATA;
  for(const n of globalThis.ECHO_UNDERMOUNTAIN_ARC_CAST.rivals)P.names[n.id]=n.name;
  for(const p of A.packages()){
    const old=P.records[p.questId]||{};
    P.records[p.questId]={...old,events:old.events||[],npcs:[...new Set([...(old.npcs||[]),'kestrel','pell','nym',p.id==='map'?'ilvara':p.id==='instrument'?'orren':'durnan'])],
      beats:[...A.beats(p.id).map(b=>b.id),...p.route.rooms],scenes:['wd-portal','wd-research','wd-contact','city-waterdeep','mc-court','um1-table'],
      media:['recorded-cavern','recorded-tavern','recorded-investigation'],stage:'waterdeep',tool:'dungeon',next:p.contract.scope,alternatives:p.route.alternatives};
    const quest=globalThis.ECHO_QUEST_CATALOG.quests.find(q=>q.id===p.questId);
    if(quest){quest.dm=p.summary+' '+p.route.description;quest.reward=p.rewards.join(' ');quest.fallback=p.route.alternatives.join(' ');}
  }
})();
