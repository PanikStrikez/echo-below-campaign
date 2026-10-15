(() => {
  'use strict';
  const townMaps = ['region-lmop', 'town-phandalin', 'town-conyberry', 'town-thundertree', 'city-waterdeep'];
  globalThis.ECHO_CONTENT_PACKS = [{
    id: 'cragmaw-continuation',
    name: 'Cragmaw Hideout continuation',
    description: 'A reusable follow-on session for the cave. Carries forward the party, creates fresh cave foes, and leaves every reveal under DM control. Duplicate the live session instead if combat is already underway.',
    source: 'Lost Mine of Phandelver, pp. 8–12; The Echo Below opening overlay',
    scenes: ['cover', 'black', ...townMaps, 'cave-mouth', 'approach', 'interior'],
    encounters: ['blind', 'kennel', 'overpass', 'den', 'pools', 'klarg'],
    beats: ['prep', 'cave', 'blind', 'kennel', 'passage', 'bridge', 'den', 'pools', 'klarg', 'sildar', 'close', 'rules'],
    firstScene: 'cave-mouth'
  }, {
    id: 'phandalin-aftermath-next',
    name: 'Next session · Phandalin after Glasstaff',
    defaultName: 'Phandalin · After Glasstaff',
    description: 'Starts at Barthen’s Provisions with Gundren at an unnamed inn and Trista holding the rat. Three leads and an open fallback. Keeps Glasstaff’s castle destination private.',
    source: 'Lost Mine of Phandelver (2014), Phandalin pp. 14–19 and Redbrand Hideout pp. 20–26; confirmed table outcomes.',
    scenes: ['cover', 'black', ...townMaps, 'phandalin-art', 'lmop-barthen-exterior', 'barthen-art', 'phandalin-street', 'redbrand-hideout', 'lmop-tresendar-manor'],
    encounters: [],
    runbook: globalThis.ECHO_STAGE6?.beats || [],
    beats: (globalThis.ECHO_STAGE6?.beats || []).map(beat => beat.id),
    firstScene: 'lmop-barthen-exterior'
  }, {
    id: 'phandalin-session-2',
    name: 'Session 2 · First steps in Phandalin',
    description: 'Begins outside Barthen’s Provisions. Includes town leads, Redbrand pressure, and the full optional hideout route while preserving actual Session 1 knowledge.',
    source: 'Lost Mine of Phandelver pp. 14–26 and appendix B; The Echo Below Session 1 actual recap',
    scenes: ['cover', 'black', ...townMaps, 'phandalin-art', 'barthen-art', 'phandalin-street', 'redbrand-hideout',
      ...(globalThis.LMOP_VISUAL_CATALOG || []).filter(item => ['Phandalin', 'Redbrand Hideout'].includes(item.chapter)).map(item => item.id),
      ...(globalThis.LMOP_BATTLE_MAP_CATALOG || []).filter(item => ['Phandalin', 'Redbrand Hideout'].includes(item.chapter)).map(item => item.id)],
    encounters: ['redbrand-street', 'hideout-cellar', 'hideout-barracks', 'hideout-trap', 'hideout-crypt', 'hideout-pens', 'hideout-crevasse', 'hideout-bugbears', 'hideout-common', 'hideout-glasstaff'],
    beats: (globalThis.ECHO_SESSION2_RUNBOOK || []).map(beat => beat.id),
    runbook: globalThis.ECHO_SESSION2_RUNBOOK || [],
    firstScene: 'lmop-barthen-exterior',
    defaultName: 'Session 2 · Phandalin'
  }, {
    id: 'gundren-session-3',
    name: 'Optional continuation · Wilderness and Cragmaw Castle',
    description: 'Future lead gathering, travel, Thundertree, and Cragmaw Castle. Gundren is already at an unnamed inn, Trista holds Glasstaff’s rat, and the castle destination remains DM-only until discovered. Use the new Phandalin aftermath package first.',
    source: 'Lost Mine of Phandelver pp. 27–41; The Echo Below actual-play continuity',
    scenes: ['cover', 'black', ...townMaps, 'phandalin-art', 'barthen-art', 'redbrand-hideout',
      ...(globalThis.LMOP_VISUAL_CATALOG || []).filter(item => ['Wilderness', 'Thundertree', 'Cragmaw Castle'].includes(item.chapter)).map(item => item.id),
      ...(globalThis.LMOP_BATTLE_MAP_CATALOG || []).filter(item => ['Wilderness', 'Thundertree', 'Cragmaw Castle'].includes(item.chapter)).map(item => item.id)],
    encounters: ['old-owl-well', 'wyvern-tor', 'tt-blights-1', 'tt-blights-2', 'tt-zombies-3', 'tt-blights-5',
      'tt-spiders-6', 'tt-dragon-7', 'tt-zombies-8', 'tt-zombies-11', 'tt-blights-12', 'tt-cultists-13',
      'castle-archers', 'castle-trap', 'castle-barracks', 'castle-hobgoblins', 'castle-banquet',
      'castle-grick', 'castle-shrine', 'castle-guards', 'castle-owlbear', 'castle-king', 'castle-warband'],
    beats: (globalThis.ECHO_SESSION3_RUNBOOK || []).map(beat => beat.id),
    runbook: globalThis.ECHO_SESSION3_RUNBOOK || [],
    firstScene: 'town-phandalin',
    defaultName: 'Wilderness and castle · optional continuation'
  }, {
    id: 'lmop-part-3-visuals',
    name: 'Part 3 · Wilderness and castle visuals',
    description: 'Player-facing art and battle maps for the optional wilderness sites, Thundertree, and Cragmaw Castle. Use the printed adventure for encounters and room keys.',
    source: 'Lost Mine of Phandelver, 2014, part 3',
    scenes: ['cover', 'black', ...townMaps, ...(globalThis.LMOP_VISUAL_CATALOG || []).filter(item =>
      ['Wilderness', 'Thundertree', 'Cragmaw Castle'].includes(item.chapter)).map(item => item.id),
      ...(globalThis.LMOP_BATTLE_MAP_CATALOG || []).filter(item =>
        ['Wilderness', 'Thundertree', 'Cragmaw Castle'].includes(item.chapter)).map(item => item.id)],
    encounters: [], beats: [], runbook: [], firstScene: 'lmop-triboar-trail',
    defaultName: 'Part 3 · Wilderness and castle'
  }, {
    id: 'lmop-part-4-visuals',
    name: 'Session 4 · Wave Echo Cave and homecoming',
    description: 'All 20 rooms, linked encounter cards, Nezznar, Nundro, the Forge, retreat and return journal, and endings based on recorded outcomes. Continue this same save across multiple game nights. Adventure guidance expects level 4 or higher; character levels are unchanged.',
    source: 'Lost Mine of Phandelver, 2014, pp. 42–51 and appendix B; labeled Echo Below additions',
    scenes: ['cover', 'black', ...townMaps, ...(globalThis.LMOP_VISUAL_CATALOG || []).filter(item =>
      ['Wave Echo Cave', 'Epilogue'].includes(item.chapter)).map(item => item.id),
      ...(globalThis.LMOP_BATTLE_MAP_CATALOG || []).filter(item => item.chapter === 'Wave Echo Cave').map(item => item.id)],
    encounters: ['wave-2', 'wave-3', 'wave-4', 'wave-6', 'wave-8', 'wave-9', 'wave-11', 'wave-12', 'wave-14', 'wave-15', 'wave-18', 'wave-19'],
    beats: (globalThis.ECHO_SESSION4_RUNBOOK || []).map(beat => beat.id),
    runbook: globalThis.ECHO_SESSION4_RUNBOOK || [], firstScene: 'lmop-cave-entrance',
    defaultName: 'Session 4 · Wave Echo Cave'
  }, {
    id:'phandalin-waterdeep-transition', name:'Phandalin → Waterdeep · outcome branches',defaultName:'Phandalin → Waterdeep',
    description:'Future homecoming, four Waterdeep leads, staying in Phandalin, travel, the Portal and Mending Court. Carries current party statistics without advancing levels or outcomes.',
    source:'Original Echo Below scenes; LMoP pp.47–51; Dungeon of the Mad Mage pp.6–9.',
    scenes:[...new Set(['cover','black','phandalin-art',...(globalThis.ECHO_TRANSITION_DATA?.staging.scenes||[])])],encounters:[],
    runbook:(globalThis.ECHO_TRANSITION_DATA?.beats||[]).map(b=>({...b,private:[...(b.private||[]),...(b.source||[]).map(s=>`${s.label||s.book} · printed p. ${s.page}. ${s.note||''}`)],run:[...(b.run||[]),`Optional audio cues: ${(b.media||[]).join(', ')}. Preview before playing.`]})),
    beats:(globalThis.ECHO_TRANSITION_DATA?.beats||[]).map(b=>b.id),firstScene:'town-phandalin'
  }, {
    id:'mending-court-home',name:'Mending Court · home and expedition returns',defaultName:'Mending Court · home',
    description:'A reusable Waterdeep home: proposed lodging, independent residents, ordinary returns, relationships and an optional later disturbance. Opening it records no visits or costs.',
    source:'Original Echo Below home; Dungeon of the Mad Mage pp.6–9 anchors the nearby Yawning Portal.',
    scenes:['cover','black','mc-court','city-waterdeep','wd-contact','wd-portal'],encounters:[],
    runbook:globalThis.ECHO_COURTYARD_DATA?.beats||[],beats:(globalThis.ECHO_COURTYARD_DATA?.beats||[]).map(b=>b.id),firstScene:'mc-court'
  }, {
    id:'waterdeep-undermountain-1',name:'Waterdeep arrival & Undermountain Level 1',defaultName:'Waterdeep · First expedition',
    description:'Eight Waterdeep scenes, seven staged handouts, all 41 Level 1 room cards with exact book/stat links, a private marked floor map, a blank tactical canvas, routes and persistent expedition notes. Book baseline: level 5; importing never levels characters.',
    source:'Dungeon of the Mad Mage pp6–26; Echo Below Waterdeep Hub and custom character opportunities',
    scenes:['cover','black','city-waterdeep','wd-portal','wd-research','wd-contact','mc-court','um1-table'],encounters:[],
    runbook:[...(globalThis.ECHO_EXPEDITION?.runbook()||[]),...(globalThis.ECHO_UNDERMOUNTAIN_ARC?.beats()||[])],beats:[...(globalThis.ECHO_EXPEDITION?.runbook()||[]),...(globalThis.ECHO_UNDERMOUNTAIN_ARC?.beats()||[])].map(b=>b.id),firstScene:'city-waterdeep'
  }];
})();
