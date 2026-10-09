(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clean = (value, length = 160) => String(value ?? '').slice(0, length);
  const esc = value => clean(value, 4000).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const id = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const modes = ['battle', 'scene', 'handout', 'journal', 'title', 'black', 'card'];
  const kinds = ['image', 'audio', 'video'];
  const number = (value, fallback, min = 0, max = 100) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
  const defaults = [
    { id: 's1-departure', name: 'Session 1 · Gundren departs', mode: 'scene', sceneId: 'gundren', mediaId: 'gundren-art', ambienceId: '', musicId: 'recorded-journey', handoutId: '', banner: 'The road to Phandalin', objective: '', echo: false },
    { id: 's1-horses', name: 'Session 1 · Dead horses', mode: 'scene', sceneId: 'horses', mediaId: 'horses-art', ambienceId: '', musicId: 'recorded-dark-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-ambush', name: 'Session 1 · Road battle', mode: 'battle', sceneId: 'road', mediaId: '', ambienceId: '', musicId: 'recorded-ambush', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-trail', name: 'Session 1 · Goblin trail', mode: 'scene', sceneId: 'trail-art', mediaId: 'trail-art', ambienceId: '', musicId: 'recorded-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-cave-mouth', name: 'Session 1 · Cave entrance', mode: 'scene', sceneId: 'cave-mouth', mediaId: 'cave-art', ambienceId: 'recorded-river', musicId: 'recorded-dark-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-hideout', name: 'Session 1 · Hideout map', mode: 'battle', sceneId: 'interior', mediaId: '', ambienceId: 'recorded-river', musicId: 'recorded-dark-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-blind', name: 'Session 1 · Goblin blind', mode: 'battle', sceneId: 'interior', mediaId: '', ambienceId: 'recorded-river', musicId: 'recorded-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-kennel', name: 'Session 1 · Wolf kennel', mode: 'battle', sceneId: 'interior', mediaId: '', ambienceId: 'recorded-river', musicId: 'recorded-dark-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-overpass', name: 'Session 1 · Overpass', mode: 'battle', sceneId: 'interior', mediaId: '', ambienceId: 'recorded-river', musicId: 'recorded-dark-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-den', name: 'Session 1 · Yeemik’s bargain', mode: 'battle', sceneId: 'interior', mediaId: '', ambienceId: 'recorded-river', musicId: 'recorded-dark-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-pools', name: 'Session 1 · Twin pools', mode: 'battle', sceneId: 'interior', mediaId: '', ambienceId: 'recorded-river', musicId: 'recorded-dark-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-klarg', name: 'Session 1 · Klarg’s cave', mode: 'battle', sceneId: 'interior', mediaId: '', ambienceId: 'recorded-river', musicId: 'recorded-boss', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-rescue', name: 'Session 1 · Sildar rescued', mode: 'scene', sceneId: 'den-art', mediaId: 'den-art', ambienceId: 'recorded-river', musicId: 'recorded-journey', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's1-phandalin', name: 'Session 1 · Phandalin arrival', mode: 'scene', sceneId: 'phandalin-art', mediaId: 'phandalin-art', ambienceId: '', musicId: 'recorded-town', handoutId: '', banner: 'Phandalin', objective: '', echo: false },
    { id: 's2-barthen', name: 'Session 2 · Barthen’s Provisions', mode: 'scene', sceneId: 'barthen-art', mediaId: 'barthen-art', ambienceId: '', musicId: 'recorded-town', handoutId: '', banner: 'Phandalin', objective: '', echo: false },
    { id: 's2-town', name: 'Session 2 · Around town', mode: 'scene', sceneId: 'phandalin-art', mediaId: 'phandalin-art', ambienceId: '', musicId: 'recorded-town', handoutId: '', banner: 'Phandalin', objective: '', echo: false },
    { id: 's2-stonehill', name: 'Session 2 · Stonehill Inn', mode: 'scene', sceneId: 'lmop-stonehill-common-room', mediaId: 'lmop-stonehill-common-room', ambienceId: 'recorded-fire', musicId: 'recorded-tavern', handoutId: '', banner: 'Stonehill Inn', objective: '', echo: false },
    { id: 's2-redbrands', name: 'Session 2 · Redbrand street', mode: 'battle', sceneId: 'phandalin-street', mediaId: '', ambienceId: '', musicId: 'recorded-ambush', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's2-hideout', name: 'Session 2 · Redbrand hideout', mode: 'battle', sceneId: 'redbrand-hideout', mediaId: '', ambienceId: '', musicId: 'recorded-dark-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's3-town', name: 'Session 3 · Choose a lead', mode: 'battle', sceneId: 'town-phandalin', mediaId: '', ambienceId: '', musicId: 'recorded-town', handoutId: '', banner: 'Where is Gundren?', objective: '', echo: false },
    { id: 's3-trail', name: 'Session 3 · Wilderness trail', mode: 'scene', sceneId: 'lmop-triboar-trail', mediaId: 'lmop-triboar-trail', ambienceId: '', musicId: 'recorded-forest', handoutId: '', banner: '', objective: '', echo: false },
    { id: 's3-castle-sight', name: 'Session 3 · Castle revealed', mode: 'scene', sceneId: 'lmop-castle-approach', mediaId: 'lmop-castle-approach', ambienceId: '', musicId: 'recorded-dark-forest', handoutId: '', banner: 'Cragmaw Castle', objective: '', echo: false },
    { id: 's3-castle-map', name: 'Session 3 · Castle map', mode: 'battle', sceneId: 'lmop-map-cragmaw-castle', mediaId: '', ambienceId: '', musicId: 'recorded-dark-forest', handoutId: '', banner: '', objective: 'Find Gundren', echo: false },
    { id: 's3-castle-infiltration', name: 'Session 3 · Castle infiltration', mode: 'battle', sceneId: 'lmop-map-cragmaw-castle', mediaId: '', ambienceId: 'recorded-cavern', musicId: 'recorded-investigation', handoutId: '', banner: '', objective: 'Find Gundren', echo: false },
    { id: 's3-grol', name: 'Session 3 · King’s quarters', mode: 'battle', sceneId: 'lmop-map-cragmaw-castle', mediaId: '', ambienceId: '', musicId: 'recorded-boss', handoutId: '', banner: '', objective: 'Protect Gundren', echo: false },
    { id: 'battle', name: 'Battlefield', mode: 'battle', sceneId: '', mediaId: '', ambienceId: '', musicId: '', handoutId: '', banner: '', objective: '', echo: false },
    { id: 'blackout', name: 'Blackout', mode: 'black', sceneId: '', mediaId: '', ambienceId: '', musicId: '', handoutId: '', banner: '', objective: '', echo: false },
    { id: 'echo', name: '[SPOILER] Nine-site reveal', mode: 'scene', sceneId: '', mediaId: 'nine-sites', ambienceId: '', musicId: '', handoutId: '', banner: 'The Echo Below', objective: '', echo: true }
  ];
  const builtins = [
    ['cover-art', 'Campaign cover', 'assets/Echo-Below-Cover.png'],
    ['nine-sites', '[SPOILER] Nine sites art', 'assets/Nine-Sites-Watercolor.png'],
    ['waterdeep-map', 'Waterdeep city map', 'assets/Waterdeep-City-Map.png'],
    ['phandalin-town-map', 'Phandalin town map', 'town-maps/professional/phandalin-overhead.png'],
    ['conyberry-town-map', 'Conyberry town map', 'town-maps/professional/conyberry-overhead.png'],
    ['thundertree-town-map', 'Thundertree town map', 'town-maps/professional/thundertree-overhead.png'],
    ['waterdeep-cast', 'Waterdeep cast', 'assets/Waterdeep-Cast-Watercolor.png'],
    ['gundren-art', 'Gundren departs', 'session-01-visuals/scene-01-gundren-departs.png'],
    ['horses-art', 'The empty horses', 'session-01-visuals/scene-02-empty-horses.png'],
    ['cave-art', 'Cave mouth', 'session-01-visuals/scene-03-cave-mouth.png'],
    ['road-reveal-art', 'Road ambush · revealed', 'session-01-visuals/scene-12-road-ambush-reveal.png'],
    ['trail-art', 'Goblin trail', 'session-01-visuals/scene-04-goblin-trail.png'],
    ['snare-art', 'Snare · discovered', 'session-01-visuals/scene-13-snare-discovered.png'],
    ['pit-art', 'Pit · discovered', 'session-01-visuals/scene-14-pit-discovered.png'],
    ['blind-art', 'Area 2 · Goblin blind', 'session-01-visuals/scene-05-goblin-blind.png'],
    ['kennel-art', 'Area 3 · Kennel', 'session-01-visuals/scene-06-kennel.png'],
    ['passage-art', 'Area 4 · Steep passage', 'session-01-visuals/scene-07-steep-passage.png'],
    ['overpass-art', 'Area 5 · Overpass', 'session-01-visuals/scene-08-overpass.png'],
    ['den-art', 'Area 6 · Goblin den', 'session-01-visuals/scene-09-goblin-den.png'],
    ['pools-art', 'Area 7 · Twin pools', 'session-01-visuals/scene-10-twin-pools.png'],
    ['klarg-art', 'Area 8 · Klarg’s cave', 'session-01-visuals/scene-11-klargs-cave.png'],
    ['phandalin-art', 'Phandalin arrival · optional', 'session-01-visuals/scene-15-phandalin-arrival.png'],
    ['barthen-art', 'Barthen’s Provisions · optional', 'session-01-visuals/scene-16-barthens-provisions.png']
  ].map(([id, name, path]) => ({ id, name, kind: 'image', category: id === 'waterdeep-map' || id.endsWith('-town-map') ? 'map' : 'art', mime: 'image/png', path, hash: '', size: 0,
    tags: id === 'nine-sites' ? ['spoiler', 'Nine'] : [], source: 'Echo Below campaign art' }))
    .concat((globalThis.LMOP_VISUAL_CATALOG || []).map(item => ({ id: item.id, name: `${item.chapter} · ${item.title}`,
      kind: 'image', category: 'art', mime: 'image/png', path: item.image, hash: '', size: 0,
      tags: [item.chapter, item.key], source: 'Lost Mine of Phandelver · campaign illustration' })))
    .concat((globalThis.LMOP_BATTLE_MAP_CATALOG || []).map(item => ({ id: item.id, name: `${item.chapter} · ${item.title}`,
      kind: 'image', category: 'map', mime: item.image.endsWith('.svg') ? 'image/svg+xml' : 'image/png', path: item.image, hash: '', size: 0,
      tags: [item.chapter, 'battle map'], source: 'Lost Mine of Phandelver · original player-safe battle map' })))
    .concat([
      ['recorded-journey','Treasure Hunter · journey','journey.mp3','music','TAD · CC0 · OpenGameArt'],
      ['recorded-forest','Forest Ambience · trail','forest.mp3','music','TinyWorlds · CC0 · OpenGameArt'],
      ['recorded-dark-forest','Dark Forest Theme · tension','dark-forest.mp3','music','cynicmusic · CC0 · OpenGameArt'],
      ['recorded-town','A New Town · Phandalin','town.mp3','music','The Cynic Project · CC0 · OpenGameArt'],
      ['recorded-ambush','Battle Theme · combat','ambush.mp3','music','Wolfgang_ · CC0 · OpenGameArt'],
      ['recorded-boss','Epic Boss Battle · Klarg','boss.wav','music','Juhani Junkala · CC0 · OpenGameArt'],
      ['recorded-river','Vistula river · cave stream','river.mp3','ambience','RandomMind · CC0 · OpenGameArt'],
      ['recorded-goblin','Goblin Cackle · reveal','goblin.wav','sfx','spookymodem · CC BY 3.0 · OpenGameArt'],
      ['recorded-wolf','Wolf monster · kennel','wolf.mp3','sfx','CaveboyTup · CC0 · OpenGameArt'],
      ['recorded-splash','Water splash · flood','splash.wav','sfx','Peludo · CC0 · OpenGameArt'],
      ['recorded-tavern','The Old Tower Inn · tavern','tavern.mp3','music','RandomMind · CC0 · OpenGameArt'],
      ['recorded-bard','The Bard’s Tale · quiet travel','bard.mp3','music','RandomMind · CC0 · OpenGameArt'],
      ['recorded-battle-alt','Battle Theme A · urgent combat','battle-alt.mp3','music','cynicmusic · CC0 · OpenGameArt'],
      ['recorded-investigation','Unsolved Investigation · stealth','investigation.wav','music','isaiah658 · CC0 · OpenGameArt'],
      ['recorded-victory','Medieval Victory · scene stinger','victory.mp3','sfx','RandomMind · CC0 · OpenGameArt'],
      ['recorded-cavern','Into the Caves · ominous bed','cavern.wav','ambience','Umplix · CC0 · OpenGameArt'],
      ['recorded-rain','Window rain · weather','rain.mp3','ambience','Ylmir · CC0 · OpenGameArt'],
      ['recorded-fire','Fireplace · hearth','fire.wav','ambience','PagDev · CC0 · OpenGameArt'],
      ['recorded-blade','Blade strike','blade.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-book','Book or page','book.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-chain','Chain rattle','chain.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-creature-hurt','Creature hurt','creature-hurt.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-roar','Monster roar','roar.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-coins','Coins','coins.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-gem','Gem found','gem.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-lock','Lock clicks','lock.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-metal','Metal impact','metal.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-spell','Spell cast','spell.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-fire-spell','Fire spell','fire-spell.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-stones','Falling stones','stones.ogg','sfx','rubberduck · CC0 · OpenGameArt'],
      ['recorded-wood','Wood impact','wood.ogg','sfx','rubberduck · CC0 · OpenGameArt']
    ].map(([id,name,file,group,source]) => ({id,name,kind:'audio',category:'audio',
      mime:file.endsWith('.mp3')?'audio/mpeg':file.endsWith('.ogg')?'audio/ogg':'audio/wav',path:`audio/recorded/${file}`,hash:'',size:0,
      tags:[group,'campaign'],source})));
  const normalizeMedia = item => ({ id: clean(item.id, 80), name: clean(item.name, 100), kind: kinds.includes(item.kind) ? item.kind : 'image',
    category: ['art', 'map', 'portrait', 'item card', 'audio', 'video'].includes(item.category) ? item.category : item.kind === 'image' ? 'art' : item.kind,
    audience: item.audience === 'dm' || ['assets/Nine-Sites-Watercolor.png','assets/Nine-Sites-Atlas.png','assets/Waterdeep-City-Map.png','world-maps/Sword-Coast-Campaign-Map.png'].includes(item.path) ? 'dm' : 'table', mime: clean(item.mime, 80), path: (/^(assets|session-01-visuals|session-02-visuals|lmop-visuals|lmop-battle-maps|town-maps)\/[A-Za-z0-9/_-]+\.(png|jpg|jpeg|webp|svg)$/i.test(item.path || '') ||
      /^audio\/(?:recorded\/)?[A-Za-z0-9_-]+\.(?:wav|mp3|ogg)$/i.test(item.path || '')) ? item.path : '',
    hash: clean(item.hash, 100), size: number(item.size, 0, 0, 100000000), tags: Array.isArray(item.tags) ? item.tags.slice(0, 12).map(x => clean(x, 40)) : [], source: clean(item.source, 200) });
  const normalizePage = page => ({ mediaId: clean(page.mediaId, 80), label: clean(page.label, 80), zoom: number(page.zoom, 100, 50, 300),
    panX: number(page.panX, 0, -100, 100), panY: number(page.panY, 0, -100, 100), crop: number(page.crop, 0, 0, 35) });
  const normalizeHandout = item => ({ id: clean(item.id, 80), title: clean(item.title, 100), text: clean(item.text, 1000),
    pages: Array.isArray(item.pages) ? item.pages.slice(0, 20).map(normalizePage) : [] });
  const normalizePreset = item => ({ id: clean(item.id, 80), name: clean(item.name, 100), mode: modes.includes(item.mode) ? item.mode : 'battle',
    sceneId: clean(item.sceneId, 80), mediaId: clean(item.mediaId, 80), ambienceId: clean(item.ambienceId, 80), musicId: clean(item.musicId, 80),
    handoutId: clean(item.handoutId, 80), banner: clean(item.banner, 100), objective: clean(item.objective, 160), echo: item.echo === true });
  const normalizeCue = cue => ({ id: clean(cue.id, 80), action: ['scene', 'art', 'mode', 'sound', 'handout', 'banner', 'objective', 'black', 'echo'].includes(cue.action) ? cue.action : 'mode',
    value: clean(cue.value, 160), label: clean(cue.label, 100) });
  const sceneSoundCues = {
    ambush:[{id:'s1-goblins-reveal',action:'sound',value:'recorded-goblin',label:'Goblins emerge'}],
    kennel:[{id:'s1-wolf-growl',action:'sound',value:'recorded-wolf',label:'Wolves react'}],
    bridge:[{id:'s1-flood-surge',action:'sound',value:'recorded-splash',label:'Flood released'}]
  };
  const quickEffects = [
    ['recorded-blade','Sword'], ['recorded-lock','Lock'], ['recorded-coins','Coins'],
    ['recorded-spell','Spell'], ['recorded-fire-spell','Fire spell'], ['recorded-roar','Monster'],
    ['recorded-stones','Falling stones'], ['recorded-victory','Victory']
  ];
  const formerMusic = {'score-road-journey': 'recorded-journey', 'score-uneasy-road': 'recorded-dark-forest', 'score-goblin-ambush': 'recorded-ambush', 'score-forest-trail': 'recorded-forest', 'score-cave-shadows': 'recorded-dark-forest', 'score-goblin-bargain': 'recorded-dark-forest', 'score-klarg': 'recorded-boss', 'score-rescue': 'recorded-journey', 'score-phandalin': 'recorded-town'};
  const formerAmbience = {'road-wind':'','cragmaw-stream':'recorded-river','phandalin-evening':''};
  const formerEffects = {'fx-goblins-reveal':'recorded-goblin','fx-wolf-growl':'recorded-wolf','fx-flood-surge':'recorded-splash'};
  function normalizeLibrary(raw = {}) {
    if(Array.isArray(raw?.media)&&raw.media.length>5000)throw Error('This media library exceeds 5,000 entries. Keep the original backup.');
    const legacyAudioIds = new Set(['road-wind','cragmaw-stream','phandalin-evening','yawning-portal-room','echo-pressure','nine-resonances',
      ...Object.keys(formerMusic),'fx-goblins-reveal','fx-snare-snap','fx-flood-surge','fx-wolf-growl','fx-echo-discovery']);
    const saved = Array.isArray(raw?.media) ? raw.media.slice(0, 5000).map(normalizeMedia).filter(m => m.id && !(m.id === 'lmop-storeroom' && m.path === 'lmop-visuals/storeroom.png')) : [];
    const media = raw?.contentProfile === 'blank' ? saved : [...builtins, ...saved.filter(m => !legacyAudioIds.has(m.id) && !builtins.some(b => b.id === m.id))];
    const savedPresets = Array.isArray(raw?.presets) ? raw.presets.slice(0, 100).map(normalizePreset).map(p =>
      p.id === 'echo' && p.name === 'Echo glimpse' ? { ...p, name: '[SPOILER] Nine-site reveal' } : p) : null;
    const presets = savedPresets || structuredClone(defaults);
    if (savedPresets && Number(raw?.presetCatalogVersion || 0) < 2)
      for (const preset of defaults.filter(p => p.id.startsWith('s1-'))) {
        const existing=presets.find(item => item.id === preset.id);
        if (!existing) presets.push(structuredClone(preset));
        else if (!existing.musicId && existing.name === preset.name)
          existing.musicId = preset.musicId;
      }
    if (savedPresets && Number(raw?.presetCatalogVersion || 0) < 3)
      for (const preset of presets) if (preset.id.startsWith('s1-')) {
        if (formerMusic[preset.musicId]) preset.musicId = formerMusic[preset.musicId];
        if (Object.hasOwn(formerAmbience, preset.ambienceId)) preset.ambienceId = formerAmbience[preset.ambienceId];
      }
    if (savedPresets && Number(raw?.presetCatalogVersion || 0) < 4)
      for (const preset of defaults.filter(p => p.id.startsWith('s2-')))
        if (!presets.some(item => item.id === preset.id)) presets.push(structuredClone(preset));
    if (savedPresets && Number(raw?.presetCatalogVersion || 0) < 5 && !presets.some(item => item.id === 's2-hideout'))
      presets.push(structuredClone(defaults.find(item => item.id === 's2-hideout')));
    if (savedPresets && Number(raw?.presetCatalogVersion || 0) < 6)
      for (const preset of defaults.filter(item => item.id.startsWith('s3-')))
        if (!presets.some(item => item.id === preset.id)) presets.push(structuredClone(preset));
    if (savedPresets && Number(raw?.presetCatalogVersion || 0) < 7)
      for (const preset of defaults.filter(item => ['s2-stonehill','s3-castle-infiltration'].includes(item.id)))
        if (!presets.some(item => item.id === preset.id)) presets.push(structuredClone(preset));
    const cuesByBeat = Object.fromEntries(Object.entries(raw?.cuesByBeat || {}).slice(0, 200).map(([key, list]) =>
      [clean(key, 80), Array.isArray(list) ? list.slice(0, 30).map(normalizeCue) : []]));
    if (Number(raw?.cueCatalogVersion || 0) < 1) for (const [beat,list] of Object.entries(sceneSoundCues)) {
      const saved = cuesByBeat[beat] ||= [];
      for (const cue of list) if (!saved.some(item => item.id === cue.id)) saved.push(normalizeCue(cue));
    }
    if (Number(raw?.cueCatalogVersion || 0) < 2)
      for (const list of Object.values(cuesByBeat)) for (const cue of list)
        if (cue.action === 'sound' && formerEffects[cue.value]) cue.value = formerEffects[cue.value];
    for (const beat of ['trail','aftermath'])
      cuesByBeat[beat] = (cuesByBeat[beat] || []).filter(cue => !['fx-snare-snap','fx-echo-discovery'].includes(cue.value));
    return { contentProfile:raw?.contentProfile === 'blank'?'blank':'echo-below', media,
      presetCatalogVersion: 7, cueCatalogVersion: 2, presets,
      handouts: Array.isArray(raw?.handouts) ? raw.handouts.slice(0, 100).map(normalizeHandout) : [],
      cards: Array.isArray(raw?.cards) ? raw.cards.slice(0, 100).map(c => ({ id: clean(c.id, 80), title: clean(c.title, 100), subtitle: clean(c.subtitle, 100), text: clean(c.text, 600), mediaId: clean(c.mediaId, 80), kind: c.kind === 'location' ? 'location' : 'portrait' })) : [],
      cuesByBeat,
      audio: { master: number(raw?.audio?.master, 80), narration: number(raw?.audio?.narration, 85), ambience: number(raw?.audio?.ambience, 70), music: number(raw?.audio?.music, 65), sfx: number(raw?.audio?.sfx, 80), fade: number(raw?.audio?.fade, 2, 0, 10), duck: number(raw?.audio?.duck, 30), echoMediaId: clean(raw?.audio?.echoMediaId, 80) } };
  }
  function normalizeLive(raw = {}) {
    return { mode: modes.includes(raw?.mode) ? raw.mode : 'battle', mediaId: clean(raw?.mediaId, 80), handoutId: clean(raw?.handoutId, 80),
      page: number(raw?.page, 0, 0, 19), cardId: clean(raw?.cardId, 80), title: clean(raw?.title, 100), subtitle: clean(raw?.subtitle, 160),
      banner: clean(raw?.banner, 100), objective: clean(raw?.objective, 160), event: clean(raw?.event, 160),
      eventEndsAt: number(raw?.eventEndsAt, 0, 0, 4102444800000), echo: raw?.echo === true,
      overlays: { turn: raw?.overlays?.turn !== false, roll: raw?.overlays?.roll !== false, objective: raw?.overlays?.objective !== false, event: raw?.overlays?.event !== false },
      activePreset: clean(raw?.activePreset, 80) };
  }
  function publicMediaIds(live, library) {
    const handout = library.handouts.find(h => h.id === live.handoutId);
    const card = library.cards.find(c => c.id === live.cardId);
    return [...new Set([['scene', 'title'].includes(live.mode) ? live.mediaId : '',
      live.mode === 'handout' ? handout?.pages?.[live.page]?.mediaId : '',
      live.mode === 'card' ? card?.mediaId : ''].filter(id=>id&&library.media.some(m=>m.id===id&&m.audience!=='dm')))];
  }
  function publicState(raw, library) {
    const live = normalizeLive(raw), ids = publicMediaIds(live, library).filter(id=>library.media.some(m=>m.id===id&&m.audience!=='dm'));
    const handout = library.handouts.find(h => h.id === live.handoutId);
    const card = library.cards.find(c => c.id === live.cardId);
    return { ...live, mediaId: ids.includes(live.mediaId) ? live.mediaId : '',
      handoutId: live.mode === 'handout' ? live.handoutId : '', cardId: live.mode === 'card' ? live.cardId : '',
      media: ids.map(id => library.media.find(m => m.id === id)).filter(Boolean).map(m => ({ id: m.id, name: m.name, kind: m.kind, path: m.path, mime: m.mime })),
      handout: handout && live.mode === 'handout' ? { title: handout.title, text: handout.text, page: normalizePage(handout.pages[live.page] || {}) } : null,
      card: card && live.mode === 'card' ? { title: card.title, subtitle: card.subtitle, text: card.text, mediaId: card.mediaId } : null };
  }
  let host, tab = 'live', selectedHandout = '', selectedCard = '', selectedBeat = '', previewPage = 0;
  let liveCategory = 'map', liveScope = 'session', liveSearch = '', livePreviewKey = '';
  let lastMapScene = '';
  const liveRecent = [];
  let artChapter = 'Phandalin', artSearch = '', artPreviewId = '';
  let mapChapter = 'Wilderness', mapSearch = '', mapPreviewId = '';
  const urls = new Map(), requested = new Set();
  const audio = { ambience: null, music: null, sfx: null, muted: false, ducking: false,
    status: 'Choose a sound and press Play, or use Test sound.', statusError: false, ids: { ambience: '', music: '', sfx: '' } };
  const media = mediaId => host?.library?.media.find(item => item.id === mediaId);
  async function urlFor(mediaId) {
    const item = media(mediaId);
    if (!item) return '';
    if (item.path) return item.path;
    if (urls.has(mediaId)) return urls.get(mediaId);
    const blob = await host.readMedia(mediaId);
    if (!(blob instanceof Blob)) return '';
    const url = URL.createObjectURL(blob); urls.set(mediaId, url); return url;
  }
  function receiveMedia(mediaId, blob) {
    if (!(blob instanceof Blob) || !mediaId) return;
    if (urls.has(mediaId)) URL.revokeObjectURL(urls.get(mediaId));
    urls.set(mediaId, URL.createObjectURL(blob)); requested.delete(mediaId);
    renderPlayer(lastPublic);
  }
  function playerURL(mediaId, live) {
    const item = (live.media || []).find(m => m.id === mediaId);
    if (!item) return '';
    if (item.path) return item.path;
    if (urls.has(mediaId)) return urls.get(mediaId);
    if (!requested.has(mediaId)) {
      requested.add(mediaId);
      const message = { app: 'echo-below-session-01-battleboard', kind: 'media-request', id: mediaId };
      if (globalThis.ECHO_TV_LINK) globalThis.ECHO_TV_LINK.sendToDM(message);
      else window.opener?.postMessage(message, '*');
    }
    return '';
  }
  const options = (items, chosen, empty = 'None') => `<option value="">${esc(empty)}</option>${items.map(item => `<option value="${esc(item.id)}" ${item.id === chosen ? 'selected' : ''}>${esc(item.name || item.title)}</option>`).join('')}`;
  const mediaOptions = (kind, chosen) => options(host.library.media.filter(m => m.audience!=='dm'&&(!kind || m.kind === kind)), chosen);
  const audioOptions = (group, chosen) => options(host.library.media.filter(m => m.kind === 'audio' && m.audience!=='dm' &&
    (m.tags.includes(group) || !m.tags.some(tag => ['ambience','music','sfx'].includes(tag)))), chosen);
  const save = () => { void host.saveLibrary(); renderDM(); };
  const liveSave = label => host.commit(label);
  function open(next = 'director', targetId = '') {
    tab = next;
    if (next === 'live' && ['map', 'art', 'handout'].includes(targetId)) {
      liveCategory = targetId; livePreviewKey = ''; liveSearch = '';
    }
    if (next === 'handouts' && targetId) { selectedHandout = targetId; previewPage = 0; }
    if (next === 'art' && targetId) {
      const item = (globalThis.LMOP_VISUAL_CATALOG || []).find(entry => entry.id === targetId);
      if (item) { artPreviewId = item.id; artChapter = item.chapter; artSearch = ''; }
    }
    if (next === 'maps' && targetId) {
      const item = (globalThis.LMOP_BATTLE_MAP_CATALOG || []).find(entry => entry.id === targetId);
      if (item) { mapPreviewId = item.id; mapChapter = item.chapter; mapSearch = ''; }
    }
    $('presentation-drawer').hidden = false; $('presentation-scrim').hidden = false; renderDM();
  }
  function close() { $('presentation-drawer').hidden = true; $('presentation-scrim').hidden = true; }
  function init(context) {
    host = context;
    globalThis.ECHO_SOUNDSCAPE?.init({url:id=>media(id)?.audience==='dm'?'':urlFor(id),error:message=>audioStatus(message,true)});
    applyVolumes();
    $('live-choose-map').onclick = () => open('live', 'map');
    $('live-choose-art').onclick = () => open('live', 'art');
    $('live-choose-handout').onclick = () => open('live', 'handout');
    $('live-return-map').onclick = returnToMap;
    $('live-black-screen').onclick = () => { host.state.presentation.mode = 'black'; liveSave('Black screen'); };
    $('close-presentation').onclick = close;
    $('presentation-scrim').onclick = close;
    $('presentation-tabs').onclick = event => { const button = event.target.closest('[data-presentation-tab]'); if (button) { tab = button.dataset.presentationTab; renderDM(); } };
    $('presentation-content').addEventListener('click', click);
    $('presentation-content').addEventListener('change', change);
    $('presentation-content').addEventListener('input', event => {
      if (event.target.id !== 'live-search') return;
      liveSearch = clean(event.target.value, 100); livePreviewKey = '';
      const position = event.target.selectionStart;
      renderDM();
      const replacement = $('live-search'); replacement?.focus(); replacement?.setSelectionRange(position, position);
    });
    window.addEventListener('beforeunload', () => { for (const url of urls.values()) URL.revokeObjectURL(url); });
  }
  function sceneChoice(chosen) { return options(host.scenes.map(s => ({ id: s.id, name: s.title })), chosen, 'Keep current scene'); }
  function currentTV() {
    const live = host.state.presentation, scene = host.scenes.find(s => s.id === host.state.scene);
    if (live.mode === 'battle') return { title: scene?.title || 'Battle map', kind: 'Map' };
    if (live.mode === 'black') return { title: 'Black screen', kind: 'Screen hidden' };
    if (live.mode === 'handout') return { title: host.library.handouts.find(h => h.id === live.handoutId)?.title || 'Handout', kind: 'Handout' };
    if (live.mode === 'card') return { title: host.library.cards.find(c => c.id === live.cardId)?.title || 'Card', kind: 'Card' };
    if (live.mode === 'scene') {
      const shownMedia = host.library.media.find(m => m.id === live.mediaId);
      return { title: shownMedia?.name || scene?.title || 'Scene art', kind: shownMedia?.category === 'map' ? 'Map image' : 'Scene art' };
    }
    return { title: live.title || live.mode, kind: 'Presentation' };
  }
  function renderLiveControls() {
    if (!host) return;
    if (host.scenes.find(s => s.id === host.state.scene)?.kind === 'map') lastMapScene = host.state.scene;
    const now = currentTV(), beats = host.beats, position = beats.findIndex(b => b.id === host.state.runbook);
    const atlasTitle=globalThis.ECHO_ATLAS_UI?.nowShowing?.();
    if(atlasTitle){now.title=atlasTitle;now.kind='Campaign atlas';}
    const next = beats.slice(position + 1).find(b => b.scene && b.scene !== 'black');
    $('live-tv-title').textContent = now.title;
    $('live-tv-kind').textContent = now.kind;
    $('tv-now-badge').textContent = `Now showing: ${now.title}`;
    $('live-tv-next').textContent = next ? `Up next: ${next.title}` : 'Choose a map, scene image, or handout.';
    $('live-return-map').disabled = !atlasTitle && host.state.presentation.mode === 'battle' &&
      host.scenes.find(s => s.id === host.state.scene)?.kind === 'map';
    $('live-black-screen').disabled = host.state.presentation.mode === 'black';
  }
  function returnToMap() {
    if (host.scenes.find(s => s.id === host.state.scene)?.kind !== 'map') {
      const recentMap = [...(host.state.map?.history || [])].reverse().find(id =>
        host.scenes.some(s => s.id === id && s.kind === 'map'));
      const mapId = host.scenes.some(s => s.id === lastMapScene && s.kind === 'map') ? lastMapScene :
        recentMap || host.scenes.find(s => s.kind === 'map')?.id;
      if (!mapId) return host.toast('No map is prepared for this session.');
      host.changeScene(mapId, false, false);
    }
    host.state.presentation.mode = 'battle'; liveSave('Returned to map');
    if (tab === 'live') close();
  }
  function rememberLive(key) {
    const index = liveRecent.indexOf(key); if (index >= 0) liveRecent.splice(index, 1);
    liveRecent.unshift(key); liveRecent.length = Math.min(liveRecent.length, 8);
  }
  function liveChoices() {
    const scenes = host.scenes, beats = host.beats;
    const beatIds = new Set(beats.map(b => b.scene).filter(Boolean));
    const sessionIds = new Set(scenes.filter(s => host.state.sessionKind !== 'session1' ||
      beatIds.has(s.id) || s.id === 'town-phandalin' || /^(session-01-visuals\/|assets\/Echo-Below-Cover)/.test(s.image || '')).map(s => s.id));
    const candidates = [];
    for (const scene of scenes) {
      if (scene.kind === 'black') continue;
      candidates.push({ key: `scene:${scene.id}`, category: scene.kind === 'map' ? 'map' : 'art',
        title: scene.title, image: host.sceneImage(scene), session: sessionIds.has(scene.id),
        detail: scene.fog ? 'Fogged map' : scene.kind === 'map' ? 'Interactive map' : 'Scene illustration' });
    }
    for (const catalog of [globalThis.LMOP_BATTLE_MAP_CATALOG || [], globalThis.LMOP_VISUAL_CATALOG || []])
      for (const item of catalog) if (!candidates.some(c => c.key === `scene:${item.id}`))
        candidates.push({ key: `scene:${item.id}`, category: catalog === globalThis.LMOP_BATTLE_MAP_CATALOG ? 'map' : 'art',
          title: `${item.chapter} · ${item.title}`, image: item.image, session: false, detail: item.coverage || item.reveal || '' });
    const sceneImages = new Set(candidates.map(c => c.image));
    for (const item of host.library.media.filter(m => m.kind === 'image'))
      if (!item.path || !sceneImages.has(item.path))
        candidates.push({ key: `media:${item.id}`, category: item.category === 'map' ? 'map' : 'art', title: item.name, image: item.path,
          mediaId: item.id, session: item.tags.includes(`session:${host.sessionId}`),
          detail: item.category === 'map' ? 'Map image · no tokens' : item.source });
    for (const handout of host.library.handouts)
      candidates.push({ key: `handout:${handout.id}`, category: 'handout', title: handout.title,
        image: media(handout.pages[0]?.mediaId)?.path || '', mediaId: handout.pages[0]?.mediaId || '',
        session: true, detail: `${handout.pages.length} page${handout.pages.length === 1 ? '' : 's'}` });
    return candidates;
  }
  function renderLivePicker() {
    const beats = host.beats, position = beats.findIndex(b => b.id === host.state.runbook);
    const nextScene = beats.slice(position + 1).find(b => b.scene && b.scene !== 'black')?.scene;
    const query = liveSearch.trim().toLocaleLowerCase();
    const candidates = liveChoices().filter(c => c.category === liveCategory &&
      (liveScope === 'all' || c.session) && (!query || `${c.title} ${c.detail}`.toLocaleLowerCase().includes(query)));
    candidates.sort((a, b) => {
      const ar = liveRecent.indexOf(a.key), br = liveRecent.indexOf(b.key);
      const aRank = ar < 0 ? (a.key === `scene:${nextScene}` ? 8 : 99) : ar;
      const bRank = br < 0 ? (b.key === `scene:${nextScene}` ? 8 : 99) : br;
      return aRank - bRank;
    });
    const preview = candidates.find(c => c.key === livePreviewKey) || candidates[0];
    livePreviewKey = preview?.key || '';
    const now = currentTV();
    return `<div class="live-picker-top"><div><small>ON THE PLAYER TV</small><strong>${esc(now.title)}</strong><span>${esc(now.kind)}</span></div><div class="presentation-confirm"><button type="button" data-do="return-map">Return to map</button><button type="button" data-do="live-black">Black screen</button></div></div>
      <div class="live-picker-categories" aria-label="Choose content type">${[['map','▦ Maps'],['art','▧ Scene art'],['handout','✦ Handouts']].map(([key,label]) => `<button type="button" data-do="live-category" data-id="${key}" class="${liveCategory === key ? 'active' : ''}">${label}</button>`).join('')}</div>
      <div class="live-picker-filters"><label>Show<select id="live-scope"><option value="session" ${liveScope === 'session' ? 'selected' : ''}>This session</option><option value="all" ${liveScope === 'all' ? 'selected' : ''}>All campaign</option></select></label><label>Find<input id="live-search" type="search" value="${esc(liveSearch)}" placeholder="Search by place or name"></label></div>
      <p class="help">${candidates.length} ${liveCategory === 'map' ? 'maps' : liveCategory === 'art' ? 'images' : 'handouts'} here. Preview stays on your screen until you press Show on TV.</p>
      ${liveCategory === 'handout' ? '<button type="button" data-do="live-manage-handouts">Create or edit handouts</button>' : ''}
      ${preview ? `<div class="presentation-art-preview live-picker-preview"><div class="live-preview-image">${preview.image ? `<img src="${esc(preview.image)}" alt="DM preview of ${esc(preview.title)}">` : preview.mediaId ? `<img data-live-media="${esc(preview.mediaId)}" alt="DM preview of ${esc(preview.title)}">` : '<span>No image page</span>'}</div><div><strong>${esc(preview.title)}</strong><p>${esc(preview.detail)}</p><div class="presentation-confirm"><button type="button" class="primary" data-do="live-show" data-id="${esc(preview.key)}" ${liveCategory === 'handout' && !preview.mediaId ? 'disabled' : ''}>Show on TV</button></div></div></div>` : '<p class="live-picker-empty">Nothing matches. Try All campaign or a different search.</p>'}
      <div class="presentation-art-grid live-picker-grid">${candidates.map(c => `<button type="button" class="live-picker-card ${c.key === livePreviewKey ? 'active' : ''}" data-do="live-preview" data-id="${esc(c.key)}">${c.image ? `<img loading="lazy" decoding="async" src="${esc(c.image)}" alt="">` : c.mediaId ? `<img data-live-media="${esc(c.mediaId)}" loading="lazy" alt="">` : '<span class="live-no-image">✦</span>'}<strong>${esc(c.title)}</strong><small>${c.key === `scene:${nextScene}` ? 'Up next · ' : liveRecent.includes(c.key) ? 'Recent · ' : ''}${esc(c.detail)}</small></button>`).join('')}</div>`;
  }
  function applyPreset(preset) {
    if (preset.sceneId && host.scenes.some(s => s.id === preset.sceneId)) host.changeScene(preset.sceneId, true, false);
    Object.assign(host.state.presentation, { mode: preset.mode, mediaId: preset.mediaId, handoutId: preset.handoutId, page: 0,
      title: preset.banner, banner: preset.banner, objective: preset.objective, echo: preset.echo, activePreset: preset.id });
    liveSave(`TV preset: ${preset.name}`);
    void playGroup('ambience', preset.ambienceId); void playGroup('music', preset.musicId);
  }
  function renderDirector() {
    const live = host.state.presentation;
    return `<h3>One-action scenes</h3><div class="presentation-presets">${host.library.presets.map(p => `<button type="button" data-do="apply-preset" data-id="${esc(p.id)}">${esc(p.name)}</button>`).join('')}</div>
      <details><summary>Create a scene preset</summary><label>Name<input id="p-preset-name" maxlength="100"></label><label>Screen mode<select id="p-preset-mode">${modes.map(m => `<option value="${m}">${m}</option>`).join('')}</select></label>
      <label>Scene<select id="p-preset-scene">${sceneChoice('')}</select></label><label>Art<select id="p-preset-media">${mediaOptions('image', '')}</select></label>
      <label>Ambience<select id="p-preset-ambience">${audioOptions('ambience', '')}</select></label><label>Music<select id="p-preset-music">${audioOptions('music', '')}</select></label>
      <label>Handout<select id="p-preset-handout">${options(host.library.handouts, '')}</select></label><label>Player banner<input id="p-preset-banner"></label>
      <label>Objective<input id="p-preset-objective"></label><label><input id="p-preset-echo" type="checkbox"> Subtle Echo effect</label><button type="button" data-do="add-preset">Save preset</button></details>
      <h3>What players see now</h3><div class="presentation-mode-grid">${modes.map(mode => `<button type="button" data-do="mode" data-id="${mode}" class="${live.mode === mode ? 'active' : ''}">${mode}</button>`).join('')}</div>
      <p class="help">Changing TV modes preserves the map, tokens, HP, and turn order.</p>`;
  }
  function showCatalogArt(id) {
    const item = (globalThis.LMOP_VISUAL_CATALOG || []).find(entry => entry.id === id);
    if (!host || !item || !host.library.media.some(entry => entry.id === id)) return;
    artPreviewId = id; artChapter = item.chapter; artSearch = '';
    Object.assign(host.state.presentation, { mode: 'scene', mediaId: id, handoutId: '',
      title: '', subtitle: '', banner: '', activePreset: '' });
    rememberLive(`media:${id}`);
    liveSave(`Showed Lost Mine art: ${item.title}`);
  }
  function renderArt() {
    const catalog = globalThis.LMOP_VISUAL_CATALOG || [];
    const chapters = [...new Set(catalog.map(item => item.chapter))];
    const query = artSearch.trim().toLocaleLowerCase();
    const visible = catalog.filter(item => (artChapter === 'all' || item.chapter === artChapter) &&
      (!query || `${item.key} ${item.title} ${item.chapter}`.toLocaleLowerCase().includes(query)));
    const preview = visible.find(item => item.id === artPreviewId) || visible[0];
    if (preview) artPreviewId = preview.id;
    return `<h3>Lost Mine scene art · ${catalog.length} images</h3>
      <p class="help">Preview on the DM screen first. Nothing appears on the player TV until you press Show. Reveal notes are private.</p>
      <div class="presentation-art-filters"><label>Chapter<select id="p-art-chapter"><option value="all" ${artChapter === 'all' ? 'selected' : ''}>All chapters</option>${chapters.map(chapter => `<option value="${esc(chapter)}" ${artChapter === chapter ? 'selected' : ''}>${esc(chapter)}</option>`).join('')}</select></label>
      <label>Find an image<input id="p-art-search" type="search" value="${esc(artSearch)}" placeholder="Place, room, or key"></label></div>
      <p class="help">${visible.length} image${visible.length === 1 ? '' : 's'} in this view.</p>
      ${preview ? `<div class="presentation-art-preview"><img src="${esc(preview.image)}" alt="DM preview of ${esc(preview.title)}"><div><strong>${esc(preview.key)} · ${esc(preview.title)}</strong><p>${esc(preview.reveal)}</p><div class="presentation-confirm"><button type="button" class="primary" data-do="show-art" data-id="${esc(preview.id)}">Show this image on TV</button><button type="button" data-do="return-map">Return to battlefield</button></div></div></div>` : '<p>No matching art. Try another chapter or search.</p>'}
      <div class="presentation-art-grid">${visible.map(item => `<article class="presentation-art-card"><img loading="lazy" decoding="async" src="${esc(item.image)}" alt=""><strong>${esc(item.key)} · ${esc(item.title)}</strong><small>${esc(item.reveal)}</small><button type="button" data-do="preview-art" data-id="${esc(item.id)}">Preview</button></article>`).join('')}</div>`;
  }
  function renderBattleMaps() {
    const catalog = globalThis.LMOP_BATTLE_MAP_CATALOG || [];
    const chapters = [...new Set(catalog.map(item => item.chapter))];
    const query = mapSearch.trim().toLocaleLowerCase();
    const visible = catalog.filter(item => (mapChapter === 'all' || item.chapter === mapChapter) &&
      (!query || `${item.title} ${item.coverage} ${item.chapter}`.toLocaleLowerCase().includes(query)));
    const preview = visible.find(item => item.id === mapPreviewId) || visible[0];
    if (preview) mapPreviewId = preview.id;
    return `<h3>Lost Mine battle maps · ${catalog.length} maps</h3>
      <p class="help">Preview on the DM screen. Nothing changes on the player TV until you press Show battlefield. Fogged maps begin covered.</p>
      <div class="presentation-art-filters"><label>Chapter<select id="p-map-chapter"><option value="all" ${mapChapter === 'all' ? 'selected' : ''}>All chapters</option>${chapters.map(chapter => `<option value="${esc(chapter)}" ${mapChapter === chapter ? 'selected' : ''}>${esc(chapter)}</option>`).join('')}</select></label>
      <label>Find a map<input id="p-map-search" type="search" value="${esc(mapSearch)}" placeholder="Place or room"></label></div>
      <p class="help">${visible.length} map${visible.length === 1 ? '' : 's'} in this view.</p>
      ${preview ? `<div class="presentation-art-preview"><img src="${esc(preview.image)}" alt="DM preview of ${esc(preview.title)}"><div><strong>${esc(preview.title)}</strong><p>${esc(preview.coverage)}</p><p>${esc(preview.reveal)}</p><p>Five-foot grid: ${preview.gridColumns} columns · ${preview.fog ? 'Fog starts covered' : 'Open battlefield'}</p><div class="presentation-confirm"><button type="button" class="primary" data-do="show-battle-map" data-id="${esc(preview.id)}">Show battlefield on TV</button></div></div></div>` : '<p>No matching map. Try another chapter or search.</p>'}
      <div class="presentation-art-grid">${visible.map(item => `<article class="presentation-art-card"><img loading="lazy" decoding="async" src="${esc(item.image)}" alt=""><strong>${esc(item.title)}</strong><small>${esc(item.coverage)}</small><button type="button" data-do="preview-battle-map" data-id="${esc(item.id)}">Preview</button></article>`).join('')}</div>`;
  }
  function renderAudio() {
    const settings = host.library.audio;
    return `<h3>Audio board</h3><div class="presentation-audio-controls"><button type="button" class="panic-mute" data-do="mute">${audio.muted ? 'Resume audio' : '■ Mute all'}</button><button type="button" data-do="duck">${audio.ducking ? 'End read-aloud' : 'Read-aloud duck'}</button><button type="button" data-do="test-sound">▶ Test sound</button></div>
      <p class="presentation-audio-status ${audio.statusError ? 'error' : ''}" role="status">${esc(audio.status)}</p>
      ${['master', 'ambience', 'music', 'sfx', 'narration'].map(group => `<label>${group} volume <input data-audio-volume="${group}" type="range" min="0" max="100" value="${settings[group]}"> <span>${settings[group]}%</span></label>`).join('')}
      <label>Crossfade seconds<input data-audio-number="fade" type="number" min="0" max="10" step="0.5" value="${settings.fade}"></label>
      <label>Read-aloud volume percent<input data-audio-number="duck" type="number" min="0" max="100" value="${settings.duck}"></label>
      ${['ambience', 'music', 'sfx'].map(group => `<div class="presentation-audio-row"><label>${group}<select id="p-audio-${group}">${audioOptions(group, audio.ids[group] || '')}</select></label><button type="button" data-do="play-${group}">${group === 'sfx' ? 'Play once' : 'Play / crossfade'}</button><button type="button" data-do="stop-${group}">Stop</button></div>`).join('')}
      <div class="presentation-quick-effects"><strong>Quick effects</strong><div>${quickEffects.map(([mediaId,label]) => `<button type="button" data-do="quick-effect" data-id="${esc(mediaId)}">▶ ${esc(label)}</button>`).join('')}</div></div>
      <label>Optional Echo sound<select data-echo-sound>${mediaOptions('audio', settings.echoMediaId)}</select></label><button type="button" data-do="echo-sound">Play Echo sound</button>
      <p class="help">Audio plays from the DM computer. Choose its TV or speaker output in your computer settings. Browsers require your first click before sound can play.</p>`;
  }
  function renderMedia() {
    return `<h3>Campaign media library</h3><label>Import art, map, portrait, item card, audio, or video<input id="p-media-file" type="file" multiple accept="image/png,image/jpeg,image/webp,audio/mpeg,audio/ogg,audio/wav,audio/mp4,video/mp4,video/webm"></label>
      <p class="help">Imported files are shared across sessions in this browser. The campaign backup includes them. Duplicate files are detected before storage.</p>
      <div class="presentation-media-grid">${host.library.media.map(item => `<article class="presentation-media-item"><div class="presentation-thumb" data-media-thumb="${esc(item.id)}">${item.kind === 'image' && item.path ? `<img loading="lazy" decoding="async" src="${esc(item.path)}" alt="">` : item.kind === 'image' ? '▧' : item.kind === 'audio' ? '♫' : '▶'}</div><strong>${esc(item.name)}</strong><small>${esc(item.kind)} · ${esc(item.source)}</small><label>Type<select data-media-category="${esc(item.id)}">${(item.kind === 'image' ? ['art', 'map', 'portrait', 'item card'] : [item.kind]).map(category => `<option value="${category}" ${item.category === category ? 'selected' : ''}>${category}</option>`).join('')}</select></label><label>Tags<input data-media-tags="${esc(item.id)}" value="${esc(item.tags.join(', '))}"></label><label>Source<input data-media-source="${esc(item.id)}" value="${esc(item.source)}"></label></article>`).join('')}</div>`;
  }
  function renderHandouts() {
    const handout = host.library.handouts.find(h => h.id === selectedHandout) || host.library.handouts[0];
    if (handout) selectedHandout = handout.id;
    const page = handout?.pages[previewPage] || handout?.pages[0];
    return `<h3>Staged handouts</h3><label>Handout<select id="p-handout-select">${options(host.library.handouts, selectedHandout, 'Choose a handout')}</select></label>
      <button type="button" data-do="new-handout">New handout</button>${handout ? `<label>Title<input data-handout-title value="${esc(handout.title)}"></label><label>Player handout text<textarea data-handout-text>${esc(handout.text)}</textarea></label>
      <label>Add image page<select id="p-handout-image">${mediaOptions('image', '')}</select></label><button type="button" data-do="add-page">Add page</button>
      <div class="presentation-page-nav">${handout.pages.map((p, i) => `<button type="button" data-do="preview-page" data-index="${i}" class="${i === previewPage ? 'active' : ''}">Page ${i + 1}</button>`).join('')}</div>
      ${page ? `<div id="p-handout-preview" class="presentation-preview">Loading preview…</div><label>Zoom %<input data-page-setting="zoom" type="range" min="50" max="300" value="${page.zoom}"></label>
      <label>Pan X<input data-page-setting="panX" type="range" min="-100" max="100" value="${page.panX}"></label><label>Pan Y<input data-page-setting="panY" type="range" min="-100" max="100" value="${page.panY}"></label>
      <label>Crop edge %<input data-page-setting="crop" type="range" min="0" max="35" value="${page.crop}"></label>` : '<p>Add an image page to preview it.</p>'}
      <div class="presentation-confirm"><button type="button" class="primary" data-do="show-handout">Show on TV</button><button type="button" data-do="hide-handout">Return to battle</button><button type="button" data-do="narrate-handout">Prepare narration</button></div>` : ''}`;
  }
  function renderCards() {
    const story = host.story || {};
    const npc = Array.isArray(story.npcs) ? story.npcs : [];
    const sites = Array.isArray(story.sites) ? story.sites : [];
    const generated = [...npc.map(n => ({ id: `npc:${n.id}`, title: n.name, kind: 'portrait', mediaId: 'waterdeep-cast' })), ...sites.map(s => ({ id: `site:${s.id}`, title: s.name, kind: 'location', mediaId: '' }))];
    const cards = [...host.library.cards, ...generated.filter(g => !host.library.cards.some(c => c.id === g.id))];
    const card = cards.find(c => c.id === selectedCard) || cards[0]; if (card) selectedCard = card.id;
    return `<h3>Portrait & location cards</h3><label>Card<select id="p-card-select">${options(cards, selectedCard)}</select></label>${card ? `<label>Title<input data-card-title value="${esc(card.title)}"></label>
      <label>Subtitle<input data-card-subtitle value="${esc(card.subtitle || '')}"></label><label>Player description<textarea data-card-text>${esc(card.text || '')}</textarea></label>
      <label>Image<select data-card-media>${mediaOptions('image', card.mediaId || '')}</select></label><button type="button" class="primary" data-do="show-card">Show card on TV</button>` : '<p>No cards yet.</p>'}
      <p class="help">Waterdeep people and nine-site names are seeded from campaign notes. Only edited player-facing card fields are shown on the TV.</p>`;
  }
  function renderCues() {
    const beats = host.beats || [], beat = beats.find(b => b.id === selectedBeat) || beats[0]; if (beat) selectedBeat = beat.id;
    const cues = beat ? host.library.cuesByBeat[beat.id] || [] : [];
    return `<h3>Optional cue timeline</h3><label>Runbook beat<select id="p-cue-beat">${options(beats.map(b => ({ id: b.id, name: b.title })), selectedBeat)}</select></label>
      <ol class="presentation-cues">${cues.map((cue, i) => `<li><span>${esc(cue.label || cue.action)} · ${esc(cue.value)}</span><button type="button" data-do="run-cue" data-index="${i}">Run cue</button><button type="button" data-do="delete-cue" data-index="${i}">Remove</button></li>`).join('')}</ol>
      ${beat ? `<label>Cue label<input id="p-cue-label" placeholder="e.g. Goblins emerge"></label><label>Action<select id="p-cue-action">${['scene', 'art', 'mode', 'sound', 'handout', 'banner', 'objective', 'black', 'echo'].map(a => `<option value="${a}">${a}</option>`).join('')}</select></label>
      <label>Value (scene ID, mode, media ID, handout ID, or text)<input id="p-cue-value" list="p-cue-values"></label><datalist id="p-cue-values">${[...host.scenes, ...host.library.media, ...host.library.handouts].map(x => `<option value="${esc(x.id)}">${esc(x.title || x.name)}</option>`).join('')}</datalist>
      <button type="button" data-do="add-cue">Add optional cue</button>` : ''}<p class="help">Cues run only when you click them. They never advance automatically with the runbook.</p>`;
  }
  function renderTV() {
    const live = host.state.presentation;
    return `<h3>Player display</h3><div class="presentation-mode-grid">${modes.map(m => `<button type="button" data-do="mode" data-id="${m}" class="${live.mode === m ? 'active' : ''}">${m}</button>`).join('')}</div>
      <label>Scene art or video<select data-live-media>${mediaOptions('', live.mediaId)}</select></label><label>Title card title<input data-live-title value="${esc(live.title)}"></label>
      <label>Subtitle<input data-live-subtitle value="${esc(live.subtitle)}"></label><label>Banner<input data-live-banner value="${esc(live.banner)}"></label>
      <label>Objective<input data-live-objective value="${esc(live.objective)}"></label><label>Timed event<input data-live-event value="${esc(live.event)}"></label>
      <label>Countdown seconds<input id="p-event-seconds" type="number" min="1" max="36000" value="60"></label><button type="button" data-do="start-event">Start countdown</button><button type="button" data-do="clear-event">Clear countdown</button>
      <div class="presentation-overlays">${['turn', 'roll', 'objective', 'event'].map(key => `<label><input type="checkbox" data-overlay="${key}" ${live.overlays[key] ? 'checked' : ''}> ${key} overlay</label>`).join('')}</div>
      <button type="button" data-do="hide-overlays">Hide all overlays</button><label><input type="checkbox" data-live-echo ${live.echo ? 'checked' : ''}> Subtle Echo visuals</label>`;
  }
  function renderDM() {
    renderLiveControls();
    if (!host || $('presentation-drawer').hidden) { updateMuteButton(); return; }
    for (const button of $('presentation-tabs').querySelectorAll('button')) button.classList.toggle('active', button.dataset.presentationTab === tab);
    $('presentation-content').innerHTML = ({ live: renderLivePicker, director: renderDirector, art: renderArt, maps: renderBattleMaps, audio: renderAudio, cues: renderCues, media: renderMedia, handouts: renderHandouts, cards: renderCards, tv: renderTV })[tab]();
    if (tab === 'live') void renderLiveImages();
    if (tab === 'handouts') void renderPreview();
    if (tab === 'media') void renderMediaThumbnails();
    updateMuteButton();
  }
  async function renderLiveImages() {
    const container = $('presentation-content');
    for (const image of container.querySelectorAll('img[data-live-media]')) {
      const url = await urlFor(image.dataset.liveMedia);
      if (container.contains(image) && url) image.src = url;
    }
  }
  async function renderPreview() {
    const target = $('p-handout-preview'); if (!target) return;
    const page = host.library.handouts.find(h => h.id === selectedHandout)?.pages[previewPage];
    const url = page && await urlFor(page.mediaId);
    if (target !== $('p-handout-preview')) return;
    target.innerHTML = url ? `<img src="${esc(url)}" alt="DM preview" style="transform:translate(${page.panX}%,${page.panY}%) scale(${page.zoom / 100});clip-path:inset(${page.crop}%)">` : '<span>No image selected</span>';
  }
  async function renderMediaThumbnails() {
    for (const item of host.library.media.filter(m => m.kind === 'image' && !m.path)) {
      const target = document.querySelector(`[data-media-thumb="${item.id}"]`);
      if (!target) continue;
      const url = await urlFor(item.id);
      if (url && target.isConnected) target.innerHTML = `<img src="${esc(url)}" alt="">`;
    }
  }
  function getCard() {
    let card = host.library.cards.find(c => c.id === selectedCard);
    if (card) return card;
    const story = host.story || {};
    const pool = selectedCard.startsWith('npc:') ? story.npcs : story.sites;
    const item = (pool || []).find(x => `${selectedCard.startsWith('npc:') ? 'npc' : 'site'}:${x.id}` === selectedCard);
    if (!item) return null;
    card = { id: selectedCard, kind: selectedCard.startsWith('npc:') ? 'portrait' : 'location', title: item.name, subtitle: '', text: '', mediaId: selectedCard.startsWith('npc:') ? 'waterdeep-cast' : '' };
    host.library.cards.push(card); void host.saveLibrary(); return card;
  }
  async function importFiles(files) {
    for (const file of files) {
      if (file.size > 40000000) { host.toast(`${file.name}: limit is 40 MB per file.`); continue; }
      const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : '';
      if (!kind || !/^(image\/(png|jpeg|webp)|audio\/(mpeg|ogg|wav|mp4)|video\/(mp4|webm))$/.test(file.type)) { host.toast(`${file.name}: unsupported media format.`); continue; }
      const bytes = await file.arrayBuffer();
      let hash;
      if (globalThis.crypto?.subtle) {
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        hash = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
      } else {
        let value = 2166136261;
        for (const byte of new Uint8Array(bytes)) value = Math.imul(value ^ byte, 16777619);
        hash = `fnv-${(value >>> 0).toString(16)}`;
      }
      if (host.library.media.some(m => m.hash === hash && m.size === file.size)) { host.toast(`${file.name} is already in the library.`); continue; }
      const mediaId = id();
      try { await host.writeMedia(mediaId, file); }
      catch { host.toast('This browser cannot store imported media. Try another browser or free storage space.'); continue; }
      host.library.media.push({ id: mediaId, name: clean(file.name, 100), kind, category: kind === 'image' ? 'art' : kind, mime: file.type, path: '', hash, size: file.size,
        tags: [`session:${host.sessionId}`], source: 'Local import' });
      host.toast(`Imported ${file.name}`);
    }
    save();
  }
  async function click(event) {
    const button = event.target.closest('[data-do]'); if (!button) return;
    const action = button.dataset.do, live = host.state.presentation, library = host.library;
    if (action === 'live-category') { liveCategory = button.dataset.id; livePreviewKey = ''; renderDM(); return; }
    if (action === 'live-preview') { livePreviewKey = button.dataset.id; renderDM(); return; }
    if (action === 'live-black') { live.mode = 'black'; liveSave('Black screen'); close(); return; }
    if (action === 'live-manage-handouts') { open('handouts'); return; }
    if (action === 'live-show') {
      const choice = liveChoices().find(item => item.key === button.dataset.id);
      if (!choice) return;
      let shown = false;
      if (choice.key.startsWith('scene:')) {
        const sceneId = choice.key.slice(6);
        if (host.scenes.some(scene => scene.id === sceneId)) {
          host.changeScene(sceneId, false, false);
          Object.assign(live, { mediaId: '', handoutId: '', title: '', subtitle: '', banner: '', activePreset: '' });
          rememberLive(choice.key); liveSave(`Showed ${choice.title}`); shown = true;
        } else if (choice.category === 'map') {
          host.showCatalogBattleMap(sceneId); rememberLive(choice.key); shown = true;
        } else if (media(sceneId)) { showCatalogArt(sceneId); rememberLive(choice.key); shown = true; }
      } else if (choice.key.startsWith('media:')) {
        Object.assign(live, { mode: 'scene', mediaId: choice.key.slice(6), handoutId: '',
          title: '', subtitle: '', banner: '', activePreset: '' });
        rememberLive(choice.key); liveSave(`Showed ${choice.title}`); shown = true;
      } else if (choice.key.startsWith('handout:')) {
        const handout = library.handouts.find(item => item.id === choice.key.slice(8));
        if (!handout?.pages.length) return host.toast('Add an image page to this handout first.');
        Object.assign(live, { mode: 'handout', handoutId: handout.id, page: 0 });
        rememberLive(choice.key); liveSave(`Showed handout: ${handout.title}`); shown = true;
      }
      if (shown) close();
      return;
    }
    if (action === 'apply-preset') { const preset = library.presets.find(p => p.id === button.dataset.id); if (preset) applyPreset(preset); return; }
    if (action === 'preview-art') { artPreviewId = button.dataset.id; renderDM(); return; }
    if (action === 'show-art') { showCatalogArt(button.dataset.id); return; }
    if (action === 'preview-battle-map') { mapPreviewId = button.dataset.id; renderDM(); return; }
    if (action === 'show-battle-map') { host.showCatalogBattleMap(button.dataset.id); return; }
    if (action === 'return-map') { returnToMap(); return; }
    if (action === 'add-preset') {
      const name = $('p-preset-name').value.trim(); if (!name) return host.toast('Give the preset a name.');
      library.presets.push(normalizePreset({ id: id(), name, mode: $('p-preset-mode').value, sceneId: $('p-preset-scene').value, mediaId: $('p-preset-media').value,
        ambienceId: $('p-preset-ambience').value, musicId: $('p-preset-music').value, handoutId: $('p-preset-handout').value,
        banner: $('p-preset-banner').value, objective: $('p-preset-objective').value, echo: $('p-preset-echo').checked })); save(); return;
    }
    if (action === 'mode') { live.mode = button.dataset.id; liveSave(`TV mode: ${live.mode}`); return; }
    if (action === 'mute') { toggleMute(); return; }
    if (action === 'test-sound') { await playSfx('recorded-coins'); return; }
    if (action === 'duck') { setDucking(!audioState().ducking); return; }
    if (action === 'quick-effect') { if (quickEffects.some(([mediaId]) => mediaId === button.dataset.id)) await playSfx(button.dataset.id); return; }
    if (action.startsWith('play-')) { const group = action.slice(5), mediaId = $(`p-audio-${group}`).value; if (group === 'sfx') await playSfx(mediaId); else await playGroup(group, mediaId); return; }
    if (action.startsWith('stop-')) { const group=action.slice(5); stopGroup(group); audioStatus(`Stopped ${group}.`); return; }
    if (action === 'echo-sound') { await playSfx(library.audio.echoMediaId); return; }
    if (action === 'new-handout') { const handout = { id: id(), title: 'New handout', text: '', pages: [] }; library.handouts.push(handout); selectedHandout = handout.id; previewPage = 0; save(); return; }
    if (action === 'add-page') { const handout = library.handouts.find(h => h.id === selectedHandout), mediaId = $('p-handout-image')?.value; if (handout && mediaId) { handout.pages.push(normalizePage({ mediaId })); previewPage = handout.pages.length - 1; save(); } return; }
    if (action === 'preview-page') { previewPage = Number(button.dataset.index); renderDM(); return; }
    if (action === 'narrate-handout') { close(); globalThis.ECHO_VOICE_STUDIO.fromSource({kind:'handout',id:selectedHandout}); return; }
    if (action === 'show-handout') { const handout = library.handouts.find(h => h.id === selectedHandout); if (!handout?.pages[previewPage]) return host.toast('Add an image page first.'); Object.assign(live, { mode: 'handout', handoutId: handout.id, page: previewPage }); liveSave(`Showed handout: ${handout.title}`); return; }
    if (action === 'hide-handout') { live.mode = 'battle'; liveSave('Returned to battle map'); return; }
    if (action === 'show-card') { const card = getCard(); if (!card) return; Object.assign(live, { mode: 'card', cardId: card.id }); liveSave(`Showed card: ${card.title}`); return; }
    if (action === 'add-cue') { const cue = normalizeCue({ id: id(), action: $('p-cue-action').value, value: $('p-cue-value').value, label: $('p-cue-label').value }); (library.cuesByBeat[selectedBeat] ||= []).push(cue); save(); return; }
    if (action === 'delete-cue') { (library.cuesByBeat[selectedBeat] ||= []).splice(Number(button.dataset.index), 1); save(); return; }
    if (action === 'run-cue') { const cue = library.cuesByBeat[selectedBeat]?.[Number(button.dataset.index)]; if (cue) await runCue(cue); return; }
    if (action === 'hide-overlays') { Object.keys(live.overlays).forEach(key => { live.overlays[key] = false; }); liveSave('Hid TV overlays'); return; }
    if (action === 'start-event') { live.eventEndsAt = Date.now() + number($('p-event-seconds').value, 60, 1, 36000) * 1000; live.overlays.event = true; liveSave('Started TV countdown'); return; }
    if (action === 'clear-event') { live.eventEndsAt = 0; liveSave('Cleared TV countdown'); return; }
  }
  async function runCue(cue) {
    const live = host.state.presentation;
    if (cue.action === 'scene' && host.scenes.some(s => s.id === cue.value)) { host.changeScene(cue.value, false, false); liveSave(`Cue: ${cue.label || cue.value}`); }
    else if (cue.action === 'art' && media(cue.value)?.kind === 'image') { live.mode = 'scene'; live.mediaId = cue.value; liveSave(`Cue: ${cue.label || cue.value}`); }
    else if (cue.action === 'mode' && modes.includes(cue.value)) { live.mode = cue.value; liveSave(`Cue: ${cue.label || cue.value}`); }
    else if (cue.action === 'sound') await playSfx(cue.value);
    else if (cue.action === 'handout' && host.library.handouts.some(h => h.id === cue.value)) { live.mode = 'handout'; live.handoutId = cue.value; live.page = 0; liveSave(`Cue: ${cue.label || cue.value}`); }
    else if (cue.action === 'banner' || cue.action === 'objective') { live[cue.action] = cue.value; liveSave(`Cue: ${cue.label || cue.action}`); }
    else if (cue.action === 'black') { live.mode = 'black'; liveSave(`Cue: ${cue.label || 'blackout'}`); }
    else if (cue.action === 'echo') { live.echo = !live.echo; liveSave(`Cue: ${cue.label || 'Echo'}`); if (live.echo) await playSfx(host.library.audio.echoMediaId); }
  }
  function change(event) {
    const el = event.target, live = host.state.presentation, library = host.library;
    if (el.id === 'live-scope') { liveScope = el.value === 'all' ? 'all' : 'session'; livePreviewKey = ''; renderDM(); return; }
    if (el.id === 'live-search') { liveSearch = clean(el.value, 100); livePreviewKey = ''; renderDM(); return; }
    if (el.id === 'p-media-file') { void importFiles([...el.files]); el.value = ''; return; }
    if (el.id === 'p-art-chapter') { artChapter = el.value; artPreviewId = ''; renderDM(); return; }
    if (el.id === 'p-art-search') { artSearch = clean(el.value, 100); artPreviewId = ''; renderDM(); return; }
    if (el.id === 'p-map-chapter') { mapChapter = el.value; mapPreviewId = ''; renderDM(); return; }
    if (el.id === 'p-map-search') { mapSearch = clean(el.value, 100); mapPreviewId = ''; renderDM(); return; }
    if (el.id === 'p-handout-select') { selectedHandout = el.value; previewPage = 0; renderDM(); return; }
    if (el.id === 'p-card-select') { selectedCard = el.value; renderDM(); return; }
    if (el.id === 'p-cue-beat') { selectedBeat = el.value; renderDM(); return; }
    if (el.dataset.audioVolume) { library.audio[el.dataset.audioVolume] = number(el.value, 50); applyVolumes(); save(); return; }
    if (el.dataset.audioNumber) { library.audio[el.dataset.audioNumber] = number(el.value, 2, 0, el.dataset.audioNumber === 'fade' ? 10 : 100); save(); return; }
    if (el.hasAttribute('data-echo-sound')) { library.audio.echoMediaId = el.value; save(); return; }
    if (el.dataset.mediaTags || el.dataset.mediaSource || el.dataset.mediaCategory) { const item = media(el.dataset.mediaTags || el.dataset.mediaSource || el.dataset.mediaCategory); if (item) { if (el.dataset.mediaTags) item.tags = el.value.split(',').map(s => clean(s.trim(), 40)).filter(Boolean).slice(0, 12); else if (el.dataset.mediaSource) item.source = clean(el.value, 200); else item.category = el.value; save(); } return; }
    const handout = library.handouts.find(h => h.id === selectedHandout);
    if (handout && el.hasAttribute('data-handout-title')) { handout.title = clean(el.value, 100); save(); return; }
    if (handout && el.hasAttribute('data-handout-text')) { handout.text = clean(el.value, 1000); save(); return; }
    if (handout && el.dataset.pageSetting) { const page = handout.pages[previewPage]; if (page) { page[el.dataset.pageSetting] = number(el.value, 0, el.dataset.pageSetting.startsWith('pan') ? -100 : 0, el.dataset.pageSetting === 'zoom' ? 300 : 100); save(); } return; }
    if (el.dataset.cardTitle !== undefined || el.dataset.cardSubtitle !== undefined || el.dataset.cardText !== undefined || el.dataset.cardMedia !== undefined) {
      const card = getCard(); if (card) { const key = el.dataset.cardTitle !== undefined ? 'title' : el.dataset.cardSubtitle !== undefined ? 'subtitle' : el.dataset.cardText !== undefined ? 'text' : 'mediaId'; card[key] = clean(el.value, key === 'text' ? 600 : 100); save(); } return;
    }
    if (el.dataset.liveMedia !== undefined) live.mediaId = el.value;
    else if (el.dataset.liveTitle !== undefined) live.title = clean(el.value, 100);
    else if (el.dataset.liveSubtitle !== undefined) live.subtitle = clean(el.value, 160);
    else if (el.dataset.liveBanner !== undefined) live.banner = clean(el.value, 100);
    else if (el.dataset.liveObjective !== undefined) live.objective = clean(el.value, 160);
    else if (el.dataset.liveEvent !== undefined) live.event = clean(el.value, 160);
    else if (el.dataset.liveEcho !== undefined) live.echo = el.checked;
    else if (el.dataset.overlay) live.overlays[el.dataset.overlay] = el.checked;
    else return;
    liveSave('Updated TV presentation');
  }
  const duckOwners=new Set();
  function holdDucking(owner,on){on?duckOwners.add(owner):duckOwners.delete(owner);applyVolumes();}
  let autoDuckUntil=0,duckTimer=0;const fadingAudio=new Map(),groupVersions={ambience:0,music:0},fadeGains={ambience:1,music:1};
  function audioState(){return {...(host?.library?.audio||{}),muted:audio.muted,ducking:audio.ducking||Date.now()<autoDuckUntil||duckOwners.size>0};}
  function setDucking(on){audio.ducking=!!on;autoDuckUntil=0;clearTimeout(duckTimer);applyVolumes();renderDM();}
  function duckFor(seconds){if(!host||seconds<=0)return;autoDuckUntil=Date.now()+Math.min(120,seconds)*1000;clearTimeout(duckTimer);applyVolumes();duckTimer=setTimeout(()=>{autoDuckUntil=0;applyVolumes();renderDM();},Math.min(120,seconds)*1000);}
  function groupVolume(group) {
    const settings = host.library.audio;
    return audio.muted ? 0 : settings.master / 100 * settings[group] / 100 * (audioState().ducking ? settings.duck / 100 : 1);
  }
  function applyVolumes() { for (const group of ['ambience', 'music', 'sfx']) if (audio[group]) audio[group].volume = groupVolume(group)*(fadeGains[group]??1);for(const [node,item]of fadingAudio)node.volume=groupVolume(item.group)*item.gain;globalThis.ECHO_SOUNDSCAPE?.setMix(audioState()); updateMuteButton(); window.dispatchEvent(new CustomEvent('echo-audio-state',{detail:audioState()})); }
  function audioStatus(message, error = false) { audio.status = message; audio.statusError = error; renderDM(); }
  function updateMuteButton() { const button = $('quick-mute'); if (button) { button.textContent = audio.muted ? '▶ Audio muted' : '■ Mute all'; button.setAttribute('aria-pressed', String(audio.muted)); } }
  function toggleMute() {
    audio.muted = !audio.muted;
    if (audio.muted) {for(const node of fadingAudio.keys())node.pause(); for (const group of ['ambience', 'music', 'sfx']) { audio[group]?.pause(); if (audio[group]) audio[group].currentTime = 0; } }
    else { for (const group of ['ambience', 'music']) audio[group]?.play().catch(error => audioStatus(`Could not resume ${group}: ${error.message}`, true)); }
    applyVolumes(); audioStatus(audio.muted ? 'All audio muted.' : 'Audio unmuted. Press Play or Test sound if needed.');
  }
  function stopGroup(group) {groupVersions[group]=(groupVersions[group]||0)+1;audio[group]?.pause();audio[group]=null;for(const [node,item]of fadingAudio)if(item.group===group){node.pause();fadingAudio.delete(node);}if(group in audio.ids)audio.ids[group]='';}
  function stopAll() {
    globalThis.ECHO_SOUNDSCAPE?.stop();window.dispatchEvent(new CustomEvent('echo-audio-state',{detail:{muted:true}}));autoDuckUntil=0;clearTimeout(duckTimer);
    for (const group of ['ambience', 'music', 'sfx']) stopGroup(group);
    audio.muted = false; audio.ducking = false;
    audioStatus('Audio stopped. Choose a sound or press Test sound.');
  }
  async function playGroup(group, mediaId) {
    if(!['ambience','music'].includes(group))return;
    if(!mediaId){stopGroup(group);audioStatus(`Stopped ${group}.`);return;}
    const item=media(mediaId);if(!item||item.kind!=='audio'||item.audience==='dm')return;
    if(audio.muted){audioStatus('Audio is muted. Press Resume audio, then Play.',true);return;}
    const generation=++groupVersions[group],url=item.path||await urlFor(mediaId);
    if(generation!==groupVersions[group]||audio.muted)return;
    if(!url)return audioStatus('Audio file could not be opened. Try importing it again.',true);
    const prior=audio[group],priorId=audio.ids[group],priorGain=fadeGains[group]??1,duration=host.library.audio.fade*1000;
    const next=new Audio(url);next.loop=true;next.volume=duration?0:groupVolume(group);audio[group]=next;fadeGains[group]=duration?0:1;
    if(prior)fadingAudio.set(prior,{group,gain:priorGain});
    try{await next.play();}catch(error){next.pause();if(generation===groupVersions[group]){audio[group]=prior;audio.ids[group]=priorId;fadeGains[group]=priorGain;fadingAudio.delete(prior);audioStatus(`Could not play ${item.name}: ${error.message}. Press Play after interacting with the page.`,true);}return;}
    if(generation!==groupVersions[group]){if(!fadingAudio.has(next))next.pause();if(prior){prior.pause();fadingAudio.delete(prior);}return;}
    if(audio.muted)next.pause();
    audio.ids[group]=mediaId;audioStatus(`Playing ${item.name} on this computer.`,false);const start=performance.now();
    function step(now){if(audio[group]!==next){if(prior){prior.pause();fadingAudio.delete(prior);}return;}const f=duration?Math.min(1,(now-start)/duration):1;fadeGains[group]=f;next.volume=groupVolume(group)*f;if(prior){const gain=priorGain*(1-f);prior.volume=groupVolume(group)*gain;fadingAudio.set(prior,{group,gain});}if(f<1)requestAnimationFrame(step);else if(prior){prior.pause();fadingAudio.delete(prior);}}
    requestAnimationFrame(step);
  }
  async function playSfx(mediaId) {
    const item = media(mediaId); if (!item || item.kind !== 'audio' || item.audience === 'dm') return false;
    if (audio.muted) { audioStatus('Audio is muted. Press Resume audio, then Test sound.', true); return false; }
    const url = item.path || await urlFor(mediaId); if (!url) { audioStatus('Audio file could not be opened.', true); return false; }
    audio.sfx?.pause(); const effect = new Audio(url); audio.sfx = effect; audio.ids.sfx = mediaId; effect.volume = groupVolume('sfx');
    try { await effect.play(); audioStatus(`Playing ${item.name} on this computer.`, false); return true; }
    catch (error) { audioStatus(`Could not play ${item.name}: ${error.message || error.name}. Check this computer's sound output.`, true); return false; }
  }
  let lastPublic = null;
  let lastPresentationMarkup = '';
  function renderPlayer(live) {
    if (!live) return; lastPublic = live;
    const frame = document.querySelector('.player-frame'), surface = $('player-presentation'), overlays = $('player-tv-overlays');
    if (!frame || !surface) return;
    frame.hidden = live.mode !== 'battle'; surface.hidden = live.mode === 'battle';
    $('player-handout').hidden = live.mode !== 'battle' || !$('player-handout').textContent.trim();
    $('player-character').hidden = live.mode !== 'battle' || !$('player-character').textContent.trim();
    if (live.mode !== 'battle') $('player-journal').hidden = true;
    $('player-journal-button').hidden = live.mode !== 'battle' || !(window.__echoPlayerJournal || []).length;
    if (live.mode !== 'battle') {
      const mediaId = live.mode === 'handout' ? live.handout?.page?.mediaId : live.mode === 'card' ? live.card?.mediaId : live.mediaId;
      const item = (live.media || []).find(m => m.id === mediaId), url = playerURL(mediaId, live) || (live.mode === 'scene' ? live.sceneImage : '');
      let visual = '';
      if (url && (item?.kind === 'image' || (!item && live.mode === 'scene'))) visual = `<img class="presentation-art" src="${esc(url)}" alt="">`;
      else if (url && item?.kind === 'video') visual = `<video class="presentation-art" src="${esc(url)}" autoplay loop muted playsinline></video>`;
      if (live.mode === 'handout' && live.handout?.page && visual) {
        const p = live.handout.page;
        visual = visual.replace('class="presentation-art"', `class="presentation-art" style="transform:translate(${p.panX}%,${p.panY}%) scale(${p.zoom / 100});clip-path:inset(${p.crop}%)"`);
      }
      const title = live.mode === 'handout' ? live.handout?.title : live.mode === 'card' ? live.card?.title : live.title;
      const subtitle = live.mode === 'handout' ? live.handout?.text : live.mode === 'card' ? [live.card?.subtitle, live.card?.text].filter(Boolean).join(' · ') : live.subtitle;
      if (live.mode === 'journal') {
        const entries = window.__echoPlayerJournal || [];
        const markup = `<div class="presentation-journal"><h1>Party journal</h1>${entries.map(e => `<article><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p></article>`).join('')}</div>`;
        if (markup !== lastPresentationMarkup) { surface.innerHTML = markup; lastPresentationMarkup = markup; }
      } else {
        const markup = `<div class="presentation-screen presentation-${esc(live.mode)} ${live.echo ? 'echo-active' : ''}">${visual}<div class="presentation-caption"><h1>${esc(title || '')}</h1><p>${esc(subtitle || '')}</p></div></div>`;
        if (markup !== lastPresentationMarkup) { surface.innerHTML = markup; lastPresentationMarkup = markup; }
      }
    }
    $('player-scene-title').textContent = live.banner || $('player-scene-title').textContent;
    $('player-app').classList.toggle('presentation-blackout', live.mode === 'black');
    $('player-hint').hidden = live.mode !== 'battle';
    const showTurn = live.overlays?.turn !== false && live.mode !== 'black';
    document.querySelector('.player-turn-bar').hidden = !showTurn && live.overlays?.roll === false;
    $('player-turn-summary').hidden = !showTurn;
    $('player-turn-list').hidden = !showTurn;
    $('player-roll-banner').hidden = live.overlays?.roll === false || !$('player-roll-banner').textContent;
    overlays.replaceChildren();
    for (const [enabled, value, name] of [[live.overlays?.objective, live.objective, 'Objective'], [live.overlays?.event, live.event, 'Event']]) {
      if (!enabled || !value || live.mode === 'black') continue;
      const pill = document.createElement('div'); pill.className = 'presentation-overlay';
      if (name === 'Event') pill.id = 'presentation-event-overlay';
      pill.textContent = `${name}: ${value}`; overlays.appendChild(pill);
    }
    overlays.hidden = !overlays.childElementCount;
    updateEventOverlay();
  }
  function updateEventOverlay() {
    const el = $('presentation-event-overlay');
    if (!el || !lastPublic) return;
    const seconds = lastPublic.eventEndsAt ? Math.max(0, Math.ceil((lastPublic.eventEndsAt - Date.now()) / 1000)) : null;
    el.textContent = `Event: ${lastPublic.event}${seconds === null ? '' : ` · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`}`;
  }
  if (location.hash === '#player') setInterval(updateEventOverlay, 1000);
  async function exportMedia(library, readRecord) {
    const files = {};
    for (const item of library.media.filter(m => !m.path)) {
      const blob = await readRecord(`media:${item.id}`);
      if (!(blob instanceof Blob)) continue;
      files[item.id] = await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(''); reader.readAsDataURL(blob); });
    }
    return files;
  }
  async function importMedia(files, library, writeRecord) {
    if (!files || typeof files !== 'object') return;
    for (const item of library.media.filter(m => !m.path)) {
      const data = files[item.id]; if (typeof data !== 'string' || !/^data:(image|audio|video)\/[\w.+-]+;base64,/.test(data)) continue;
      const response = await fetch(data); await writeRecord(`media:${item.id}`, await response.blob());
    }
  }
  globalThis.ECHO_PRESENTATION = { normalizeLibrary, normalizeLive, publicState, publicMediaIds, init, open, showCatalogArt, renderDM, renderPlayer,
    receiveMedia, toggleMute, stopAll, holdDucking, stopGroup, audioState, setDucking, duckFor, syncAudio:applyVolumes, playGroup, playSfx, exportMedia, importMedia };
})();
