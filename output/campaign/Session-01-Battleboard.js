(() => {
  'use strict';

  const APP = 'echo-below-session-01-battleboard';
  const STORAGE_KEY = 'echo-below-session-01-battleboard-v1';
  const CAMPAIGN_DB = 'echo-below-campaign-table-v1';
  const CAMPAIGN_INDEX_KEY = 'campaign:index';
  const CAMPAIGN_REGISTRY_KEY = 'campaigns:registry:v2';
  const DATA_VERSION = 3;
  const IS_PLAYER = location.hash === '#player';
  const IS_PRIVATE_PREVIEW=IS_PLAYER&&new URLSearchParams(location.search).get('dm-preview')==='1'&&window.parent!==window;
  const CONDITIONS = ['Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled',
    'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained',
    'Stunned', 'Unconscious', 'Concentrating', 'Surprised'];
  const content = globalThis.ECHO_TABLE_CONTENT || {};
  const SCENES = content.SCENES || {};
  const RUNBOOK = content.RUNBOOK || [];
  const RUNBOOK_IDS = content.RUNBOOK_IDS || new Set();
  const SCENE_NOTES = content.SCENE_NOTES || {};
  const ENCOUNTERS = content.ENCOUNTERS || [];
  const STATS = content.STATS || {};
  const INIT_BONUSES = content.INIT_BONUSES || {};
  const AC_DEFAULTS = content.AC_DEFAULTS || {};
  const COMBAT_CARDS = content.COMBAT_CARDS || {};
  const CARD_SOURCES = content.CARD_SOURCES || {};
  const HANDOUT_IMAGES = content.HANDOUT_IMAGES || new Set();
  const MAP_TOOLS = new Set(['target', 'move', 'ruler', 'circle', 'cone', 'square', 'line', 'ping', 'wall', 'door', 'secret', 'point', 'light', 'link', 'pan']);
  const MAP_SQUARES_ACROSS = 30;
  const SAFE_TOKEN_TYPES = new Set(['custom', 'hero', 'hero-trista', 'hero-donavan', 'hero-ringgo', 'hero-pebble', 'hero-aldric', 'paladin', 'sildar', 'goblin', 'wolf', 'bugbear', 'redbrand-ruffian', 'skeleton', 'nothic', 'evil-mage', 'hobgoblin', 'grick', 'owlbear', 'doppelganger', 'orc', 'ogre', 'zombie', 'hamun-kost', 'twig-blight', 'ash-zombie', 'giant-spider', 'young-green-dragon', 'cultist',
    ...(globalThis.ECHO_SESSION4_COMBAT?.creatureTypes || [])]);
  const TOWN_MAP_IDS = globalThis.ECHO_BOOT?.echo === false ? [] : ['region-lmop', 'town-phandalin', 'town-conyberry', 'town-thundertree', 'city-waterdeep'];

  function seedTownMapScenes(map) {
    if (!IS_PLAYER && map.scenes && globalThis.ECHO_TOWN_MAPS?.scene)
      for (const id of TOWN_MAP_IDS) map.scenes[id] ||= globalThis.ECHO_TOWN_MAPS.scene(id);
    return map;
  }

  function displaySceneTitle(value) {return String(value||'').replace(/^(.{1,100}?) · \1 · /,'$1 · ');}
  function sceneEntries(value = state) {
    if (value.sessionKind === 'custom') return (value.scenes || []).map(scene=>({...scene,title:displaySceneTitle(scene.title)}));
    return Object.entries(SCENES).map(([id, scene]) => ({ id, ...scene }));
  }

  function getScene(id, value = state) {
    if (Array.isArray(value.scenes)) return value.scenes.find(scene => scene.id === id);
    return SCENES[id];
  }

  function isMapScene(id = state.scene, value = state) {
    return getScene(id, value)?.kind === 'map';
  }

  function sceneHasFog(id = state.scene, value = state) {
    return getScene(id, value)?.fog === true;
  }

  function sessionRunbook(value = state) {
    const base = (value.sessionKind === 'custom' ? value.runbookBeats || [] : RUNBOOK).map(beat => globalThis.ECHO_NARRATION?.upgradeBeat(beat) || beat).map(beat=>beat.id==='s4-room-10'&&!beat.run?.some(line=>line.includes('dry northern passage'))?{...beat,run:['Source-map erratum · p. 43: the stair junction also has a dry northern passage toward area 18, separate from the low stream. Preserve the party’s known routes; finding this exit does not reveal other rooms.',...(beat.run||[])]}:beat);
    if (arguments.length) return base;
    const plan = campaignIndex.story?.sessionPlans?.[activeSessionId];
    const beats = [...base, ...(plan?.extraBeats || []).map(beat => Object.assign(beat, { storyExtra: true }))];
    const positions = new Map((plan?.order || []).map((id, index) => [id, index]));
    return beats.map((beat, index) => ({ beat, index })).sort((a, b) =>
      (positions.get(a.beat.id) ?? (positions.size + a.index)) - (positions.get(b.beat.id) ?? (positions.size + b.index)))
      .map(item => {const beat=globalThis.ECHO_TRANSITION?.decorate(item.beat,campaignIndex.story)||item.beat;return globalThis.ECHO_COURTYARD?.decorate(beat,campaignIndex.story)||beat;});
  }

  function sessionEncounters(value = state) {
    return value.sessionKind === 'custom' ? value.encounters || [] : ENCOUNTERS;
  }

  function fogForScene(id = state.scene, value = state) {
    return value.sessionKind === 'session1' && id === 'interior'
      ? value.fog || [] : value.sceneFog?.[id] || [];
  }

  function setFogForScene(id, tiles) {
    if (state.sessionKind === 'session1' && id === 'interior') state.fog = tiles;
    else state.sceneFog[id] = tiles;
  }

  function token(id, name, label, type, team, maxHp, encounter = '') {
    const creature = globalThis.ECHO_COMBAT_DATA?.CREATURES[type];
    return { id, name, label, type, team, encounter, maxHp, hp: maxHp, tempHp: 0, exhaustion: 0,
      initiative: null, initBonus: INIT_BONUSES[type] ?? (Number.isFinite(creature?.abilities?.[1]) ? Math.floor((creature.abilities[1] - 10) / 2) : null),
      ac: AC_DEFAULTS[type] ?? creature?.ac ?? null, conditions: [], extraAttacks: [],
      customAttack: { name: '', bonus: 0, count: 1, sides: 8, modifier: 0, damage: 'damage' },
      placed: false, visible: true, scene: '', x: 50, y: 50 };
  }
  function session4EnemyTokens() {
    return (globalThis.ECHO_SESSION4_COMBAT?.tokenSpecs || []).map(spec =>
      token(spec.id, spec.name, spec.label, spec.type, spec.team || 'enemy', spec.maxHp, spec.encounter));
  }
  function seedSession4Resources(value) {
    if (!value.combatRun?.resources) return;
    for (const [id, resources] of Object.entries(globalThis.ECHO_SESSION4_COMBAT?.resources || {}))
      if (value.tokens.some(item => item.id === id) && !Object.hasOwn(value.combatRun.resources, id))
        value.combatRun.resources[id] = structuredClone(resources);
    if (value.map?.tokenMeta) for (const foe of value.tokens.filter(item => item.id.startsWith('s4-wave-'))) {
      const size = (globalThis.ECHO_COMBAT_DATA.CREATURES[foe.type]?.size || 'medium').split(' ')[0].toLowerCase();
      value.map.tokenMeta[foe.id] ||= { size, facing: 0, elevation:
        /^s4-wave-18-bugbear-[12]$/.test(foe.id) ? -20 : 0, portrait: '' };
    }
  }
  function session2EnemyTokens() { return IS_PLAYER ? [] : content.session2EnemyTokens?.(token)||[]; }

  function session3EnemyTokens() { return IS_PLAYER ? [] : content.session3EnemyTokens?.(token)||[]; }

  function defaultTokens() { return IS_PLAYER ? [] : content.defaultTokens?.(token)||[]; }

  function entranceFog() {
    const visible = [];
    for (let row = 8; row < 10; row++) for (let col = 4; col <= 6; col++) visible.push(`${row},${col}`);
    return visible;
  }

  function newState() {
    const tokens = defaultTokens();
    const empty = globalThis.ECHO_BOOT?.echo === false;
    return { schemaVersion: DATA_VERSION, commandRevision: 0, session2ContentVersion: 7, session3ContentVersion: 1, session4ContentVersion: 1, contentPackId: '', waveEcho: globalThis.ECHO_WAVE_ECHO?.normalize() || null, contentProfile:empty?'blank':'echo-below', preservePartyProgression:empty, sessionKind:empty?'custom':'session1', scenes:empty?[{id:'black',title:'Black screen',kind:'black',image:'',fog:false,grid:false}]:null, encounters:empty?[]:null, runbookBeats:empty?[]:null, sceneFog: {}, assets: {},
      scene: empty?'black':'cover', runbook: empty?'all':'prep', grid: !empty, playerReveal: false, leaderTempHp: empty?0:7, fog: empty?[]:entranceFog(),
      requests: [], phoneRequests: [], phoneReplies: {}, phoneActions: globalThis.ECHO_PHONE_ACTIONS?.normalize(), tokens, party: globalThis.ECHO_PARTY_DATA?.seedParty(tokens) || {},
      combat: globalThis.ECHO_COMBAT_DATA?.normalizeCombat(null, ENCOUNTERS) || { plans: {}, creatures: {}, tokens: {}, effects: [], library: [] },
      combatRun: globalThis.ECHO_COMBAT_RUN?.normalize(), combatPlus: globalThis.ECHO_COMBAT_PLUS?.normalize(),
      partyMeta: { marchingOrder: '', lightSources: '', travelPace: 'normal', notes: empty?'':'Set marching order after Byron and Bowman introduce their characters.' },
      partyShown: '',
      turn: { scene: '', round: 0, order: [], index: 0 }, rolls: [], publicRollId: null,
      annotations: [], map: seedTownMapScenes(globalThis.ECHO_MAP_DATA?.normalize() || {}), sceneMood: globalThis.ECHO_TABLE?.normalizeMood(), handout: { visible: false, image: '', title: '', text: '' },
      tvTextCards: [],
      presentation: globalThis.ECHO_PRESENTATION?.normalizeLive(),
      ergonomics: globalThis.ECHO_ERGONOMICS?.normalizeSession(),
      sessionLog: [], undoStack: [], redoStack: [], ping: null };
  }

  function keepsPartyProgression(source, packId = '') {
    return globalThis.ECHO_BOOT?.echo === false || (Number(source?.schemaVersion) >= 2 && source?.party && typeof source.party === 'object') || source?.contentProfile === 'blank' || source?.preservePartyProgression === true ||
      ['waterdeep-undermountain-1', 'phandalin-waterdeep-transition', 'mending-court-home', 'silent-library-expedition']
        .includes(source?.contentPackId || packId);
  }

  function newCustomState(from = state) {
    const fresh = newState();
    fresh.sessionKind = 'custom';
    fresh.contentProfile = from.contentProfile === 'blank' ? 'blank' : 'echo-below';
    fresh.preservePartyProgression = keepsPartyProgression(from);
    fresh.scenes = [
      { id: 'cover', title: 'Campaign cover', kind: 'visual', image: 'assets/Echo-Below-Cover.png', fog: false, grid: false },
      { id: 'black', title: 'Black screen', kind: 'black', image: '', fog: false, grid: false },
      ...TOWN_MAP_IDS.map(id => ({ id, ...SCENES[id], fog: false, grid: false }))
    ];
    fresh.encounters = [];
    fresh.runbookBeats = [];
    fresh.sceneFog = {};
    fresh.scene = 'cover';
    fresh.runbook = 'all';
    fresh.grid = false;
    fresh.leaderTempHp = bounded(from.leaderTempHp ?? 7);
    fresh.fog = [];
    fresh.tokens = from.tokens.filter(t => t.team === 'pc' || t.team === 'ally').map(t => ({
      ...JSON.parse(JSON.stringify(t)), placed: false, scene: '', initiative: null, tempHp: fresh.preservePartyProgression ? t.tempHp : 0
    }));
    fresh.party = structuredClone(from.party || {});
    if (!fresh.preservePartyProgression) for (const item of Object.values(fresh.party)) item.tempHp = 0;
    if (!fresh.preservePartyProgression) for (const [id, maxHp] of [['pc-trista', 21], ['pc-pebble', 23]]) {
      const sheet = fresh.party[id], hero = fresh.tokens.find(token => token.id === id);
      if (!sheet || !hero || Number(sheet.level) >= 3) continue;
      const damageTaken = Math.max(0, hero.maxHp - hero.hp);
      hero.maxHp = maxHp; hero.hp = Math.max(0, maxHp - damageTaken);
      fresh.party[id] = globalThis.ECHO_PARTY_DATA.levelThreeSheet(sheet, hero);
    }
    const donavan = fresh.party['pc-donavan'];
    const donavanHero = fresh.tokens.find(token => token.id === 'pc-donavan');
    if (!fresh.preservePartyProgression && donavan && donavanHero && Number(donavan.level) < 3) {
      const damageTaken = Math.max(0, donavanHero.maxHp - donavanHero.hp);
      donavanHero.maxHp = 24;
      donavanHero.hp = Math.max(0, 24 - damageTaken);
      donavanHero.ac = 16;
      donavanHero.initBonus = 2;
      fresh.party['pc-donavan'] = globalThis.ECHO_PARTY_DATA.donavanLevelThreeSheet(donavan, donavanHero);
    }
    if (!fresh.preservePartyProgression) for (const [id, maxHp] of [['pc-ringgo', 24], ['pc-aldric', 25]]) {
      const sheet = fresh.party[id], hero = fresh.tokens.find(token => token.id === id);
      if (!sheet || !hero || Number(sheet.level) >= 3) continue;
      const damageTaken = Math.max(0, hero.maxHp - hero.hp);
      hero.maxHp = maxHp;
      hero.hp = Math.max(0, maxHp - damageTaken);
      hero.ac = id === 'pc-ringgo' ? 16 : 12;
      hero.initBonus = id === 'pc-ringgo' ? 4 : 2;
      fresh.party[id] = globalThis.ECHO_PARTY_DATA.latestLevelThreeSheet(sheet, hero);
    }
    fresh.partyMeta = structuredClone(from.partyMeta || fresh.partyMeta);
    const carriedTowns = Object.fromEntries(TOWN_MAP_IDS.filter(id => from.map?.scenes?.[id])
      .map(id => [id, structuredClone(from.map.scenes[id])]));
    fresh.map = seedTownMapScenes(globalThis.ECHO_MAP_DATA?.normalize({ displays: from.map?.displays, displayIndex: from.map?.displayIndex,
      playerInput: from.map?.playerInput, tokenMeta: from.map?.tokenMeta, scenes: carriedTowns }) || fresh.map);
    if (fresh.contentProfile === 'blank') { fresh.scenes = [{id:'black', title:'Black screen', kind:'black', image:'', fog:false, grid:false}]; fresh.scene='black'; fresh.map=globalThis.ECHO_MAP_DATA.normalize(); }
    fresh.partyShown = '';
    fresh.combat = globalThis.ECHO_COMBAT_DATA?.normalizeCombat({ library: from.combat?.library,
      creatures: from.combat?.creatures }, []) || fresh.combat;
    if(globalThis.ECHO_BOOT?.echo !== false)globalThis.ECHO_PARTY_DATA.syncGoronResistance(fresh);
    return fresh;
  }

  function bounded(value, max = 999) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(max, Math.round(n))) : 0;
  }

  function signedInteger(value, min = -99, max = 999) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : 0;
  }

  function pointValue(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50;
  }

  function validTile(key) {
    if (typeof key !== 'string' || !/^\d{1,3},\d{1,3}$/.test(key)) return false;
    const [row, col] = key.split(',').map(Number);
    return row >= 0 && row < 334 && col >= 0 && col < 500;
  }

  function tileDimensions(id = state.scene) {
    return globalThis.ECHO_FLOOR_MAPS?.resolution(state.map?.scenes?.[id]?.floorFog) || (state.map?.scenes?.[id]?.fineFog ? { rows: 20, cols: 32 } : { rows: 10, cols: 16 });
  }
  function tileForPoint(t) {
    const { rows, cols } = tileDimensions(t.scene);
    return `${Math.min(rows - 1, Math.floor(t.y * rows / 100))},${Math.min(cols - 1, Math.floor(t.x * cols / 100))}`;
  }
  function currentTile(key) {
    if (!validTile(key)) return false;
    const [row, col] = key.split(',').map(Number), { rows, cols } = tileDimensions();
    return row < rows && col < cols;
  }

  function safeImageSource(value) {
    if (typeof value !== 'string') return '';
    if(!IS_PLAYER&&(globalThis.ECHO_ATLAS?.proposal(value)?.proposalImage===value||globalThis.ECHO_ATLAS?.rasterSource(value)||value==='atlas/tactical/wave-echo-master.svg'))return value;
    const atlasImage=globalThis.ECHO_ATLAS_VIEW?.imageSource?.(value);
    if(atlasImage)return atlasImage;
    if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 8000000) return value;
    if (/^(assets|session-01-visuals|session-02-visuals|lmop-visuals|lmop-battle-maps|town-maps)\/[A-Za-z0-9/_-]+\.(png|jpg|jpeg|webp|svg)$/.test(value)) return value;
    return '';
  }

  function resolveImage(value, source = state) {
    if (typeof value === 'string' && value.startsWith('asset:')) return source.assets?.[value.slice(6)] || '';
    return safeImageSource(value);
  }

  function normalize(raw, packId = '') {
    const fresh = newState();
    if (!raw || typeof raw !== 'object') return fresh;
    globalThis.ECHO_RELIABILITY?.assertSupported(raw);
    fresh.commandRevision = Number.isSafeInteger(raw.commandRevision) && raw.commandRevision >= 0 ? raw.commandRevision : 0;
    fresh.contentProfile = globalThis.ECHO_BOOT?.echo === false || raw.contentProfile === 'blank' ? 'blank' : 'echo-below';
    fresh.contentPackId = String(raw.contentPackId || packId || '').slice(0, 80);
    // These packs carry the current sheets forward; historical level-up migrations
    // must not replace their saved progression when they are reopened or restored.
    fresh.preservePartyProgression = keepsPartyProgression(raw, fresh.contentPackId);
    const migrateLegacyPartyLevel = raw.sessionKind === 'custom' && !fresh.preservePartyProgression;
    fresh.waveEcho = globalThis.ECHO_WAVE_ECHO?.normalize(raw.waveEcho) || null;
    if (raw.assets && typeof raw.assets === 'object') for (const [id, data] of Object.entries(raw.assets).slice(0, 150)) {
      if (/^[A-Za-z0-9_-]{1,100}$/.test(id) && safeImageSource(data).startsWith('data:')) fresh.assets[id] = data;
    }
    const normalizeImage = (value, fallbackId) => {
      if (typeof value === 'string' && value.startsWith('asset:') && fresh.assets[value.slice(6)]) return value;
      const safe = safeImageSource(value);
      if (!safe.startsWith('data:')) return safe;
      const id = `image_${String(fallbackId).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80)}`;
      fresh.assets[id] = safe;
      return `asset:${id}`;
    };
    const oldBuiltInImages = {
      road: ['session-01-visuals/road-ambush-5ft-grid.png', 'session-01-visuals/road-ambush-gridless.png'],
      approach: ['session-01-visuals/cave-approach-5ft-grid.png', 'session-01-visuals/cave-approach-gridless.png'],
      interior: ['session-01-visuals/cragmaw-hideout-player.svg', 'session-01-visuals/cragmaw-hideout-map-source-page.png'],
      'phandalin-street': ['session-02-visuals/phandalin-street.svg'],
      'redbrand-hideout': ['session-02-visuals/redbrand-hideout.svg'],
      'region-lmop': ['town-maps/phandelver-region.svg'],
      'town-phandalin': ['town-maps/phandalin-overhead.svg'],
      'town-conyberry': ['town-maps/conyberry-overhead.svg'],
      'town-thundertree': ['town-maps/thundertree-overhead.svg'],
      ...Object.fromEntries((globalThis.LMOP_BATTLE_MAP_CATALOG || [])
        .filter(item => item.id.startsWith('lmop-map-'))
        .map(item => [item.id, [`lmop-battle-maps/${item.id.slice('lmop-map-'.length)}.svg`]]))
    };
    if (raw.sessionKind === 'custom') {
      fresh.sessionKind = 'custom';
      fresh.scenes = Array.isArray(raw.scenes) ? raw.scenes.slice(0, 100).filter(s =>
        s && typeof s.id === 'string' && typeof s.title === 'string' &&
        ['map', 'visual', 'black'].includes(s.kind)).map(s => ({
          id: s.id.slice(0, 80), title: s.title.slice(0, 80), kind: s.kind,
          image: oldBuiltInImages[s.id]?.includes(s.image) ? SCENES[s.id].image : normalizeImage(s.image, s.id),
          fog: s.kind === 'map' && s.fog === true,
          grid: s.kind === 'map' && s.grid === true,
          gridColumns: Math.max(5, Math.min(500, bounded(s.gridColumns || 30, 500)))
        })) : [];
      if (fresh.contentProfile !== 'blank' && !fresh.scenes.some(s => s.id === 'cover')) fresh.scenes.unshift({ id: 'cover', title: 'Campaign cover', kind: 'visual', image: 'assets/Echo-Below-Cover.png', fog: false, grid: false });
      if (!fresh.scenes.some(s => s.id === 'black')) fresh.scenes.push({ id: 'black', title: 'Black screen', kind: 'black', image: '', fog: false, grid: false });
      for (const id of fresh.contentProfile === 'blank' ? [] : TOWN_MAP_IDS) if (!fresh.scenes.some(scene => scene.id === id))
        fresh.scenes.push({ id, ...SCENES[id], fog: false, grid: false });
      fresh.encounters = Array.isArray(raw.encounters) ? raw.encounters.slice(0, 100).filter(e => e && typeof e.id === 'string').map(e => ({
        id: e.id.slice(0, 80), name: String(e.name || 'Encounter').slice(0, 80), note: String(e.note || '').slice(0, 500)
      })) : [];
      fresh.runbookBeats = Array.isArray(raw.runbookBeats) ? raw.runbookBeats.slice(0, 150).filter(b => b && typeof b.id === 'string').map(b => ({
        id: b.id.slice(0, 80), flowVersion: b.flowVersion===1?1:0, title: String(b.title || 'Untitled beat').slice(0, 100),
        scene: String(b.scene || '').slice(0, 80), encounter: String(b.encounter || '').slice(0, 80),
        read: Array.isArray(b.read) ? b.read.slice(0, 20).map(x => String(x).slice(0, 1200)) : [],
        readAfter: Array.isArray(b.readAfter) ? b.readAfter.slice(0, 20).map(x => String(x).slice(0, 1200)) : [],
        ask: Array.isArray(b.ask) ? b.ask.slice(0, 20).map(x => String(x).slice(0, 1200)) : [],
        run: Array.isArray(b.run) ? b.run.slice(0, 20).map(x => String(x).slice(0, 1200)) : [],
        choices: Array.isArray(b.choices) ? b.choices.slice(0, 20).map(x => String(x).slice(0, 1200)) : [],
        tv: String(b.tv || '').slice(0, 1200),
        private: Array.isArray(b.private) ? b.private.slice(0, 20).map(x => String(x).slice(0, 1200)) : []
      })) : [];
      if(fresh.contentPackId==='waterdeep-undermountain-1'&&globalThis.ECHO_UNDERMOUNTAIN_ARC){
        fresh.runbookBeats=globalThis.ECHO_UNDERMOUNTAIN_ARC.extendRunbook(fresh.runbookBeats);
        if(!fresh.scenes.some(s=>s.id==='mc-court'))fresh.scenes.push({id:'mc-court',...SCENES['mc-court'],fog:false,grid:false});
      }
      fresh.tokens = [];
      fresh.runbook = 'all';
      const isSession4 = fresh.contentPackId === 'lmop-part-4-visuals' || fresh.runbookBeats.some(beat => beat.id === 's4-prep');
      if (isSession4 && Number(raw.session4ContentVersion || 0) < 1) {
        const pack = globalThis.ECHO_CONTENT_PACKS?.find(item => item.id === 'lmop-part-4-visuals');
        if (pack) {
          for (const id of pack.scenes) if (!fresh.scenes.some(scene => scene.id === id) && SCENES[id])
            fresh.scenes.push({ id, ...SCENES[id], kind: SCENES[id].kind || 'visual', fog: SCENES[id].fog === true, grid: SCENES[id].kind === 'map' });
          for (const id of pack.encounters) if (!fresh.encounters.some(encounter => encounter.id === id)) {
            const encounter = ENCOUNTERS.find(item => item.id === id);
            if (encounter) fresh.encounters.push({ ...encounter });
          }
          for (const beat of pack.runbook) if (!fresh.runbookBeats.some(item => item.id === beat.id)) fresh.runbookBeats.push(structuredClone(beat));
          const savedIds = new Set((Array.isArray(raw.tokens) ? raw.tokens : []).filter(Boolean).map(item => item.id));
          fresh.tokens.push(...session4EnemyTokens().filter(item => !savedIds.has(item.id)));
          fresh.contentPackId = pack.id;
        }
      }
      const isSession3 = fresh.runbookBeats.some(beat => beat.id === 's3-choice') &&
        fresh.encounters.some(encounter => encounter.id === 'castle-king');
      if (isSession3 && Number(raw.session3ContentVersion || 0) < 1) {
        const pack = globalThis.ECHO_CONTENT_PACKS?.find(item => item.id === 'gundren-session-3');
        if (pack) {
          for (const id of pack.scenes) if (!fresh.scenes.some(scene => scene.id === id) && SCENES[id])
            fresh.scenes.push({ id, ...SCENES[id], kind: SCENES[id].kind || 'visual',
              fog: SCENES[id].fog === true, grid: SCENES[id].kind === 'map' });
          for (const id of pack.encounters) if (!fresh.encounters.some(encounter => encounter.id === id)) {
            const encounter = ENCOUNTERS.find(item => item.id === id);
            if (encounter) fresh.encounters.push({ ...encounter });
          }
          const insertAt = fresh.runbookBeats.findIndex(beat => beat.id === 's3-castle-sight');
          const additions = pack.runbook.filter(beat => !fresh.runbookBeats.some(item => item.id === beat.id))
            .map(beat => structuredClone(beat));
          fresh.runbookBeats.splice(insertAt < 0 ? fresh.runbookBeats.length : insertAt, 0, ...additions);
          fresh.tokens.push(...session3EnemyTokens());
        }
      }
      const isSession2 = fresh.runbookBeats.some(beat => beat.id === 's2-barthen') && fresh.encounters.some(encounter => encounter.id === 'redbrand-street');
      if (isSession2 && Number(raw.session2ContentVersion || 0) < 2) {
        const pack = globalThis.ECHO_CONTENT_PACKS?.find(item => item.id === 'phandalin-session-2');
        if (pack) {
          for (const id of pack.scenes) if (!fresh.scenes.some(scene => scene.id === id) && SCENES[id])
            fresh.scenes.push({ id, ...SCENES[id], kind: SCENES[id].kind || 'visual', fog: SCENES[id].fog === true, grid: SCENES[id].kind === 'map' });
          for (const id of pack.encounters) if (!fresh.encounters.some(encounter => encounter.id === id)) {
            const encounter = ENCOUNTERS.find(item => item.id === id);
            if (encounter) fresh.encounters.push({ ...encounter });
          }
          const close = fresh.runbookBeats.findIndex(beat => beat.id === 's2-close');
          const additions = pack.runbook.filter(beat => !fresh.runbookBeats.some(existing => existing.id === beat.id)).map(beat => structuredClone(beat));
          fresh.runbookBeats.splice(close < 0 ? fresh.runbookBeats.length : close, 0, ...additions);
          const manor = fresh.runbookBeats.find(beat => beat.id === 's2-manor');
          if (manor?.run?.some(line => line.includes('The next pack can continue from that point')))
            Object.assign(manor, structuredClone(pack.runbook.find(beat => beat.id === 's2-manor')));
          const town = fresh.runbookBeats.find(beat => beat.id === 's2-town');
          if (town?.run?.some(line => line.startsWith('Lionshield Coster: if the party')))
            Object.assign(town, structuredClone(pack.runbook.find(beat => beat.id === 's2-town')));
          const sildar = fresh.runbookBeats.find(beat => beat.id === 's2-sildar');
          if (sildar?.run?.some(line => line.startsWith('Sildar is looking for Iarno')) && sildar.run.length === 3)
            Object.assign(sildar, structuredClone(pack.runbook.find(beat => beat.id === 's2-sildar')));
          const ending = fresh.runbookBeats.find(beat => beat.id === 's2-close');
          if (ending?.run?.some(line => line.startsWith('Record wagon delivery and payment')) && ending.run.length === 3)
            Object.assign(ending, structuredClone(pack.runbook.find(beat => beat.id === 's2-close')));
          fresh.tokens.push(...session2EnemyTokens().filter(foe => foe.encounter !== 'redbrand-street'));
        }
      }
      if (isSession2 && Number(raw.session2ContentVersion || 0) < 3) {
        const revised = globalThis.ECHO_SESSION2_RUNBOOK || [];
        const unchanged = {
          's2-barracks': ['Three Redbrand ruffians. They may be prepared', 2],
          's2-trap': ['DC 15 Perception spots the pit.', 2],
          's2-crypt': ['Three skeletons animate when a creature nears', 2],
          's2-pens': ['Two ruffians guard Mirna Dendrar and her children', 2],
          's2-armory': ['Area 6 is locked from the outside. Its racks hold 12 spears', 2],
          's2-crevasse': ['Carp’s hillside tunnel enters here. A nothic lurks below', 3],
          's2-bugbears': ['Three bugbears sent by the Black Spider. Droop is intimidated', 3],
          's2-common': ['Four ruffians are gambling and drunk.', 2],
          's2-workshop': ['The rat is Iarno’s familiar and can warn him telepathically.', 2],
          's2-glasstaff': ['Iarno Albrek is Glasstaff. If warned', 5]
        };
        for (const [id, [prefix, count]] of Object.entries(unchanged)) {
          const beat = fresh.runbookBeats.find(item => item.id === id);
          const update = revised.find(item => item.id === id);
          if (beat?.run?.length === count && beat.run[0]?.startsWith(prefix) && update) {
            beat.run = structuredClone(update.run);
            const oldRead = { 's2-trap':'The passage narrows beneath old stone.',
              's2-crypt':'Three old stone coffins stand beneath a low ceiling.',
              's2-pens':'Iron bars divide the chamber. Two armed Redbrands turn toward you' }[id];
            if (oldRead && beat.read?.[0]?.startsWith(oldRead)) beat.read = structuredClone(update.read);
          }
        }
      }
      if (isSession2 && Number(raw.session2ContentVersion || 0) < 4) {
        const previousRead = {
          's2-barracks': 'A lamp warms this rough sleeping room. Red cloaks hang from pegs, and the people inside look up sharply from their interrupted rest.',
          's2-crevasse': 'The worked stone gives way to a raw split in the earth. Two narrow bridges cross the dark gap. Something below shifts its gaze toward you without making a sound.',
          's2-common': 'Dice clatter across a scarred table. Four red-cloaked figures are deep in a game and late to notice the doorway.',
          's2-glasstaff': 'A better-appointed room sits beyond the rougher hideout. Papers lie beside a travel chest, and a slender staff catches the lamplight. Someone has been planning from here.'
        };
        for (const [id, oldText] of Object.entries(previousRead)) {
          const beat = fresh.runbookBeats.find(item => item.id === id);
          const update = globalThis.ECHO_SESSION2_RUNBOOK?.find(item => item.id === id);
          if (beat?.read?.length === 1 && beat.read[0] === oldText && update) beat.read = structuredClone(update.read);
        }
        const glasstaff = fresh.runbookBeats.find(item => item.id === 's2-glasstaff');
        const revised = globalThis.ECHO_SESSION2_RUNBOOK?.find(item => item.id === 's2-glasstaff');
        const oldLoot = 'A search finds the Black Spider letter and an unlocked chest: 180 sp, 130 gp, five carnelians (10 gp each), two peridots (15 gp each), one pearl (100 gp), scrolls of charm person and fireball. Iarno also carries the staff of defense.';
        if (glasstaff?.run?.[3] === oldLoot && revised) glasstaff.run[3] = revised.run[3];
        if (glasstaff?.private?.length === 1 && glasstaff.private[0] === 'Lost Mine of Phandelver pp. 25–26; Evil Mage appendix p. 57; staff of defense appendix A p. 53.' && revised)
          glasstaff.private = structuredClone(revised.private);
      }
      if (isSession2 && Number(raw.session2ContentVersion || 0) < 5) {
        const revised = globalThis.ECHO_SESSION2_RUNBOOK || [];
        const beat = id => fresh.runbookBeats.find(item => item.id === id);
        const update = id => revised.find(item => item.id === id);
        const prep = beat('s2-prep');
        if (prep?.run?.length === 3 && prep.run[2] === 'No delivery, payment, conversation, or inn stay has happened yet.')
          prep.run.push(...update('s2-prep').run.slice(3));
        if (prep?.private?.length === 1 && prep.private[0] === 'Do not put Trista’s token or any unrevealed Echo explanation on the player TV.')
          prep.private = structuredClone(update('s2-prep').private);
        const barthen = beat('s2-barthen');
        if (barthen?.read?.[0] === 'Warm lamplight falls over rope, trail food, tools, and stacks of ledgers. Behind the counter, a thin shopkeeper looks up. His welcoming smile falters when he sees Sildar and counts the faces coming through the door. “Where is Gundren?”')
          barthen.read = structuredClone(update('s2-barthen').read);
        if (barthen?.private?.length === 1 && barthen.private[0] === 'Lost Mine of Phandelver p. 16. Barthen should not magically know where Gundren was taken.')
          barthen.private = structuredClone(update('s2-barthen').private);
        const sildar = beat('s2-sildar');
        if (sildar?.private?.length === 1 && sildar.private[0] === 'Published Iarno material is on pp. 14 and 18-19. His eventual identity is DM-only until discovered.')
          sildar.private = structuredClone(update('s2-sildar').private);
        const inn = beat('s2-inn');
        if (inn?.read?.[0] === 'The inn is warmer and louder than the street. Supper, wet cloaks, and low conversation crowd the common room. Several people glance toward Sildar, then toward your travel-worn gear. A child at one table stops talking mid-sentence.')
          inn.read = structuredClone(update('s2-inn').read);
        const town = beat('s2-town');
        if (town?.run?.[1] === 'Alderleaf Farm · Qelline is a welcoming halfling farmer. Her son Carp found a tunnel near the manor; he can guide the party to area 8. Say: “Carp came back white as a sheet, but he remembers exactly where he went.” Qelline also knows Reidoth may help with distant locations.')
          town.run[1] = update('s2-town').run[1];
        if (town?.choices?.length === 1 && town.choices[0] === 'Do not require every location in one session. Follow only the lead the players choose.')
          town.choices = structuredClone(update('s2-town').choices);
      }
      if (isSession2 && Number(raw.session2ContentVersion || 0) < 6) {
        const revised = globalThis.ECHO_SESSION2_RUNBOOK || [];
        const beat = id => fresh.runbookBeats.find(item => item.id === id);
        const update = id => revised.find(item => item.id === id);
        const prep = beat('s2-prep');
        const oldAbductors = 'The humanoid figures who took Gundren were not identified as goblins. Their identity, employer, and any handoff to Cragmaw Castle remain DM-side decisions; do not tell players a destination without evidence.';
        if (prep?.private?.[2] === oldAbductors) prep.private[2] = update('s2-prep').private[2];
        const town = beat('s2-town');
        const oldLead = 'If they focus on Gundren, Qelline can point toward Reidoth; Halia can point toward the Redbrands’ goblin. Droop has only a broad direction, while a captured bugbear can provide a more precise castle lead. Let the party discover these links through conversation.';
        if (town?.choices?.[1] === oldLead) town.choices[1] = update('s2-town').choices[1];
        const redbrands = beat('s2-redbrands');
        const oldCapture = 'If three are defeated, the last tries to escape toward Tresendar Manor. A captured ruffian can supply a lead. Protect bystanders from automatic splash damage.';
        if (redbrands?.run?.[2] === oldCapture) redbrands.run[2] = update('s2-redbrands').run[2];
        if (redbrands?.private?.length === 1 && redbrands.private[0] === 'Published trigger and flight behavior: p. 19; stat block: appendix B p. 61. Four ruffians can make eight attacks per round.')
          redbrands.private = structuredClone(update('s2-redbrands').private);
        const glasstaff = beat('s2-glasstaff');
        const oldKnowledge = 'Iarno knows the Spider seeks the Forge, but not the cave’s location. Sildar can arrange custody in the townmaster’s hall; the book doubles the 200 XP award if Iarno is delivered alive. Let the players decide what to do with him.';
        if (glasstaff?.run?.length === 5 && glasstaff.run[4] === oldKnowledge)
          glasstaff.run.splice(4, 1, ...structuredClone(update('s2-glasstaff').run.slice(4)));
      }
      if (isSession2 && Number(raw.session2ContentVersion || 0) < 7) {
        const close = fresh.runbookBeats.find(item => item.id === 's2-close');
        const oldLevel = 'No new level milestone is required. The party just earned level 2.';
        const revised = globalThis.ECHO_SESSION2_RUNBOOK?.find(item => item.id === 's2-close');
        if (close?.run?.[3] === oldLevel && revised) close.run[3] = revised.run[3];
      }
    }
    const knownScene = id => !!getScene(id, fresh);
    if (knownScene(raw.scene)) fresh.scene = raw.scene;
    const beats = sessionRunbook(fresh);
    if (raw.runbook === 'all' || beats.some(b => b.id === raw.runbook)) fresh.runbook = raw.runbook;
    else if (fresh.sessionKind === 'session1' && RUNBOOK_IDS.has(SCENE_NOTES[fresh.scene])) fresh.runbook = SCENE_NOTES[fresh.scene];
    fresh.grid = fresh.sessionKind === 'custom' ? raw.grid === true : raw.grid !== false;
    fresh.leaderTempHp = bounded(raw.leaderTempHp ?? 7);
    fresh.playerReveal = raw.playerReveal === true;
    fresh.map = globalThis.ECHO_MAP_DATA?.normalize(raw.map) || fresh.map;
    if (fresh.contentProfile !== 'blank') fresh.map = seedTownMapScenes(fresh.map);
    if (SCENES['region-lmop'] && getScene('region-lmop', fresh)?.image === SCENES['region-lmop'].image)
      globalThis.ECHO_TOWN_MAPS?.upgradeRegionScene(fresh.map.scenes?.['region-lmop']);
    fresh.sceneMood = globalThis.ECHO_TABLE?.normalizeMood(raw.sceneMood) || fresh.sceneMood;
    if (Array.isArray(raw.fog)) fresh.fog = [...new Set(raw.fog.filter(validTile))];
    if (raw.sceneFog && typeof raw.sceneFog === 'object') for (const [id, tiles] of Object.entries(raw.sceneFog)) {
      if (knownScene(id) && sceneHasFog(id, fresh) && Array.isArray(tiles))
        fresh.sceneFog[id] = [...new Set(tiles.filter(key=>{if(!validTile(key))return false;const [r,c]=key.split(',').map(Number),size=globalThis.ECHO_FLOOR_MAPS?.resolution(fresh.map.scenes[id]?.floorFog)||{rows:20,cols:32};return r<size.rows&&c<size.cols;}))];
    }
    if (Array.isArray(raw.requests)) fresh.requests = [...new Set(raw.requests.filter(validTile))];
    if (Array.isArray(raw.phoneRequests)) fresh.phoneRequests = raw.phoneRequests.slice(0, 40).filter(item => item &&
      typeof item.id === 'string' && ['tile', 'point', 'action', 'move'].includes(item.kind) && typeof item.scene === 'string' &&
      typeof item.characterId === 'string').map(item => ({ id: item.id.slice(0, 80), kind: item.kind,
        scene: item.scene.slice(0, 80), characterId: item.characterId.slice(0, 80),
        key: item.kind === 'tile' && validTile(item.key) ? item.key : '',
        pointId: item.kind === 'point' ? String(item.pointId || '').slice(0, 80) : '',
        label: item.kind === 'action' ? String(item.label || '').slice(0, 100) : '',
        x: item.kind === 'move' && item.x !== null && item.x !== '' && Number.isFinite(Number(item.x)) ? pointValue(item.x) : null,
        y: item.kind === 'move' && item.y !== null && item.y !== '' && Number.isFinite(Number(item.y)) ? pointValue(item.y) : null }))
      .filter(item => item.kind === 'tile' ? item.key : item.kind === 'point' ? item.pointId : item.kind === 'move' ? item.x !== null && item.y !== null : item.label);
    fresh.phoneActions = globalThis.ECHO_PHONE_ACTIONS?.normalize(raw.phoneActions);
    fresh.actionReceipts=(Array.isArray(raw.actionReceipts)?raw.actionReceipts:[]).slice(-60).filter(r=>r&&typeof r.owner==='string').map(r=>({owner:r.owner,receipt:globalThis.ECHO_ACTION_RECEIPTS?.model(r.receipt)})).filter(r=>r.receipt);
    if (raw.phoneReplies && typeof raw.phoneReplies === 'object') fresh.phoneReplies = Object.fromEntries(Object.entries(raw.phoneReplies).slice(0, 12)
      .filter(([id, value]) => /^pc-[A-Za-z0-9_-]{1,75}$/.test(id) && typeof value === 'string')
      .map(([id, value]) => [id, value.slice(0, 160)]));
    const saved = new Map((Array.isArray(raw.tokens) ? raw.tokens : []).filter(t => t && typeof t.id === 'string').map(t => [t.id, t]));
    for (const old of saved.values()) {
      if (fresh.tokens.some(t => t.id === old.id) || fresh.tokens.length >= 250) continue;
      if (globalThis.ECHO_BOOT?.echo !== false && old.id === 'ally-dracuseth') continue;
      if (!['pc', 'ally', 'enemy'].includes(old.team)) continue;
      const type = SAFE_TOKEN_TYPES.has(old.type) || raw.combat?.creatures?.[old.type] ? old.type : 'custom';
      fresh.tokens.push(token(old.id.slice(0, 80), String(old.name || 'Combatant').slice(0, 60),
        String(old.label || '?').slice(0, 4), type, old.team, bounded(old.maxHp),
        String(old.encounter || '').slice(0, 80)));
    }
    for (const t of fresh.tokens) {
      const old = saved.get(t.id);
      if (!old) continue;
      if (t.team !== 'pc' && ['ally', 'enemy'].includes(old.team)) t.team = old.team;
      t.maxHp = bounded(old.maxHp);
      t.hp = bounded(old.hp);
      t.tempHp = bounded(old.tempHp);
      t.exhaustion = Math.max(0, Math.min(6, bounded(old.exhaustion, 6)));
      t.placed = old.placed === true;
      t.visible = old.visible !== false;
      t.scene = isMapScene(old.scene, fresh) ? old.scene : '';
      t.x = pointValue(old.x);
      t.y = pointValue(old.y);
      if (old.initiative !== null && old.initiative !== undefined && old.initiative !== '' && Number.isFinite(Number(old.initiative))) {
        t.initiative = signedInteger(old.initiative);
      }
      if (Object.hasOwn(old, 'initBonus')) {
        t.initBonus = old.initBonus === null || old.initBonus === '' ? null : signedInteger(old.initBonus, -99, 99);
      }
      if (Object.hasOwn(old, 'ac')) t.ac = old.ac === null || old.ac === '' ? null : bounded(old.ac, 99);
      if (fresh.sessionKind === 'custom' && fresh.runbookBeats.some(beat => beat.id === 's2-barthen') &&
          Number(raw.session2ContentVersion || 0) < 4 && t.encounter === 'hideout-glasstaff' && !t.placed && t.ac === null)
        t.ac = 16;
      if (Array.isArray(old.conditions)) t.conditions = [...new Set(old.conditions.filter(c => CONDITIONS.includes(c)))];
      if (old.customAttack && typeof old.customAttack === 'object') t.customAttack = {
        name: String(old.customAttack.name || '').slice(0, 50),
        bonus: old.customAttack.bonus === null || old.customAttack.bonus === '' ? null : signedInteger(old.customAttack.bonus, -99, 99),
        count: Math.max(1, Math.min(20, bounded(old.customAttack.count, 20))),
        sides: [4, 6, 8, 10, 12, 20, 100].includes(Number(old.customAttack.sides)) ? Number(old.customAttack.sides) : 8,
        modifier: signedInteger(old.customAttack.modifier, -99, 99),
        damage: String(old.customAttack.damage || 'damage').slice(0, 40)
      };
      if (Array.isArray(old.extraAttacks)) t.extraAttacks = old.extraAttacks.slice(0, 20).filter(a => a && typeof a.name === 'string').map(a => ({
        name: a.name.slice(0, 50), bonus: a.bonus === null ? null : signedInteger(a.bonus, -99, 99),
        count: Math.max(1, Math.min(20, bounded(a.count, 20))),
        sides: [4, 6, 8, 10, 12, 20, 100].includes(Number(a.sides)) ? Number(a.sides) : 8,
        modifier: signedInteger(a.modifier, -99, 99), damage: String(a.damage || 'damage').slice(0, 40)
      }));
    }
    const oldDonavan = raw.party?.['pc-donavan']?.sourceStatus === 'Story guide; combat numbers and level need live sheet';
    const donavanToken = fresh.tokens.find(t => t.id === 'pc-donavan');
    if (!fresh.preservePartyProgression && oldDonavan && donavanToken && donavanToken.maxHp === 0 && donavanToken.hp === 0) {
      donavanToken.maxHp = 9; donavanToken.hp = 9;
      if (donavanToken.ac === null) donavanToken.ac = 12;
      if (donavanToken.initBonus === null) donavanToken.initBonus = 2;
    }
    const oldSildar = raw.party?.['ally-sildar']?.sourceStatus === 'Provisional; verify equipment and statistics in adventure';
    const sildarToken = fresh.tokens.find(t => t.id === 'ally-sildar');
    if (!fresh.preservePartyProgression && oldSildar && sildarToken?.hp === 1 && sildarToken.ac === 16) sildarToken.ac = null;
    const yeemikToken = fresh.tokens.find(t => t.id === 'yeemik');
    if (yeemikToken?.maxHp === 7 && yeemikToken.hp === 7) {
      yeemikToken.maxHp = 12;
      yeemikToken.hp = 12;
    }
    // Import the new player sheets once while keeping damage and other live combat state.
    const characterRevisions = [
      { id: 'pc-ringgo', status: 'Current uploaded sheet; second Expertise choice remains open', oldHp: 10, maxHp: 17, ac: 16, init: 4 },
      { id: 'pc-donavan', status: 'Current uploaded sheet; prepared spells and newer spell sources need confirmation', oldHp: 9, maxHp: 17, ac: 12, init: 2 },
      { id: 'pc-aldric', status: 'Playable DM-built sheet; replace choices with Bowman’s sheet if supplied', oldHp: 8, maxHp: 18, ac: 12, init: 2, currentHp: 9 }
    ];
    for (const revision of fresh.preservePartyProgression ? [] : characterRevisions) {
      if (raw.party?.[revision.id]?.sourceStatus !== revision.status) continue;
      const hero = fresh.tokens.find(t => t.id === revision.id);
      if (!hero || hero.maxHp !== revision.oldHp) continue;
      const damageTaken = Math.max(0, hero.maxHp - hero.hp);
      hero.maxHp = revision.maxHp;
      hero.hp = Math.max(0, (revision.currentHp ?? revision.maxHp) - damageTaken);
      hero.ac = revision.ac;
      hero.initBonus = revision.init;
    }
    if (migrateLegacyPartyLevel) for (const [id, maxHp] of [['pc-trista', 21], ['pc-pebble', 23]]) {
      if (Number(raw.party?.[id]?.level) >= 3) continue;
      const hero = fresh.tokens.find(token => token.id === id);
      if (!hero || hero.maxHp <= 0) continue;
      const damageTaken = Math.max(0, hero.maxHp - hero.hp);
      hero.maxHp = maxHp;
      hero.hp = Math.max(0, maxHp - damageTaken);
    }
    if (migrateLegacyPartyLevel && Number(raw.party?.['pc-donavan']?.level) < 3) {
      const hero = fresh.tokens.find(token => token.id === 'pc-donavan');
      if (hero && hero.maxHp > 0) {
        const damageTaken = Math.max(0, hero.maxHp - hero.hp);
        hero.maxHp = 24;
        hero.hp = Math.max(0, 24 - damageTaken);
        hero.ac = 16;
        hero.initBonus = 2;
      }
    }
    if (migrateLegacyPartyLevel) for (const [id, maxHp, ac, init] of [
      ['pc-ringgo', 24, 16, 4], ['pc-aldric', 25, 12, 2]]) {
      if (Number(raw.party?.[id]?.level) >= 3) continue;
      const hero = fresh.tokens.find(token => token.id === id);
      if (!hero || hero.maxHp <= 0) continue;
      const damageTaken = Math.max(0, hero.maxHp - hero.hp);
      hero.maxHp = maxHp;
      hero.hp = Math.max(0, maxHp - damageTaken);
      hero.ac = ac;
      hero.initBonus = init;
    }
    fresh.party = globalThis.ECHO_PARTY_DATA?.normalizeParty(raw.party, fresh.tokens, migrateLegacyPartyLevel, fresh.preservePartyProgression) || {};
    if (!fresh.preservePartyProgression && fresh.sessionKind === 'custom' && fresh.runbookBeats.some(beat => beat.id === 's2-barthen') &&
        Number(raw.session2ContentVersion || 0) < 3)
      for (const sheet of Object.values(fresh.party)) if (sheet.role === 'pc') sheet.level = Math.max(2, Number(sheet.level) || 0);
    fresh.combat = globalThis.ECHO_COMBAT_DATA?.normalizeCombat(raw.combat, sessionEncounters(fresh)) || fresh.combat;
    if(globalThis.ECHO_BOOT?.echo !== false)globalThis.ECHO_PARTY_DATA.syncGoronResistance(fresh);
    fresh.combatRun = globalThis.ECHO_COMBAT_RUN?.normalize(raw.combatRun);
    fresh.combatPlus = globalThis.ECHO_COMBAT_PLUS?.normalize(raw.combatPlus);
    if (fresh.contentPackId === 'lmop-part-4-visuals' && Number(raw.session4ContentVersion || 0) < 1)
      seedSession4Resources(fresh);
    if (fresh.sessionKind === 'custom' && fresh.runbookBeats.some(beat => beat.id === 's2-barthen') &&
        Number(raw.session2ContentVersion || 0) < 3) {
      const legacyPlanText = {
        'hideout-trap': { terrain:'Concealed 20-foot pit in corridor.' },
        'hideout-crypt': { starting:'Three skeletons inert until trigger.', reinforcements:'None specified.' },
        'hideout-pens': { terrain:'Prison bars and vulnerable captives.', starting:'Two guards.', nonCombat:'Distract or negotiate while securing captives.' },
        'hideout-bugbears': { starting:'Three bugbears; Droop is a frightened noncombatant.', nonCombat:'Retreat, bluff, or question Droop after.', negotiation:'Droop can describe rooms, not a precise castle location.' },
        'hideout-common': { starting:'Four drunk ruffians.' },
        'hideout-glasstaff': { retreat:'Secret route toward storeroom, crevasse, cellar.' }
      };
      for (const [id, fields] of Object.entries(legacyPlanText)) {
        const plan = fresh.combat.plans[id], revised = globalThis.ECHO_COMBAT_DATA.PLANS[id];
        if (!plan || !revised) continue;
        for (const [field, oldValue] of Object.entries(fields))
          if (plan[field] === oldValue) plan[field] = revised[field];
        if (['hideout-crypt','hideout-bugbears','hideout-common','hideout-glasstaff'].includes(id) &&
            plan.waves[0]?.note === {
              'hideout-crypt':'Only animate near side doors unless cloak or password Illefarn.',
              'hideout-bugbears':'Droop is not in the enemy wave.',
              'hideout-common':'Check poisoned condition from room key.',
              'hideout-glasstaff':'If warned, use escape route before deploying.'
            }[id]) plan.waves[0].note = revised.waves[0].note;
      }
    }
    for (const t of fresh.tokens) if (t.team === 'enemy') {
      const defaults = globalThis.ECHO_COMBAT_DATA.creatureDefense(t.type, fresh.combat.creatures);
      const record = fresh.combat.tokens[t.id] ||= defaults;
      if (Number(raw.session2ContentVersion || 0) < 3 && t.id.startsWith('s2-')) {
        for (const field of ['resistances', 'vulnerabilities', 'immunities']) if (!record[field]) record[field] = defaults[field];
        if (t.encounter === 'hideout-common' && !t.placed && !t.conditions.length) t.conditions = ['Poisoned'];
      }
    }
    if (raw.partyMeta && typeof raw.partyMeta === 'object') fresh.partyMeta = {
      marchingOrder: String(raw.partyMeta.marchingOrder || '').replace(/(?:,\s*)?Dracuseth(?:\s*,)?/gi, ', ').replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',').slice(0, 300),
      lightSources: String(raw.partyMeta.lightSources || '').slice(0, 500),
      travelPace: ['slow', 'normal', 'fast'].includes(raw.partyMeta.travelPace) ? raw.partyMeta.travelPace : 'normal',
      notes: String(raw.partyMeta.notes || '').slice(0, 2000)
    };
    if (typeof raw.partyShown === 'string' && fresh.party[raw.partyShown]) fresh.partyShown = raw.partyShown;
    const knownIds = new Set(fresh.tokens.map(t => t.id));
    if (raw.turn && typeof raw.turn === 'object') {
      const order = Array.isArray(raw.turn.order) ? raw.turn.order.filter(id => knownIds.has(id)) : [];
      fresh.turn = { scene: isMapScene(raw.turn.scene, fresh) ? raw.turn.scene : '',
        round: bounded(raw.turn.round), order: [...new Set(order)],
        index: Math.min(Math.max(0, signedInteger(raw.turn.index, 0, 999)), Math.max(0, order.length - 1)) };
    }
    if (Array.isArray(raw.rolls)) {
      fresh.rolls = raw.rolls.slice(0, 50).filter(r => r && typeof r.id === 'string').map(r => ({
        id: r.id.slice(0, 80), label: String(r.label || '').slice(0, 80),
        notation: String(r.notation || '').slice(0, 40),
        parts: Array.isArray(r.parts) ? r.parts.slice(0, 20).map(part => bounded(part, 100)) : [],
        total: signedInteger(r.total, -999, 999), kind: r.kind === 'manual' ? 'manual' : 'digital',
        time: String(r.time || '').slice(0, 40)
      }));
    }
    if (typeof raw.publicRollId === 'string' && fresh.rolls.some(r => r.id === raw.publicRollId)) fresh.publicRollId = raw.publicRollId;
    if (Array.isArray(raw.annotations)) fresh.annotations = raw.annotations.slice(0, 80).filter(a =>
      a && typeof a.id === 'string' && isMapScene(a.scene, fresh) &&
      ['ruler', 'circle', 'cone', 'square', 'line'].includes(a.kind)).map(a => ({
        id: a.id.slice(0, 80), scene: a.scene, kind: a.kind,
        x1: pointValue(a.x1), y1: pointValue(a.y1), x2: pointValue(a.x2), y2: pointValue(a.y2)
      }));
    if (raw.handout && typeof raw.handout === 'object') fresh.handout = {
      visible: raw.handout.visible === true,
      image: HANDOUT_IMAGES.has(raw.handout.image) || fresh.scenes?.some(s => s.image === raw.handout.image) ||
        (typeof raw.handout.image === 'string' && raw.handout.image.startsWith('asset:') && fresh.assets[raw.handout.image.slice(6)])
        ? raw.handout.image : '',
      title: String(raw.handout.title || '').slice(0, 100),
      text: String(raw.handout.text || '').slice(0, 1200)
    };
    fresh.tvTextCards = globalThis.ECHO_TV_TEXT?.normalizeCards(raw.tvTextCards) || [];
    fresh.presentation = globalThis.ECHO_PRESENTATION?.normalizeLive(raw.presentation);
    fresh.atlas = IS_PLAYER ? globalThis.ECHO_ATLAS_VIEW?.normalize(raw.atlas) || null : null;
    fresh.ergonomics = globalThis.ECHO_ERGONOMICS?.normalizeSession(raw.ergonomics);
    if (Array.isArray(raw.sessionLog)) fresh.sessionLog = raw.sessionLog.slice(0, 100).filter(e => e && typeof e.label === 'string').map(e =>
      ({ label: e.label.slice(0, 140), time: String(e.time || '').slice(0, 40),
        round: bounded(e.round, 999), actor: String(e.actor || '').slice(0, 80) }));
    if (Array.isArray(raw.undoStack)) fresh.undoStack = raw.undoStack.slice(-20).filter(e =>
      e && typeof e.snapshot === 'string' && e.snapshot.length < 250000).map(e =>
      ({ snapshot: e.snapshot, label: String(e.label || 'Change').slice(0, 140),
        time: String(e.time || '').slice(0, 40) }));
    if (Array.isArray(raw.redoStack)) fresh.redoStack = raw.redoStack.slice(-20).filter(e =>
      e && typeof e.snapshot === 'string' && e.snapshot.length < 250000).map(e =>
      ({ snapshot: e.snapshot, label: String(e.label || 'Change').slice(0, 140),
        time: String(e.time || '').slice(0, 40) }));
    return fresh;
  }

  function readSavedState() {
    let raw;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch { return newState(); }
    return raw ? normalize(JSON.parse(raw)) : newState();
  }

  let state = newState();
  let activeSessionId = 'session-01';
  let campaignIndex = { schemaVersion: DATA_VERSION, active: 'session-01', sessions: [{ id: 'session-01', name: globalThis.ECHO_BOOT?.echo === false?'Session 1':'Session 1 · Goblin Arrows' }], installedPacks:globalThis.ECHO_BOOT?.installedPacks, restorePoints: [], migrationReport: [],
    rules: globalThis.ECHO_RULES_UI?.normalizeSettings(null) || null, combatLibrary: [],
    story: globalThis.ECHO_STORY_DATA?.normalize() || null,
    presentation: globalThis.ECHO_PRESENTATION?.normalizeLibrary() || null,
    ergonomics: globalThis.ECHO_ERGONOMICS?.normalizeSettings() || null,
    tableExtras: globalThis.ECHO_TABLE?.normalize() || null };
  let saveQueue = Promise.resolve();
  let campaignRegistry = globalThis.ECHO_RELIABILITY?.normalizeRegistry() || { schemaVersion: DATA_VERSION, active: 'default', campaigns: [{ id: 'default', name: 'The Echo Below', archived: false }] };
  let activeCampaignId = 'default';
  const campaignIndexKey = (id = activeCampaignId) => `campaign:${id}:index`;
  const campaignSessionKey = (sessionId, id = activeCampaignId) => `campaign:${id}:session:${sessionId}`;
  const sessionCache = new Map();
  let playerWindow = null;
  const playerClients = new Map();
  const tvChannel = !IS_PRIVATE_PREVIEW && location.protocol !== 'file:' && typeof BroadcastChannel === 'function'
    ? new BroadcastChannel(`${APP}-player-tv`) : null;
  const tvClientId = `${Date.now()}-${Math.random()}`;
  const dmInstanceId = `${Date.now()}-${Math.random()}`;
  const dmStartedAt = Date.now();
  const channelSources = new Map();
  let activeDmId = '';
  let activeDmStartedAt = 0;
  let activeDmAt = 0;
  let playerLastAppliedRevision = 0;
  let playerStartedAt = Date.now();
  let tvCalibrationCheck = false;
  let playerViewport = null;
  let playerRenderMs = 0;
  let connected = false;
  let lastSentRevision = 0;
  let selectedEncounter = 'road';
  let editingSceneId = null;
  let editingBeatId = null;
  let fogPainting = false;
  let fogCovering = false;
  let fogSyncQueued = false;
  let priorScene = 'cover';
  let toastTimer = null;const feedbackRecords=[];
  let selectedTokenId = null;
  let contextTab = 'turn';
  let selectedClueId = '';
  let previewSceneId = '';
  let floorFocusPreview = null;
  let previewQuery = '', previewKind = 'all';
  let activeMapTool = 'move';
  let mapPreview = null;
  let pingTimer = null;
  let lastCommittedSnapshot = gameSnapshot(state);

  const $ = id => document.getElementById(id);
  const getToken = id => state.tokens.find(t => t.id === id);
  const currentIsMap = () => isMapScene();

  function syncPartyFromTokens() {
    if (!globalThis.ECHO_PARTY_DATA || IS_PLAYER) return;
    for (const t of state.tokens.filter(item => item.team === 'pc' || item.team === 'ally')) {
      if (!state.party[t.id]) state.party[t.id] = globalThis.ECHO_PARTY_DATA.seedSheet(t.id, t.name, t.team);
      const sheet = state.party[t.id];
      if (sheet.hp === 0 && t.hp > 0 && sheet.death)
        sheet.death = { successes: 0, failures: 0, stable: false };
      sheet.hp = t.maxHp ? t.hp : null;
      sheet.maxHp = t.maxHp || null;
      sheet.tempHp = t.tempHp;
      sheet.ac = t.ac;
      sheet.exhaustion = t.exhaustion || 0;
      sheet.conditions = [...new Set([...(sheet.conditions || []).filter(c => !CONDITIONS.includes(c)),
        ...t.conditions.filter(c => c !== 'Concentrating')])];
      if (t.conditions.includes('Concentrating') && !sheet.concentration) sheet.concentration = 'Effect unspecified';
      if (!t.conditions.includes('Concentrating')) sheet.concentration = '';
      const combatRecord = combatTokenRecord(t.id);
      combatRecord.concentration = t.conditions.includes('Concentrating') ? sheet.concentration : '';
      combatRecord.surprised = t.conditions.includes('Surprised');
    }
  }

  function commitParty(label) {
    for (const sheet of Object.values(state.party)) {
      const t = getToken(sheet.id);
      if (!t) continue;
      t.name = sheet.name.slice(0, 60);
      t.maxHp = bounded(sheet.maxHp);
      t.hp = bounded(sheet.hp);
      t.tempHp = bounded(sheet.tempHp);
      t.ac = sheet.ac === null ? null : bounded(sheet.ac, 99);
      t.exhaustion = bounded(sheet.exhaustion, 6);
      t.conditions = [...new Set([...(sheet.conditions || []).filter(c => CONDITIONS.includes(c)),
        ...(sheet.concentration ? ['Concentrating'] : [])])];
    }
    commit(label);
  }

  function gameSnapshot(value) {
    const { sessionLog, undoStack, redoStack, ping, assets, ...game } = value;
    const {sessionFlow, ...tableExtras} = campaignIndex?.tableExtras || {};
    return JSON.stringify({ ...game, __tableExtras: tableExtras });
  }

  function pruneUnusedAssets() {
    if (!state.assets || !Object.keys(state.assets).length) return;
    const references = `${gameSnapshot(state)}${state.undoStack.map(step => step.snapshot).join('')}${state.redoStack.map(step => step.snapshot).join('')}`;
    for (const id of Object.keys(state.assets)) if (!references.includes(`asset:${id}`)) delete state.assets[id];
  }

  function commandReceiptPending(review){return review.event?.combatAftermath?.pending?[review.event.combatAftermath.pending]:[];}
  function actionReceipt(raw,owner='') {
    const receipt=globalThis.ECHO_ACTION_RECEIPTS?.model(raw);if(!receipt)return;
    if(owner){state.actionReceipts ||= [];state.actionReceipts.push({owner,receipt:{...receipt,undo:'ask-dm'}});state.actionReceipts=state.actionReceipts.slice(-60);}
    globalThis.ECHO_ACTION_RECEIPTS.show(receipt,activeCampaignId+'/'+activeSessionId);
  }
  function toast(message) {
    const el = $('toast');
    el.textContent = String(message);
    const failure=/cannot|could not|failed|error|blocked|missing|unavailable|disconnected|not saved/i.test(String(message));const previous=feedbackRecords.find(r=>r.message===String(message));if(previous){previous.count++;previous.at=Date.now();}else feedbackRecords.unshift({message:String(message),failure,count:1,at:Date.now()});if(feedbackRecords.length>40){let at=feedbackRecords.findLastIndex(r=>!r.failure);feedbackRecords.splice(at<0?feedbackRecords.length-1:at,1);}
    el.dataset.state=failure?'failed':'saved';const history=$('dm-feedback-history');if(history){history.replaceChildren();for(const record of feedbackRecords.slice().sort((a,b)=>Number(b.failure)-Number(a.failure)||b.at-a.at)){const row=document.createElement('p');row.textContent=`${record.failure?'Needs attention':'Update'} · ${new Date(record.at).toLocaleTimeString()} · ${record.message}${record.count>1?' · repeated '+record.count+' times':''}`;history.append(row);}const label=$('dm-feedback-summary');label.textContent=`Notices · ${feedbackRecords.filter(r=>r.failure).length} issues · ${feedbackRecords.length} updates`;}
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  const persistence = IS_PLAYER ? null : globalThis.ECHO_STORAGE?.create(CAMPAIGN_DB);
  const stored = name => (...args) => {
    if (!persistence) throw Error('Campaign storage module is unavailable. Keep the app files together and reload.');
    return persistence[name](...args);
  };
  const readRecord = stored('readRecord'), writeRecord = stored('writeRecord'),
    writeRecordsAtomic = stored('writeRecordsAtomic'), writeMediaRecord = stored('writeMediaRecord'),
    deleteRecord = stored('deleteRecord');

  const failedSaveKeys = new Set();
  function enqueueSave(key, value) {
    const status = $('save-status');
    if (status) { status.textContent = 'Saving…'; status.classList.remove('error'); }
    saveQueue = saveQueue.then(() => writeRecord(key, value)).then(() => {
      failedSaveKeys.delete(key);
      if (status) { status.textContent = failedSaveKeys.size ? 'Some changes could not save · download a backup' : 'Saved'; status.classList.toggle('error', failedSaveKeys.size > 0); }
    }).catch(() => {
      failedSaveKeys.add(key);
      if (status) { status.textContent = 'Could not save · download a backup'; status.classList.add('error'); }
    });
    return saveQueue;
  }

  function saveLocal() {
    if (IS_PLAYER) return Promise.resolve();
    const snapshot = JSON.stringify(state);
    sessionCache.set(activeSessionId, snapshot);
    return enqueueSave(campaignSessionKey(activeSessionId), snapshot);
  }

  function saveCampaignIndex() {
    campaignIndex.schemaVersion = DATA_VERSION;
    const key=campaignIndexKey(),savedCampaign=activeCampaignId;
    return enqueueSave(key, JSON.stringify(campaignIndex)).then(()=>{
      if(!failedSaveKeys.has(key)&&activeCampaignId===savedCampaign)globalThis.ECHO_RECONCILIATION?.notify();
    });
  }

  function saveCampaignRegistry() {
    return enqueueSave(CAMPAIGN_REGISTRY_KEY, JSON.stringify(campaignRegistry));
  }

  async function loadCampaignRegistry() {
    let raw = null;
    const savedRegistry = await readRecord(CAMPAIGN_REGISTRY_KEY);
    if (savedRegistry) raw = JSON.parse(savedRegistry);
    if (raw) {
      globalThis.ECHO_RELIABILITY?.assertSupported(raw);
      campaignRegistry = globalThis.ECHO_RELIABILITY.normalizeRegistry(raw);
    } else {
      campaignRegistry = globalThis.ECHO_RELIABILITY.normalizeRegistry();
      const oldIndex = await readRecord(CAMPAIGN_INDEX_KEY);
      let parsed = null;
      if (oldIndex) {
        try { parsed = JSON.parse(oldIndex); }
        catch { throw new Error('The original campaign index could not be read. Your original save was left untouched.'); }
      }
      const oldSessions = {};
      for (const item of parsed?.sessions || [{ id: 'session-01', name: 'Session 1 · Goblin Arrows' }]) {
        if (typeof item?.id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(item.id)) continue;
        let value = await readRecord(`session:${item.id}`);
        if (!value && item.id === 'session-01') try { value = localStorage.getItem(STORAGE_KEY); } catch { /* Storage unavailable. */ }
        if (value) oldSessions[item.id] = value;
      }
      if (oldIndex || Object.keys(oldSessions).length) {
        const original = { schemaVersion: 1, index: oldIndex, sessions: oldSessions, created: Date.now() };
        await writeRecord('recovery:default:legacy-original', JSON.stringify(original));
        const copiedIndex = parsed || { ...campaignIndex };
        copiedIndex.restorePoints = [...(copiedIndex.restorePoints || []),
          { id: 'legacy-original', label: 'Original before campaign upgrade', kind: 'migration', created: original.created }];
        await writeRecord(campaignIndexKey('default'), JSON.stringify(copiedIndex));
        for (const [id, value] of Object.entries(oldSessions)) await writeRecord(campaignSessionKey(id, 'default'), value);
      }
      if (!oldIndex && !Object.keys(oldSessions).length && ['blank','example'].includes(new URLSearchParams(location.search).get('start'))) {
        const template = new URLSearchParams(location.search).get('start') === 'example' ? ECHO_TEMPLATES.example() : ECHO_TEMPLATES.blank();
        const prepared = globalThis.ECHO_RECOVERY.prepare(template, normalize);
        const freshId=`campaign-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
        campaignRegistry.active=freshId;campaignRegistry.campaigns[0].id=freshId;
        await writeRecordsAtomic([[campaignIndexKey(freshId), JSON.stringify(prepared.index)],
          [campaignSessionKey('session-01',freshId), JSON.stringify(prepared.sessions[0].state)]]);
        campaignRegistry.campaigns[0].name = template.campaign.name;
      }
      await saveCampaignRegistry();
    }
    activeCampaignId = campaignRegistry.active;
  }

  async function loadCampaign() {
    await loadCampaignRegistry();
    let savedIndex = null;
    const rawIndex = await readRecord(campaignIndexKey());
    if (rawIndex) savedIndex = JSON.parse(rawIndex);
    if (savedIndex) globalThis.ECHO_RELIABILITY?.assertSupported(savedIndex);
    if (savedIndex && Array.isArray(savedIndex.sessions) && savedIndex.sessions.length) {
      const sessions = savedIndex.sessions.slice(0, 500).filter(s => s && typeof s.id === 'string' && typeof s.name === 'string').map(s =>
        ({ id: s.id.slice(0, 80), name: s.name.slice(0, 80),
          packId: /^[A-Za-z0-9_-]{1,100}$/.test(s.packId||'') ? s.packId : '' }));
      if (sessions.length) campaignIndex = { schemaVersion: DATA_VERSION, installedPacks:globalThis.ECHO_BOUNDARY?.packs(savedIndex)||savedIndex.installedPacks, active: sessions.some(s => s.id === savedIndex.active) ? savedIndex.active : sessions[0].id, sessions,
        restorePoints: Array.isArray(savedIndex.restorePoints) ? savedIndex.restorePoints : [],
        migrationReport: Array.isArray(savedIndex.migrationReport) ? savedIndex.migrationReport.slice(-30) : [],
        rules: globalThis.ECHO_RULES_UI?.normalizeSettings(savedIndex.rules) || null,
        combatLibrary: globalThis.ECHO_COMBAT_DATA?.normalizeCombat({ library: savedIndex.combatLibrary }, []).library || [],
        story: globalThis.ECHO_STORY_DATA.normalize(savedIndex.story),
        presentation: globalThis.ECHO_PRESENTATION?.normalizeLibrary(savedIndex.presentation),
        ergonomics: globalThis.ECHO_ERGONOMICS?.normalizeSettings(savedIndex.ergonomics),
        tableExtras: globalThis.ECHO_TABLE?.normalize(savedIndex.tableExtras) };
    }
    if(savedIndex && savedIndex.installedPacks===undefined && globalThis.ECHO_BOUNDARY){
      const originalId=`before-pack-boundary-${Date.now()}`,originalSessions={};
      for(const entry of campaignIndex.sessions)originalSessions[entry.id]=await readRecord(campaignSessionKey(entry.id));
      await writeRecord(`recovery:${activeCampaignId}:${originalId}`,JSON.stringify({schemaVersion:DATA_VERSION,index:rawIndex,sessions:originalSessions,created:Date.now()}));
      campaignIndex.restorePoints.push({id:originalId,label:'Original before explicit campaign packs',kind:'migration',created:Date.now()});
      campaignIndex.migrationReport.push({at:new Date().toISOString(),from:DATA_VERSION,to:DATA_VERSION,session:campaignIndex.active,restorePoint:originalId,note:'Recorded installed campaign packs from the existing content profile; no outcomes or character choices assigned.'});
    }
    activeSessionId = campaignIndex.active;
    let saved = null;
    const rawSession = await readRecord(campaignSessionKey(activeSessionId));
    if (rawSession) saved = JSON.parse(rawSession);
    if (saved) globalThis.ECHO_RELIABILITY?.assertSupported(saved);
    if ((savedIndex && globalThis.ECHO_RELIABILITY.versionOf(savedIndex) < DATA_VERSION) ||
        (saved && globalThis.ECHO_RELIABILITY.versionOf(saved) < DATA_VERSION)) {
      const from = Math.min(savedIndex ? globalThis.ECHO_RELIABILITY.versionOf(savedIndex) : DATA_VERSION,
        saved ? globalThis.ECHO_RELIABILITY.versionOf(saved) : DATA_VERSION);
      const id = `before-v3-${Date.now()}`;
      const sessions = {};
      for (const entry of campaignIndex.sessions) sessions[entry.id] = await readRecord(campaignSessionKey(entry.id));
      await writeRecord(`recovery:${activeCampaignId}:${id}`, JSON.stringify({ schemaVersion: 1,
        index: JSON.stringify(savedIndex), sessions, created: Date.now() }));
      campaignIndex.restorePoints.push({ id, label: 'Original before data upgrade', kind: 'migration', created: Date.now() });
      campaignIndex.migrationReport.push({ at: new Date().toISOString(), from, to: DATA_VERSION,
        session: activeSessionId, restorePoint: id,
        note: 'Added revision tracking and retained the original saved campaign before normalization.' });
    }
    const savedKeepsProgression = keepsPartyProgression(saved, campaignIndex.sessions.find(s => s.id === activeSessionId)?.packId);
    if (!savedKeepsProgression && saved?.sessionKind === 'custom' && ['pc-trista', 'pc-pebble'].some(id => Number(saved.party?.[id]?.level) < 3)) {
      const id = `before-level-3-${Date.now()}`;
      const sessions = {};
      for (const entry of campaignIndex.sessions)
        sessions[entry.id] = entry.id === activeSessionId ? rawSession : await readRecord(campaignSessionKey(entry.id));
      await writeRecord(`recovery:${activeCampaignId}:${id}`, JSON.stringify({ schemaVersion: DATA_VERSION,
        index: JSON.stringify(savedIndex || campaignIndex), sessions, created: Date.now() }));
      campaignIndex.restorePoints.push({ id, label: 'Before Trista and Pebble level 3', kind: 'migration', created: Date.now() });
    }
    if (!savedKeepsProgression && saved?.sessionKind === 'custom' && Number(saved.party?.['pc-donavan']?.level) < 3) {
      const id = `before-donavan-level-3-${Date.now()}`;
      const sessions = {};
      for (const entry of campaignIndex.sessions)
        sessions[entry.id] = entry.id === activeSessionId ? rawSession : await readRecord(campaignSessionKey(entry.id));
      await writeRecord(`recovery:${activeCampaignId}:${id}`, JSON.stringify({ schemaVersion: DATA_VERSION,
        index: JSON.stringify(savedIndex || campaignIndex), sessions, created: Date.now() }));
      campaignIndex.restorePoints.push({ id, label: 'Before Donavan level 3', kind: 'migration', created: Date.now() });
    }
    if (!savedKeepsProgression && saved?.sessionKind === 'custom' && ['pc-ringgo', 'pc-aldric'].some(id => Number(saved.party?.[id]?.level) < 3)) {
      const id = `before-ringgo-aldric-level-3-${Date.now()}`;
      const sessions = {};
      for (const entry of campaignIndex.sessions)
        sessions[entry.id] = entry.id === activeSessionId ? rawSession : await readRecord(campaignSessionKey(entry.id));
      await writeRecord(`recovery:${activeCampaignId}:${id}`, JSON.stringify({ schemaVersion: DATA_VERSION,
        index: JSON.stringify(savedIndex || campaignIndex), sessions, created: Date.now() }));
      campaignIndex.restorePoints.push({ id, label: 'Before Ringgo and Aldric level 3', kind: 'migration', created: Date.now() });
    }
    const loadedPackId = campaignIndex.sessions.find(item => item.id === activeSessionId)?.packId || '';
    if (saved && loadedPackId === 'lmop-part-4-visuals' && Number(saved.session4ContentVersion || 0) < 1) {
      const id = `before-wave-echo-content-${Date.now()}`, sessions = {};
      for (const entry of campaignIndex.sessions)
        sessions[entry.id] = entry.id === activeSessionId ? rawSession : await readRecord(campaignSessionKey(entry.id));
      await writeRecord(`recovery:${activeCampaignId}:${id}`, JSON.stringify({ schemaVersion: DATA_VERSION,
        index: JSON.stringify(savedIndex || campaignIndex), sessions, created: Date.now() }));
      campaignIndex.restorePoints.push({ id, label: 'Before Wave Echo content upgrade', kind: 'migration', created: Date.now() });
    }
    state = saved ? normalize(saved, loadedPackId) : activeCampaignId === 'default' && activeSessionId === 'session-01' ? readSavedState() : newCustomState();
    // Apply the DM-approved level-four choices only to the current live
    // Echo Below session. Historical sessions and practice campaigns stay as saved.
    const levelFourIds = globalThis.ECHO_BOOT?.echo !== false && activeCampaignId === 'default'
      ? ['pc-pebble', 'pc-trista', 'pc-ringgo'].filter(id => Number(state.party?.[id]?.level) === 3 && Number.isFinite(state.party[id].maxHp)) : [];
    if (levelFourIds.length) {
      const id = `before-party-level-4-${Date.now()}`, sessions = {};
      for (const entry of campaignIndex.sessions)
        sessions[entry.id] = entry.id === activeSessionId ? JSON.stringify(state) : await readRecord(campaignSessionKey(entry.id));
      await writeRecord(`recovery:${activeCampaignId}:${id}`, JSON.stringify({ schemaVersion: DATA_VERSION,
        index: JSON.stringify(campaignIndex), sessions, created: Date.now() }));
      campaignIndex.restorePoints.push({ id, label: 'Before approved party level 4 choices', kind: 'migration', created: Date.now() });
      globalThis.ECHO_PARTY_DATA.applyLevelFourChoices(state, levelFourIds);
    }
    // The approved Goron traits also apply when Pebble is already level 4.
    // Keep this migration out of seeds, historical sessions, and practice campaigns.
    if (globalThis.ECHO_BOOT?.echo !== false && activeCampaignId === 'default' && state.party?.['pc-pebble'] &&
        !globalThis.ECHO_PARTY_DATA.hasGoronTraits(state.party['pc-pebble'])) {
      const id = `before-pebble-goron-traits-${Date.now()}`, sessions = {};
      for (const entry of campaignIndex.sessions)
        sessions[entry.id] = entry.id === activeSessionId ? JSON.stringify(state) : await readRecord(campaignSessionKey(entry.id));
      await writeRecord(`recovery:${activeCampaignId}:${id}`, JSON.stringify({ schemaVersion: DATA_VERSION,
        index: JSON.stringify(campaignIndex), sessions, created: Date.now() }));
      campaignIndex.restorePoints.push({ id, label: 'Before Pebble Goron traits', kind: 'migration', created: Date.now() });
      globalThis.ECHO_PARTY_DATA.applyGoronTraits(state);
    }
    campaignContinuity();
    if (globalThis.ECHO_BOOT?.echo !== false && Number(state.party?.['pc-donavan']?.level) >= 3 && campaignIndex.rules?.characterOptions)
      campaignIndex.rules.characterOptions['donavan-scribes'] = 'active';
    if (globalThis.ECHO_BOOT?.echo !== false && Number(state.party?.['pc-ringgo']?.level) >= 3 && campaignIndex.rules?.characterOptions) {
      campaignIndex.rules.characterOptions['ringgo-assassin'] = 'active';
      delete campaignIndex.rules.characterOptions['ringgo-soulknife'];
    }
    if (!campaignIndex.combatLibrary.length && state.combat.library.length) campaignIndex.combatLibrary = structuredClone(state.combat.library);
    state.combat.library = structuredClone(campaignIndex.combatLibrary);
    sessionCache.set(activeSessionId, JSON.stringify(state));
    lastCommittedSnapshot = gameSnapshot(state);
    selectedEncounter = sessionEncounters()[0]?.id || 'all';
    await saveLocal();
    await saveCampaignIndex();
    try { await captureRestorePoint('Before session', 'automatic'); }
    catch { /* The live save remains usable; Recovery will show the missing point. */ }
  }

  function downloadJson(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function makeSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  async function switchSession(id) {
    if (id === activeSessionId || !campaignIndex.sessions.some(s => s.id === id)) return;
    globalThis.ECHO_TABLE_FLOW?.rememberScene();
    globalThis.ECHO_TABLE?.stopRehearsal();
    let restoreId = '';
    try { restoreId = await captureRestorePoint('Before changing session', 'automatic'); } catch { /* An old save still requires this copy. */ }
    await saveQueue;
    let raw = sessionCache.get(id) || await readRecord(campaignSessionKey(id));
    const source = raw ? JSON.parse(raw) : null;
    const oldVersion = source ? globalThis.ECHO_RELIABILITY.versionOf(source) : DATA_VERSION;
    if (oldVersion < DATA_VERSION && !restoreId) throw Error('The older session was left unchanged because a recovery copy could not be made.');
    state = source ? normalize(source, campaignIndex.sessions.find(item => item.id === id)?.packId) : newCustomState();
    state.combat.library = structuredClone(campaignIndex.combatLibrary);
    activeSessionId = id;
    campaignIndex.active = id;
    selectedEncounter = sessionEncounters()[0]?.id || 'all';
    selectedTokenId = null;
    editingSceneId = null;
    editingBeatId = null;
    mapPreview = null;
    priorScene = state.scene;
    lastCommittedSnapshot = gameSnapshot(state);
    resetBuilderForms();
    populateHandoutFields();
    globalThis.ECHO_TABLE_FLOW?.restoreScene();
    if (oldVersion < DATA_VERSION) {
      campaignIndex.migrationReport.push({ at:new Date().toISOString(), from:oldVersion, to:DATA_VERSION,
        session:id, restorePoint:restoreId, note:'Opened and saved an older session with revision tracking.' });
      await saveLocal();
    }
    await saveCampaignIndex();
    renderDM(); sendToPlayer();
  }

  async function createSession(duplicate = false) {
    let number = 2;
    while (campaignIndex.sessions.some(session => new RegExp(`^Session ${number}(?:\\b|$)`, 'i').test(session.name))) number++;
    const suggestion = duplicate
      ? `${campaignIndex.sessions.find(s => s.id === activeSessionId)?.name || 'Session'} copy`
      : `Session ${number}`;
    const answer = window.prompt(duplicate ? 'Name the copy:' : 'Name the new session:', suggestion);
    if (answer === null) return;
    const name = answer.trim().slice(0, 80);
    if (!name) { toast('Give the session a name.'); return; }
    globalThis.ECHO_TABLE?.stopRehearsal();
    try { await captureRestorePoint('Before creating session', 'automatic'); } catch { /* Continue with creation. */ }
    const id = makeSessionId();
    const next = duplicate ? normalize(JSON.parse(JSON.stringify(state))) : newCustomState(state);
    next.phoneRequests = [];
    next.phoneActions = globalThis.ECHO_PHONE_ACTIONS?.normalize();
    next.combatPlus = globalThis.ECHO_COMBAT_PLUS?.normalize();
    if (duplicate && campaignIndex.story.sessionPlans[activeSessionId])
      campaignIndex.story.sessionPlans[id] = structuredClone(campaignIndex.story.sessionPlans[activeSessionId]);
    next.combat.library = structuredClone(campaignIndex.combatLibrary);
    await saveQueue;
    activeSessionId = id;
    state = next;
    campaignIndex.sessions.push({ id, name });
    campaignIndex.active = id;
    selectedEncounter = sessionEncounters()[0]?.id || 'all';
    selectedTokenId = null;
    editingSceneId = null;
    editingBeatId = null;
    lastCommittedSnapshot = gameSnapshot(state);
    resetBuilderForms();
    populateHandoutFields();
    await saveLocal();
    await saveCampaignIndex();
    renderDM(); sendToPlayer();
    toast(`${name} is ready.`);
  }

  async function restartCurrentSession() {
    const name = campaignIndex.sessions.find(session => session.id === activeSessionId)?.name || 'this session';
    if (!window.confirm(`Restart “${name}”? Map positions, fog, combat, rolls, and TV content will return to their starting state.${state.contentPackId === 'lmop-part-4-visuals' ? ' The Wave Echo journal and expedition outcomes will also reset. To return after a rest or retreat, keep this save and use the Wave Echo journal instead.' : ''} A restore point will be saved first.`)) return;
    globalThis.ECHO_TABLE?.stopRehearsal();
    try { await captureRestorePoint(`Before restarting ${name}`, 'manual'); }
    catch { toast('A restore point could not be saved. The session was not restarted.'); return; }
    const previous = state;
    const fresh = previous.sessionKind === 'session1' ? newState() : newCustomState(previous);
    if (previous.sessionKind === 'custom') {
      fresh.contentPackId = previous.contentPackId;
      fresh.scenes = structuredClone(previous.scenes || fresh.scenes);
      fresh.encounters = structuredClone(previous.encounters || []);
      fresh.runbookBeats = structuredClone(previous.runbookBeats || []);
      fresh.assets = structuredClone(previous.assets || {});
      fresh.tokens = structuredClone(previous.tokens).map(t => ({ ...t, hp: t.maxHp,
        tempHp: 0, exhaustion: 0, conditions: [], initiative: null, placed: false, visible: t.team !== 'enemy', scene: '', x: 50, y: 50 }));
      for (const sheet of Object.values(fresh.party)) {
        if (Number.isFinite(sheet.maxHp)) sheet.hp = sheet.maxHp;
        sheet.tempHp = 0; sheet.death = { successes: 0, failures: 0, stable: false };
        sheet.exhaustion = 0; sheet.conditions = []; sheet.concentration = ''; sheet.effects = [];
        sheet.inspiration = false;
        for (const resource of sheet.resources || []) if (Number.isFinite(resource.max)) resource.current = resource.max;
        if (sheet.hitDice && Number.isFinite(sheet.hitDice.max)) sheet.hitDice.current = sheet.hitDice.max;
      }
      fresh.map.scenes = structuredClone(previous.map?.scenes || {});
      for (const [sceneId, scene] of Object.entries(fresh.map.scenes)) {
        for (const line of scene.lines || []) { line.open = false; line.discovered = false; }
        if (!TOWN_MAP_IDS.includes(sceneId))
          for (const point of scene.points || []) { point.visible = false; point.approved = false; }
        for (const link of scene.links || []) link.visible = false;
        scene.view = { zoom: 1, panX: 0, panY: 0 };
      }
      fresh.combat = globalThis.ECHO_COMBAT_DATA.normalizeCombat({ library: campaignIndex.combatLibrary,
        creatures: previous.combat?.creatures }, fresh.encounters);
      if(globalThis.ECHO_BOOT?.echo !== false)globalThis.ECHO_PARTY_DATA.syncGoronResistance(fresh);
      if (fresh.contentPackId === 'lmop-part-4-visuals') seedSession4Resources(fresh);
    }
    fresh.combat.library = structuredClone(campaignIndex.combatLibrary);
    state = fresh;
    globalThis.ECHO_PRESENTATION?.stopAll();
    selectedEncounter = sessionEncounters()[0]?.id || 'all';
    selectedTokenId = null; editingSceneId = null; editingBeatId = null; mapPreview = null;
    priorScene = state.scene;
    resetBuilderForms(); populateHandoutFields();
    lastCommittedSnapshot = gameSnapshot(state);
    await saveLocal(); renderDM(); sendToPlayer();
    toast(`${name} restarted. The previous state is in Restore points.`);
  }

  async function createPackedSession(packId = 'cragmaw-continuation', askForName = true) {
    const pack = globalThis.ECHO_CONTENT_PACKS?.find(item => item.id === packId);
    if (!pack) { toast('The session pack could not be loaded.'); return; }
    if(pack.carryExploration){const existing=campaignIndex.sessions.find(s=>s.packId===packId);if(existing){await switchSession(existing.id);toast('Resumed your saved session; maps, enemies and exploration are preserved. Use Duplicate session for a separate rehearsal.');return;}}
    if(packId==='waterdeep-undermountain-1'){
      const existing=campaignIndex.sessions.find(s=>s.packId===packId);
      if(existing){await reviewArcReturn(existing.id);toast('Your saved first floor is ready for review. Use Duplicate session for a separate copy.');return;}
    }
    if(packId==='silent-library-expedition'&&campaignIndex.sessions.some(s=>s.packId===packId)){globalThis.ECHO_STORY_UI?.open('expeditions');toast('The Silent Library already has a saved session. Review its expedition return to preserve the party and dungeon history.');return;}
    const tracked=campaignIndex.tableExtras.expeditions?.records.find(r=>campaignIndex.sessions.find(s=>s.id===r.sessionId)?.packId===packId);
    if(tracked){globalThis.ECHO_STORY_UI?.open('expeditions');toast('This dungeon already has a saved expedition. Use Preview return to preserve its history. Duplicate the saved session explicitly if you want a separate copy.');return;}
    const answer = askForName ? window.prompt(`Name ${pack.name}:`, pack.defaultName || 'Cragmaw Hideout · continuation')
      : pack.defaultName || 'Cragmaw Hideout · continuation';
    if (answer === null) return;
    const name = answer.trim().slice(0, 80);
    if (!name) { toast('Give the session a name.'); return; }
    await captureRestorePoint(`Before creating ${pack.name}`, 'automatic');
    const previous = state, id = makeSessionId();
    const next = newCustomState(previous);
    if(pack.preservePartyProgression===true||['waterdeep-undermountain-1','phandalin-waterdeep-transition','mending-court-home','silent-library-expedition','phandalin-aftermath-next'].includes(packId)){next.preservePartyProgression=true;next.party=structuredClone(previous.party||{});next.tokens=previous.tokens.filter(t=>t.team==='pc'||t.team==='ally').map(t=>({...structuredClone(t),placed:false,scene:'',initiative:null}));}
    if(pack.preservePartyProgression===true){
      next.combatRun.resources=structuredClone(previous.combatRun?.resources||{});
    }
    next.contentPackId = pack.id;
    next.scenes = pack.scenes.map(sceneId => ({ id: sceneId, ...SCENES[sceneId],
      kind: SCENES[sceneId].kind || 'visual', image: SCENES[sceneId].image || '',
      fog: SCENES[sceneId].fog === true, grid: SCENES[sceneId].kind === 'map' && SCENES[sceneId].grid !== false }));
    for (const item of globalThis.LMOP_BATTLE_MAP_CATALOG || []) if (item.fog && next.scenes.some(scene => scene.id === item.id)) {
      next.sceneFog[item.id] = [];
      next.map.scenes[item.id] = globalThis.ECHO_MAP_DATA.scene({ fineFog: true });
    }
    if(packId==='silent-library-expedition')for(const scene of next.scenes.filter(s=>s.fog)){next.sceneFog[scene.id]=[];next.map.scenes[scene.id]=globalThis.ECHO_MAP_DATA.scene({fineFog:true});}
    next.encounters = ENCOUNTERS.filter(encounter => pack.encounters.includes(encounter.id)).map(encounter => ({ ...encounter, ...(pack.encounterNotes?.[encounter.id]?{note:pack.encounterNotes[encounter.id]}:{}) }));
    next.runbookBeats = (pack.runbook || RUNBOOK).filter(beat => pack.beats.includes(beat.id)).map(beat => structuredClone(beat));
    next.scene = pack.firstScene;
    next.runbook = next.runbookBeats[0]?.id || 'all';
    next.grid = SCENES[pack.firstScene]?.kind === 'map' && SCENES[pack.firstScene]?.grid !== false;
    if (packId === 'cragmaw-continuation') next.sceneFog.interior = previous.sessionKind === 'session1' ? [...previous.fog] :
      [...(previous.sceneFog?.interior || entranceFog())];
    next.tokens.push(...defaultTokens().filter(token => token.team === 'enemy' && pack.encounters.includes(token.encounter)));
    if (packId === 'phandalin-session-2') {
      next.tokens.push(...session2EnemyTokens());
      next.sceneFog['redbrand-hideout'] = [];
      for (const sheet of Object.values(next.party)) if (sheet.role === 'pc') sheet.level = Math.max(2, Number(sheet.level) || 0);
    }
    if (packId === 'gundren-session-3') {
      const played=new Set(globalThis.ECHO_CONTINUITY.effective(campaignContinuity()).filter(e=>e.approved).map(e=>e.id));
      next.tokens.push(...session3EnemyTokens().filter(foe=>
        !(played.has('actual-s23-orcs')&&foe.encounter==='wyvern-tor')&&
        !(played.has('actual-s23-koth')&&foe.id==='s3-hamun')));
    }
    if (packId === 'lmop-part-4-visuals') { next.tokens.push(...session4EnemyTokens()); seedSession4Resources(next); }
    if(pack.enemySeed){
      const retained=previous.tokens.filter(t=>t.team==='enemy'&&pack.encounters.includes(t.encounter));
      const retainedEncounters=new Set(retained.map(t=>t.encounter));
      const seeds=pack.enemySeed==='wave'?session4EnemyTokens():session3EnemyTokens();
      next.tokens.push(...structuredClone(retained),...seeds.filter(t=>pack.encounters.includes(t.encounter)&&!retainedEncounters.has(t.encounter)));
      if(pack.enemySeed==='wave')seedSession4Resources(next);
    }
    if(pack.carryExploration){
      for(const scene of next.scenes){
        if(previous.map?.scenes?.[scene.id])next.map.scenes[scene.id]=structuredClone(previous.map.scenes[scene.id]);
        if(previous.sceneFog?.[scene.id])next.sceneFog[scene.id]=structuredClone(previous.sceneFog[scene.id]);
      }
      next.waveEcho=structuredClone(previous.waveEcho);
    }
    next.combat = globalThis.ECHO_COMBAT_DATA.normalizeCombat({ library: campaignIndex.combatLibrary,
      creatures: previous.combat?.creatures, ...(pack.preservePartyProgression===true?{tokens:previous.combat?.tokens,effects:previous.combat?.effects}:{}) }, next.encounters);
    globalThis.ECHO_PARTY_DATA.syncGoronResistance(next);
    for (const foe of next.tokens.filter(t => t.team === 'enemy'))
      next.combat.tokens[foe.id] ||= globalThis.ECHO_COMBAT_DATA.creatureDefense(foe.type, next.combat.creatures);
    await saveQueue;
    activeSessionId = id; state = next;
    previewSceneId = next.scene; contextTab = 'guide';
    campaignIndex.sessions.push({ id, name, packId }); campaignIndex.active = id;
    if(['phandalin-aftermath-next','next-session-4'].includes(packId)&&globalThis.ECHO_STAGE6?.applies(campaignContinuity())){
      const prep=globalThis.ECHO_QUEST_PREP.ensure(campaignIndex.story);
      const catalog=await questPrepContext(id);
      globalThis.ECHO_STAGE6.seedBoard({...catalog,story:campaignIndex.story,continuity:campaignContinuity(),prep,sessionId:id,roster:state.tokens.filter(t=>t.team==='pc').map(t=>({id:t.id,name:t.name}))});
      prep.target=id;
    }
    if(packId==='silent-library-expedition'&&globalThis.ECHO_ADVENTURES){globalThis.ECHO_ADVENTURES.seedLibrary(campaignIndex.tableExtras);const r=globalThis.ECHO_EXPEDITIONS.create(expeditionContext(),name,['sl-library-map']);r.objective='Review the archive’s access, catalogue provenance and custody with affected people.';r.conditions='Return by the shop stair; record any actual restriction before re-entry.';}
    selectedEncounter = next.encounters[0]?.id || 'all';
    selectedTokenId = null; editingSceneId = null; editingBeatId = null;
    lastCommittedSnapshot = gameSnapshot(state);
    resetBuilderForms(); populateHandoutFields();
    await saveLocal(); await saveCampaignIndex();
    renderDM(); sendToPlayer();
    toast(`${pack.name} is ready. Review carried HP and level-up choices before play.`);
  }

  async function renameSession() {
    const session = campaignIndex.sessions.find(s => s.id === activeSessionId);
    if (!session) return;
    const answer = window.prompt('Rename this session:', session.name);
    if (answer === null) return;
    const name = answer.trim().slice(0, 80);
    if (!name) { toast('Give the session a name.'); return; }
    session.name = name;
    await saveCampaignIndex();
    renderDM(); sendToPlayer();
  }

  async function deleteSession() {
    if (activeSessionId === 'session-01') { toast('Session 1 is kept as the campaign starting point.'); return; }
    if (campaignIndex.sessions.length <= 1) { toast('Keep at least one session in the campaign.'); return; }
    const session = campaignIndex.sessions.find(s => s.id === activeSessionId);
    if (!session || !window.confirm(`Delete “${session.name}” and its saved maps and notes? Back up the campaign first if you may need it.`)) return;
    try { await captureRestorePoint(`Before deleting ${session.name}`, 'automatic'); } catch { /* Continue with deletion. */ }
    const removedId = activeSessionId;
    campaignIndex.sessions = campaignIndex.sessions.filter(s => s.id !== removedId);
    const nextId = campaignIndex.sessions.find(s => s.id === 'session-01')?.id || campaignIndex.sessions[0]?.id;
    if (!nextId) return;
    await switchSession(nextId);
    delete campaignIndex.story.sessionPlans[removedId];
    await saveCampaignIndex();
    sessionCache.delete(removedId);
    await deleteRecord(campaignSessionKey(removedId));
    toast(`Deleted ${session.name}.`);
  }

  async function captureRestorePoint(label, kind = 'automatic') {
    if (IS_PLAYER) return null;
    const activeSnapshot = JSON.stringify(state);
    await saveQueue;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const sessions = {};
    for (const session of campaignIndex.sessions) sessions[session.id] = session.id === activeSessionId
      ? activeSnapshot : sessionCache.get(session.id) || await readRecord(campaignSessionKey(session.id));
    const encoded=await globalThis.ECHO_RECOVERY.encodePoint({schemaVersion:DATA_VERSION,index:JSON.stringify(campaignIndex),sessions,created:Date.now()});
    try{await writeRecord(`recovery:${activeCampaignId}:${id}`,encoded.raw);}catch(error){const message='Restore point could not be saved: browser storage may be full. The campaign was not replaced. Download a backup, then review old automatic points in Recovery. '+error.message;globalThis.ECHO_RELIABILITY?.setRecoveryIssue(message);throw Error(message);}
    const originalPoints=campaignIndex.restorePoints||[];
    campaignIndex.restorePoints=[...originalPoints,{ id, label: String(label).slice(0, 100), kind, created: Date.now(), bytes:encoded.bytes, originalBytes:encoded.originalBytes, encoding:encoded.encoding }];
    const ordinary = campaignIndex.restorePoints.filter(point => point.kind === 'automatic'),expired=ordinary.slice(0, Math.max(0, ordinary.length - 30));
    campaignIndex.restorePoints=campaignIndex.restorePoints.filter(point=>!expired.some(old=>old.id===point.id));
    await saveCampaignIndex();
    if(failedSaveKeys.has(campaignIndexKey())){
      campaignIndex.restorePoints=originalPoints;try{await deleteRecord(`recovery:${activeCampaignId}:${id}`);}catch{}
      const message='Restore point could not be indexed. The campaign was not replaced and existing restore points were retained. Download a backup before trying again.';
      globalThis.ECHO_RELIABILITY?.setRecoveryIssue(message);throw Error(message);
    }
    // Never delete an older point until the replacement and its index are saved.
    for(const point of expired)await deleteRecord(`recovery:${activeCampaignId}:${point.id}`);
    globalThis.ECHO_RELIABILITY?.setRecoveryIssue('');
    globalThis.ECHO_RELIABILITY?.render();
    return id;
  }

  async function pruneRestorePoints(keep) {
    await saveQueue;const points=globalThis.ECHO_RECOVERY.pruneCandidates(campaignIndex.restorePoints||[],keep);if(!points.length)return 'No old automatic points to remove.';
    if(!window.confirm(`Remove ${points.length} old automatic restore points and keep the latest ${keep}? Download a backup first. Manual and migration originals stay saved.`))return 'Cleanup cancelled.';
    const before=campaignIndex.restorePoints;campaignIndex.restorePoints=before.filter(p=>!points.some(x=>x.id===p.id));
    try{await writeRecord(campaignIndexKey(),JSON.stringify(campaignIndex));}catch(error){campaignIndex.restorePoints=before;throw error;}
    for(const point of points)await deleteRecord(`recovery:${activeCampaignId}:${point.id}`);return `Removed ${points.length} old automatic restore points. Manual and migration originals retained.`;
  }

  async function restorePoint(id) {
    const point = campaignIndex.restorePoints?.find(item => item.id === id);
    if (!point) return;
    let snapshot;
    try { snapshot = await globalThis.ECHO_RECOVERY.decodePoint(await readRecord(`recovery:${activeCampaignId}:${id}`)); }
    catch { toast('This restore point could not be opened.'); return; }
    if (!snapshot?.sessions || !window.confirm(`Restore “${point.label}”? The current campaign will be copied to a new restore point first.`)) return;
    await captureRestorePoint('Before restore', 'automatic');
    const original = snapshot.index ? JSON.parse(snapshot.index) : { ...campaignIndex };
    globalThis.ECHO_RELIABILITY.assertSupported(original);
    const merged = new Map([...(original.restorePoints || []), ...(campaignIndex.restorePoints || [])].map(item => [item.id, item]));
    original.restorePoints = [...merged.values()];
    for (const [sessionId, raw] of Object.entries(snapshot.sessions)) if (/^[A-Za-z0-9_-]{1,80}$/.test(sessionId) && raw) {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      globalThis.ECHO_RELIABILITY.assertSupported(parsed);
      await writeRecord(campaignSessionKey(sessionId), JSON.stringify(parsed));
    }
    await writeRecord(campaignIndexKey(), JSON.stringify(original));
    sessionCache.clear();
    await loadCampaign();
    resetBuilderForms(); populateHandoutFields();
    globalThis.ECHO_RULES_UI?.setSettings(campaignIndex.rules);
    globalThis.ECHO_TABLE_FLOW?.restoreScene();
    renderDM(); setWorkspaceMode(campaignIndex.ergonomics?.mode || 'run'); sendToPlayer();
    toast(`Restored ${point.label}.`);
  }

  async function downloadPoint(id) {
    const point = campaignIndex.restorePoints?.find(item => item.id === id);
    const raw = point && await readRecord(`recovery:${activeCampaignId}:${id}`);
    if (!raw) { toast('Restore point is unavailable.'); return; }
    downloadJson(`echo-below-restore-point-${id}.json`, await globalThis.ECHO_RECOVERY.decodePoint(raw));
  }

  async function buildCampaignArchive() {
    await saveQueue;
    const capturedIndex=structuredClone(campaignIndex),capturedState=structuredClone(state),capturedCampaign=activeCampaignId,capturedSession=activeSessionId,cache=new Map(sessionCache);
    const sessions = [];
    for (const session of capturedIndex.sessions) {
      const raw = session.id === capturedSession ? JSON.stringify(capturedState)
        : cache.get(session.id) || await readRecord(campaignSessionKey(session.id,capturedCampaign));
      if (!raw) continue;
      sessions.push({ id: session.id, name: session.name, packId: session.packId || JSON.parse(raw).contentPackId || '', state: JSON.parse(raw) });
    }
    const archive = {
      format: 'echo-below-campaign-v2', schemaVersion: DATA_VERSION,
      campaign: { id: capturedCampaign, name: campaignRegistry.campaigns.find(c => c.id === capturedCampaign)?.name || 'Campaign', ...(campaignRegistry.campaigns.find(c=>c.id===capturedCampaign)?.originId?{originId:campaignRegistry.campaigns.find(c=>c.id===capturedCampaign).originId}:{}) },
      installedPacks:globalThis.ECHO_BOUNDARY?.packs(capturedIndex)||capturedIndex.installedPacks, active: capturedSession, sessions, rules: capturedIndex.rules,
      migrationReport: capturedIndex.migrationReport || [],
      combatLibrary: capturedIndex.combatLibrary, story: capturedIndex.story,
      presentation: capturedIndex.presentation, ergonomics: capturedIndex.ergonomics,
      tableExtras: capturedIndex.tableExtras,
      mediaFiles: await globalThis.ECHO_PRESENTATION?.exportMedia(capturedIndex.presentation, readRecord)
    };
    if(capturedCampaign!==activeCampaignId||capturedSession!==activeSessionId||JSON.stringify(capturedState)!==JSON.stringify(state)||JSON.stringify(capturedIndex)!==JSON.stringify(campaignIndex))throw Error('The campaign changed while capturing its backup. Try again so the records share one snapshot.');
    const report = globalThis.ECHO_RELIABILITY.validateArchive(archive);
    if (!report.valid) throw new Error(`Backup is missing imported media: ${report.missingMedia.join(', ')}`);
    return archive;
  }

  async function downloadCampaign() {
    try{await globalThis.ECHO_WHOLE_BACKUP.download();}catch(error){toast(error.message||'Complete backup could not be created.');}
  }

  async function downloadBrowserData() {
    try {
      const archive = await buildCampaignArchive();
      downloadJson(`echo-below-${activeCampaignId}-backup.json`, archive);
      toast(`Backed up ${archive.sessions.length} sessions with imported media.`);
    } catch (error) { toast(error.message || 'Backup could not be created.'); }
  }

  async function restoreCampaign(file) {
    if(/\.zip$/i.test(file.name)||file.type==='application/zip'){
      try{await globalThis.ECHO_WHOLE_BACKUP.openRestore(file);}catch(e){toast(e.message+'. The live campaign was not changed.');}return;
    }
    let archive;
    try { archive = JSON.parse(await file.text()); }
    catch { toast('That file is not a valid campaign backup.'); return; }
    let report;
    try { report = globalThis.ECHO_RELIABILITY.validateArchive(archive); }
    catch (error) { toast(error.message); return; }
    if (!report.valid) { toast(`Backup is incomplete: ${report.missingMedia.join(', ')}`); return; }
    let prepared;
    try {
      const targetPacks=globalThis.ECHO_BOUNDARY?.packs(archive);
      const crossPack=targetPacks&&ECHO_BOUNDARY.key(targetPacks)!==globalThis.ECHO_BOOT?.key;
      if(crossPack)prepared=ECHO_BOUNDARY.handoff(archive);
      else {prepared = globalThis.ECHO_RECOVERY.prepare(archive, normalize); await globalThis.ECHO_RECOVERY.rehearse(archive, normalize);}
    }
    catch (error) { toast(`Restore check failed: ${error.message}. The live campaign was not changed.`); return; }
    if (!window.confirm(`Verified ${report.sessions} sessions. Restore them as a new campaign? The current campaign will stay saved.`)) return;
    await saveQueue;
    let campaignId = '', activated = false;
    const addedMedia = [];
    try {
      campaignId = `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const restoredIndex = prepared.index;
      await globalThis.ECHO_PRESENTATION?.importMedia(archive.mediaFiles, restoredIndex.presentation,
        async (key, blob) => {
          const existing = await readRecord(key);
          if (existing instanceof Blob) {
            const [oldBytes, newBytes] = await Promise.all([existing.arrayBuffer(), blob.arrayBuffer()]);
            const oldView = new Uint8Array(oldBytes), newView = new Uint8Array(newBytes);
            const same = existing.type === blob.type && oldView.length === newView.length &&
              oldView.every((byte, index) => byte === newView[index]);
            if (!same) throw new Error(`Imported media ID ${key} already belongs to a different file.`);
            return;
          }
          await writeMediaRecord(key.replace(/^media:/, ''), blob);
          addedMedia.push(key);
        });
      await writeRecordsAtomic([...prepared.sessions.map(entry => [campaignSessionKey(entry.id, campaignId), JSON.stringify(entry.state)]),
        [campaignIndexKey(campaignId), JSON.stringify(restoredIndex)]]);
      await globalThis.ECHO_PHONE?.disconnectForCampaignSwitch();
      const nextRegistry = structuredClone(campaignRegistry);
      nextRegistry.campaigns.push({ id: campaignId, name: String(archive.campaign?.name || `${file.name.replace(/\.json$/i, '')} restored`).slice(0, 80), archived: false });
      nextRegistry.active = campaignId;
      await writeRecord(CAMPAIGN_REGISTRY_KEY, JSON.stringify(nextRegistry));
      activated = true; campaignRegistry = nextRegistry;
      if(globalThis.ECHO_BOUNDARY && ECHO_BOUNDARY.key(ECHO_BOUNDARY.packs(restoredIndex))!==globalThis.ECHO_BOOT?.key){ECHO_BOUNDARY.reload(`Restored ${prepared.sessions.length} sessions as a separate campaign.`);return;}
      activeCampaignId=campaignId;
      sessionCache.clear();
      await loadCampaign();
      resetBuilderForms(); populateHandoutFields();
      globalThis.ECHO_RULES_UI?.setSettings(campaignIndex.rules);
      globalThis.ECHO_TABLE_FLOW?.restoreScene();
      renderDM(); setWorkspaceMode(campaignIndex.ergonomics?.mode || 'run'); sendToPlayer();
      toast(`Restored ${prepared.sessions.length} sessions as a separate campaign.`);
    } catch (error) {
      if (!activated) {
        for (const entry of prepared.sessions) await deleteRecord(campaignSessionKey(entry.id, campaignId));
        if (campaignId) await deleteRecord(campaignIndexKey(campaignId));
        for (const key of addedMedia) await deleteRecord(key);
      }
      toast(`${error.message || 'The campaign could not be stored here.'} ${activated ? 'Restore the previous campaign from Campaigns if needed.' : 'The live campaign was not changed.'} Keep your backup file.`);
    }
  }

  function freshCampaignState() {
    const fresh = newCustomState();
    fresh.tokens = [];
    fresh.party = {};
    fresh.partyMeta = { marchingOrder: '', lightSources: '', travelPace: 'normal', notes: '' };
    fresh.combat = globalThis.ECHO_COMBAT_DATA.normalizeCombat(null, []);
    fresh.map = globalThis.ECHO_MAP_DATA.normalize();
    fresh.ergonomics = globalThis.ECHO_ERGONOMICS.normalizeSession();
    return fresh;
  }

  function freshCampaignIndex() {
    return { schemaVersion: DATA_VERSION, active: 'session-01', sessions: [{ id: 'session-01', name: 'Session 1' }], restorePoints: [], migrationReport: [],
      rules: globalThis.ECHO_RULES_UI.normalizeSettings(null), combatLibrary: [],
      story: globalThis.ECHO_STORY_DATA.normalize(), presentation: globalThis.ECHO_PRESENTATION.normalizeLibrary(),
      ergonomics: globalThis.ECHO_ERGONOMICS.normalizeSettings(), tableExtras: globalThis.ECHO_TABLE.normalize() };
  }

  async function activateCampaign(id) {
    if (id === activeCampaignId || !campaignRegistry.campaigns.some(item => item.id === id && !item.archived)) return;
    await globalThis.ECHO_PHONE?.disconnectForCampaignSwitch();
    globalThis.ECHO_TABLE_FLOW?.rememberScene();
    globalThis.ECHO_TABLE?.stopRehearsal();
    try { await captureRestorePoint('Before switching campaign', 'automatic'); }
    catch { /* The current live save remains available. */ }
    await saveQueue;
    campaignRegistry.active = id;
    await saveCampaignRegistry();
    const targetIndex=JSON.parse(await readRecord(campaignIndexKey(id)));
    if(globalThis.ECHO_BOUNDARY && ECHO_BOUNDARY.key(ECHO_BOUNDARY.packs(targetIndex))!==globalThis.ECHO_BOOT?.key){ECHO_BOUNDARY.reload(`Opened ${campaignRegistry.campaigns.find(item=>item.id===id)?.name}.`);return;}
    activeCampaignId=id;
    sessionCache.clear();
    await loadCampaign();
    selectedTokenId = null; editingSceneId = null; editingBeatId = null;
    resetBuilderForms(); populateHandoutFields();
    globalThis.ECHO_RULES_UI?.setSettings(campaignIndex.rules);
    globalThis.ECHO_TABLE_FLOW?.restoreScene();
    renderDM(); setWorkspaceMode(campaignIndex.ergonomics?.mode || 'run'); sendToPlayer();
    toast(`Opened ${campaignRegistry.campaigns.find(item => item.id === id)?.name}.`);
  }

  async function createCampaign(providedName, example=false) {
    const answer = typeof providedName === 'string' ? providedName : window.prompt('Name the new campaign:', 'New campaign');
    if (answer === null) return;
    const name = answer.trim().slice(0, 80);
    if (!name) { toast('Give the campaign a name.'); return; }
    const id = `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    if(example)await globalThis.ECHO_TEMPLATES.loadExample();
    const template = example ? globalThis.ECHO_TEMPLATES.example(name) : globalThis.ECHO_TEMPLATES.blank(name);
    const prepared = globalThis.ECHO_RECOVERY.prepare(template, normalize);
    const index = prepared.index;
    const first = prepared.sessions[0].state;
    await writeRecordsAtomic([[campaignIndexKey(id), JSON.stringify(index)],[campaignSessionKey('session-01', id), JSON.stringify(first)]]);
    campaignRegistry.campaigns.push({ id, name, archived: false });
    await activateCampaign(id);
  }

  async function duplicateCampaign(sourceId, practice = false) {
    const source = campaignRegistry.campaigns.find(item => item.id === sourceId);
    if (!source) return;
    const choice = practice ? {mode:'practice',name:`PRACTICE · ${source.name}`} : await globalThis.ECHO_TEMPLATES.chooseCopy(source.name);
    if (!choice) return;
    if (['blank','example'].includes(choice.mode)) return createCampaign(choice.name,choice.mode==='example');
    practice = choice.mode === 'practice';
    const name = choice.name.trim().slice(0, 80); if (!name) return;
    await saveQueue;
    const raw = sourceId === activeCampaignId ? JSON.stringify(campaignIndex) : await readRecord(campaignIndexKey(sourceId));
    if (!raw) { toast('That campaign could not be read.'); return; }
    const index = JSON.parse(raw); globalThis.ECHO_RELIABILITY.assertSupported(index);
    const id = `${practice?'practice':'campaign'}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    index.restorePoints = [];
    if(practice&&index.tableExtras){index.tableExtras.flow={version:1,baselines:{}};index.tableExtras.sessionFlow=globalThis.ECHO_SESSION_FLOW?.normalize()||null;}
    const copies = [];
    for (const session of index.sessions) {
      const value = sourceId === activeCampaignId && session.id === activeSessionId ? JSON.stringify(state)
        : await readRecord(campaignSessionKey(session.id, sourceId));
      if (!value) { toast(`Could not copy ${session.name}; source save is missing.`); return; }
      copies.push([session.id, value]);
    }
    await writeRecordsAtomic([...copies.map(([sessionId,value])=>[campaignSessionKey(sessionId,id),value]),[campaignIndexKey(id),JSON.stringify(index)]]);
    campaignRegistry.campaigns.push({ id, name, archived: false, ...(practice?{practiceSource:sourceId}:{}) });
    await activateCampaign(id);
  }

  async function archiveCampaign(id, archived) {
    const item = campaignRegistry.campaigns.find(campaign => campaign.id === id);
    if (!item) return;
    if (archived && campaignRegistry.campaigns.filter(campaign => !campaign.archived).length < 2) { toast('Keep one active campaign.'); return; }
    if (archived && !window.confirm(`Archive “${item.name}”? Its data will remain available for unarchiving.`)) return;
    if (archived && id === activeCampaignId) try { await captureRestorePoint('Before archiving campaign', 'automatic'); }
    catch { /* Archiving keeps the campaign record intact. */ }
    if(archived&&id===activeCampaignId){const next=campaignRegistry.campaigns.find(c=>!c.archived&&c.id!==id);if([id,next?.id||''].some(key=>key.startsWith('practice-')))await globalThis.ECHO_PHONE?.disconnectForCampaignSwitch();}
    item.archived = archived;
    if (archived && id === activeCampaignId) {
      const next = campaignRegistry.campaigns.find(campaign => !campaign.archived);
      campaignRegistry.active = next.id; activeCampaignId = next.id;
      await saveCampaignRegistry(); sessionCache.clear(); await loadCampaign();
      resetBuilderForms(); populateHandoutFields(); globalThis.ECHO_RULES_UI?.setSettings(campaignIndex.rules);
      globalThis.ECHO_TABLE_FLOW?.restoreScene();
    renderDM(); setWorkspaceMode(campaignIndex.ergonomics?.mode || 'run'); sendToPlayer();
    } else await saveCampaignRegistry();
    renderCampaignSelect(); globalThis.ECHO_RELIABILITY?.render();
    toast(`${item.name} ${archived ? 'archived' : 'unarchived'}.`);
  }

  let atmospherePlacement=null;
  let dungeonPlacement = null, dungeonSavedSignature = '';
  function dungeonData(){return globalThis.ECHO_DUNGEON?.data(campaignIndex.tableExtras);}
  function dungeonSight(){if(mapSceneData().floorFog)return {enabled:false};return !IS_PLAYER && globalThis.ECHO_DUNGEON ? globalThis.ECHO_DUNGEON.sight(dungeonData(),state.scene,mapSceneData(),state.tokens,fogForScene()) : {enabled:false};}
  function dungeonPublic(){const mask=mapSceneData().floorFog?new Set(fogForScene()):null;return IS_PLAYER ? state.dungeon : globalThis.ECHO_DUNGEON?.publicView(dungeonData(),state.scene,dungeonSight(),p=>!mask||mask.has(tileForPoint({...p,scene:state.scene})));}
  function rememberDungeon(){if(!globalThis.ECHO_DUNGEON)return;globalThis.ECHO_DUNGEON.remember(dungeonData(),state.scene,dungeonSight());const signature=JSON.stringify(dungeonData());if(signature!==dungeonSavedSignature){dungeonSavedSignature=signature;void saveCampaignIndex();}}
  function atmosphereData(){return globalThis.ECHO_ATMOSPHERE?.data(campaignIndex.tableExtras);}
  function atmospherePublic(tokens){if(!globalThis.ECHO_ATMOSPHERE)return null;const sight=dungeonSight(),revealed=new Set(sight.enabled?sight.current:fogForScene());
    const view=globalThis.ECHO_ATMOSPHERE.project(atmosphereData(),state,tokens,p=>!sceneHasFog()&&!sight.enabled||revealed.has(tileForPoint({...p,scene:state.scene})));
    for(const t of tokens){if(dungeonData()?.heroes?.[t.id]?.lit)view.anchors.push({id:'carried-'+t.id,kind:'torch',x:t.x,y:t.y,size:5,visible:true});}return view;
  }
  function atlasWorkspace() {
    return campaignIndex.tableExtras.atlas ||= globalThis.ECHO_ATLAS.normalizeWorkspace();
  }
  const atlasMapImages=new Map(), atlasMaskedImages=new Map();
  function publicSceneArtwork(revealed) {
    const path=getScene(state.scene)?.image||'';
    const record=globalThis.ECHO_ATLAS?.proposal(path);
    if(!record)return resolveImage(path);
    const cols=tileDimensions().cols,rows=tileDimensions().rows;
    const overlayRecords=(record.revealOverlays||[]).filter(o=>(mapSceneData().floorReveals||[]).includes(o.id));
    const signature=JSON.stringify([path,sceneHasFog(),cols,rows,[...revealed].sort(),overlayRecords.map(o=>o.id)]);
    if(atlasMaskedImages.has(signature))return atlasMaskedImages.get(signature);
    const canvas=document.createElement('canvas');canvas.width=record.isFloorMaster?6000:2000;canvas.height=Math.round(canvas.width*record.viewBox[3]/record.viewBox[2]);
    const ctx=canvas.getContext('2d');ctx.fillStyle='#142019';ctx.fillRect(0,0,canvas.width,canvas.height);
    let image=atlasMapImages.get(path);
    if(!image){image=new Image();atlasMapImages.set(path,image);image.onload=()=>{atlasMaskedImages.clear();sendToPlayer();};image.src=path;}
    const overlayImages=overlayRecords.map(o=>{let img=atlasMapImages.get(o.image);if(!img){img=new Image();atlasMapImages.set(o.image,img);img.onload=()=>{atlasMaskedImages.clear();sendToPlayer();};img.src=o.image;}return img;});
    const ready=image.complete&&image.naturalWidth&&overlayImages.every(img=>img.complete&&img.naturalWidth);
    if(ready){ctx.save();if(sceneHasFog()){ctx.beginPath();for(const key of revealed){if(!validTile(key))continue;const [r,c]=key.split(',').map(Number);ctx.rect(c*canvas.width/cols,r*canvas.height/rows,canvas.width/cols,canvas.height/rows);}ctx.clip();}ctx.drawImage(image,0,0,canvas.width,canvas.height);for(const img of overlayImages)ctx.drawImage(img,0,0,canvas.width,canvas.height);ctx.restore();}
    const result=safeAtlasCanvas(canvas);
    if(ready){if(atlasMaskedImages.size>12)atlasMaskedImages.clear();atlasMaskedImages.set(signature,result);}
    return result;
  }
  let atlasCanvasNotice=false;
  function safeAtlasCanvas(canvas,type='image/png',quality) {
    try{return canvas.toDataURL(type,quality);}catch(error){if(error.name!=='SecurityError')throw error;
      if(!atlasCanvasNotice){atlasCanvasNotice=true;toast('Source map could not be rendered safely from this file address. Open the desktop app with its local http address. The map stays concealed; no private source file was sent.');}
      const safe=document.createElement('canvas');safe.width=32;safe.height=32;const ctx=safe.getContext('2d');ctx.fillStyle='#142019';ctx.fillRect(0,0,32,32);return safe.toDataURL('image/png');
    }
  }
  function atlasPresentationKey() {
    const p=state.presentation||{};
    return JSON.stringify([p.mode,p.mediaId,p.handoutId,p.cardId,p.title,p.subtitle]);
  }
  function atlasPublic() {
    if(IS_PLAYER)return state.atlas||null;
    const shown=campaignIndex.tableExtras.atlas?.shown;
    if(!shown || shown.scene!==state.scene || shown.presentation!==atlasPresentationKey())return null;
    const payload=globalThis.ECHO_ATLAS?.publicProjection(globalThis.ECHO_ATLAS_DATA,globalThis.ECHO_TRAVEL.data(campaignIndex.tableExtras),shown.boardId,shown.view)||null;
    // Private room-purpose filenames do not travel with a reviewed, unkeyed layout.
    if(payload&&(globalThis.ECHO_ATLAS.proposal(payload.board.image)||globalThis.ECHO_ATLAS.rasterSource(payload.board.image)))payload.board.image=atlasFullArtwork(payload.board.image,payload.board.viewBox);
    return payload;
  }
  const atlasFullImages=new Map();
  function atlasFullArtwork(path,box) {
    if(!globalThis.ECHO_ATLAS?.proposal(path)&&!globalThis.ECHO_ATLAS?.rasterSource(path))return '';
    if(atlasFullImages.has(path))return atlasFullImages.get(path);
    let image=atlasMapImages.get(path);
    if(!image){image=new Image();atlasMapImages.set(path,image);image.onload=()=>{atlasMaskedImages.clear();sendToPlayer();};image.src=path;}
    const ready=image.complete&&image.naturalWidth;
    const photographic=/\.(?:png|jpe?g|webp)$/i.test(path);
    const width=ready&&photographic?Math.min(2000,image.naturalWidth):2000;
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=Math.round(width*box[3]/box[2]);
    const ctx=canvas.getContext('2d');ctx.fillStyle='#142019';ctx.fillRect(0,0,canvas.width,canvas.height);
    if(ready){ctx.drawImage(image,0,0,canvas.width,canvas.height);const data=photographic?safeAtlasCanvas(canvas,'image/jpeg',.9):safeAtlasCanvas(canvas);atlasFullImages.set(path,data);return data;}
    return canvas.toDataURL('image/png');
  }
  function renderPlayerAtlas() {
    let panel=$('player-atlas');
    if(!panel){panel=document.createElement('section');panel.id='player-atlas';panel.setAttribute('aria-label','Campaign atlas');Object.assign(panel.style,{position:'absolute',inset:'0',zIndex:'12',background:'#142820',overflow:'hidden'});document.querySelector('.player-stage-wrap').append(panel);}
    panel.hidden=!state.atlas;
    if(state.atlas){globalThis.ECHO_ATLAS_VIEW?.render(panel,state.atlas);$('player-scene-title').textContent=state.atlas.board.title;$('player-hint').textContent='Campaign atlas · The DM controls this view.';}
    else panel.replaceChildren();
  }
  function initAtlas() {
    if(IS_PLAYER || !globalThis.ECHO_ATLAS_UI)return;
    globalThis.ECHO_ATLAS_UI.init({
      content:(title,fill)=>globalThis.ECHO_COCKPIT.content(title,fill),data:()=>globalThis.ECHO_ATLAS_DATA,
      travel:()=>globalThis.ECHO_TRAVEL.data(campaignIndex.tableExtras),extras:()=>campaignIndex.tableExtras,image:resolveImage,toast,
      saveView:(id,view)=>{atlasWorkspace().views[id]=view;void saveCampaignIndex();},
      stage:()=>{},
      show:payload=>{atlasWorkspace().shown={boardId:globalThis.ECHO_ATLAS_UI.current().boardId,view:payload.view,scene:state.scene,presentation:atlasPresentationKey()};void saveCampaignIndex();commit('Showed reviewed atlas view');globalThis.ECHO_PHONE?.sync();},
      hide:()=>{atlasWorkspace().shown=null;void saveCampaignIndex();commit('Returned from atlas to live scene');globalThis.ECHO_PHONE?.sync();},
      nowShowing:()=>atlasPublic()?.board.title||'',
      sceneTitle:id=>getScene(id)?.title||'',
      prepareMap:(requested,review={})=>{
        const selected=globalThis.ECHO_ATLAS.proposal(requested?.id);
        if(!selected)throw Error('Choose a map from the reviewed campaign collection.');
        const proposal=selected.floorProposalId?globalThis.ECHO_ATLAS.proposal(selected.floorProposalId):selected;
        if(!proposal)throw Error('This section needs its reviewed parent floor.');
        const atlasBoard=globalThis.ECHO_ATLAS_DATA.boards.find(row=>row.proposalId===selected.id);
        const access=globalThis.ECHO_ATLAS.gate(globalThis.ECHO_ATLAS_DATA,globalThis.ECHO_TRAVEL.data(campaignIndex.tableExtras),atlasBoard?.id);
        if(!access.allowed)throw Error(access.reason);
        if(globalThis.ECHO_ATLAS.permissionRequired(globalThis.ECHO_ATLAS_DATA,atlasBoard.id)&&review.permissionReviewed!==true)throw Error('Confirm that players have permission to see these rooms before preparing this map.');
        if(state.sessionKind!=='custom')throw Error('Use a prepared campaign session for a separate map variant; the original Session 1 board remains available.');
        const id=globalThis.ECHO_ATLAS.proposalSceneId(proposal);
        if(state.scenes.some(s=>s.id===id&&s.image!==proposal.proposalImage))throw Error('This prepared map ID belongs to a different saved layout. The existing scene has been preserved.');
        if(!state.scenes.some(s=>s.id===id)){
          if(state.scenes.length>=100)throw Error('This session has 100 scenes. Prepare this map in another session.');
          state.scenes.push({id,title:(proposal.playerTitle||'Dungeon map')+' · source layout',kind:'map',image:proposal.proposalImage,fog:true,grid:proposal.scale?.tacticalMeasurement!==false,gridColumns:Math.max(5,Math.min(500,Math.round(proposal.scale?.gridColumns||30)))});
          state.sceneFog[id]=[];
          const placements=(proposal.entryPoints||[]).filter(p=>Array.isArray(p.point)&&p.point.length===2&&p.point.every(Number.isFinite));
          const target=p=>p.returnProposalId?globalThis.ECHO_ATLAS.proposalSceneId(p.returnProposalId):p.returnSceneId||'';
          state.map.scenes[id]=globalThis.ECHO_MAP_DATA.scene({fineFog:true,floorFog:proposal.floorFog||null,
            points:placements.filter(p=>!target(p)).map(p=>({id:p.id,x:(p.point[0]-proposal.viewBox[0])/proposal.viewBox[2]*100,y:(p.point[1]-proposal.viewBox[1])/proposal.viewBox[3]*100,title:p.title,note:p.note,visible:false,approved:false})),
            links:placements.filter(p=>target(p)).map(p=>({id:p.id,x:(p.point[0]-proposal.viewBox[0])/proposal.viewBox[2]*100,y:(p.point[1]-proposal.viewBox[1])/proposal.viewBox[3]*100,title:p.playerTitle||'Return route',target:target(p),visible:false}))});
          commit('Prepared separate source layout: '+proposal.title);
        }
        if(proposal.isFloorMaster){
          const record=globalThis.ECHO_EXPEDITIONS?.data(campaignIndex.tableExtras).records.find(r=>r.sessionId===activeSessionId&&r.phase!=='closed'&&r.sceneIds.includes('um1-table'));
          if(record&&!record.sceneIds.includes(id)){record.sceneIds.push(id);globalThis.ECHO_EXPEDITIONS.log(expeditionContext(),record,'map','Linked the source floor to this expedition; existing room outcomes and fog remain in place.');commit('Linked source floor to expedition record');}
        }
        floorFocusPreview=proposal.isFloorMaster?{sceneId:id,campaign:activeCampaignId,session:activeSessionId,proposalId:selected.id,view:globalThis.ECHO_FLOOR_MAPS.focus(proposal,selected)}:null;
        previewSceneId=id;contextTab='scene';renderContextSidebar();toast(proposal.isFloorMaster?'Floor prepared for private review. Sections share this one save. Show on TV applies the view with current saved fog.':'Map prepared for private review. Existing fog and positions are retained. Use Show on TV when ready.');
      },
      openTravel:id=>globalThis.ECHO_TRAVEL_UI.open(id),
      openDestination:place=>{const target=place.arrivalScene||(place.mapIds||[]).find(id=>getScene(id));if(target&&getScene(target)){previewSceneId=target;contextTab='scene';renderContextSidebar();}else{globalThis.ECHO_TRAVEL_UI.open(place.travelId);}},
      links:place=>({quests:(place.questIds||[]).map(id=>{const q=globalThis.ECHO_QUEST_PREP.cards(campaignContinuity()).find(q=>q.id===id);return q?{id,title:q.title,detail:q.goal||q.objective||''}:{id,title:id};}),npcs:(place.npcIds||[]).map(id=>{const npc=campaignIndex.story.npcs.find(n=>n.id===id),seed=globalThis.ECHO_COURTYARD_DATA?.cast.find(n=>n.id===id),base=globalThis.ECHO_STORY_DATA?.NPC_SEED.find(n=>n[0]===id);return {id,title:npc?.name||seed?.name||base?.[1]||'Contact reference unavailable',detail:npc?.goal||seed?.role||'',available:!!npc};}),leads:(place.leadIds||[]).map(id=>({id,title:sessionRunbook().find(b=>b.id===id)?.title||id})),maps:(place.mapIds||[]).map(id=>({id,title:getScene(id)?.title||id}))}),
      openQuest:()=>globalThis.ECHO_STORY_UI.openQuestBoard(activeSessionId),openNpc:id=>{if(campaignIndex.story.npcs.some(n=>n.id===id))globalThis.ECHO_STORY_UI.openPerson(id);else toast('This contact has no saved person record in this campaign.');},
      openLead:id=>{if(sessionRunbook().some(b=>b.id===id))selectRunbook(id);else toast('This lead belongs to another session. Open its quest preparation board.');}
    });
    $('live-return-map')?.addEventListener('click',()=>{if(campaignIndex.tableExtras.atlas?.shown){atlasWorkspace().shown=null;void saveCampaignIndex();sendToPlayer();globalThis.ECHO_PHONE?.sync();}});
  }
  function publicState() {
    const sight=dungeonSight();
    const fog = new Set(sight.enabled?sight.explored:fogForScene());
    const publicImage=publicSceneArtwork(fog);
    const sharedFog=mapSceneData().floorFog?globalThis.ECHO_FLOOR_MAPS.publicOverlay():[...fog];
    const visible = globalThis.ECHO_RELIABILITY.visibleTokens(state.tokens, state.scene, fog,
      sceneHasFog() || sight.enabled, enemyVisibleByLight, tileForPoint).filter(t=>!sight.enabled||t.team==='pc'||sight.visible(t));
    const visibleIds = new Set(visible.map(t => t.id));
    const tokens = visible.map(t => ({ id: t.id, name: t.name, label: t.label,
      type: t.id === 's3-vyerith' ? 'custom' : t.type === 'vhalak' ? 'custom' : t.type, team: t.team,
      placed: true, visible: true, scene: t.scene, x: t.x, y: t.y,
      defeated: t.hp === 0, conditions: t.conditions,
      statusDue: state.combat?.effects?.some(e => e.tokenId === t.id && e.due) || false,
      concentrating: !!state.combat?.tokens?.[t.id]?.concentration }));
    const turnOrder = state.turn.order.map(getToken).filter(t => t && visibleIds.has(t.id)).map(t =>
      ({ id: t.id, label: t.label, name: t.name, initiative: t.initiative }));
    const activeId = state.turn.order[state.turn.index];
    const turn = state.turn.scene === state.scene
      ? { round: state.turn.round, order: turnOrder,
        activeId: turnOrder.some(t => t.id === activeId) ? activeId : null }
      : { round: 0, order: [], activeId: null };
    const shownRoll = state.rolls.find(r => r.id === state.publicRollId);
    const publicRoll = shownRoll ? { label: shownRoll.label, notation: shownRoll.notation,
      parts: shownRoll.parts, total: shownRoll.total } : null;
    const mapScene = presentedMapScene();
    const publicMap=globalThis.ECHO_MAP_DATA?.publicScene(mapScene)||{};
    if(mapScene.floorFog){for(const key of ['points','links','lights'])publicMap[key]=(publicMap[key]||[]).filter(p=>fog.has(tileForPoint({...p,scene:state.scene})));publicMap.lines=[];}
    const payload = globalThis.ECHO_RELIABILITY.publicPayload({ atlas: atlasPublic(), atmosphere:atmospherePublic(tokens), dungeon:dungeonPublic(), journey: globalThis.ECHO_TRAVEL?.publicView(globalThis.ECHO_TRAVEL.data(campaignIndex.tableExtras)), sessionKind: state.sessionKind,
      scenes: [getScene(state.scene)].filter(Boolean).map(scene => ({ id:scene.id||state.scene,title:displaySceneTitle(scene.title),kind:scene.kind,image:publicImage,fog:scene.fog,grid:scene.grid,gridColumns:scene.gridColumns })),
      sessionName: (activeCampaignId.startsWith('practice-')?'PRACTICE · ':'')+(campaignIndex.sessions.find(s => s.id === activeSessionId)?.name || 'Campaign session'),
      scene: state.scene, grid: state.grid, playerReveal: state.playerReveal,
      calibrationCheck: tvCalibrationCheck,
      map: { playerInput: state.map?.playerInput !== false,
        display: state.map?.displays?.[state.map.displayIndex] || null,
        scenes: { [state.scene]: publicMap },
        tokenMeta: Object.fromEntries(tokens.map(t => [t.id, {
          size: state.map?.tokenMeta?.[t.id]?.size || 'medium',
          facing: state.map?.tokenMeta?.[t.id]?.facing || 0,
          elevation: state.map?.tokenMeta?.[t.id]?.elevation || 0,
          portrait: resolveImage(state.map?.tokenMeta?.[t.id]?.portrait || '') }])) },
      fog: sharedFog, sceneFog: state.sessionKind === 'custom' ? { [state.scene]: sharedFog } : {},
      tokens, turn, publicRoll,
      narration: globalThis.ECHO_VOICE_STUDIO?.publicView() || null,
      reduceMotion: campaignIndex.ergonomics?.reducedMotion === true,
      presentation: { ...globalThis.ECHO_PRESENTATION?.publicState(state.presentation, campaignIndex.presentation),
        sceneImage: publicImage },
      annotations: [...state.annotations.filter(a => a.scene === state.scene), ...(state.combatPlus?.areas||[]).filter(a=>a.scene===state.scene&&a.active&&a.public).map(a=>({...a.shape,id:a.id,scene:a.scene}))],
      ping: state.ping && state.ping.scene === state.scene && Date.now() - state.ping.created < 7000
        ? { scene: state.scene, x: state.ping.x, y: state.ping.y } : null,
      handout: state.handout.visible ? { ...state.handout, image: resolveImage(state.handout.image) } : null,
      mainQuest: globalThis.ECHO_QUESTS?.tvQuest(campaignContinuity()) || null,
      tvTextCards: globalThis.ECHO_TV_TEXT?.publicCards(state.tvTextCards) || [],
      journal: globalThis.ECHO_OUTCOMES?.journal(campaignIndex.story) || [
        ...(globalThis.ECHO_CONTINUITY?.publicJournal(campaignContinuity()) || []),
        ...(campaignIndex.story?.journal || []).filter(entry => entry.published).map(entry =>
          ({ id: entry.id, title: entry.title, text: entry.text, kind: entry.kind, when: entry.when })),
        ...(campaignIndex.story?.evidence || []).filter(entry => entry.published && entry.playerSaw).map(entry =>
          ({ id: entry.id, title: entry.title, text: entry.playerSaw, kind: entry.status, when: '' }))
      ],
      partyView: state.partyShown && state.party[state.partyShown]
        ? globalThis.ECHO_PARTY_DATA?.safeView(state.party[state.partyShown]) : null });
    return globalThis.ECHO_TABLE?.decoratePublic(payload, state.tokens.find(t => t.team === 'pc' && t.visible !== false) || state.tokens.find(t => t.team === 'pc')) || payload;
  }

  const privatePreviewFrames=new Map();let privatePreviewTimer=null;
  function privatePreviewPayload(sceneId,key){const staged=key!=='live'?pendingFloorFocus():null;if(key==='live'||!sceneId)return publicState();const wanted=getScene(sceneId)?.kind==='map'?'battle':sceneId==='black'?'black':'scene';if(sceneId===state.scene&&!staged&&state.presentation.mode===wanted&&!state.presentation.mediaId)return publicState();const original=state,originalIndex=campaignIndex;try{state=structuredClone(original);campaignIndex=structuredClone(originalIndex);state.scene=sceneId||original.scene;if(staged)state.map.scenes[staged.sceneId].view={...staged.view};if(sceneId!==original.scene&&campaignIndex.tableExtras.atlas)campaignIndex.tableExtras.atlas.shown=null;if(state.sessionKind==='custom')state.grid=getScene(state.scene)?.grid===true;state.presentation={...state.presentation,mode:getScene(state.scene)?.kind==='map'?'battle':state.scene==='black'?'black':'scene',mediaId:'',handoutId:'',cardId:''};return publicState();}finally{state=original;campaignIndex=originalIndex;}}
  function mountPrivatePreview(container,sceneId='',key='staged'){
    initPrivatePreviews();
    let view=privatePreviewFrames.get(key);if(!view){const frame=document.createElement('iframe');frame.className='exact-tv-preview';frame.title=key==='live'?'Exactly what players see now':'Player-safe preview of the staged scene';frame.tabIndex=-1;const url=new URL(location.href);url.searchParams.set('dm-preview','1');url.hash='player';frame.src=url.href;view={frame,sceneId,loaded:false,payload:null,signature:''};privatePreviewFrames.set(key,view);frame.onload=()=>{view.loaded=true;view.signature='';refreshPrivatePreviews();};}
    if(view.sceneId!==sceneId){view.sceneId=sceneId;view.signature='';}container.classList.add('exact-tv-preview-host');container.append(view.frame);if(view.container!==container){view.resize?.disconnect();view.container=container;view.resize=new ResizeObserver(()=>{if(view.frame.isConnected)view.frame.style.transform=`scale(${container.clientWidth/(view.width||1920)})`;});view.resize.observe(container);}refreshPrivatePreviews();
  }
  function refreshPrivatePreviews(){for(const view of privatePreviewFrames.values()){if(!view.loaded||!view.frame.isConnected||!view.frame.getBoundingClientRect().width)continue;const viewport=playerViewport?.width>0&&playerViewport?.height>0?playerViewport:{width:1920,height:1080};view.width=viewport.width;view.frame.style.width=viewport.width+'px';view.frame.style.height=viewport.height+'px';view.container.style.aspectRatio=viewport.width+'/'+viewport.height;view.frame.style.transform=`scale(${view.container.clientWidth/viewport.width})`;const signature=viewport.width+'x'+viewport.height+':'+lastSentRevision+':'+view.sceneId+':'+(view.frame.title.includes('now')?'':JSON.stringify(pendingFloorFocus()?.view||''));if(view.signature===signature)continue;view.payload=privatePreviewPayload(view.sceneId,view.frame.title.includes('now')?'live':'staged');view.signature=signature;view.frame.contentWindow.postMessage({app:APP,kind:'private-preview-state',payload:view.payload},'*');}}
  function initPrivatePreviews(){if(privatePreviewTimer)return;privatePreviewTimer=setInterval(refreshPrivatePreviews,1500);window.addEventListener('message',event=>{const view=[...privatePreviewFrames.values()].find(v=>v.frame.contentWindow===event.source);if(!view||event.data?.app!==APP||event.data.kind!=='preview-media-request')return;const id=String(event.data.id||'');if(!view.payload?.presentation?.media?.some(m=>m.id===id))return;void readRecord('media:'+id).then(blob=>{if(blob instanceof Blob&&view.frame.isConnected)view.frame.contentWindow.postMessage({app:APP,kind:'preview-media',id,blob},'*');});});}

  function phoneSnapshot() {
    const safe = publicState(), scene = getScene(state.scene);
    const mapScene = safe.map?.scenes?.[state.scene] || {};
    const characters = Object.fromEntries(state.tokens.filter(t => t.team === 'pc' && state.party[t.id]).map(t =>
      [t.id, globalThis.ECHO_PARTY_DATA.ownerView(state.party[t.id])]));
    const phoneExtras=globalThis.ECHO_TABLE?.phoneData() || {};
    phoneExtras.privateClues=Object.fromEntries(Object.keys(characters).map(id=>[id,[...(phoneExtras.privateClues?.[id]||[]),...(globalThis.ECHO_QUESTS?.privateClues(campaignContinuity(),id)||[]),...(globalThis.ECHO_OUTCOMES?.privateJournal(campaignContinuity(),id)||[])]]));
    return { campaign: activeCampaignId, atlas:safe.atlas, dungeonProtocol:1, dungeon:safe.dungeon, searchRequests:(dungeonData()?.requests||[]).map(r=>({...r,title:globalThis.ECHO_DUNGEON.scene(dungeonData(),r.scene).objects.find(o=>o.id===r.objectId)?.title||r.area})), travelProtocol: 1, journey: safe.journey, travelRequests: globalThis.ECHO_TRAVEL?.data(campaignIndex.tableExtras).requests || [], playerToolsProtocol: 1,
      playerTools: Object.fromEntries(Object.keys(characters).map(id=>[id,{...(globalThis.ECHO_PLAYER_TOOLS?.phone(campaignIndex.tableExtras||{},state.party,id)||{}),objective:globalThis.ECHO_OUTCOMES?.tableObjective(campaignContinuity(),campaignIndex.tableExtras.playerHub?.objective)||{text:'',at:''}}])), actionProtocol: 1, combatProtocol: 1, characters,
      combatPrompts: Object.fromEntries(Object.keys(characters).map(id=>[id,globalThis.ECHO_COMBAT_PLUS?.phone(state,id)||{}])),
      movementViews: Object.fromEntries(Object.keys(characters).map(id=>[id,{...globalThis.ECHO_COMBAT_PLUS?.scale(state,getScene(state.scene)?.gridColumns||MAP_SQUARES_ACROSS),speed:globalThis.ECHO_COMBAT_PLUS?.speed(state,getToken(id)),used:state.combatRun?.queue.key===`${state.scene}:${state.turn.round}:${id}`?state.combatRun.queue.movementUsed:0,crawling:getToken(id).conditions.includes('Prone'),areas:(state.combatPlus?.areas||[]).filter(a=>a.scene===state.scene&&a.active&&a.public&&a.difficult).map(a=>({kind:a.shape.kind,x1:a.shape.x1,y1:a.shape.y1,x2:a.shape.x2,y2:a.shape.y2}))}])), receipts:Object.fromEntries(Object.keys(characters).map(id=>[id,(state.actionReceipts||[]).filter(r=>r.owner===id).map(r=>globalThis.ECHO_ACTION_RECEIPTS.model(r.receipt))])), actionRequests: Object.fromEntries(Object.keys(characters).map(id => [id, globalThis.ECHO_PHONE_ACTIONS?.publicRequests(state,id) || []])), isMap: scene?.kind === 'map', fogged: sceneHasFog() || safe.dungeon?.enabled,
      continuity: { journal: globalThis.ECHO_OUTCOMES?.journal(campaignIndex.story) || globalThis.ECHO_CONTINUITY?.publicJournal(campaignContinuity()) || [],
        quests: globalThis.ECHO_QUESTS?.phoneQuests(campaignContinuity()) || (globalThis.ECHO_CONTINUITY?.questCards(campaignContinuity(), true) || []).map(q=>({id:q.id,title:q.title,state:q.state,goal:q.goal})),
        tracks: globalThis.ECHO_CONTINUITY?.trackers(campaignContinuity(), true) || [] },
      sceneTitle: scene?.title || 'Scene', ...phoneExtras, requestStatus: state.phoneReplies,
      initiative: { open: state.combatRun?.initiativePrompt?.open === true && state.combatRun.initiativePrompt.scene === state.scene,
        eligible: Object.fromEntries(state.tokens.filter(t => t.team === 'pc' && t.placed && t.scene === state.scene).map(t => [t.id, true])),
        totals: Object.fromEntries(state.tokens.filter(t => t.team === 'pc').map(t => [t.id, t.initiative])),
        bonuses: Object.fromEntries(state.tokens.filter(t => t.team === 'pc').map(t => [t.id, t.initBonus])) },
      rehearsal: safe.rehearsal === true, sceneMood: safe.sceneMood,
      public: { sessionName: safe.sessionName, scene: safe.scene, rehearsal: safe.rehearsal, sceneMood: safe.sceneMood,
        map: { playerInput: safe.map?.playerInput, scenes: { [state.scene]: { fineFog: mapScene.fineFog, points: mapScene.points || [] } } },
        fog: safe.fog, tokens: safe.tokens, turn: safe.turn, publicRoll: safe.publicRoll,
        presentation: { sceneImage: safe.presentation?.sceneImage || '' } } };
  }

  function handlePhoneAction(action) {
    const sheet = state.party[action.characterId], hero = getToken(action.characterId);
    if (!sheet || !hero || hero.team !== 'pc') return;
    if(['search-request','search-cancel'].includes(action.kind)){
      try {if(action.kind==='search-request'&&(action.scene!==state.scene||state.map.playerInput===false))throw Error('This exploration scene is no longer open.');globalThis.ECHO_DUNGEON.receive(dungeonData(),action,Object.keys(state.party),dungeonPublic());void saveCampaignIndex();commit('Updated dungeon search request');}
      catch(error){state.phoneReplies[hero.id]=error.message;commit('Search request needs correction');}return;
    }
    if (['travel-request','travel-cancel'].includes(action.kind)) {
      try { globalThis.ECHO_TRAVEL.receive(globalThis.ECHO_TRAVEL.data(campaignIndex.tableExtras),action,Object.keys(state.party));
        void saveCampaignIndex(); commit('Updated player destination request');
      } catch(error) { state.phoneReplies[hero.id]=error.message;commit('Travel request needs correction'); } return;
    }
    if (action.kind === 'save-response' || action.kind === 'reaction-response') {
      try { if(action.kind==='save-response') globalThis.ECHO_COMBAT_PLUS.saveResult(state,action,rollDie);
        else globalThis.ECHO_COMBAT_PLUS.reactionReply(state,action);
        commit(`${sheet.name}: ${action.kind==='save-response'?'saving throw received':'reaction response received'}`);
      } catch(error) {state.phoneReplies[hero.id]=error.message;commit('Phone combat response needs correction');} return;
    }
    if (action.kind === 'initiative') {
      if (!state.combatRun?.initiativePrompt?.open || state.combatRun.initiativePrompt.scene !== state.scene ||
        !hero.placed || hero.scene !== state.scene || action.scene !== state.scene) return;
      if (action.mode === 'manual' && Number.isInteger(action.total) && action.total >= -99 && action.total <= 999) {
        hero.initiative = action.total;
        state.phoneReplies[hero.id] = `Initiative ${hero.initiative} recorded from your physical die.`;
        commit(`${hero.name} entered initiative ${hero.initiative}`);
      } else if (action.mode === 'roll') {
        if (!Number.isInteger(hero.initBonus)) { state.phoneReplies[hero.id] = 'Ask your DM to set your initiative bonus first.'; commit(); return; }
        const entry = recordDiceRoll(`${hero.name} initiative`, 1, 20, hero.initBonus);
        hero.initiative = entry.total;
        globalThis.ECHO_PHONE?.setRollResult(hero.id, entry);
        state.phoneReplies[hero.id] = `Initiative ${entry.total} (${entry.parts[0]} ${hero.initBonus >= 0 ? '+' : '−'} ${Math.abs(hero.initBonus)}).`;
        commit(`${hero.name} rolled initiative ${entry.total}`);
      }
      return;
    }
    if (action.kind === 'save-clue') {
      if (globalThis.ECHO_TABLE?.saveClue(action.characterId, action.clueId)) {
        state.phoneReplies[action.characterId] = 'Clue saved to your journal.';
        commit(`${sheet.name} saved a private clue`);
      }
      return;
    }
    if (['personal-note','share-clue','item-request','item-cancel'].includes(action.kind)) {
      try { state.phoneReplies[hero.id]=globalThis.ECHO_PLAYER_TOOLS.receive(campaignIndex.tableExtras,state.party,action); void saveCampaignIndex(); commit(`Player companion: ${sheet.name} · ${action.kind}`);if(action.kind==='share-clue')actionReceipt({title:'Clue sharing',status:'resolved',committed:['Clue published to the shared party journal.'],pending:[],undo:'conditional'}); }
      catch(error) { state.phoneReplies[hero.id]=error.message;commit('Player companion request needs correction'); } return;
    }
    if (['action-request','action-revise','action-cancel'].includes(action.kind)) {
      try {
        const row = globalThis.ECHO_PHONE_ACTIONS.receive(state, action, publicState().tokens.map(t=>t.id));
        state.phoneReplies[hero.id] = `${row.label}: ${row.message}`;
        commit(`${sheet.name}: ${row.label} · ${row.status}`);
        toast(`${sheet.name}: ${row.label} · ${row.status}. Open Actions in the sidebar.`);
      } catch (error) { state.phoneReplies[hero.id] = error.message; commit(`Phone request needs correction: ${sheet.name}`); }
      return;
    }
    if (action.kind === 'roll') {
      const count = Number(action.count), sides = Number(action.sides), modifier = Number(action.modifier);
      if (!Number.isInteger(count) || count < 1 || count > 20 || ![4, 6, 8, 10, 12, 20, 100].includes(sides) ||
        !Number.isInteger(modifier) || modifier < -99 || modifier > 99) return;
      const label = `${sheet.name} · ${String(action.label || 'roll').slice(0, 45)}`;
      let entry;
      if (sides === 20 && count === 1 && ['advantage', 'disadvantage'].includes(action.mode)) {
        const parts = [rollDie(20), rollDie(20)];
        entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, label,
          notation: `2d20 ${action.mode}${modifier > 0 ? `+${modifier}` : modifier < 0 ? modifier : ''}`,
          parts, total: (action.mode === 'advantage' ? Math.max(...parts) : Math.min(...parts)) + modifier,
          kind: 'digital', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        state.rolls.unshift(entry); state.rolls = state.rolls.slice(0, 50);
      } else entry = recordDiceRoll(label, count, sides, modifier);
      state.publicRollId = entry.id;
      globalThis.ECHO_PHONE?.setRollResult(action.characterId, entry);
      commit(`${sheet.name} rolled ${entry.notation}: ${entry.total}`);
      return;
    }
    if (action.scene !== state.scene || !currentIsMap() || state.map?.playerInput === false) return;
    if (action.kind === 'move') {
      if (!hero.placed || hero.scene !== state.scene || !Number.isFinite(action.x) || !Number.isFinite(action.y)) return;
      state.phoneRequests = state.phoneRequests.filter(request => !(request.kind === 'move' && request.characterId === hero.id && request.scene === state.scene));
      state.phoneRequests.push({ id: `phone-move-${Date.now()}-${action.sequence}`, kind: 'move', scene: state.scene,
        characterId: hero.id, x: pointValue(action.x), y: pointValue(action.y) });
      state.phoneRequests = state.phoneRequests.slice(-40);
      state.phoneReplies[hero.id] = 'Movement requested. The DM will place your token.';
      commit(`${sheet.name} requested movement`);
      return;
    }
    if (action.kind !== 'explore') return;
    const key = typeof action.key === 'string' && sceneHasFog() && currentTile(action.key) && !fogForScene().includes(action.key)
      ? action.key : '';
    const point = presentedMapScene().points.find(item => item.id === action.pointId && item.visible && item.approved);
    if (!key && !point) return;
    const kind = key ? 'tile' : 'point';
    if (state.phoneRequests.some(item => item.scene === state.scene && item.characterId === action.characterId &&
      item.kind === kind && (key ? item.key === key : item.pointId === point.id))) return;
    state.phoneRequests.push({ id: `phone-${Date.now()}-${action.sequence}`, kind, scene: state.scene,
      characterId: action.characterId, key, pointId: point?.id || '' });
    state.phoneRequests = state.phoneRequests.slice(-40);
    commit(`${sheet.name} requested exploration`);
    toast(`${sheet.name} asked to explore. Review Player requests.`);
  }

  function livePlayerClients() {
    for (const [target, info] of playerClients) {
      if (target.closed || (info.viaChannel && Date.now() - info.heartbeat > 12000)) playerClients.delete(target);
    }
    return [...playerClients.entries()];
  }

  function postToDM(message) {
    if(IS_PRIVATE_PREVIEW)return;
    if (tvChannel) tvChannel.postMessage({ ...message, clientId: tvClientId, toDm: message.kind === 'hello' ? '' : activeDmId });
    else window.opener?.postMessage(message, '*');
  }

  function sendToPlayer(targetOnly = null) {
    globalThis.ECHO_PHONE?.sync();
    const clients = livePlayerClients().filter(([target]) => !targetOnly || target === targetOnly);
    if (!clients.length) {
      connected = false;
      updateConnection();
      return;
    }
    const message = { app: APP, kind: 'state', revision: ++lastSentRevision, payload: publicState() };
    for (const [target, info] of clients) {
      try { if(!info.pendingSince)info.pendingSince=Date.now();info.sentAt=Date.now();info.sentRevision=message.revision;target.postMessage(message, '*'); info.error = ''; }
      catch { playerClients.delete(target); }
    }
    updateConnection();
  }

  function connectionHealth() {
    const clients=livePlayerClients().map(([, info]) => info),health=globalThis.ECHO_CONNECTION_HEALTH.tv(clients);
    if(clients.length){const seen=Math.min(...clients.map(info=>info.heartbeat||0)),applied=Math.min(...clients.map(info=>info.ackRevision||0)),sent=Math.max(...clients.map(info=>info.sentRevision||0));
      health.details=`Last seen ${seen?Math.max(0,Math.round((Date.now()-seen)/1000))+'s ago':'never'} · applied update ${applied}/${sent}`;}
    return health;
  }

  function updateConnection() {
    if (IS_PLAYER) return;
    const el = $('connection-status');
    const health = connectionHealth();
    el.textContent = `Player TV ${health.label}${health.details?' · '+health.details:''}`;
    el.title = el.textContent;
    el.classList.toggle('connected', health.level === 'connected');
    el.classList.toggle('stale', health.level === 'stale');
    $('resync-player').hidden = health.level === 'connected';
    globalThis.ECHO_ERGONOMICS?.refreshConnection();
    globalThis.ECHO_RELIABILITY?.refreshConnection();
  }

  function resyncPlayer() {
    if (!livePlayerClients().length) { $('open-player').click(); return; }
    sendToPlayer();
    toast('Resent the current player view.');
  }

  function describeChange(before, after) {
    if (before.scene !== after.scene) return `Scene: ${getScene(after.scene, after)?.title || after.scene}`;
    if (before.handout?.visible !== after.handout?.visible ||
      (after.handout?.visible && JSON.stringify(before.handout) !== JSON.stringify(after.handout)))
      return after.handout?.visible ? `Show handout: ${after.handout.title || 'Untitled'}` : 'Hide handout';
    if (before.annotations?.length !== after.annotations?.length)
      return after.annotations.length > before.annotations.length ? `Draw ${after.annotations.at(-1).kind} on map` : 'Clear map marks';
    if (JSON.stringify(fogForScene(after.scene, before)) !== JSON.stringify(fogForScene(after.scene, after)))
      return `Map fog: ${fogForScene(after.scene, after).length} squares revealed`;
    if (before.rolls?.[0]?.id !== after.rolls?.[0]?.id && after.rolls?.[0])
      return `Roll: ${after.rolls[0].label} = ${after.rolls[0].total}`;
    if (before.publicRollId !== after.publicRollId)
      return after.publicRollId ? 'Show dice result on TV' : 'Hide dice result from TV';
    if (before.turn?.index !== after.turn?.index || before.turn?.round !== after.turn?.round ||
      before.turn?.order?.length !== after.turn?.order?.length)
      return after.turn?.order?.length ? `Round ${after.turn.round}: ${getToken(after.turn.order[after.turn.index])?.name || 'turn order'}` : 'End combat';
    for (const t of after.tokens || []) {
      const old = before.tokens?.find(item => item.id === t.id);
      if (!old) continue;
      if (old.hp !== t.hp || old.tempHp !== t.tempHp) return `${t.name}: ${t.hp} HP${t.tempHp ? ` +${t.tempHp} temp` : ''}`;
      if (old.maxHp !== t.maxHp) return `${t.name}: max HP ${t.maxHp}`;
      if (old.ac !== t.ac) return `${t.name}: AC ${t.ac ?? '?'}`;
      if (old.initiative !== t.initiative) return `${t.name}: initiative ${t.initiative ?? 'cleared'}`;
      if (old.placed !== t.placed || old.scene !== t.scene) return `${t.name}: ${t.placed ? 'placed' : 'removed'}`;
      if (old.x !== t.x || old.y !== t.y) return `${t.name}: moved`;
      if (old.visible !== t.visible) return `${t.name}: ${t.visible ? 'shown' : 'hidden'} on TV`;
      if (JSON.stringify(old.conditions) !== JSON.stringify(t.conditions)) return `${t.name}: conditions updated`;
    }
    return 'DM change';
  }

  function commit(label) {
    globalThis.ECHO_EXPEDITIONS?.reconcile(expeditionContext());
    if(globalThis.ECHO_SETTLEMENTS){
      const previous=JSON.parse(lastCommittedSnapshot),ledger=globalThis.ECHO_SETTLEMENTS.data(campaignIndex.tableExtras);
      const elapsed=Math.max(0,(state.map?.clock?.minutes||0)-(previous.map?.clock?.minutes||0));
      const oldPlace=previous.__tableExtras?.travel?.position?.placeId,newPlace=campaignIndex.tableExtras.travel?.position?.placeId;
      if(oldPlace!==newPlace)for(const town of ledger.towns)if(oldPlace==='region-'+town.id)globalThis.ECHO_SETTLEMENTS.leave(ledger,town.id);
      if(elapsed)globalThis.ECHO_SETTLEMENTS.advance(ledger,elapsed);
      if(oldPlace!==newPlace)for(const town of ledger.towns)if(newPlace==='region-'+town.id)globalThis.ECHO_SETTLEMENTS.arrive(ledger,town.id);
      if(elapsed||oldPlace!==newPlace)void saveCampaignIndex();
    }
    rememberDungeon();
    syncPartyFromTokens();
    globalThis.ECHO_COMBAT_PLUS?.syncAreas(state);
    let nextSnapshot = gameSnapshot(state);
    if (nextSnapshot !== lastCommittedSnapshot) {
      state.commandRevision = (globalThis.ECHO_COMMANDS?.revision(state) ?? state.commandRevision ?? 0) + 1;
      nextSnapshot = gameSnapshot(state);
      globalThis.ECHO_ATMOSPHERE?.changes(JSON.parse(lastCommittedSnapshot),state);
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const description = label || describeChange(JSON.parse(lastCommittedSnapshot), JSON.parse(nextSnapshot));
      state.undoStack.push({ snapshot: lastCommittedSnapshot, label: description, time });
      state.undoStack = state.undoStack.slice(-20);
      state.redoStack = [];
      state.sessionLog.unshift({ label: description, time, round: state.turn.round,
        actor: getToken(state.turn.order[state.turn.index])?.name || '' });
      state.sessionLog = state.sessionLog.slice(0, 100);
      lastCommittedSnapshot = nextSnapshot;
    }
    pruneUnusedAssets();
    saveLocal();
    if (JSON.stringify(state.combat?.library || []) !== JSON.stringify(campaignIndex.combatLibrary || [])) {
      campaignIndex.combatLibrary = structuredClone(state.combat.library);
      void saveCampaignIndex();
    }
    renderDM();
    sendToPlayer();
  }

  function undoLast() {
    const step = state.undoStack.pop();
    if (!step) { toast('Nothing to undo yet.'); return; }
    const remaining = state.undoStack;
    const redo = [...state.redoStack, { snapshot: gameSnapshot(state), label: step.label,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }].slice(-20);
    const log = state.sessionLog;
    const assets = state.assets;
    const restored = JSON.parse(step.snapshot);
    if (restored.__tableExtras) { const sessionFlow=campaignIndex.tableExtras.sessionFlow; campaignIndex.tableExtras = globalThis.ECHO_TABLE.normalize(restored.__tableExtras); campaignIndex.tableExtras.sessionFlow=sessionFlow; void saveCampaignIndex(); }
    state = normalize({ ...restored, assets });
    state.undoStack = remaining;
    state.redoStack = redo;
    state.sessionLog = [{ label: `Undid: ${step.label}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: state.turn.round, actor: getToken(state.turn.order[state.turn.index])?.name || '' }, ...log].slice(0, 100);
    lastCommittedSnapshot = gameSnapshot(state);
    pruneUnusedAssets();
    if (JSON.stringify(state.combat.library) !== JSON.stringify(campaignIndex.combatLibrary)) {
      campaignIndex.combatLibrary = structuredClone(state.combat.library);
      void saveCampaignIndex();
    }
    saveLocal(); renderDM(); sendToPlayer();
    actionReceipt({title:step.label,status:'undone',pending:['Review the restored state before trying the action again.']});
    toast(`Undid: ${step.label}`);
  }

  function redoLast() {
    const step = state.redoStack.pop();
    if (!step) { toast('Nothing to redo yet.'); return; }
    const redo = state.redoStack;
    const undo = [...state.undoStack, { snapshot: gameSnapshot(state), label: step.label,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }].slice(-20);
    const log = state.sessionLog, assets = state.assets;
    const restored = JSON.parse(step.snapshot);
    if (restored.__tableExtras) { const sessionFlow=campaignIndex.tableExtras.sessionFlow; campaignIndex.tableExtras = globalThis.ECHO_TABLE.normalize(restored.__tableExtras); campaignIndex.tableExtras.sessionFlow=sessionFlow; void saveCampaignIndex(); }
    state = normalize({ ...restored, assets });
    state.undoStack = undo; state.redoStack = redo;
    state.sessionLog = [{ label: `Redid: ${step.label}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: state.turn.round, actor: getToken(state.turn.order[state.turn.index])?.name || '' }, ...log].slice(0, 100);
    lastCommittedSnapshot = gameSnapshot(state);
    saveLocal(); renderDM(); sendToPlayer();
    toast(`Redid: ${step.label}`);
  }

  function pendingFloorFocus(){return floorFocusPreview&&floorFocusPreview.sceneId===previewSceneId&&floorFocusPreview.campaign===activeCampaignId&&floorFocusPreview.session===activeSessionId?floorFocusPreview:null;}
  function showScenePreview(){
    const staged=pendingFloorFocus();
    if(!getScene(previewSceneId))return;
    changeScene(previewSceneId,true,false);
    if(staged){state.map.scenes[staged.sceneId].view={...staged.view};floorFocusPreview=null;}
    commit(staged?'Showed reviewed floor section with saved fog':'Showed reviewed scene');
  }

  function changeScene(scene, followRunbook = true, saveNow = true) {
    if (!getScene(scene)) return;
    if (!IS_PLAYER && campaignIndex.tableExtras.atlas) campaignIndex.tableExtras.atlas.shown=null;
    const changedScene=state.scene!==scene;
    if (state.scene !== scene) globalThis.ECHO_TABLE_FLOW?.rememberScene();
    if (state.scene !== scene) void captureRestorePoint(`Before scene: ${getScene(scene).title}`, 'automatic').catch(() => {});
    if (state.scene !== scene) state.map.history = [...state.map.history, state.scene].slice(-20);
    if (state.scene !== 'black') priorScene = state.scene;
    if (state.scene !== scene) { state.requests = []; state.phoneRequests = []; }
    state.scene = scene;
    if (!IS_PLAYER) { contextTab = 'scene'; previewSceneId = scene; }
    if (state.presentation) state.presentation.mode = getScene(scene)?.kind === 'map' ? 'battle' : scene === 'black' ? 'black' : 'scene';
    if (state.sessionKind === 'custom') state.grid = getScene(scene).grid === true;
    const suggested = state.sessionKind === 'session1' ? SCENE_NOTES[scene] : sessionRunbook().find(b => b.scene === scene)?.id;
    if (followRunbook && sessionRunbook().some(b => b.id === suggested)) {
      state.runbook = suggested;
      const beat = sessionRunbook().find(item => item.id === state.runbook);
      if (beat?.encounter) selectedEncounter = beat.encounter;
    }
    if(changedScene)globalThis.ECHO_TABLE_FLOW?.restoreScene();
    if (saveNow) commit();
  }

  function mapSceneData(id = state.scene) {
    if (IS_PLAYER) return state.map?.scenes?.[id] || {};
    return state.map.scenes[id] ||= globalThis.ECHO_MAP_DATA.scene();
  }
  function campaignContinuity() {
    return globalThis.ECHO_CONTINUITY?.ensure(campaignIndex.story, activeCampaignId) || {events:[],quests:[]};
  }
  function presentedMapScene(id = state.scene) {
    const original = mapSceneData(id);
    const raw = !IS_PLAYER && globalThis.ECHO_DUNGEON ? globalThis.ECHO_DUNGEON.mapScene(dungeonData(),id,original) : original;
    const traveled = !IS_PLAYER && id === 'region-lmop' && globalThis.ECHO_TRAVEL ? globalThis.ECHO_TRAVEL.projectMap(globalThis.ECHO_TRAVEL.data(campaignIndex.tableExtras),raw) : raw;
    return !IS_PLAYER && globalThis.ECHO_CONTINUITY ? globalThis.ECHO_CONTINUITY.projectMap(campaignContinuity(),traveled,id) : traveled;
  }

  function showCatalogBattleMap(id) {
    const item = (globalThis.LMOP_BATTLE_MAP_CATALOG || []).find(entry => entry.id === id);
    if (!item || !SCENES[id]) return;
    if (state.sessionKind === 'custom' && !state.scenes.some(scene => scene.id === id))
      state.scenes.push({ id, ...SCENES[id], kind: 'map', grid: true,
        fog: item.fog === true, gridColumns: item.gridColumns });
    if (item.fog) {
      state.sceneFog[id] ||= [];
      state.map.scenes[id] ||= globalThis.ECHO_MAP_DATA.scene({ fineFog: true });
    }
    changeScene(id, false, false);
    state.grid = true;
    commit(`Battle map: ${item.title}`);
  }

  function navigationMarkerContext() {
    const d=campaignContinuity(),prep=campaignIndex.story.questPrep||{links:{},boards:{}},beats=sessionRunbook(),scenes=sceneEntries();
    const quests=globalThis.ECHO_QUEST_PREP.cards(d),profiles={};
    for(const q of quests){const seed=globalThis.ECHO_QUEST_PREP_DATA?.records[q.id]||{},links=prep.links?.[q.id]||{};profiles[q.id]=Object.fromEntries(['events','npcs','beats','scenes'].map(k=>[k,[...new Set([...(seed[k]||[]),...(links[k]||[])])]]));}
    const ctx={continuity:d,prep,story:campaignIndex.story,beats,scenes,encounters:sessionEncounters(),media:campaignIndex.presentation?.media||[],roster:state.tokens.filter(t=>t.team==='pc').map(t=>({id:t.id,name:t.name})),sessionId:activeSessionId,targetExists:true,targetSceneIds:scenes.map(x=>x.id),targetEncounterIds:sessionEncounters().map(x=>x.id)};
    return {events:globalThis.ECHO_CONTINUITY.effective(d).filter(e=>e.approved&&e.status!=='planned'),quests,profiles,
      leads:(prep.boards?.[activeSessionId]?.leads||[]).map(l=>({...l,reviewCurrent:globalThis.ECHO_QUEST_PREP.readiness(ctx,l).reviewed})),
      npcs:campaignIndex.story.npcs.map(n=>({id:n.id,name:n.name})),names:globalThis.ECHO_QUEST_PREP_DATA?.names||{},places:campaignIndex.tableExtras.travel?.places||[]};
  }
  function navigationSourceMarkers(){return globalThis.ECHO_BOOT?.echo===false?[]:(globalThis.ECHO_SESSION_MAP_DATA?.maps||[]).flatMap(map=>map.rooms.map(r=>({scene:map.id,point:map.id+'-'+r.id,title:map.title+' · '+r.id+' · '+r.title,visible:false,approved:false,clue:'',revealable:false}))); }
  async function questPrepContext(sessionId) {
    let target = sessionId === activeSessionId ? state : null;
    if (!target && sessionId !== 'next') {
      const raw = await readRecord(campaignSessionKey(sessionId));
      if (raw) target = JSON.parse(raw);
    }
    const unique = rows => [...new Map(rows.filter(x=>x?.id).map(x=>[x.id,x])).values()];
    const targetBeats = target ? [...sessionRunbook(target), ...(campaignIndex.story.sessionPlans[sessionId]?.extraBeats || [])] : [];
    const targetScenes = target ? sceneEntries(target) : [];
    return {
      sessions: campaignIndex.sessions.map(s=>({id:s.id,name:s.name})),
      scenes: unique([...Object.entries(SCENES).map(([id,value])=>({id,...value})), ...sceneEntries(), ...targetScenes]).map(scene=>({...scene,previewImage:resolveImage(scene.image,targetScenes.some(s=>s.id===scene.id)?target:state)})),
      beats: unique([...RUNBOOK, ...(globalThis.ECHO_ADVENTURES?.beats()||[]), ...(globalThis.ECHO_FINALE?.beats()||[]), ...(globalThis.ECHO_CONTENT_PACKS||[]).flatMap(pack=>pack.runbook||[]), ...sessionRunbook(), ...targetBeats]),
      encounters: unique([...ENCOUNTERS, ...sessionEncounters(), ...(target?sessionEncounters(target):[])]),
      media: campaignIndex.presentation?.media || [],
      currentSceneIds: sceneEntries().map(x=>x.id), currentBeatIds: sessionRunbook().map(x=>x.id), currentEncounterIds: sessionEncounters().map(x=>x.id),
      targetSceneIds: targetScenes.map(x=>x.id), targetEncounterIds: target?sessionEncounters(target).map(x=>x.id):[], targetExists:!!target
    };
  }

  function storyPlan() {
    const plans = campaignIndex.story.sessionPlans;
    return plans[activeSessionId] ||= { nextBeat: '', music: '', handout: '', likelyRules: '', elsePlan: '',
      opening: '', notes: '', order: [], extraBeats: [], beats: {} };
  }

  let expeditionEditing=false;
  function expeditionContext() { return {state,extras:campaignIndex.tableExtras,story:campaignIndex.story,continuity:campaignContinuity(),sessionId:activeSessionId}; }
  async function reviewArcReturn(sessionId) {
    const campaign=activeCampaignId,sourceSession=activeSessionId,session=campaignIndex.sessions.find(s=>s.id===sessionId&&s.packId==='waterdeep-undermountain-1');
    if(!session)throw Error('Choose the saved first-floor session.');
    const M=globalThis.ECHO_EXPEDITIONS,target=await expeditionTarget({sessionId});
    if(campaign!==activeCampaignId||sourceSession!==activeSessionId)throw Error('The table changed. Review the saved dungeon again.');
    if(!target.scenes?.some(s=>s.id==='um1-table'))throw Error('The saved first-floor map is missing. Restore or repair that save before returning.');
    let r=M.data(campaignIndex.tableExtras).records.find(r=>r.sessionId===sessionId&&r.phase!=='closed')||M.data(campaignIndex.tableExtras).records.find(r=>r.sessionId===sessionId);
    if(!r){r=M.create({...expeditionContext(),state:target,sessionId},session.name,['um1-table',...target.scenes.filter(s=>s.image==='atlas/undermountain/level-1-player.svg').map(s=>s.id)]);commit('Linked existing first-floor save to expedition record');await saveCampaignIndex();}
    else if(r.phase!=='closed'){
      const added=target.scenes.filter(s=>s.image==='atlas/undermountain/level-1-player.svg'&&!r.sceneIds.includes(s.id)).map(s=>s.id);
      if(added.length){r.sceneIds.push(...added);M.log(expeditionContext(),r,'map','Linked the reviewed source floor to this expedition.');commit('Linked source floor to expedition record');await saveCampaignIndex();}
    }
    globalThis.ECHO_EXPEDITIONS_UI.open(r.id);
  }
  function expeditionBookRooms(record) {
    if(state.contentPackId==='lmop-part-4-visuals')return globalThis.ECHO_WAVE_ECHO.ROOM_NAMES.map((title,i)=>({system:'wave',id:String(i+1),title:(i+1)+'. '+title,status:state.waveEcho.rooms[i+1].status}));
    if(record.sceneIds.includes('um1-table'))return globalThis.ECHO_WATERDEEP_DATA.rooms.map(r=>({system:'waterdeep',id:r.id,title:r.number+'. '+r.title,status:campaignIndex.tableExtras.expedition.rooms[r.id]?.status||'unvisited'}));return [];
  }
  function bindExpeditionRooms(id,review) {
    const M=globalThis.ECHO_EXPEDITIONS,ctx=expeditionContext(),r=M.get(ctx,id),[scene,objectId]=review.object.split('|'),[system,roomId]=review.book.split('|');
    if(system==='waterdeep')globalThis.ECHO_EXPEDITION.room(globalThis.ECHO_EXPEDITION.data(ctx.extras),roomId);
    M.bind(ctx,r,{scene,objectId,system,roomId},review.authority);commit('Linked native dungeon room records');void saveCampaignIndex();
  }
  async function expeditionTarget(record) {
    if(!campaignIndex.sessions.some(s=>s.id===record.sessionId))throw Error('This expedition save is missing. Restore its backup before returning.');
    if(record.sessionId===activeSessionId)return structuredClone(state);
    await saveQueue;const raw=sessionCache.get(record.sessionId)||await readRecord(campaignSessionKey(record.sessionId));
    if(!raw)throw Error('The saved dungeon could not be read. Restore it rather than create a fresh pack.');
    return normalize(JSON.parse(raw),campaignIndex.sessions.find(s=>s.id===record.sessionId)?.packId);
  }
  function expeditionReturnRecord(record) {return {...structuredClone(record),awayMinutes:record.phase==='away'?Math.max(0,Math.floor((campaignIndex.tableExtras.settlements?.minutes||0)-(record.retreat?.worldMinute||0))):0};}
  async function previewExpeditionReturn(id) {
    const campaign=activeCampaignId,sourceSession=activeSessionId,r=globalThis.ECHO_EXPEDITIONS.get(expeditionContext(),id);if(!r)throw Error('Choose an expedition.');
    const target=await expeditionTarget(r);if(campaign!==activeCampaignId||sourceSession!==activeSessionId)throw Error('Campaign changed; preview again.');
    const review=globalThis.ECHO_EXPEDITION_RESUME.previewMerge(state,target,expeditionReturnRecord(r));
    review.lines=[`Return conditions: ${r.conditions||'Not recorded — review the actual route.'}`,`Refuges: ${r.refuges||'No safe refuge recorded.'}`,...r.sceneIds.flatMap(scene=>(campaignIndex.tableExtras.dungeon?.scenes?.[scene]?.passages||[]).filter(p=>p.blocked).map(p=>'Recorded blocked route: '+p.title)),`${r.proposals.filter(p=>p.status==='proposed').length} proposed developments still need review.`,...review.people.map(p=>`${p.name}: current ${p.hp}/${p.maxHp} HP, ${p.tempHp} temporary HP; retain current resources and conditions; ${p.positionSource} (${p.position.x}, ${p.position.y}).`),...review.warnings,`${review.preserved.enemies} saved non-player tokens retained. No revival, refill or fog reset.`,`The TV will show ${getScene(review.scene,target)?.title||review.scene}. ${review.awayMinutes} recorded minutes away; ${review.waveMinutes} minutes added to Wave Echo reminders only.`];
    return {campaign,sourceSession,id,review,dungeonSignature:globalThis.ECHO_EXPEDITIONS.returnReviewSignature(expeditionContext(),r)};
  }
  async function applyExpeditionReturn(id,preview) {
    if(preview.campaign!==activeCampaignId||preview.sourceSession!==activeSessionId||preview.id!==id)throw Error('The campaign or source session changed. Preview again.');
    const returnRecord=globalThis.ECHO_EXPEDITIONS.get(expeditionContext(),id);
    if(!returnRecord||preview.dungeonSignature!==globalThis.ECHO_EXPEDITIONS.returnReviewSignature(expeditionContext(),returnRecord))throw Error('Dungeon rooms, routes or return conditions changed. Preview the return again.');
    await captureRestorePoint('Before returning to saved expedition','automatic');
    if(preview.campaign!==activeCampaignId||preview.sourceSession!==activeSessionId)throw Error('The campaign changed. Preview again.');
    await saveLocal();await saveQueue;
    const M=globalThis.ECHO_EXPEDITIONS,record=M.get(expeditionContext(),id);if(!record)throw Error('This expedition record changed. Preview again.');
    const target=await expeditionTarget(record),r=M.get(expeditionContext(),id);if(!r)throw Error('This expedition record changed. Preview again.');
    if(preview.campaign!==activeCampaignId||preview.sourceSession!==activeSessionId)throw Error('The campaign changed. Preview again.');
    if(preview.dungeonSignature!==M.returnReviewSignature(expeditionContext(),r))throw Error('Dungeon rooms, routes or return conditions changed. Preview the return again.');
    const merged=globalThis.ECHO_EXPEDITION_RESUME.applyMerge(state,target,preview.review,expeditionReturnRecord(r));
    // Commit against the destination's prior native state. A recovery point also retains both sessions.
    state=normalize(merged);activeSessionId=r.sessionId;campaignIndex.active=activeSessionId;
    lastCommittedSnapshot=gameSnapshot(target);r.phase='active';M.log(expeditionContext(),r,'return','Returned to the saved dungeon with current PC resources. '+preview.review.awayMinutes+' recorded minutes away.');
    selectedEncounter=sessionEncounters()[0]?.id||'all';selectedTokenId=null;editingSceneId=null;editingBeatId=null;mapPreview=null;priorScene=state.scene;previewSceneId=state.scene;
    resetBuilderForms();populateHandoutFields();commit('Returned to saved expedition with current party');await saveCampaignIndex();
  }

  function ensureDowntimeTown(id,name) {
    const M=globalThis.ECHO_SETTLEMENTS,d=M.data(campaignIndex.tableExtras);if(!d.towns.some(t=>t.id===id))d.towns.push({id,name,redbrands:'unknown',families:'unknown',mine:'unknown',notes:'',since:d.minutes,sinceId:'',returned:0,departed:false});
  }
  function advanceDowntimeBlock(minutes,expected) {
    if(state.turn.order.length)throw Error('End combat before advancing downtime.');
    const ledger=globalThis.ECHO_SETTLEMENTS.data(campaignIndex.tableExtras);
    if(expected!==undefined&&ledger.minutes!==expected)throw Error('Time changed after preview. Review the elapsed block again.');
    if(!Number.isSafeInteger(minutes)||minutes<1||minutes>43200)throw Error('Choose 1–43,200 whole minutes.');
    state.map.clock.minutes+=minutes;for(const timer of state.map.clock.timers)timer.remaining=Math.max(0,timer.remaining-minutes);
    globalThis.ECHO_TABLE?.advanceMinutes(minutes);commit('Advanced reviewed group downtime');void saveCampaignIndex();
  }

  function saveStory(label) {
    campaignIndex.story.commandRevision = globalThis.ECHO_COMMANDS.revision(campaignIndex.story) + 1;
    globalThis.ECHO_SETTLEMENTS_UI?.refresh();
    if(globalThis.ECHO_SETTLEMENTS&&$('quick-settlements')){const count=globalThis.ECHO_SETTLEMENTS.due(globalThis.ECHO_SETTLEMENTS.data(campaignIndex.tableExtras)).length;$('quick-settlements').textContent=`♜ Towns${count?' ('+count+' due)':''}`;}
    $('runbook-content').dataset.current = '';
    renderRunbook();
    renderNextUpStrip();
    void saveCampaignIndex();
    sendToPlayer();
    renderStage('dm');
    globalThis.ECHO_TABLE?.render();
    globalThis.ECHO_PLAYER_TOOLS_UI?.render();
    globalThis.ECHO_PHONE?.sync();
    globalThis.ECHO_GUIDED?.render(); globalThis.ECHO_COCKPIT?.refresh(); globalThis.ECHO_SESSION_FLOW_UI?.refresh();
  }

  function enemyVisibleByLight(t) {
    const view=dungeonSight();if(view.enabled&&t.scene===state.scene)return view.visible(t);
    const scene = presentedMapScene(t.scene);
    if (scene.light !== 'dark') return true;
    const blocked = (from, to) => globalThis.ECHO_MAP_DATA.blocked(from, to, scene.lines || []);
    const within = (from, radius) => Math.hypot(t.x - from.x, (t.y - from.y) * 2 / 3) <= radius && !blocked(from, t);
    if ((scene.lights || []).some(light => light.enabled && within(light, light.radius))) return true;
    if (scene.vision === 'darkvision') {
      const radius = 60 / ((getScene(t.scene)?.gridColumns || MAP_SQUARES_ACROSS) * 5) * 100;
      return state.tokens.some(hero => hero.team === 'pc' && hero.placed && hero.scene === t.scene && within(hero, radius));
    }
    return false;
  }

  function rollDie(sides) {
    const source = globalThis.crypto;
    if (source?.getRandomValues) {
      const limit = 0x100000000 - (0x100000000 % sides);
      const values = new Uint32Array(1);
      do { source.getRandomValues(values); } while (values[0] >= limit);
      return (values[0] % sides) + 1;
    }
    return Math.floor(Math.random() * sides) + 1;
  }

  function recordDiceRoll(label, count, sides, modifier = 0) {
    const parts = Array.from({ length: count }, () => rollDie(sides));
    const notation = `${count}d${sides}${modifier > 0 ? `+${modifier}` : modifier < 0 ? modifier : ''}`;
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label: label || 'Dice roll', notation, parts, total: parts.reduce((a, b) => a + b, modifier),
      kind: 'digital', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    state.rolls.unshift(entry);
    state.rolls = state.rolls.slice(0, 50);
    if (state.publicRollId && !state.rolls.some(roll => roll.id === state.publicRollId)) state.publicRollId = null;
    return entry;
  }

  function recordManualRoll(label, total) {
    const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      label: label || 'Physical dice', notation: 'manual', parts: [], total,
      kind: 'manual', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    state.rolls.unshift(entry);
    state.rolls = state.rolls.slice(0, 50);
    if (state.publicRollId && !state.rolls.some(roll => roll.id === state.publicRollId)) state.publicRollId = null;
    return entry;
  }

  function rollInitiative(t) {
    if (t.initBonus === null) { toast(`Set ${t.name}’s initiative bonus first.`); return; }
    const entry = recordDiceRoll(`${t.name} initiative`, 1, 20, t.initBonus);
    t.initiative = entry.total;
    commit();
  }

  function aftermathEncounter() {
    const encounters=sessionEncounters(),ids=state.turn.order.map(getToken).filter(t=>t?.encounter).map(t=>t.encounter);
    return ids.includes(selectedEncounter)?selectedEncounter:ids.find(id=>encounters.some(e=>e.id===id))||selectedEncounter||encounters[0]?.id||'';
  }
  function ensureAftermath(id) {
    if(!sessionEncounters().some(e=>e.id===id))throw Error('Choose an available encounter.');
    const p=state.combat.plans[id] ||= globalThis.ECHO_COMBAT_DATA.normalizePlan(null,id);
    const a=globalThis.ECHO_COMBAT_AFTERMATH.start(p,{sessionId:activeSessionId,encounterId:id,sceneId:state.turn.scene||state.scene,beatId:state.runbook},!!p.aftermath&&(p.aftermath.sessionId!==activeSessionId||p.aftermath.encounterId!==id));if(state.turn.order.length&&!state.combat.aftermathRunKey)state.combat.aftermathRunKey=a.runKey;return a;
  }
  function openCombatAftermath(id=aftermathEncounter()) {globalThis.ECHO_COMBAT_UI.open('wrap',id);}
  function reviewCombatAftermath(id) {
    const a=ensureAftermath(id),p=state.combat.plans[id],encounter=sessionEncounters().find(e=>e.id===id);
    a.step=3;commit('Saved aftermath review position');
    const A=globalThis.ECHO_COMBAT_AFTERMATH,values=A.values(p,{name:encounter.name,sessionName:campaignIndex.sessions.find(s=>s.id===activeSessionId)?.name||'Session'}),old=A.record(campaignContinuity(),a.runKey),pending=A.draft(campaignContinuity(),a.runKey);
    const nav=globalThis.ECHO_SESSION_MAP?.selection();if(nav?.markerId&&nav.beatId===a.beatId)values.markers=[{scene:nav.board,point:nav.markerId,reveal:false}];
    const beat=sessionRunbook().find(b=>b.id===a.beatId);if(beat)values.sceneGuide=globalThis.ECHO_ENCOUNTER_FLOW?.reviewContext(activeCampaignId+'/'+activeSessionId,beat);
    globalThis.ECHO_STORY_UI.outcome(values);
    if(old&&!pending&&a.reviewedNotes&&a.reviewedNotes!==A.notesSignature(p)){const draft=A.draft(campaignContinuity(),a.runKey);draft.event.detail=values.detail;draft.event.combatAftermath=values.combatAftermath;saveStory('Prepared latest aftermath notes as a correction');globalThis.ECHO_STORY_UI.render();}
  }
  function finishCombatAftermath(id) {
    const a=ensureAftermath(id),e=globalThis.ECHO_COMBAT_AFTERMATH.approved(campaignContinuity(),a.runKey);
    if(!e)throw Error('Apply the reviewed aftermath before finishing.');
    if(a.reviewedNotes&&a.reviewedNotes!==globalThis.ECHO_COMBAT_AFTERMATH.notesSignature(state.combat.plans[id]))throw Error('Private aftermath notes changed. Review their correction before finishing.');
    if(a.sessionId!==activeSessionId||(state.turn.order.length&&(state.turn.scene!==a.sceneId||state.combat.aftermathRunKey!==a.runKey)))throw Error('The active fight changed. Reopen its aftermath.');
    if(state.combatPlus?.pauses?.some(p=>p.status==='open'&&p.scene===a.sceneId))throw Error('Resolve the current reaction before ending initiative.');
    if(['retreat','escape','unresolved'].includes(e.combatAftermath.ending)&&state.turn.order.length)a.pausedTurn=structuredClone(state.turn);
    if(a.finished&&!state.turn.order.length){globalThis.ECHO_SESSION_MAP?.back();return;}
    a.finished=true;a.step=4;
    state.turn={scene:'',round:0,order:[],index:0};state.combatRun.initiativePrompt.open=false;
    // Outstanding reviews, queues, effects and phone requests remain available.
    commit('Finished reviewed combat aftermath; pending items retained');
    globalThis.ECHO_SESSION_MAP?.back();
  }
  function resumeCombatAftermath(id) {
    const a=ensureAftermath(id);if(!a.pausedTurn)throw Error('This aftermath has no paused turn order.');
    if(state.turn.order.length)throw Error('Finish or pause the active fight before resuming another.');if(state.scene!==a.pausedTurn.scene)throw Error('Preview and explicitly show the saved battlefield before resuming this fight.');
    state.turn=structuredClone(a.pausedTurn);state.combat.aftermathRunKey=a.runKey;a.pausedTurn=null;a.finished=false;
    commit('Resumed paused combat with saved initiative');globalThis.ECHO_HYBRID_UI.go('combat');
  }

  function buildTurnOrder() {
    if (!currentIsMap()) { toast('Choose a battle map before building turn order.'); return; }
    const missing = state.tokens.filter(t => t.placed && t.scene === state.scene &&
      (t.team !== 'enemy' || t.hp > 0) && t.initiative === null);
    if (missing.length) { toast(`Enter initiative for ${missing.map(t => t.name).slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}.`); return; }
    const combatants = state.tokens.filter(t => t.placed && t.scene === state.scene &&
      t.initiative !== null && (t.team !== 'enemy' || t.hp > 0));
    if (!combatants.length) { toast('Place combatants and enter or roll their initiative first.'); return; }
    const startingNewFight=!state.turn.order.length||state.turn.scene!==state.scene;
    if (!state.turn.round) void captureRestorePoint('Before combat', 'automatic').catch(() => {});
    combatants.sort((a, b) => b.initiative - a.initiative);
    const activeId = state.turn.order[state.turn.index];
    const order = combatants.map(t => t.id);
    state.turn = { scene: state.scene,
      round: state.turn.scene === state.scene && state.turn.round > 0 ? state.turn.round : 1,
      order, index: Math.max(0, order.indexOf(activeId)) };
    state.combatRun.initiativePrompt.open = false;
    if(startingNewFight){const id=aftermathEncounter();if(id){const p=state.combat.plans[id] ||= globalThis.ECHO_COMBAT_DATA.normalizePlan(null,id);globalThis.ECHO_COMBAT_AFTERMATH.start(p,{sessionId:activeSessionId,encounterId:id,sceneId:state.scene,beatId:state.runbook},true);state.combat.aftermathRunKey=p.aftermath.runKey;}}
    if (!activeId) processTurnPoint(order[0], 'start');
    commit();
    if (combatants.some((t, index) => index && t.initiative === combatants[index - 1].initiative))
      toast('Initiative tie: use the arrows in the DM turn bar to set the order the table chooses.');
  }

  function processTurnPoint(actorId, point) {
    const actor = getToken(actorId);
    if (!actor || !state.combat) return;
    globalThis.ECHO_COMBAT_PLUS?.turnPoint(state,actorId,point);
    const record = state.combat.tokens[actorId];
    if (point === 'start' && record) {
      record.reactionUsed = false;
      if (record.ready) { record.ready = ''; toast(`${actor.name}'s readied action has expired. Check the table ruling.`); }
    }
    if (point === 'end' && state.turn.round === 1 && record?.surprised) {
      record.surprised = false;
      actor.conditions = actor.conditions.filter(value => value !== 'Surprised');
    }
    const due = [];
    for (const effect of state.combat.effects) if (effect.triggerActor === actorId && effect.triggerPoint === point) {
      if (effect.remaining > 0) effect.remaining--;
      if (effect.remaining === 0 && (!effect.fired || effect.repeatSave)) {
        effect.fired = true; effect.due = true; due.push(effect.name);
      }
    }
    if (due.length) toast(`${actor.name}: review ${due.join(', ')} (${point} of turn).`);
  }

  function advanceTurn(direction, skipReview = false) {
    if(direction>0&&!skipReview&&globalThis.ECHO_GUIDED?.beforeAdvance())return;
    if (state.combatPlus?.pauses.some(p=>p.scene===state.scene&&p.status==='open')) {toast('Combat is paused for reactions. Resolve the reaction window first.');globalThis.ECHO_COMBAT_PLUS_UI.open('damage');return;}
    const order = state.turn.order;
    if (!order.length) { toast('Build turn order first.'); return; }
    let index = state.turn.index;
    let round = state.turn.round;
    const previousRound = round;
    for (let count = 0; count < order.length; count++) {
      index += direction;
      if (index >= order.length) { index = 0; round++; }
      if (index < 0) { index = order.length - 1; round = Math.max(1, round - 1); }
      const t = getToken(order[index]);
      if (t && (t.team !== 'enemy' || t.hp > 0)) {
        if (direction > 0) processTurnPoint(order[state.turn.index], 'end');
        state.turn.index = index;
        state.turn.round = round;
        if (direction > 0 && round > previousRound) {
          const clock = state.map.clock;
          clock.combatSeconds = (clock.combatSeconds || 0) + 6;
          if (clock.combatSeconds >= 60) {
            clock.combatSeconds -= 60;
            clock.minutes += 1;
            for (const timer of clock.timers) timer.remaining = Math.max(0, timer.remaining - 1);
            if (clock.timers.some(timer => timer.remaining === 0)) toast('A spell or exploration timer is due.');
          }
        }
        if (direction > 0) processTurnPoint(t.id, 'start');
        commit();
        return;
      }
    }
  }

  function rollPlacedEnemies() {
    if (!currentIsMap()) { toast('Choose a battle map first.'); return; }
    const enemies = state.tokens.filter(t => t.team === 'enemy' && t.placed &&
      t.scene === state.scene && t.hp > 0);
    if (!enemies.length) { toast('Place the enemies for this battle first.'); return; }
    for (const t of enemies) t.initiative = recordDiceRoll(`${t.name} initiative`, 1, 20, t.initBonus ?? 0).total;
    commit();
    toast(`Rolled initiative for ${enemies.length} placed ${enemies.length === 1 ? 'enemy' : 'enemies'}.`);
  }

  function toggleInitiativePrompt() {
    if (!currentIsMap()) { toast('Choose a battle map first.'); return; }
    const heroes = state.tokens.filter(t => t.team === 'pc' && t.placed && t.scene === state.scene);
    if (!heroes.length) { toast('Place at least one hero on this map first.'); return; }
    const prompt = state.combatRun.initiativePrompt;
    const opening = !prompt.open || prompt.scene !== state.scene;
    prompt.open = opening; prompt.scene = state.scene;
    commit(opening ? 'Asked player phones for initiative' : 'Closed phone initiative');
    toast(opening ? 'Players can roll initiative or enter a physical-die total on their phones.' : 'Phone initiative closed.');
  }

  function sceneImage(gridVisible = true) {
    return resolveImage(getScene(state.scene)?.image);
  }

  function iconMarkup(type, label = '') {
    if (type === 'goblin') return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#456a3d"/><path d="M19 21 3 15l8 18M45 21l16-6-8 18" fill="#77905a" stroke="#253c2b" stroke-width="2"/><ellipse cx="32" cy="34" rx="19" ry="21" fill="#7b9b57"/><path d="M19 32q5-5 10 0M35 32q5-5 10 0" stroke="#202b25" stroke-width="3" fill="none"/><circle cx="24" cy="33" r="2"/><circle cx="40" cy="33" r="2"/><path d="m27 44 5 4 5-4" fill="none" stroke="#282323" stroke-width="2"/><path d="m26 44 2 5 2-4m6 0 2 4 2-5" fill="#fff2c8"/></svg>';
    if (type === 'wolf') return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#3b4650"/><path d="M14 28 12 6l17 14M50 28l2-22-17 14" fill="#8b969d" stroke="#2a3036" stroke-width="2"/><path d="M11 29q21-17 42 0l-5 23H16Z" fill="#9fa7aa"/><path d="M21 35q4-3 8 0m6 0q4-3 8 0" stroke="#1d2730" stroke-width="3"/><path d="m22 42 10-6 10 6-10 13Z" fill="#d9d8ce"/><path d="m27 43 5 5 5-5Z" fill="#222"/></svg>';
    if (type === 'bugbear') return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#4d302a"/><circle cx="13" cy="24" r="9" fill="#896249"/><circle cx="51" cy="24" r="9" fill="#896249"/><path d="M12 30q1-20 20-21 19 1 20 21l-4 23H16Z" fill="#9a6847"/><path d="M19 29q6-5 12 0m2 0q6-5 12 0" stroke="#2f211e" stroke-width="4"/><circle cx="25" cy="31" r="2"/><circle cx="39" cy="31" r="2"/><path d="M21 44q11 8 22 0" stroke="#35231d" stroke-width="3" fill="none"/><path d="m23 43 3 9 3-6m6 0 3 6 3-9" fill="#eee3cc"/></svg>';
    if (type === 'paladin') return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#775229"/><path d="M12 17q20-11 40 0v24Q43 54 32 59 20 54 12 41Z" fill="#d4a34e" stroke="#fff0bc" stroke-width="2"/><path d="M32 18v31M20 33h24" stroke="#fff4d1" stroke-width="5"/></svg>';
    if (type === 'sildar') return '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#3b6079"/><path d="M14 15q18-7 36 0v22Q43 51 32 57 20 51 14 37Z" fill="#86b6c8" stroke="#ecf5e9" stroke-width="2"/><path d="M23 24q9-6 18 0M21 36q11 7 22 0" fill="none" stroke="#24465c" stroke-width="4"/></svg>';
    const colors = { 'hero-trista': '#9270a1', 'hero-donavan': '#537fa3', 'hero-ringgo': '#8a568c', 'hero-pebble': '#a78257', 'hero-aldric': '#7b7b9d', hero: '#537fa3', 'redbrand-ruffian': '#843b39' };
    const letters = { 'hero-trista': 'T', 'hero-donavan': 'D', 'hero-ringgo': 'R', 'hero-pebble': 'P', 'hero-aldric': 'A' };
    const safeLetter = String(letters[type] || label || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2) || '?';
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="${colors[type] || '#686568'}"/><circle cx="32" cy="32" r="25" fill="none" stroke="#f6e2aa" stroke-width="2"/><text x="32" y="44" text-anchor="middle" font-family="Georgia,serif" font-size="28" font-weight="bold" fill="#fff4df">${safeLetter}</text></svg>`;
  }

  function mapPoint(event, stage) {
    const box = stage.getBoundingClientRect();
    const view = mapSceneData().view || { zoom: 1, panX: 0, panY: 0 };
    return { x: pointValue(50 + ((event.clientX - box.left) / box.width * 100 - 50 - view.panX) / view.zoom),
      y: pointValue(50 + ((event.clientY - box.top) / box.height * 100 - 50 - view.panY) / view.zoom) };
  }

  function createTokenElement(t, stage, mode) {
    const el = document.createElement('div');
    const due = mode !== 'player' ? state.combat?.effects?.some(e => e.tokenId === t.id && e.due) : t.statusDue;
    const concentrating = mode !== 'player' ? !!state.combat?.tokens?.[t.id]?.concentration : t.concentrating;
    const activeTurn = mode === 'player'
      ? state.turn?.round > 0 && state.turn.activeId === t.id
      : state.turn?.round > 0 && state.turn.scene === state.scene && state.turn.order[state.turn.index] === t.id;
    el.className = `token ${t.team}${mode === 'dm' && !t.visible ? ' hidden-enemy' : ''}${t.hp === 0 || t.defeated ? ' defeated' : ''}${due ? ' status-due' : ''}${concentrating ? ' status-concentrating' : ''}${activeTurn ? ' active-turn' : ''}`;
    el.dataset.tokenId=t.id;
    el.style.left = `${t.x}%`;
    el.style.top = `${t.y}%`;
    const meta = state.map?.tokenMeta?.[t.id] || {};
    const size = { tiny: .55, small: .8, medium: 1, large: 1.5, huge: 2, gargantuan: 2.5 }[meta.size] || 1;
    el.style.setProperty('--token-scale', String(size));
    if(mode==='dm'&&globalThis.ECHO_COMBAT_RUN?.targetId?.()===t.id){el.classList.add('combat-targeted');const mark=document.createElement('span');mark.className='token-target-flag';mark.textContent='◎ TARGET';el.append(mark);}
    if(mode==='dm'&&selectedTokenId===t.id){el.classList.add('token-selected');const mark=document.createElement('span');mark.className='token-selected-flag';mark.textContent='□ SELECTED';el.append(mark);}
    if (mode === 'dm') el.dataset.hp = t.maxHp === 0 ? '?' : `${t.hp}${t.tempHp ? `+${t.tempHp}` : ''}`;
    el.title = t.name;
    if(mode==='dm'){el.tabIndex=0;el.setAttribute('aria-label',t.name+' · Enter for card; arrow keys move 1% of map; Shift+F10 for quick actions');el.addEventListener('contextmenu',event=>{event.preventDefault();event.stopPropagation();globalThis.ECHO_DM_DESK_UI?.openToken(t.id);});el.addEventListener('keydown',event=>{if(event.key==='ContextMenu'||event.shiftKey&&event.key==='F10'){event.preventDefault();globalThis.ECHO_DM_DESK_UI?.openToken(t.id);}else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();event.stopPropagation();const current=getToken(t.id);if(!current||!currentIsMap())return;const delta={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]}[event.key];placeTokensDirect(t.id,{x:Math.max(0,Math.min(100,current.x+delta[0])),y:Math.max(0,Math.min(100,current.y+delta[1]))});document.querySelector('#dm-stage .token[data-token-id="'+t.id+'"]')?.focus();}else if(event.key==='Enter'){event.preventDefault();openCombatCard(t.id);}});}
    const portrait = mode === 'dm' ? resolveImage(meta.portrait || '') : safeImageSource(meta.portrait || '');
    if (portrait) { const image = document.createElement('img'); image.className = 'token-portrait'; image.src = portrait; image.alt = ''; el.appendChild(image); }
    else el.innerHTML = iconMarkup(t.type, t.label);
    if (activeTurn) { const flag = document.createElement('span'); flag.className = 'token-turn-flag'; flag.textContent = '▼ TURN'; flag.setAttribute('aria-label', `${t.name}'s turn`); el.appendChild(flag); }
    if (meta.facing) { const facing = document.createElement('span'); facing.className = 'token-facing'; facing.style.rotate = `${meta.facing}deg`; el.appendChild(facing); }
    if (meta.elevation) { const badge = document.createElement('span'); badge.className = 'token-elevation'; badge.textContent = `${meta.elevation > 0 ? '+' : ''}${meta.elevation} ft`; el.appendChild(badge); }
    const label = document.createElement('span');
    label.className = 'token-label';
    const orientation=mode==='player'?state.atmosphere:globalThis.ECHO_ATMOSPHERE?atmosphereData():null;
    if(mode!=='dm'&&orientation)label.style.rotate=(orientation.labelAngles?.[t.id]??orientation.labelAngle??0)+'deg';
    label.textContent = t.label;
    el.appendChild(label);
    if (t.conditions?.length) {
      const marker = document.createElement('span');
      marker.className = 'condition-marker';
      marker.textContent = t.conditions.length === 1 ? '!' : String(t.conditions.length);
      marker.title = t.conditions.join(', ');
      el.appendChild(marker);
    }
    if (mode === 'dm' || mode === 'player' && t.team === 'pc' && state.map?.playerInput !== false) {
      el.addEventListener('pointerdown', event => beginTokenDrag(event, el, t, stage, mode));
    } else el.style.cursor = 'default';
    return el;
  }

  function placeTokensDirect(actorId, destination) {
    const plan = globalThis.ECHO_COMMANDS.prepare(state, { type: 'move-token', actorId,
      x: destination.x, y: destination.y,
      groupIds: state.map?.group?.includes(actorId) ? state.map.group : [actorId],
      columns: getScene(state.scene)?.gridColumns || MAP_SQUARES_ACROSS,
      expectedRevision: globalThis.ECHO_COMMANDS.revision(state) }, { pointValue });
    if (!plan.changed) { renderStage('dm'); return; }
    state = globalThis.ECHO_COMMANDS.apply(state, plan);
    commit(plan.label);
    if (plan.effects.length > 1) toast(plan.effects.slice(1).join(' '));
  }

  function beginTokenDrag(event, el, t, stage, mode) {
    if (event.button !== 0) return;
    const tool = activeMapTool;
    if (mode === 'dm' && ['ruler','circle','cone','square','line'].includes(tool)) { beginMapTool(event, stage); return; }
    event.preventDefault();
    event.stopPropagation();
    el.setPointerCapture(event.pointerId);
    const start = { x: event.clientX, y: event.clientY };
    let moved = false;
    const move = e => {
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 4 && !moved) return;
      moved = true;
      const p = mapPoint(e, stage);
      el.style.left = `${p.x}%`;
      el.style.top = `${p.y}%`;
    };
    const finish = e => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', finish);
      el.removeEventListener('pointercancel', finish);
      if(e.type==='pointercancel'){renderStage(mode);return;}
      if (!moved) {
        if (mode === 'dm' && tool === 'target') {
          if (globalThis.ECHO_PHONE_ACTIONS_UI?.active?.()) globalThis.ECHO_PHONE_ACTIONS_UI.addTarget(t.id);
          else {
            globalThis.ECHO_COMBAT_RUN?.target(t.id);
            if (globalThis.ECHO_HYBRID_UI?.current() === 'combat') globalThis.ECHO_HYBRID_UI.closeDrawer();
            else { contextTab = 'turn'; renderContextSidebar(); }
          }
          renderStage('dm');
        } else if (mode === 'dm') openCombatCard(t.id);
        return;
      }
      const p = mapPoint(e, stage);
      if (mode === 'dm') {
        const live = getToken(t.id);
        if (live) {
          try { placeTokensDirect(live.id, p); }
          catch (error) { toast(error.message); renderStage('dm'); }
        }
      } else {
        t.x = p.x; t.y = p.y;
        postToDM({ app: APP, kind: 'move-token', id: t.id, x: p.x, y: p.y });
      }
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', finish);
    el.addEventListener('pointercancel', finish);
  }

  function revealTile(key, reveal = true, finishRender = true) {
    if (!currentTile(key)) return;
    const set = new Set(fogForScene());
    if (reveal) set.add(key); else set.delete(key);
    if(globalThis.ECHO_DUNGEON&&!mapSceneData().floorFog)globalThis.ECHO_DUNGEON.manualFog(dungeonData(),state.scene,[key],reveal,mapSceneData().fineFog);
    setFogForScene(state.scene, [...set]);
    state.requests = state.requests.filter(request => request !== key);
    if (finishRender && !fogPainting) { commit(); return; }
    if (finishRender) renderDM();
    if (!fogSyncQueued) {
      fogSyncQueued = true;
      requestAnimationFrame(() => { fogSyncQueued = false; sendToPlayer(); });
    }
  }

  function annotationSvgElement(tag, attributes) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [name, value] of Object.entries(attributes)) el.setAttribute(name, String(value));
    return el;
  }

  function drawAnnotation(svg, mark, preview = false) {
    const x1 = mark.x1, y1 = mark.y1 * 2 / 3, x2 = mark.x2, y2 = mark.y2 * 2 / 3;
    const dx = x2 - x1, dy = y2 - y1;
    const distance = Math.hypot(dx, dy);
    const common = { fill: mark.kind === 'ruler' ? 'none' : '#efa35b44',
      stroke: preview ? '#fff6d3' : '#ffc16f', 'stroke-width': .5 };
    let shape;
    if (mark.kind === 'circle') shape = annotationSvgElement('circle',
      { cx: x1, cy: y1, r: distance, ...common });
    else if (mark.kind === 'square') shape = annotationSvgElement('rect',
      { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(dx), height: Math.abs(dy), ...common });
    else if (mark.kind === 'cone') {
      const half = distance / 2;
      const px = distance ? -dy / distance * half : 0;
      const py = distance ? dx / distance * half : 0;
      shape = annotationSvgElement('polygon',
        { points: `${x1},${y1} ${x2 + px},${y2 + py} ${x2 - px},${y2 - py}`, ...common });
    } else shape = annotationSvgElement('line',
      { x1, y1, x2, y2, ...common,
        'stroke-width': mark.kind === 'line' ? 2.4 : .45,
        'stroke-dasharray': mark.kind === 'ruler' ? '1.5 1' : 'none' });
    svg.appendChild(shape);
    if (mark.kind === 'ruler') {
      const columns = getScene(state.scene)?.gridColumns || MAP_SQUARES_ACROSS;
      const feet = Math.round(distance * columns * 5 / 100 / 5) * 5;
      const text = annotationSvgElement('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 1.5,
        'text-anchor': 'middle', class: 'ruler-label' });
      text.textContent = `≈ ${feet} ft`;
      svg.appendChild(text);
    }
  }

  function renderMapOverlays(mode) {
    const stage = $(mode === 'dm' ? 'dm-stage' : 'player-stage');
    const old = stage.querySelector('.map-overlay');
    old?.remove();
    if (!currentIsMap()) return;
    const svg = annotationSvgElement('svg', { class: 'map-overlay', viewBox: '0 0 100 66.666667',
      preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    const mapScene = mapSceneData();
    const visibility = mode === 'dm' && !mapPreviewMode ? mapScene.dmLayers : mapScene.playerLayers;
    for (const mark of (state.annotations || []).filter(a => a.scene === state.scene)) {
      const template = ['circle', 'cone', 'square'].includes(mark.kind);
      if ((template ? visibility?.templates : visibility?.annotations) !== false) drawAnnotation(svg, mark);
    }
    if (mode === 'dm' && !mapPreviewMode && visibility?.markers !== false) for (const line of mapScene.lines || []) {
      svg.appendChild(annotationSvgElement('line', { x1: line.x1, y1: line.y1 * 2 / 3,
        x2: line.x2, y2: line.y2 * 2 / 3, class: `map-barrier ${line.kind}${line.open ? ' open' : ''}` }));
    }
    if(mode==='dm'&&!mapPreviewMode)for(const area of (state.combatPlus?.areas||[]).filter(a=>a.active&&a.scene===state.scene))drawAnnotation(svg,area.shape);
    if (mode === 'dm' && mapPreview?.scene === state.scene) drawAnnotation(svg, mapPreview, true);
    const ping = state.ping;
    if (ping && ping.scene === state.scene && (!ping.created || Date.now() - ping.created < 7000)) {
      svg.appendChild(annotationSvgElement('circle', { cx: ping.x, cy: ping.y * 2 / 3, r: 2.4,
        class: 'map-ping' }));
    }
    stage.appendChild(svg);
    applyMapView(svg);
  }

  let mapPreviewMode = false;
  let lastMapRenderMs = 0;
  function applyMapView(element) {
    const view = mapSceneData().view || { zoom: 1, panX: 0, panY: 0 };
    element.style.transformOrigin = 'center center';
    element.style.transform = `translate(${view.panX}%, ${view.panY}%) scale(${view.zoom})`;
  }

  function setMapTool(tool) {
    if (!MAP_TOOLS.has(tool)) return;
    activeMapTool = tool;
    for (const button of document.querySelectorAll('[data-map-tool]'))
      button.classList.toggle('active', button.dataset.mapTool === tool);
    $('map-tool-hint').textContent = tool === 'move' ? TOWN_MAP_IDS.includes(state.scene) ? 'Click stars to inspect locations; drag any token to move it.' : 'Drag any token to move it immediately. Click shaded squares to reveal.'
      : tool==='target'?'Click a token to target it; drag it to move it.':tool==='ruler'?'Drag anywhere, including a token, to measure. Choose Move to drag tokens.':tool === 'ping' ? 'Click the map to point something out on the TV.'
        : ['point', 'light', 'link'].includes(tool) ? `Click the map to place a ${tool}.`
          : tool === 'pan' ? 'Drag the map to pan.' : `Drag on the map to draw a ${tool}.`;
  }

  function beginMapTool(event, stage) {
    if(atmospherePlacement&&event.button===0&&!mapPreviewMode){event.preventDefault();event.stopPropagation();const chosen=atmospherePlacement;atmospherePlacement=null;const a=globalThis.ECHO_ATMOSPHERE.scene(atmosphereData(),state.scene).anchors.find(a=>a.id===chosen.id);if(a&&chosen.scene===state.scene){const p=mapPoint(event,stage);a.x=p.x;a.y=p.y;void saveCampaignIndex();commit('Placed scene feature');}return;}

    if(dungeonPlacement&&event.button===0&&!mapPreviewMode){event.preventDefault();event.stopPropagation();const chosen=dungeonPlacement;dungeonPlacement=null;atmospherePlacement=null;
      const o=globalThis.ECHO_DUNGEON.scene(dungeonData(),state.scene).objects.find(o=>o.id===chosen.id);
      if(o&&chosen.scene===state.scene){const p=mapPoint(event,stage);o.x=p.x;o.y=p.y;void saveCampaignIndex();commit('Placed dungeon object');}return;}

    if (activeMapTool === 'move' || !currentIsMap() || event.button !== 0) return;
    if (mapPreviewMode) return;
    event.preventDefault();
    event.stopPropagation();
    const start = mapPoint(event, stage);
    if(activeMapTool==='target')return;
    if (activeMapTool === 'point' || activeMapTool === 'light' || activeMapTool === 'link') {
      globalThis.ECHO_MAP_UI?.place(activeMapTool, start);
      return;
    }
    if (activeMapTool === 'pan') {
      const view = mapSceneData().view;
      const startView = { ...view }, box = stage.getBoundingClientRect();
      const move = e => { view.panX = Math.max(-550, Math.min(550, startView.panX + (e.clientX - event.clientX) / box.width * 100));
        view.panY = Math.max(-550, Math.min(550, startView.panY + (e.clientY - event.clientY) / box.height * 100));
        for (const child of stage.children) applyMapView(child); };
      const finish = () => { stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerup', finish); commit('Panned map'); };
      stage.addEventListener('pointermove', move); stage.addEventListener('pointerup', finish); return;
    }
    if (['wall', 'door', 'secret'].includes(activeMapTool)) {
      const move = e => { const p = mapPoint(e, stage); mapPreview = { scene: state.scene, kind: 'line', x1: start.x, y1: start.y, x2: p.x, y2: p.y }; renderMapOverlays('dm'); };
      const finish = e => { stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerup', finish);
        const p = mapPoint(e, stage); mapPreview = null;
        if (Math.hypot(p.x - start.x, p.y - start.y) > 1) {
          mapSceneData().lines.push({ id: `barrier-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, kind: activeMapTool, x1: start.x, y1: start.y, x2: p.x, y2: p.y, open: false, discovered: false });
          commit(`Added ${activeMapTool}`);
        } else renderMapOverlays('dm'); };
      stage.addEventListener('pointermove', move); stage.addEventListener('pointerup', finish); return;
    }
    if (activeMapTool === 'ping') {
      const id = `${Date.now()}-${Math.random()}`;
      state.ping = { id, scene: state.scene, x: start.x, y: start.y, created: Date.now() };
      renderMapOverlays('dm'); sendToPlayer();
      clearTimeout(pingTimer);
      pingTimer = setTimeout(() => {
        if (state.ping?.id !== id) return;
        state.ping = null; renderMapOverlays('dm'); sendToPlayer();
      }, 6500);
      return;
    }
    stage.setPointerCapture(event.pointerId);
    const kind = activeMapTool;
    mapPreview = { id: 'preview', scene: state.scene, kind,
      x1: start.x, y1: start.y, x2: start.x, y2: start.y };
    const move = e => {
      if (!mapPreview) return;
      const p = mapPoint(e, stage);
      mapPreview.x2 = p.x; mapPreview.y2 = p.y;
      renderMapOverlays('dm');
    };
    const finish = e => {
      stage.removeEventListener('pointermove', move);
      stage.removeEventListener('pointerup', finish);
      stage.removeEventListener('pointercancel', finish);
      if (!mapPreview) return;
      const p = mapPoint(e, stage);
      mapPreview.x2 = p.x; mapPreview.y2 = p.y;
      if (Math.hypot(mapPreview.x2 - start.x, mapPreview.y2 - start.y) > 1) {
        state.annotations.push({ ...mapPreview, id: `${Date.now()}-${Math.random()}` });
        state.annotations = state.annotations.slice(-80);
        mapPreview = null;
        commit();
      } else { mapPreview = null; renderMapOverlays('dm'); }
    };
    stage.addEventListener('pointermove', move);
    stage.addEventListener('pointerup', finish);
    stage.addEventListener('pointercancel', finish);
  }

  const stageRenderKeys = new WeakMap();
  function renderStage(mode) {
    const started = globalThis.performance?.now?.() || Date.now();
    const stage = $(mode === 'dm' ? 'dm-stage' : 'player-stage');
    const scene = state.scene;
    const currentKey=mode==='player'?JSON.stringify({...state, atmosphere:state.atmosphere?{...state.atmosphere,pulses:(state.atmosphere.pulses||[]).filter(p=>Date.now()-p.at<1600)}:null}):null;
    if(currentKey&&stageRenderKeys.get(stage)===currentKey&&stage.childElementCount)return;
    const retainedImage=stage.querySelector('img.scene-image');
    stageRenderKeys.delete(stage);
    stage.className = `stage ${mapPreviewMode && mode === 'dm' ? 'player' : mode}-view scene-${scene}`;
    stage.replaceChildren();
    stage.onpointerdown = null; stage.ondragover = null; stage.ondrop = null;
    const mapScene = typeof presentedMapScene === 'function' ? presentedMapScene() : mapSceneData();
    const viewingPlayer = mode === 'player' || mapPreviewMode;
    const dungeon=typeof dungeonPublic==='function'?dungeonPublic():state.dungeon;
    const visibility = viewingPlayer ? mapScene.playerLayers : mapScene.dmLayers;
    const sceneData = getScene(scene);
    if (!sceneData || sceneData.kind === 'black') return;
    if (visibility?.map !== false && state.sessionKind === 'session1' && scene === 'interior') {
      const crop = document.createElement('div');
      crop.className = 'interior-crop';
      const image = document.createElement('img');
      image.src = resolveImage(sceneData.image);
      image.alt = 'Cragmaw Hideout interior map';
      image.draggable = false;
      crop.appendChild(image);
      stage.appendChild(crop);
    } else if (visibility?.map !== false && sceneImage(visibility?.grid !== false)) {
      const image = retainedImage?.getAttribute('src')===sceneImage(visibility?.grid !== false)?retainedImage:document.createElement('img');
      image.className = `scene-image${scene === 'cover' ? ' cover' : ''}`;
      image.src = sceneImage(visibility?.grid !== false);
      image.alt = sceneData.title;
      image.draggable = false;
      stage.appendChild(image);
    } else {
      const blank = document.createElement('div');
      blank.className = 'blank-scene';
      blank.textContent = sceneData.title;
      stage.appendChild(blank);
    }
    if(mode==='dm'&&visibility?.map!==false){const proposal=globalThis.ECHO_ATLAS?.proposal(sceneData.image);for(const overlay of proposal?.revealOverlays||[]){if(!(mapScene.floorReveals||[]).includes(overlay.id))continue;const image=document.createElement('img');image.className='scene-image';image.style.pointerEvents='none';image.src=overlay.image;image.alt='Reviewed passage geometry';image.draggable=false;stage.appendChild(image);}}
    if (scene === 'region-lmop' && visibility?.map !== false && mapScene.journeyMotion !== false) {
      stage.classList.add('journey-motion');
      // Keep ambient loops at the same phase when a token move or TV sync rebuilds the stage.
      const seconds = Date.now() / 1000;
      for (const [name, duration] of [['water', 18], ['mist', 34], ['glow', 6]])
        stage.style.setProperty(`--journey-${name}-phase`, `${-(seconds % duration)}s`);
      const ambient = document.createElement('div');
      ambient.className = 'journey-ambient'; ambient.setAttribute('aria-hidden', 'true');
      for (const name of ['coast', 'woodland']) {
        const mask = document.createElement('div'); mask.className = `journey-${name}`;
        mask.appendChild(document.createElement('span')); ambient.appendChild(mask);
      }
      stage.appendChild(ambient);
    }
    // The calibrated floor has 300 columns. At an overview scale their lines
    // obscure the terrain; show the grid once a tactical section is close enough.
    const denseFloor=!!mapScene.floorFog || (getScene(scene)?.gridColumns||0)>=200;
    if (isMapScene() && state.grid && visibility?.grid !== false && (!denseFloor || (mapScene.view?.zoom||1)>=5)) {
      const grid = document.createElement('div');
      grid.className = 'grid-overlay';
      const columns = getScene(scene)?.gridColumns || MAP_SQUARES_ACROSS;
      grid.style.backgroundSize = `${100 / columns}% ${150 / columns}%`;
      if(denseFloor){
        const line=`${Math.max(.12,Math.min(.4,1/(mapScene.view?.zoom||1)))}px`;
        grid.style.backgroundImage=`linear-gradient(to right, rgba(226,210,174,.18) ${line}, transparent ${line}), linear-gradient(to bottom, rgba(226,210,174,.18) ${line}, transparent ${line})`;
      }
      stage.appendChild(grid);
    }
    if ((sceneHasFog() || dungeon?.enabled) && visibility?.fog !== false && mapScene.floorFog) {
      const fog=document.createElement('canvas');fog.className='floor-fog-canvas';fog.style.cssText='position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated';
      globalThis.ECHO_FLOOR_MAPS.paint(fog,fogForScene(),mapScene.floorFog,!viewingPlayer);
      if(mode==='dm'&&!mapPreviewMode)fog.addEventListener('pointerdown',event=>{if(event.button!==0||activeMapTool!=='move'||dungeonPlacement||atmospherePlacement)return;event.preventDefault();event.stopPropagation();fogPainting=true;fogCovering=event.shiftKey;revealTile(tileForPoint({...mapPoint(event,stage),scene}),!fogCovering,false);globalThis.ECHO_FLOOR_MAPS.paint(fog,fogForScene(),mapScene.floorFog,true);});
      stage.appendChild(fog);
    } else if ((sceneHasFog() || dungeon?.enabled) && visibility?.fog !== false) {
      const fog = document.createElement('div');
      fog.className = 'fog-grid';
      const { rows, cols } = tileDimensions();
      fog.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      fog.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
      const visible = new Set(dungeon?.enabled?dungeon.explored:fogForScene());
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const key = `${row},${col}`;
          const tile = document.createElement('div');
          tile.className = `fog-tile${visible.has(key) ? ' revealed' : ''}${mode === 'dm' && !mapPreviewMode && state.requests.includes(key) ? ' requested' : ''}`;
          tile.dataset.key = key;
          if (mode === 'dm' && !mapPreviewMode) tile.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            if (dungeonPlacement || atmospherePlacement) return;
            if (activeMapTool !== 'move') return;
            fogPainting = true;
            fogCovering = event.shiftKey;
            revealTile(key, !fogCovering, true);
            event.preventDefault();
          });
          else if (mode === 'player' && state.map?.playerInput !== false && !visible.has(key)) tile.addEventListener('click', () => {
            const kind = state.playerReveal ? 'reveal-tile' : 'explore-request';
            postToDM({ app: APP, kind, key });
            toast(state.playerReveal ? 'Exploring this area…' : 'Asked the DM to reveal this area.');
          });
          fog.appendChild(tile);
        }
      }
      stage.appendChild(fog);
    }
    if (!isMapScene()) return;
    const layer = document.createElement('div');
    layer.className = 'token-layer';
    const fog = new Set(fogForScene());
    const shown = state.tokens.filter(t => (!viewingPlayer||!dungeon?.enabled||t.team==='pc'||dungeon.current.includes(tileForPoint(t))) && t.placed && t.scene === scene && (!viewingPlayer || t.visible !== false) &&
      (!mapPreviewMode || t.team !== 'enemy' || enemyVisibleByLight(t)) &&
      (!mapPreviewMode || t.team !== 'enemy' || !sceneHasFog() || fog.has(tileForPoint(t))));
    if (visibility?.tokens !== false) for (const t of shown) layer.appendChild(createTokenElement(t, stage, mapPreviewMode ? 'preview' : mode));
    if (visibility?.labels === false) layer.classList.add('no-labels');
    stage.appendChild(layer);
    if (visibility?.markers !== false) {
      const markers = document.createElement('div'); markers.className = 'map-marker-layer';
      const addMarker = (p, kind) => { const button = document.createElement('button'); button.type = 'button';
        button.className = `map-marker ${kind}${mode === 'dm' && (!p.visible || !p.approved) ? ' unrevealed' : ''}`; button.style.left = `${p.x}%`; button.style.top = `${p.y}%`;
        button.textContent = kind === 'point' ? '✦' : kind === 'link' ? '↗' : '☀'; button.title = p.title || kind;
        if (scene === 'region-lmop' && kind === 'point') {
          button.dataset.pointId = p.id;
          const label = document.createElement('span'); label.className = 'region-map-label'; label.textContent = p.title;
          button.appendChild(label);
        }
        button.addEventListener('click', event => { event.stopPropagation();
          if (mode === 'dm') globalThis.ECHO_MAP_UI?.selectMarker(kind, p.id);
          else if (state.map?.playerInput !== false && (kind === 'point' || kind === 'link')) {
            postToDM({ app: APP, kind: `${kind}-request`, id: p.id });
            toast(`Asked the DM about ${p.title || 'this place'}.`);
          }
        }); markers.appendChild(button); };
      // The TV receives only approved public points, without private visibility flags.
      // The DM's player preview still reads full scene data and must filter those flags.
      for (const p of mapScene.points || []) if (mode === 'player' || !viewingPlayer || p.visible && p.approved) addMarker(p, 'point');
      for (const p of mapScene.links || []) if (!viewingPlayer || p.visible) addMarker(p, 'link');
      if (!viewingPlayer) for (const p of mapScene.lights || []) addMarker(p, 'light');
      stage.appendChild(markers);
    }
    if (viewingPlayer && !dungeon?.enabled && mapScene.light !== 'bright') {
      const shade = document.createElement('canvas'); shade.className = 'map-light-shade';
      shade.width = 900; shade.height = 600;
      const context = shade.getContext('2d');
      context.fillStyle = mapScene.light === 'dark' ? 'rgba(2,8,14,.88)' : 'rgba(3,10,16,.48)';
      context.fillRect(0, 0, 900, 600);
      context.globalCompositeOperation = 'destination-out';
      const lights = (mapScene.lights || []).filter(l => l.enabled);
      if (mapScene.vision === 'darkvision') {
        const radius = 60 / ((getScene(scene)?.gridColumns || MAP_SQUARES_ACROSS) * 5) * 100;
        for (const t of shown.filter(t => t.team === 'pc')) lights.push({ x: t.x, y: t.y, radius });
      }
      for (const light of lights) {
        const x = light.x * 9, y = light.y * 6, radius = light.radius * 9;
        const glow = context.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, 'rgba(0,0,0,1)'); glow.addColorStop(.5, 'rgba(0,0,0,.9)'); glow.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = glow; context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      stage.appendChild(shade);
    }
    renderMapOverlays(mode);
    if(globalThis.ECHO_ATMOSPHERE_VIEW){let view=mode==='player'?state.atmosphere:atmospherePublic(publicState().tokens);if(mode==='dm'&&!viewingPlayer&&view)view={...view,anchors:globalThis.ECHO_ATMOSPHERE.scene(atmosphereData(),scene).anchors};globalThis.ECHO_ATMOSPHERE_VIEW.render(stage,view,shown);}
    if(globalThis.ECHO_DUNGEON_VIEW){
      let view=dungeon;
      if(mode==='dm'&&!viewingPlayer&&globalThis.ECHO_DUNGEON){const record=globalThis.ECHO_DUNGEON.scene(dungeonData(),scene);view={...dungeon,enabled:false,objects:record.objects.map(o=>({...o,text:o.text,canSearch:false})),passages:record.passages};}
      if(visibility?.markers===false)view={...view,objects:[],passages:[]};
      if(visibility?.fog===false)view={...view,enabled:false};
      globalThis.ECHO_DUNGEON_VIEW.render(stage,view,mode==='dm'&&!viewingPlayer?o=>globalThis.ECHO_DUNGEON_UI.open(o.id,o.kind):null);
    }
    if (scene === 'region-lmop' && visibility?.markers !== false && globalThis.ECHO_TRAVEL_VIEW) {
      const travel = !IS_PLAYER && globalThis.ECHO_TRAVEL ? globalThis.ECHO_TRAVEL.data(campaignIndex.tableExtras) : null;
      const publicTravel = travel ? globalThis.ECHO_TRAVEL.publicView(travel) : state.journey;
      const shownTravel = travel && !viewingPlayer ? {...publicTravel,position:{...travel.position,title:globalThis.ECHO_TRAVEL.place(travel,travel.position.placeId)?.title||'On the road'}} : publicTravel;
      globalThis.ECHO_TRAVEL_VIEW.render(stage,shownTravel, mode==='dm'&&!viewingPlayer ? position=>{
        try { const nearby=travel.places.filter(globalThis.ECHO_TRAVEL.known).map(p=>({p,d:Math.hypot(p.x-position.x,p.y-position.y)})).sort((a,b)=>a.d-b.d)[0];globalThis.ECHO_TRAVEL.move(travel,position.x,position.y,nearby?.d<2.5?nearby.p.id:'');void saveCampaignIndex();commit('Moved party travel marker'); }
        catch(error){toast(error.message);renderStage(mode);}
      } : null);
    }
    for (const child of stage.children) applyMapView(child);
    if (mode === 'dm' && !mapPreviewMode) {
      stage.onpointerdown = event => beginMapTool(event, stage);
      stage.ondragover = event => event.preventDefault();
      stage.ondrop = event => {
        event.preventDefault();
        const id = event.dataTransfer?.getData('text/plain');
        const t = getToken(id);
        if (!t) return;
        const p = mapPoint(event, stage);
        t.placed = true; t.scene = state.scene; t.x = p.x; t.y = p.y;
        commit();
      };
    }
    if(currentKey)stageRenderKeys.set(stage,currentKey);
    lastMapRenderMs = (globalThis.performance?.now?.() || Date.now()) - started;
  }

  function addSmallButton(parent, label, handler, className = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (className) button.className = className;
    button.addEventListener('click', handler);
    parent.appendChild(button);
    return button;
  }

  function numberField(parent, labelText, value, onChange) {
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'number'; input.min = '0'; input.max = '999'; input.value = value;
    input.addEventListener('change', () => onChange(input.value));
    label.appendChild(input);
    parent.appendChild(label);
  }

  function applyDelta(t, delta) {
    if (delta < 0) {
      let damage = -delta;
      const absorbed = Math.min(t.tempHp, damage);
      t.tempHp -= absorbed;
      damage -= absorbed;
      t.hp = Math.max(0, t.hp - damage);
    } else t.hp = Math.min(t.maxHp || 999, t.hp + delta);
    commit();
  }

  function createRosterRow(t) {
    const row = document.createElement('div');
    row.className = 'roster-row';
    // Cached row handlers must follow the current token after immutable commands/Undo.
    for(const type of ['pointerdown','click','change','dragstart'])row.addEventListener(type,()=>{t=getToken(t.id)||t;},true);
    const top = document.createElement('div');
    top.className = 'roster-top';
    const icon = document.createElement('div');
    icon.className = 'palette-icon';
    icon.draggable = true;
    icon.title = `Drag ${t.name} onto the current map`;
    icon.innerHTML = iconMarkup(t.type, t.label);
    icon.addEventListener('dragstart', event => event.dataTransfer?.setData('text/plain', t.id));
    icon.addEventListener('click', () => {
      if (!currentIsMap()) { toast('Choose a battle map before placing an icon.'); return; }
      t.placed = true; t.scene = state.scene;
      t.x = 50; t.y = 50;
      commit();
    });
    top.appendChild(icon);
    const name = document.createElement('div');
    name.className = 'roster-name';
    name.textContent = t.name;
    const stats = document.createElement('small');
    const creatureSummary = globalThis.ECHO_COMBAT_DATA?.CREATURES[t.type] || state.combat?.creatures?.[t.type];
    stats.textContent = STATS[t.type] || (creatureSummary
      ? `AC ${creatureSummary.ac ?? '?'} · HP ${creatureSummary.hp ?? '?'} · ${creatureSummary.source}` : STATS.hero);
    name.appendChild(stats);
    top.appendChild(name);
    const vitals = document.createElement('span');
    vitals.className = 'roster-vitals';
    vitals.textContent = `${t.maxHp ? `${t.hp}/${t.maxHp} HP` : 'HP ?'}${t.tempHp ? ` +${t.tempHp}` : ''}${t.ac !== null ? ` · AC ${t.ac}` : ''}`;
    top.appendChild(vitals);
    row.appendChild(top);
    const initiative = document.createElement('div');
    initiative.className = 'initiative-actions';
    const initiativeLabel = document.createElement('label');
    initiativeLabel.textContent = 'Initiative ';
    const initiativeInput = document.createElement('input');
    initiativeInput.type = 'number'; initiativeInput.min = '-99'; initiativeInput.max = '999';
    initiativeInput.placeholder = '—';
    initiativeInput.value = t.initiative ?? '';
    initiativeInput.addEventListener('change', () => {
      t.initiative = initiativeInput.value === '' ? null : signedInteger(initiativeInput.value);
      commit();
    });
    initiativeLabel.appendChild(initiativeInput);
    initiative.appendChild(initiativeLabel);
    const bonusLabel = document.createElement('label');
    bonusLabel.textContent = 'Bonus ';
    const bonusInput = document.createElement('input');
    bonusInput.type = 'number'; bonusInput.min = '-99'; bonusInput.max = '99';
    bonusInput.placeholder = '?';
    bonusInput.value = t.initBonus ?? '';
    bonusInput.addEventListener('change', () => {
      t.initBonus = bonusInput.value === '' ? null : signedInteger(bonusInput.value, -99, 99);
      commit();
    });
    bonusLabel.appendChild(bonusInput);
    initiative.appendChild(bonusLabel);
    addSmallButton(initiative, 'Roll Init', () => rollInitiative(t));
    row.appendChild(initiative);
    const actions = document.createElement('div');
    actions.className = 'roster-actions';
    numberField(actions, 'HP', t.hp, value => { t.hp = bounded(value); commit(); });
    numberField(actions, 'Max', t.maxHp, value => {
      t.maxHp = bounded(value); t.hp = Math.min(t.hp, t.maxHp || 999); commit();
    });
    numberField(actions, 'Temp', t.tempHp, value => { t.tempHp = bounded(value); commit(); });
    for (const delta of [-5, -1, 1, 5]) addSmallButton(actions, delta > 0 ? `+${delta}` : String(delta), () => applyDelta(t, delta));
    addSmallButton(actions, 'Card', () => openCombatCard(t.id), 'card-open');
    if (t.team === 'pc' || t.team === 'ally') addSmallButton(actions, 'Sheet', () => globalThis.ECHO_PARTY_UI?.open(t.id));
    if (t.team === 'enemy') {
      const visible = document.createElement('label');
      visible.className = 'visible-label';
      const check = document.createElement('input');
      check.type = 'checkbox'; check.checked = t.visible;
      check.addEventListener('change', () => { t.visible = check.checked; commit(); });
      visible.appendChild(check);
      visible.append(' On TV');
      actions.appendChild(visible);
    }
    addSmallButton(actions, t.placed ? 'Remove' : 'Place', () => {
      if (t.placed) t.placed = false;
      else {
        if (!currentIsMap()) { toast('Choose a battle map before placing an icon.'); return; }
        t.placed = true; t.scene = state.scene; t.x = 50; t.y = 50;
      }
      commit();
    }, 'remove');
    if (state.sessionKind === 'custom') addSmallButton(actions, 'Delete', () => {
      if (!window.confirm(`Delete ${t.name} from this session?`)) return;
      state.tokens = state.tokens.filter(item => item.id !== t.id);
      delete state.combat.tokens[t.id];
      state.combat.effects = state.combat.effects.filter(effect => effect.tokenId !== t.id && effect.triggerActor !== t.id);
      for (const plan of Object.values(state.combat.plans)) for (const wave of plan.waves) {
        wave.tokenIds = wave.tokenIds.filter(id => id !== t.id);
        delete wave.positions[t.id];
      }
      state.turn.order = state.turn.order.filter(id => id !== t.id);
      state.turn.index = Math.min(state.turn.index, Math.max(0, state.turn.order.length - 1));
      if (!state.turn.order.length) state.turn = { scene: '', round: 0, order: [], index: 0 };
      if (selectedTokenId === t.id) selectedTokenId = null;
      commit(`Deleted combatant: ${t.name}`);
    });
    row.appendChild(actions);
    return row;
  }

  let rosterRenderKey='';
  function renderRosters() {
    const encounters = sessionEncounters();
    const nextKey=JSON.stringify([state.scene,state.sessionKind,selectedEncounter,encounters,state.tokens.map(({x,y,...t})=>t),state.combat?.creatures]);
    if(nextKey===rosterRenderKey&&$('party-roster').childElementCount)return;
    rosterRenderKey=nextKey;
    const party = $('party-roster');
    party.replaceChildren();
    for (const t of state.tokens.filter(t => t.team !== 'enemy')) party.appendChild(createRosterRow(t));
    const enemies = $('enemy-roster');
    enemies.replaceChildren();
    const groups = selectedEncounter === 'all' ? encounters : encounters.filter(e => e.id === selectedEncounter);
    for (const encounter of groups) {
      const note = document.createElement('p');
      note.className = 'encounter-note';
      note.textContent = `${encounter.name}: ${encounter.note}`;
      enemies.appendChild(note);
      for (const t of state.tokens.filter(t => t.encounter === encounter.id)) enemies.appendChild(createRosterRow(t));
    }
    if (state.sessionKind === 'custom' && selectedEncounter === 'all') {
      const assigned = new Set(encounters.map(e => e.id));
      const other = state.tokens.filter(t => t.team === 'enemy' && !assigned.has(t.encounter));
      if (other.length) {
        const note = document.createElement('p');
        note.className = 'encounter-note'; note.textContent = 'Other enemies';
        enemies.appendChild(note);
        for (const t of other) enemies.appendChild(createRosterRow(t));
      }
    }
  }

  function renderRequests() {
    const container = $('explore-requests');
    container.hidden=!!globalThis.ECHO_DM_DESK_UI;
    container.replaceChildren();
    for (const key of state.requests) {
      const row = document.createElement('div');
      row.className = 'request-row';
      row.textContent = 'Players want to explore a shaded part of this map.';
      const buttons = document.createElement('div');
      buttons.className = 'button-row';
      addSmallButton(buttons, 'Reveal it', () => revealTile(key));
      addSmallButton(buttons, 'Dismiss', () => { state.requests = state.requests.filter(k => k !== key); commit(); });
      row.appendChild(buttons);
      container.appendChild(row);
    }
    const phonePanel = $('phone-request-panel'), phoneList = $('phone-requests');
    const pending = (state.phoneRequests || []).filter(request => request.scene === state.scene);
    const actions = globalThis.ECHO_PHONE_ACTIONS?.data(state).requests.filter(globalThis.ECHO_PHONE_ACTIONS.pending) || [];
    const items=globalThis.ECHO_PLAYER_TOOLS?.data(campaignIndex.tableExtras).requests.filter(r=>r.status==='waiting') || [];
    const journeys=globalThis.ECHO_TRAVEL?.data(campaignIndex.tableExtras).requests.filter(r=>r.status==='waiting')||[];
    phonePanel.hidden = !!globalThis.ECHO_DM_DESK_UI || !pending.length && !actions.length && !items.length && !journeys.length;
    phoneList.replaceChildren();
    for(const r of journeys){const row=document.createElement('div');row.className='request-row';row.textContent=`${state.party[r.owner]?.name||'Player'} · destination request`;addSmallButton(row,'Review travel',()=>globalThis.ECHO_TRAVEL_UI.open());phoneList.append(row);}
    for (const request of items) {const row=document.createElement('div');row.className='request-row';row.textContent=`${state.party[request.owner]?.name} · ${request.verb} ${request.expected?.name||''}`;addSmallButton(row,'Review inventory',()=>globalThis.ECHO_PLAYER_TOOLS_UI.open(request.id));phoneList.append(row);}
    for (const request of actions) {
      const row = document.createElement('div'); row.className = 'request-row';
      row.textContent = `${state.party[request.characterId]?.name || 'Player'} · ${request.label} · ${request.status}`;
      addSmallButton(row, 'Review', () => globalThis.ECHO_PHONE_ACTIONS_UI.open(request.id)); phoneList.append(row);
    }
    for (const request of pending) {
      const row = document.createElement('div'); row.className = 'request-row';
      const name = state.party[request.characterId]?.name || 'A player';
      const point = request.kind === 'point' ? presentedMapScene().points.find(item => item.id === request.pointId) : null;
      row.textContent = request.kind === 'action' ? `${name} asks to use ${request.label}. Review any resource cost on their sheet.` :
        request.kind === 'move' ? `${name} asks to move their token. Place it at the requested spot or dismiss.` :
        `${name} asks to explore ${point?.title || 'a shaded part of the map'}.`;
      const buttons = document.createElement('div'); buttons.className = 'button-row';
      addSmallButton(buttons, request.kind === 'action' ? 'Request again' : request.kind === 'move' ? 'Place token' : request.kind === 'tile' ? 'Reveal it' : 'Show clue', () => approvePhoneRequest(request.id));
      addSmallButton(buttons, 'Dismiss', () => dismissPhoneRequest(request.id));
      row.appendChild(buttons); phoneList.appendChild(row);
    }
  }

  function stageCombatAction(actorId, actionType, actionIndex, targetIds=[], casting=null) {
    const actor=getToken(actorId),attacks=globalThis.ECHO_COMBAT_RUN.attackChoices(actor);
    const sequence=globalThis.ECHO_COMBAT_RUN.sequence(actor,attacks);
    const sequenceStep=state.party[actorId]?-1:sequence.findIndex((step,i)=>!state.combatRun.queue.done[i]&&step.attackIndex===actionIndex);
    const request=globalThis.ECHO_COMBAT_ACTIONS.stage(state,{actorId,actionType,actionIndex,targetIds,casting,sequenceStep});
    commit(`Staged ${actor.name}: ${request.label}`);
    globalThis.ECHO_PHONE_ACTIONS_UI.open(request.id);
  }

  function setPhoneActionStatus(id,status,message) {
    const row=globalThis.ECHO_PHONE_ACTIONS.data(state).requests.find(r=>r.id===id);
    if(!row || !globalThis.ECHO_PHONE_ACTIONS.pending(row)) return;
    row.revision++; globalThis.ECHO_PHONE_ACTIONS.transition(row,status,message);
    if(row.source!=='dm')state.phoneReplies[row.characterId]=`${row.label}: ${message}`;
    commit(`${row.label}: ${status}`);
  }

  function approvePhoneRequest(id) {
    if (globalThis.ECHO_PHONE_ACTIONS?.data(state).requests.some(r=>r.id===id)) { globalThis.ECHO_PHONE_ACTIONS_UI.open(id); return; }
    const request = state.phoneRequests.find(item => item.id === id);
    if (!request || request.scene !== state.scene) return;
    if (request.kind === 'move') {
      const token = getToken(request.characterId);
      if (!token?.placed || token.scene !== state.scene || token.team !== 'pc') throw Error('That character is no longer on this map.');
      const result = globalThis.ECHO_COMBAT_PLUS.placeToken(state, token.id,
        { x: pointValue(request.x), y: pointValue(request.y) }, getScene(state.scene)?.gridColumns || MAP_SQUARES_ACROSS);
      state = result.state;
      state.phoneRequests = state.phoneRequests.filter(item => item.id !== id);
      state.phoneReplies[request.characterId] = 'Movement approved by the DM.';
      commit(`Placed ${token.name} from phone request`);
      if (result.notes.length) toast(result.notes.join(' '));
      return;
    }
    state.phoneRequests = state.phoneRequests.filter(item => item.id !== id);
    if (request.kind === 'action') {
      state.phoneReplies[request.characterId] = `${request.label}: please send this action again with targets using the updated phone app.`;
      commit(`Requested updated phone action: ${request.label}`);
      return;
    }
    if (request.kind === 'tile' && sceneHasFog() && currentTile(request.key)) {
      revealTile(request.key, true, false);
      commit(`Approved ${state.party[request.characterId]?.name || 'player'} exploration`);
      return;
    }
    const point = presentedMapScene().points.find(item => item.id === request.pointId && item.visible && item.approved);
    if (point?.clue) state.handout = { visible: true, image: '', title: point.title, text: point.clue };
    commit(`Approved ${state.party[request.characterId]?.name || 'player'} exploration: ${point?.title || 'map point'}`);
  }

  function dismissPhoneRequest(id) {
    const action=globalThis.ECHO_PHONE_ACTIONS?.data(state).requests.find(r=>r.id===id);
    if(action){setPhoneActionStatus(id,'declined','Declined by DM.');return;}
    const request = state.phoneRequests.find(item => item.id === id);
    if (!request) return;
    state.phoneRequests = state.phoneRequests.filter(item => item.id !== id);
    state.phoneReplies[request.characterId] = request.kind === 'action' ? `${request.label} was declined by the DM.` : request.kind === 'move' ? 'Movement request dismissed by the DM.' : 'Exploration request dismissed.';
    commit(`Dismissed ${state.party[request.characterId]?.name || 'player'}’s request`);
  }

  function appendRunbookGroup(article, heading, entries, readAloud = false) {
    if (!Array.isArray(entries) || entries.length === 0) return;
    const title = document.createElement('h4');
    title.textContent = heading;
    article.appendChild(title);
    if (readAloud) {
      for (const paragraph of entries) {
        const quote = document.createElement('blockquote');
        quote.className = 'runbook-read';
        quote.textContent = paragraph;
        article.appendChild(quote);
        addSmallButton(article, 'Preview text for TV', () => globalThis.ECHO_TV_TEXT?.preview(heading, paragraph));
      }
    } else {
      const list = document.createElement('ul');
      for (const entry of entries) {
        const item = document.createElement('li');
        item.textContent = entry;
        if (heading === 'Ask the players') addSmallButton(item, 'Preview for TV', () => globalThis.ECHO_TV_TEXT?.preview(heading, entry));
        list.appendChild(item);
      }
      article.appendChild(list);
    }
  }

  function createRunbookBeat(beat) {
    const article = document.createElement('article');
    article.className = 'runbook-beat';
    const title = document.createElement('h3');
    title.textContent = beat.title;
    article.appendChild(title);
    if (!IS_PLAYER && globalThis.ECHO_CONTINUITY) {
      const history = document.createElement('details');
      const summary = document.createElement('summary'); summary.textContent = 'Actual campaign record · prepared text below is not proof it happened'; history.append(summary);
      for (const e of campaignContinuity().events.filter(e=>e.approved&&e.session.startsWith('Sessions 2–3'))) {
        const line=document.createElement('p');line.textContent=`${e.status}: ${e.detail}`;history.append(line);
      }
      addSmallButton(history,'Open continuity & quests',()=>globalThis.ECHO_STORY_UI?.open('continuity'));
      article.append(history);
    }
    if (!IS_PLAYER && globalThis.ECHO_SPOTLIGHTS_UI) addSmallButton(article,'Character spotlights',()=>globalThis.ECHO_STORY_UI?.open('spotlights'));

    {
      const pages = globalThis.ECHO_STORY_DATA;
      const links = document.createElement('div'); links.className = 'button-row';
      const room = pages?.CRAGMAW_PAGES?.[beat.id] || globalThis.ECHO_SESSION4_PAGES?.[beat.id];
      if (room) addSmallButton(links, `LMoP · p. ${room}`, () => globalThis.ECHO_RULES_UI?.openBook('lmop',
        globalThis.ECHO_RULES_UI.printedToPdf('lmop', room).page));
      for (const [label, book, printed] of pages?.LIVE_RULES?.[beat.id] || [])
        addSmallButton(links, `${label} · p. ${printed}`, () => globalThis.ECHO_RULES_UI?.openBook(book,
          globalThis.ECHO_RULES_UI.printedToPdf(book, printed).page));
      for (const source of (globalThis.ECHO_TRANSITION_DATA?.beats.find(b=>b.id===beat.id)||globalThis.ECHO_COURTYARD_DATA?.beats.find(b=>b.id===beat.id))?.source || [])
        if(source.book&&Number.isFinite(source.page))addSmallButton(links,`${source.label || source.book} · p. ${source.page}`,()=>globalThis.ECHO_RULES_UI?.openBook(source.book,globalThis.ECHO_RULES_UI.printedToPdf(source.book,source.page).page));
      if (links.childNodes.length) article.appendChild(links);
    }
    const storyBeat = campaignIndex.story?.sessionPlans?.[activeSessionId]?.beats?.[beat.id];
    if (storyBeat) {
      if (storyBeat.optional || storyBeat.status !== 'ready') {
        const badge = document.createElement('p'); badge.className = 'runbook-cue';
        badge.textContent = `${storyBeat.optional ? 'Optional · ' : ''}${storyBeat.status}`;
        article.appendChild(badge);
      }
      if (storyBeat.trigger) appendRunbookGroup(article, 'Trigger', [storyBeat.trigger]);
      if (storyBeat.consequence) appendRunbookGroup(article, 'Consequence', [storyBeat.consequence]);
      if (storyBeat.elsePlan) appendRunbookGroup(article, 'If they go elsewhere', [storyBeat.elsePlan]);
      if (storyBeat.music) appendRunbookGroup(article, 'Music cue', [storyBeat.music]);
      if (storyBeat.handout) appendRunbookGroup(article, 'Handout cue', [storyBeat.handout]);
      if (storyBeat.likelyRules) appendRunbookGroup(article, 'Likely rules', [storyBeat.likelyRules]);
    }
    if (beat.tv) {
      const cue = document.createElement('p');
      cue.className = 'runbook-cue';
      cue.textContent = `TV cue: ${beat.tv}`;
      article.appendChild(cue);
    }
    if (beat.scene && getScene(beat.scene)) {
      addSmallButton(article, 'Preview this visual', () => {previewSceneId=beat.scene;contextTab='scene';renderContextSidebar();globalThis.ECHO_HYBRID_UI?.openDrawer();}, 'runbook-show');
    }
    if (['s2-arrival', 's2-town'].includes(beat.id))
      addSmallButton(article, 'Preview Phandalin town map', () => {previewSceneId='town-phandalin';contextTab='scene';renderContextSidebar();globalThis.ECHO_HYBRID_UI?.openDrawer();}, 'runbook-show');
    if (beat.id.startsWith('mc-')) addSmallButton(article,'Open Mending Court',()=>globalThis.ECHO_STORY_UI?.open('courtyard'));
    if (beat.id.startsWith('tr-') || ['s4-homecoming','s4-beyond'].includes(beat.id)) addSmallButton(article,'Prepare Phandalin → Waterdeep',()=>globalThis.ECHO_STORY_UI?.open('transition'));
    if (beat.id.startsWith('s4-')) addSmallButton(article, 'Wave Echo journal', () => globalThis.ECHO_STORY_UI?.open('wave-echo'));
    const artKeys = globalThis.ECHO_SESSION2_ART?.[beat.id] || globalThis.ECHO_SESSION3_ART?.[beat.id] || globalThis.ECHO_SESSION4_ART?.[beat.id] || [];
    if (artKeys.length) {
      const catalog = globalThis.LMOP_VISUAL_CATALOG || [];
      const details = document.createElement('details');
      details.className = 'runbook-art';
      const summary = document.createElement('summary');
      summary.textContent = `Scene art · ${artKeys.length}`;
      details.appendChild(summary);
      for (const key of artKeys) {
        const item = catalog.find(entry => entry.key === key);
        if (!item) continue;
        const row = document.createElement('div');
        row.className = 'runbook-art-row';
        const label = document.createElement('span');
        label.textContent = `${item.key} · ${item.title} — ${item.reveal}`;
        row.appendChild(label);
        addSmallButton(row, 'Preview & show', () => globalThis.ECHO_PRESENTATION?.open('art', item.id));
        details.appendChild(row);
      }
      article.appendChild(details);
    }
    appendRunbookGroup(article, 'Say aloud', beat.read, true);
    if(beat.read?.length)addSmallButton(article,'Prepare narration',()=>globalThis.ECHO_VOICE_STUDIO.fromSource({kind:'scene',id:beat.id,sessionId:activeSessionId}));
    appendRunbookGroup(article, 'Ask the players', beat.ask);
    appendRunbookGroup(article, 'Run this', beat.run);
    appendRunbookGroup(article, 'If they choose another route', beat.choices);
    appendRunbookGroup(article, 'After the water rush, say', beat.readAfter, true);
    appendRunbookGroup(article, 'DM only', beat.private);
    if (state.sessionKind === 'custom') {
      const controls = document.createElement('div');
      controls.className = 'button-row';
      addSmallButton(controls, 'Edit beat', () => editBeat(beat.id));
      addSmallButton(controls, 'Remove beat', () => {
        if (!window.confirm(`Remove “${beat.title}” from this session?`)) return;
        state.runbookBeats = state.runbookBeats.filter(item => item.id !== beat.id);
        state.runbook = state.runbookBeats[0]?.id || 'all';
        $('runbook-content').dataset.current = '';
        commit(`Removed DM beat: ${beat.title}`);
      });
      article.appendChild(controls);
    }
    return article;
  }

  function selectRunbook(id) {
    const beats = sessionRunbook();
    if (id !== 'all' && !beats.some(beat => beat.id === id)) return;
    state.runbook = id;
    if (/^s4-room-\d+$/.test(id) && state.waveEcho) { state.waveEcho.room = Number(id.slice(8)); state.waveEcho.resumeBeat = id; }
    if (id !== 'all') { storyPlan().nextBeat = id; void saveCampaignIndex(); }
    const beat = beats.find(item => item.id === id);
    if (beat?.encounter) selectedEncounter = beat.encounter;
    contextTab = beat?.encounter ? 'encounter' : 'scene';
    commit(`DM notes: ${beat?.title || 'All Session 1 notes'}`);
  }

  function nextRunbookBeat() {
    const beats = sessionRunbook();
    const index = beats.findIndex(beat => beat.id === state.runbook);
    const plan = campaignIndex.story?.sessionPlans?.[activeSessionId];
    const usable = beat => beat && !beat.courtyardLocked && plan?.beats?.[beat.id]?.status !== 'skipped';
    const branch = beats.find(beat => beat.id === plan?.beats?.[state.runbook]?.next);
    if (usable(branch)) return branch;
    return beats.slice(index + 1).find(usable) || null;
  }

  function renderRunbook() {
    const select = $('runbook-select');
    const allBeats = sessionRunbook();
    const signature = `${activeSessionId}:${allBeats.map(beat => `${beat.id}:${beat.title}`).join('|')}`;
    if (select.dataset.signature !== signature) {
      select.replaceChildren();
      for (const beat of allBeats) {
        const option = document.createElement('option');
        option.value = beat.id; option.textContent = beat.title;
        select.appendChild(option);
      }
      const all = document.createElement('option');
      all.value = 'all'; all.textContent = 'All notes'; select.appendChild(all);
      select.dataset.signature = signature;
      $('runbook-content').dataset.current = '';
    }
    select.value = state.runbook;
    const index = allBeats.findIndex(beat => beat.id === state.runbook);
    $('runbook-prev').disabled = index <= 0;
    $('runbook-next').disabled = index < 0 || !nextRunbookBeat();
    const content = $('runbook-content');
    if (content.dataset.current === `${activeSessionId}:${state.runbook}`) return;
    content.replaceChildren();
    const beats = state.runbook === 'all' ? allBeats : allBeats.filter(beat => beat.id === state.runbook);
    for (const beat of beats) content.appendChild(createRunbookBeat(beat));
    if (!beats.length) content.textContent = 'Add a DM beat in Prepare this session to put your read-aloud and notes here.';
    content.dataset.current = `${activeSessionId}:${state.runbook}`;
  }

  function renderDMTurnBar() {
    const order = state.turn.order.map(getToken).filter(Boolean);
    const list = $('dm-turn-list');
    list.replaceChildren();
    const active = order[state.turn.index];
    $('dm-turn-summary').textContent = order.length
      ? `Round ${state.turn.round} · ${active?.name || 'Choose a turn'}${state.turn.scene !== state.scene ? ' · switch to its map' : ''}`
      : 'No turn order yet';
    const localOrder = !!order.length && state.turn.scene === state.scene;
    $('previous-turn').disabled = !localOrder;
    $('next-turn').disabled = !localOrder;
    $('start-combat').hidden = localOrder;
    $('start-combat').textContent = order.length ? 'Start combat here' : 'Start combat';
    $('start-combat').disabled = !currentIsMap();
    $('end-combat').disabled = !order.length;
    $('request-initiative').disabled = !currentIsMap();
    $('request-initiative').textContent = state.combatRun?.initiativePrompt?.open && state.combatRun.initiativePrompt.scene === state.scene ? 'Close phone initiative' : 'Ask phones for initiative';
    for (const [index, t] of order.entries()) {
      const sheet = state.party?.[t.id];
      const status = sheet ? [sheet.hp !== null ? `${sheet.hp}/${sheet.maxHp ?? '?'} HP` : '',
        sheet.death?.successes || sheet.death?.failures ? `Death ${sheet.death.successes || 0}✓ ${sheet.death.failures || 0}✗` : '',
        sheet.death?.stable ? 'Stable' : '',
        sheet.exhaustion ? `Exh ${sheet.exhaustion}` : '',
        sheet.concentration ? 'Conc' : '',
        sheet.effects?.length ? sheet.effects.slice(0, 2).map(effect => effect.name).join(', ') : ''].filter(Boolean).join(' · ') : '';
      const flow = state.combat?.tokens?.[t.id];
      const combatStatus = [flow?.surprised ? 'Surprised' : '', flow?.reactionUsed ? 'Reaction used' : '',
        flow?.ready ? 'Ready' : '', flow?.concentration ? 'Conc' : '',
        state.combat?.effects?.filter(e => e.tokenId === t.id).slice(0, 2)
          .map(e => `${e.name}${e.due ? ' DUE' : ` ${e.remaining}`}`).join(', ') || ''].filter(Boolean).join(' · ');
      const chip = addSmallButton(list, `${t.name} · ${t.initiative ?? '—'}${status ? ` · ${status}` : ''}${combatStatus ? ` · ${combatStatus}` : ''}`, () => {
        state.turn.index = index;
        commit();
      }, `turn-chip ${index === state.turn.index ? 'active' : ''}${t.hp === 0 && t.team === 'enemy' ? ' defeated' : ''}`);
      chip.title = `Jump to ${t.name}’s turn`;
      const move = (direction) => {
        const other = index + direction;
        if (other < 0 || other >= state.turn.order.length) return;
        const activeId = state.turn.order[state.turn.index];
        [state.turn.order[index], state.turn.order[other]] = [state.turn.order[other], state.turn.order[index]];
        state.turn.index = state.turn.order.indexOf(activeId);
        commit(`Reordered initiative: ${t.name}`);
      };
      if (order[index - 1]?.initiative === t.initiative)
        addSmallButton(list, '↑', () => move(-1)).title = `Move ${t.name} earlier in the tie`;
      if (order[index + 1]?.initiative === t.initiative)
        addSmallButton(list, '↓', () => move(1)).title = `Move ${t.name} later in the tie`;
    }
  }

  function renderPlayerTurnBar() {
    const turn = state.turn || { round: 0, order: [], activeId: null };
    const order = Array.isArray(turn.order) ? turn.order : [];
    $('player-app').classList.toggle('player-combat-active', order.length > 0 || Boolean(state.publicRoll));
    const list = $('player-turn-list');
    list.replaceChildren();
    const active = order.find(t => t.id === turn.activeId);
    $('player-turn-summary').textContent = order.length
      ? `Round ${turn.round}${active ? ` · ${active.name}’s turn` : ''}`
      : 'Waiting for combat';
    for (const [index,t] of order.entries()) {
      const chip = document.createElement('span');
      chip.className = `turn-chip${t.id === turn.activeId ? ' active' : ''}`;
      chip.textContent = state.map?.display?.tvPreset!=='classic'?`${t.id===turn.activeId?'▶':index+1} ${t.name}`:`${t.name} · ${t.initiative ?? '—'}`;chip.setAttribute('aria-label',`${index+1}. ${t.name}${t.id===turn.activeId?' · active turn':''}`);
      list.appendChild(chip);
    }
    if(state.map?.display?.tvPreset!=='classic')requestAnimationFrame(()=>{const current=list.querySelector('.active');if(current)list.scrollLeft=Math.max(0,current.offsetLeft-list.offsetLeft-list.clientWidth/2+current.clientWidth/2);});
    const banner = $('player-roll-banner');
    const roll = state.publicRoll;
    banner.hidden = !roll;
    banner.textContent = roll
      ? `${roll.label || 'Roll'} · ${roll.notation}${roll.parts?.length ? ` [${roll.parts.join(', ')}]` : ''} = ${roll.total}`
      : '';
  }

  function renderRollHistory() {
    const history = $('roll-history');
    history.replaceChildren();
    $('hide-tv-roll').disabled = !state.publicRollId;
    if (!state.rolls.length) {
      const empty = document.createElement('p');
      empty.className = 'help';
      empty.textContent = 'Rolls are private until you choose Show on TV.';
      history.appendChild(empty);
      return;
    }
    for (const roll of state.rolls) {
      const row = document.createElement('div');
      row.className = 'roll-entry';
      const text = document.createElement('div');
      text.className = 'roll-entry-text';
      const name = document.createElement('strong');
      name.textContent = `${roll.label} · ${roll.total}`;
      const detail = document.createElement('small');
      detail.textContent = `${roll.notation}${roll.parts.length ? ` [${roll.parts.join(', ')}]` : ''} · ${roll.time}`;
      text.append(name, detail);
      row.appendChild(text);
      const shown = state.publicRollId === roll.id;
      addSmallButton(row, shown ? 'On TV' : 'Show on TV', () => {
        state.publicRollId = roll.id;
        commit();
      }).disabled = shown;
      history.appendChild(row);
    }
  }

  function openCombatCard(id) {
    selectedTokenId = id;
    contextTab = 'token';
    renderCombatCard();
    renderContextSidebar();
    renderContextSidebar();
  }

  function cardNumberInput(parent, labelText, value, onChange, placeholder = '') {
    const label = document.createElement('label');
    label.textContent = labelText;
    const input = document.createElement('input');
    input.type = 'number'; input.min = '-99'; input.max = '999';
    input.value = value ?? ''; input.placeholder = placeholder;
    input.addEventListener('change', () => onChange(input.value));
    label.appendChild(input);
    parent.appendChild(label);
  }

  function rollCardAttack(t, attack, damage = false) {
    const name = `${t.name} ${attack.name || 'attack'}`;
    globalThis.ECHO_COMBAT_UI?.prepareRoll(t.id, `${name} ${damage ? attack.damage || 'damage' : 'attack'}`,
      damage ? attack.count : 1, damage ? attack.sides : 20,
      damage ? attack.modifier : attack.bonus, damage ? 'damage' : 'attack', damage ? attack.damage : '');
  }

  function renderCombatCard() {
    const card = $('combat-card');
    const t = getToken(selectedTokenId);
    const moreWasOpen = card.querySelector('.card-more')?.open || false;
    card.hidden = !t;
    card.replaceChildren();
    if (!t) return;
    const head = document.createElement('div');
    head.className = 'combat-card-head';
    const title = document.createElement('h2');
    title.textContent = t.name;
    head.appendChild(title);
    const renameButton = state.sessionKind === 'custom' ? addSmallButton(head, 'Rename', () => {
      const name = window.prompt('Combatant name:', t.name);
      if (name === null || !name.trim()) return;
      t.name = name.trim().slice(0, 60);
      commit(`Renamed combatant: ${t.name}`);
    }) : null;
    addSmallButton(head, 'Close', () => { selectedTokenId = null; contextTab = 'turn'; renderCombatCard(); renderContextSidebar(); });
    card.appendChild(head);
    const summary = document.createElement('p');
    summary.className = 'combat-card-summary';
    summary.textContent = `${t.team === 'enemy' ? 'Enemy' : t.team === 'ally' ? 'Ally' : 'Hero'} · ${t.placed ? 'On map' : 'Not placed'} · Initiative ${t.initiative ?? '—'}`;
    card.appendChild(summary);
    const source = CARD_SOURCES[t.type];
    const creature = globalThis.ECHO_COMBAT_DATA?.CREATURES[t.type] || state.combat?.creatures?.[t.type];
    if (source) {
      const sourceRow = document.createElement('div');
      sourceRow.className = 'combat-card-source';
      sourceRow.append(document.createTextNode(`Rules source: ${source.label} `));
      addSmallButton(sourceRow, 'Open source', () => globalThis.ECHO_RULES_UI?.openBook(source.book, source.page));
      card.appendChild(sourceRow);
    } else if (creature) {
      const sourceRow = document.createElement('p');
      sourceRow.className = 'combat-card-source';
      sourceRow.textContent = `Rules source: ${creature.source || 'DM entry'}`;
      card.appendChild(sourceRow);
    } else if (t.type === 'sildar' || t.type === 'custom') {
      const sourceNote = document.createElement('p');
      sourceNote.className = 'combat-card-note';
      sourceNote.textContent = t.type === 'sildar'
        ? 'Provisional Sildar card: confirm his statistics in the adventure before rolling.'
        : 'Custom card: enter the controlling source and exact action details in the rules library or your session notes.';
      card.appendChild(sourceNote);
    }
    const cardActions = document.createElement('div');
    addSmallButton(cardActions,'Quick actions',()=>globalThis.ECHO_DM_DESK_UI?.openToken(t.id));
    cardActions.className = 'button-row card-main-actions';
    if (t.team === 'pc' || t.team === 'ally') addSmallButton(cardActions, 'Full sheet', () => globalThis.ECHO_PARTY_UI?.open(t.id));
    if (globalThis.ECHO_COMBAT_DATA?.CREATURES[t.type] || state.combat?.creatures?.[t.type])
      addSmallButton(cardActions, 'Creature details', () => globalThis.ECHO_COMBAT_UI?.openCreature(t.type));
    if (t.team === 'enemy' || (t.team === 'ally' && !['ally-dracuseth', 'ally-sildar'].includes(t.id))) {
      addSmallButton(cardActions, t.team === 'enemy' ? 'Mark as ally' : 'Mark as enemy', () => {
        t.team = t.team === 'enemy' ? 'ally' : 'enemy';
        if (t.team === 'ally') t.visible = false;
        commit(`${t.name} is now ${t.team === 'ally' ? 'an ally' : 'an enemy'}`);
      });
    }
    if (t.team !== 'pc') addSmallButton(cardActions, t.visible ? 'Hide on TV' : 'Show on TV', () => {
      t.visible = !t.visible; commit(`${t.name} ${t.visible ? 'shown on' : 'hidden from'} TV`);
    });
    addSmallButton(cardActions, 'Damage / heal', () => globalThis.ECHO_COMBAT_UI?.prepareDamage([t.id], 0, 'slashing'));
    card.appendChild(cardActions);
    if ((t.type === 'paladin' || t.type === 'hero-trista') &&
      !globalThis.ECHO_RULES_UI?.isExceptionActive(t.type === 'paladin' ? 'dracuseth' : 'trista')) {
      const warning = document.createElement('p');
      warning.className = 'combat-card-note';
      warning.textContent = 'This card uses a 2024 character sheet. The named rules exception is currently disabled in Rules & books.';
      card.appendChild(warning);
    }
    const stats = document.createElement('div');
    stats.className = 'combat-card-stats';
    cardNumberInput(stats, 'HP', t.hp, value => { t.hp = bounded(value); commit(); });
    cardNumberInput(stats, 'Max HP', t.maxHp, value => { t.maxHp = bounded(value); t.hp = Math.min(t.hp, t.maxHp || 999); commit(); });
    cardNumberInput(stats, 'Temp HP', t.tempHp, value => { t.tempHp = bounded(value); commit(); });
    cardNumberInput(stats, 'AC', t.ac, value => { t.ac = value === '' ? null : bounded(value, 99); commit(); }, '?');
    cardNumberInput(stats, 'Exhaustion 0–6', t.exhaustion || 0,
      value => { t.exhaustion = Math.max(0, Math.min(6, bounded(value, 6))); commit(`${t.name}: exhaustion level ${t.exhaustion}`); });
    card.appendChild(stats);
    const hpButtons = document.createElement('div');
    hpButtons.className = 'button-row';
    for (const delta of [-5, -1, 1, 5]) addSmallButton(hpButtons,
      `${delta > 0 ? '+' : ''}${delta} HP`, () => applyDelta(t, delta));
    card.appendChild(hpButtons);
    const data = COMBAT_CARDS[t.type] || (creature ? { note: creature.variants || '', attacks: (creature.actions || []).flatMap(action => {
      const match = /^(\d{1,2})d(4|6|8|10|12|20)([+-]\d{1,3})?$/.exec(action.dice || '');
      return match ? [{ name: action.name, bonus: action.bonus, count: Number(match[1]), sides: Number(match[2]),
        modifier: Number(match[3] || 0), damage: action.type || 'damage' }] : [];
    }) } : null);
    if (data?.note) {
      const note = document.createElement('p');
      note.className = 'combat-card-note'; note.textContent = data.note;
      card.appendChild(note);
    }
    const attacksTitle = document.createElement('h3');
    attacksTitle.textContent = 'Attacks and actions';
    card.appendChild(attacksTitle);
    const rollHelp = document.createElement('p');
    rollHelp.className = 'help';
    rollHelp.textContent = 'These buttons roll dice only. Confirm advantage, cover, critical hits, saves, resistance, and limited uses before changing HP.';
    card.appendChild(rollHelp);
    if (!data?.attacks?.length && !t.extraAttacks?.length) {
      const note = document.createElement('p');
      note.className = 'help';
      note.textContent = 'Use the live character sheet for this character. Add a quick roll below if useful.';
      card.appendChild(note);
    }
    const attacks = [...(data?.attacks || []).map(attack => ({ attack, savedIndex: null })),
      ...(t.extraAttacks || []).map((attack, savedIndex) => ({ attack, savedIndex }))];
    for (const { attack, savedIndex } of attacks) {
      const row = document.createElement('div');
      row.className = 'card-attack';
      const name = document.createElement('strong');
      const damageText = `${attack.count}d${attack.sides}${attack.modifier > 0 ? `+${attack.modifier}` : attack.modifier < 0 ? attack.modifier : ''}`;
      name.textContent = `${attack.name} · ${damageText} ${attack.damage}`;
      row.appendChild(name);
      const buttons = document.createElement('div');
      buttons.className = 'button-row';
      if (attack.bonus !== null) addSmallButton(buttons, `Attack ${attack.bonus >= 0 ? '+' : ''}${attack.bonus}`,
        () => rollCardAttack(t, attack));
      addSmallButton(buttons, attack.damage === 'healing' ? 'Roll healing' : 'Roll damage',
        () => rollCardAttack(t, attack, true));
      if (savedIndex !== null) addSmallButton(buttons, 'Remove action', () => {
        t.extraAttacks.splice(savedIndex, 1);
        commit(`Removed ${attack.name} from ${t.name}'s card`);
      });
      row.appendChild(buttons);
      card.appendChild(row);
    }
    const customTitle = document.createElement('h3');
    customTitle.textContent = 'Custom quick roll';
    card.appendChild(customTitle);
    const custom = t.customAttack;
    const customRow = document.createElement('div');
    customRow.className = 'custom-attack';
    const nameInput = document.createElement('input');
    nameInput.type = 'text'; nameInput.maxLength = 50;
    nameInput.placeholder = 'Attack or spell name'; nameInput.value = custom.name;
    nameInput.addEventListener('change', () => { custom.name = nameInput.value.slice(0, 50); commit(); });
    customRow.appendChild(nameInput);
    const damageInput = document.createElement('input');
    damageInput.type = 'text'; damageInput.maxLength = 40;
    damageInput.placeholder = 'Damage type or healing'; damageInput.value = custom.damage || 'damage';
    damageInput.addEventListener('change', () => { custom.damage = damageInput.value.trim().slice(0, 40) || 'damage'; commit(); });
    customRow.appendChild(damageInput);
    cardNumberInput(customRow, 'To hit', custom.bonus,
      value => { custom.bonus = value === '' ? null : signedInteger(value, -99, 99); commit(); });
    cardNumberInput(customRow, 'Dice', custom.count, value => { custom.count = Math.max(1, Math.min(20, bounded(value, 20))); commit(); });
    const sidesLabel = document.createElement('label');
    sidesLabel.textContent = 'Die';
    const sides = document.createElement('select');
    for (const size of [4, 6, 8, 10, 12, 20, 100]) {
      const option = document.createElement('option');
      option.value = size; option.textContent = `d${size}`; sides.appendChild(option);
    }
    sides.value = String(custom.sides);
    sides.addEventListener('change', () => { custom.sides = Number(sides.value); commit(); });
    sidesLabel.appendChild(sides); customRow.appendChild(sidesLabel);
    cardNumberInput(customRow, 'Damage +', custom.modifier, value => { custom.modifier = signedInteger(value, -99, 99); commit(); });
    const customButtons = document.createElement('div');
    customButtons.className = 'button-row';
    addSmallButton(customButtons, 'Roll attack', () => rollCardAttack(t, { ...custom, name: custom.name || 'custom' })).disabled = custom.bonus === null;
    addSmallButton(customButtons, custom.damage === 'healing' ? 'Roll healing' : 'Roll damage',
      () => rollCardAttack(t, { ...custom, name: custom.name || 'custom' }, true));
    addSmallButton(customButtons, 'Save action to card', () => {
      if (!custom.name.trim()) { toast('Name this attack or action first.'); return; }
      t.extraAttacks.push({ ...custom, name: custom.name.trim() });
      t.extraAttacks = t.extraAttacks.slice(-20);
      commit(`Added ${custom.name} to ${t.name}'s card`);
    });
    customRow.appendChild(customButtons);
    card.appendChild(customRow);
    const customHelp = document.createElement('p');
    customHelp.className = 'help';
    customHelp.textContent = 'Leave To hit blank for actions that only roll damage or healing. Save an action to keep it on this card.';
    card.appendChild(customHelp);
    const conditionsTitle = document.createElement('h3');
    conditionsTitle.textContent = 'Conditions';
    card.appendChild(conditionsTitle);
    const conditions = document.createElement('div');
    conditions.className = 'condition-grid';
    for (const condition of CONDITIONS) {
      const label = document.createElement('label');
      const check = document.createElement('input');
      check.type = 'checkbox'; check.checked = t.conditions.includes(condition);
      check.addEventListener('change', () => {
        t.conditions = check.checked ? [...new Set([...t.conditions, condition])]
          : t.conditions.filter(item => item !== condition);
        if (condition === 'Surprised') combatTokenRecord(t.id).surprised = check.checked;
        if (condition === 'Concentrating') combatTokenRecord(t.id).concentration = check.checked ? 'Effect unspecified' : '';
        commit(`${t.name}: ${condition} ${check.checked ? 'added' : 'removed'}`);
      });
      label.append(check, condition);
      conditions.appendChild(label);
    }
    card.appendChild(conditions);
    const more = document.createElement('details');
    more.className = 'card-more';
    more.open = moreWasOpen;
    const moreTitle = document.createElement('summary');
    moreTitle.textContent = 'More details & editing';
    more.appendChild(moreTitle);
    if (renameButton) more.appendChild(renameButton);
    const extraStats = document.createElement('div');
    extraStats.className = 'combat-card-stats';
    for (const item of [...stats.children].filter((_, index) => index === 1 || index === 4)) extraStats.appendChild(item);
    more.appendChild(extraStats);
    for (const item of [...card.querySelectorAll('.combat-card-source, .combat-card-note')]) more.appendChild(item);
    for (const item of [rollHelp, customTitle, customRow, customHelp, conditionsTitle, conditions]) more.appendChild(item);
    card.appendChild(more);
  }

  function renderSessionLog() {
    $('undo-last').disabled = !state.undoStack.length;
    $('quick-undo').disabled = !state.undoStack.length;
    $('redo-last').disabled = !state.redoStack.length;
    $('quick-redo').disabled = !state.redoStack.length;
    const list = $('session-log');
    list.replaceChildren();
    for (const entry of state.sessionLog.slice(0, 40)) {
      const row = document.createElement('div');
      row.className = 'session-log-entry';
      const time = document.createElement('time');
      time.textContent = entry.time;
      const context = entry.round ? ` R${entry.round}${entry.actor ? ` · ${entry.actor}` : ''} — ` : ' ';
      row.append(time, context, entry.label);
      list.appendChild(row);
    }
    if (!state.sessionLog.length) list.textContent = 'Actions will appear here as you play.';
  }

  function populateHandoutFields() {
    renderHandoutChoices();
    const scene = state.sessionKind === 'custom' ? state.scenes.find(s => s.image && s.image === state.handout.image) : null;
    $('handout-image').value = scene ? `scene:${scene.id}` : state.handout.image;
    $('handout-title').value = state.handout.title;
    $('handout-text').value = state.handout.text;
  }

  function renderHandoutControls() {
    $('hide-handout').disabled = !state.handout.visible;
    $('handout-status').textContent = state.handout.visible
      ? `On TV: ${state.handout.title || 'Untitled handout'}` : 'No handout on TV';
    renderHandoutPreview();
  }

  function renderHandoutPreview() {
    const root = $('handout-dm-preview');
    if (!root) return;
    root.replaceChildren();
    const choice = $('handout-image').value;
    const image = choice.startsWith('scene:') ? getScene(choice.slice(6))?.image || '' : choice;
    const title = $('handout-title').value.trim();
    const body = $('handout-text').value.trim();
    const label = document.createElement('small'); label.textContent = 'DM PREVIEW · NOT ON TV YET'; root.append(label);
    if (image && resolveImage(image)) { const img = document.createElement('img'); img.src = resolveImage(image); img.alt = 'Staged handout preview'; root.append(img); }
    const heading = document.createElement('strong'); heading.textContent = title || (image ? 'Image handout' : 'Nothing staged'); root.append(heading);
    if (body) { const copy = document.createElement('p'); copy.textContent = body; root.append(copy); }
  }

  function sidebarLine(root, label, value) {
    const row = document.createElement('p'); row.className = 'context-line';
    const strong = document.createElement('strong'); strong.textContent = `${label}: `;
    row.append(strong, document.createTextNode(value || '—')); root.append(row);
  }

  function renderNextUpStrip() {
    const root = $('next-up-strip'); if (!root) return;
    root.replaceChildren();
    const lead = globalThis.ECHO_QUEST_PREP?.live(campaignIndex.story,activeSessionId);
    const beat = nextRunbookBeat();
    const encounter = sessionEncounters().find(item => item.id === beat?.encounter);
    const scene = getScene(beat?.scene);
    const add = (label, value) => { const group = document.createElement('span'); group.className = 'next-up-item';
      const name = document.createElement('small'); name.textContent = label;
      const detail = document.createElement('strong'); detail.textContent = value;
      group.append(name, detail); root.append(group); };
    if(lead){add('CURRENT OBJECTIVE',lead.objective);add('NEXT USEFUL ACTION',lead.nextAction);const button=document.createElement('button');button.type='button';button.textContent='Open current lead';button.onclick=()=>globalThis.ECHO_STORY_UI?.openQuestBoard(activeSessionId);root.append(button);return;}
    const questGuide=campaignContinuity().questGuide;
    if(questGuide?.enabled){const act=globalThis.ECHO_QUEST_CATALOG?.quests.find(q=>q.id==='act-'+questGuide.currentAct);if(act)add('CURRENT QUEST',act.title);}
    add('NEXT BEAT', beat?.title || 'End of prepared runbook');
    add('LIKELY ENCOUNTER', encounter?.name || 'None prepared');
    add('PREPARED VISUAL', scene?.title || 'Keep current TV view');
    if (beat) { const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Open beat';
      button.addEventListener('click', () => selectRunbook(beat.id)); root.append(button); }
    if (beat?.encounter) { const launch = document.createElement('button'); launch.type = 'button'; launch.textContent = 'Stage encounter';
      launch.addEventListener('click', () => globalThis.ECHO_ENCOUNTER_LAUNCH?.stage(beat.id)); root.append(launch); }
  }

  function launchPreparedEncounter(choice) {
    if (state.turn.order.length) { toast('End the current combat before launching a new encounter.'); return; }
    const encounter = sessionEncounters().find(item => item.id === choice.encounterId);
    const sourceScene = getScene(choice.sceneId), scene = sourceScene && {...sourceScene,id:choice.sceneId};
    if (!encounter || scene?.kind !== 'map') { toast('This encounter needs a prepared battle map.'); return; }
    const beat = sessionRunbook().find(item => item.id === choice.beatId);
    if(state.combat.plans[encounter.id])state.combat.plans[encounter.id].sceneId=scene.id;
    changeScene(scene.id, false, false);
    if (choice.place) {
      const plan = state.combat.plans[encounter.id];
      const wave = plan?.waves?.[0];
      const members = wave?.tokenIds?.length ? wave.tokenIds : state.tokens.filter(item => item.encounter === encounter.id && item.hp > 0).map(item => item.id);
      let position = 0;
      for (const id of members) {
        const token = getToken(id); if (!token || token.hp <= 0) continue;
        const saved = wave&&globalThis.ECHO_COMBAT_DATA.positionFor(wave,id,scene.id,globalThis.ECHO_COMBAT_DATA.expectedScene(encounter.id));
        const sameMap = token.placed && token.scene === scene.id;
        token.placed = true; token.scene = scene.id;
        token.x = saved?.x ?? (sameMap ? token.x : Math.min(90, 30 + position * 8));
        token.y = saved?.y ?? (sameMap ? token.y : 40);
        if (token.team === 'enemy') token.visible = choice.reveal === true;
        position++;
      }
      if (wave) wave.deployed = true;
    }
    state.presentation.mode = 'battle';
    if (choice.hideHandout && state.handout) state.handout.visible = false;
    if (beat) { state.runbook = beat.id; storyPlan().nextBeat = beat.id; void saveCampaignIndex(); }
    selectedEncounter = encounter.id; contextTab = 'encounter';
    if (choice.musicId) {
      const sound = campaignIndex.presentation?.media.find(item => item.id === choice.musicId);
      const group = sound?.tags?.includes('ambience') && !sound?.tags?.includes('music') ? 'ambience' : 'music';
      void globalThis.ECHO_PRESENTATION?.playGroup(group, choice.musicId);
    }
    commit(`Launched encounter: ${encounter.name}`);
    toast(`${encounter.name} is on the TV. Enemies are ${choice.reveal ? 'visible' : 'hidden'}; start initiative when ready.`);
  }

  function renderContextSidebar() {
    const names = { guide:'Next action', tools:'Campaign tools', turn: 'Active turn', token: 'Token card', scene: 'Scene details', encounter: 'Encounter details', clue: 'Clue details', requests: 'Inbox' };
    globalThis.ECHO_PHONE_ACTIONS_UI?.render();
    globalThis.ECHO_DM_DESK_UI?.inbox();
    if (!getToken(selectedTokenId) && contextTab === 'token') contextTab = 'turn';
    $('context-title').textContent = names[contextTab];
    for (const button of document.querySelectorAll('[data-context-tab]')) {
      const active = button.dataset.contextTab === contextTab;
      button.setAttribute('aria-pressed', String(active)); button.classList.toggle('active', active);
      $(`context-${button.dataset.contextTab}`).hidden = !active;
    }
    $('context-token-empty').hidden = !!getToken(selectedTokenId);
    const sceneRoot = $('context-scene'); sceneRoot.replaceChildren();
    if (!getScene(previewSceneId)) previewSceneId = state.scene;
    const scene = getScene(previewSceneId);
    if (scene) {
      const heading = document.createElement('h3'); heading.textContent = scene.title.split(' · ').filter((part,index,all)=>index===0||part!==all[index-1]).join(' · '); sceneRoot.append(heading);
      sidebarLine(sceneRoot, 'Type', scene.kind === 'map' ? 'Interactive map' : 'Illustration');
      sidebarLine(sceneRoot, 'TV status', previewSceneId === state.scene ? 'Current scene' : 'DM preview only');
      const floorPreview=pendingFloorFocus(),section=floorPreview&&globalThis.ECHO_ATLAS.proposal(floorPreview.proposalId);
      if(section)sidebarLine(sceneRoot,'Prepared section',section.title+' · current saved fog will remain');
      const preview = resolveImage(section?.proposalImage || scene.image || '');
      if (preview) { const img = document.createElement('img'); img.className = 'context-scene-preview'; img.src = preview; img.alt = `DM preview of ${scene.title}`; sceneRoot.append(img);img.hidden=true; }
      const staged=document.createElement('section');staged.className='tv-staging-card';const status=document.createElement('strong');status.textContent=previewSceneId===state.scene&&state.presentation.mode===(scene.kind==='map'?'battle':'scene')?'Current TV presentation · player audience':'Ready to show · private preview · player audience';staged.append(status);const exact=document.createElement('div');staged.append(exact);sceneRoot.append(staged);mountPrivatePreview(exact,previewSceneId,'staged');
      const live=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Now showing · exact player view';live.append(summary);const currentPreview=document.createElement('div');live.append(currentPreview);sceneRoot.append(live);live.ontoggle=()=>{if(live.open)mountPrivatePreview(currentPreview,'','live');};
      const show = document.createElement('button'); show.type = 'button'; show.textContent = 'Show on TV';show.className='primary';
      show.disabled = !floorPreview && !state.presentation.mediaId && previewSceneId === state.scene && ((scene.kind === 'map' && state.presentation.mode === 'battle') || (scene.kind !== 'map' && state.presentation.mode === 'scene'));
      show.addEventListener('click', showScenePreview); sceneRoot.append(show);
    }
    const filters=document.createElement('div');filters.className='cockpit-visual-filters';
    const search=document.createElement('input');search.type='search';search.placeholder='Search locations or images';search.setAttribute('aria-label','Search visuals');search.value=previewQuery;filters.append(search);
    const type=document.createElement('select');type.setAttribute('aria-label','Visual type');for(const [value,label]of [['all','All visuals'],['map','Battle & exploration maps'],['art','Scene illustrations']]){const option=document.createElement('option');option.value=value;option.textContent=label;type.append(option);}type.value=previewKind;filters.append(type);sceneRoot.append(filters);
    const scenePicker = document.createElement('select'); scenePicker.setAttribute('aria-label', 'Choose scene');
    const count=document.createElement('small');count.setAttribute('aria-live','polite');
    const fillScenes=()=>{scenePicker.replaceChildren();const matches=sceneEntries().filter(item=>item.kind!=='black'&&(previewKind==='all'||(previewKind==='map'?item.kind==='map':item.kind!=='map'))&&item.title.toLowerCase().includes(previewQuery.toLowerCase().trim()));const prompt=document.createElement('option');prompt.value='';prompt.textContent=matches.length?'Choose a visual to preview…':'No matching visuals';scenePicker.append(prompt);const groups=new Map();for(const item of matches){const groupName=item.title.includes(' · ')?item.title.split(' · ')[0]:'Session scenes';if(!groups.has(groupName)){const group=document.createElement('optgroup');group.label=groupName;groups.set(groupName,group);scenePicker.append(group);}const option=document.createElement('option');option.value=item.id;option.textContent=item.title;groups.get(groupName).append(option);}scenePicker.value=matches.some(item=>item.id===previewSceneId)?previewSceneId:'';count.textContent=matches.length+' visuals · selecting only previews';};
    search.addEventListener('input',()=>{previewQuery=search.value;fillScenes();});type.addEventListener('change',()=>{previewKind=type.value;fillScenes();});
    fillScenes();scenePicker.addEventListener('change', () => { if(!scenePicker.value)return;previewSceneId = scenePicker.value; renderContextSidebar(); }); sceneRoot.append(scenePicker,count);
    const encounterRoot = $('context-encounter'); encounterRoot.replaceChildren();
    const encounter = sessionEncounters().find(item => item.id === selectedEncounter);
    const title = document.createElement('h3'); title.textContent = encounter?.name || 'Choose an encounter'; encounterRoot.append(title);
    if (encounter?.note) { const note = document.createElement('p'); note.textContent = encounter.note; encounterRoot.append(note); }
    const enemies = state.tokens.filter(t => t.encounter === selectedEncounter);
    sidebarLine(encounterRoot, 'Combatants', enemies.length ? enemies.map(t => t.name).join(', ') : 'None placed');
    const encounterPicker = document.createElement('select'); encounterPicker.setAttribute('aria-label', 'Choose encounter');
    for (const item of sessionEncounters()) { const option = document.createElement('option'); option.value = item.id; option.textContent = item.name; encounterPicker.append(option); }
    encounterPicker.value = selectedEncounter;
    encounterPicker.addEventListener('change', () => { selectedEncounter = encounterPicker.value; renderRosters(); renderContextSidebar(); }); encounterRoot.append(encounterPicker);
    const combatButton = document.createElement('button'); combatButton.type = 'button'; combatButton.textContent = 'Open full encounter tools';
    combatButton.addEventListener('click', () => globalThis.ECHO_COMBAT_UI?.open('encounters')); encounterRoot.append(combatButton);
    globalThis.ECHO_ENCOUNTER_LAUNCH?.render(encounterRoot, selectedEncounter);
    globalThis.ECHO_COCKPIT?.refresh();
    const clueRoot = $('context-clue'); clueRoot.replaceChildren();
    const clues = campaignIndex.story?.evidence || [];
    if (!clues.length) { const empty = document.createElement('p'); empty.textContent = 'No clues recorded yet. Add one in Story & continuity.'; clueRoot.append(empty); }
    else {
      if (!clues.some(clue => clue.id === selectedClueId)) selectedClueId = clues[0].id;
      const list = document.createElement('div'); list.className = 'context-clue-list';
      for (const clue of clues.slice(0, 30)) { const button = document.createElement('button'); button.type = 'button';
        button.textContent = clue.title; button.classList.toggle('active', clue.id === selectedClueId);
        button.addEventListener('click', () => { selectedClueId = clue.id; renderContextSidebar(); }); list.append(button); }
      const picker=document.createElement('details'),pickerTitle=document.createElement('summary');pickerTitle.textContent='Choose another clue';picker.append(pickerTitle,list);
      const clue = clues.find(item => item.id === selectedClueId);
      const heading = document.createElement('h3'); heading.textContent = clue.title; clueRoot.append(heading);
      sidebarLine(clueRoot, 'Status', clue.status); sidebarLine(clueRoot, 'Who knows', clue.whoKnows);
      sidebarLine(clueRoot, 'Players saw', clue.playerSaw); sidebarLine(clueRoot, 'DM detail', clue.detail);
      const badge = document.createElement('small'); badge.textContent = 'DM ONLY · opens on the TV only when you explicitly publish it'; clueRoot.append(badge,picker);
    }
  }

  function renderPlayerHandout() {
    const drawer = $('player-handout');
    const handout = state.handout;
    drawer.hidden = !handout?.visible;
    drawer.replaceChildren();
    if (!handout?.visible) return;
    const title = document.createElement('h2');
    title.textContent = handout.title || 'Handout';
    drawer.appendChild(title);
    if (safeImageSource(handout.image)) {
      const img = document.createElement('img');
      img.src = handout.image; img.alt = handout.title || 'Player handout';
      drawer.appendChild(img);
    }
    if (handout.text) {
      const text = document.createElement('p');
      text.textContent = handout.text;
      drawer.appendChild(text);
    }
  }

  function renderPlayerCharacter() {
    const panel = $('player-character');
    const view = state.partyView;
    panel.hidden = !view;
    panel.replaceChildren();
    if (!view) return;
    const line = (tag, value) => { const el = document.createElement(tag); el.textContent = value; panel.append(el); };
    line('h2', view.name || 'Character');
    line('p', `${view.ancestry || ''} ${view.className || ''} · level ${view.level ?? '?'}`);
    line('p', `${view.showHp ? `AC ${view.ac ?? '?'} · HP ${view.hp ?? '?'}/${view.maxHp ?? '?'}${view.tempHp ? ` +${view.tempHp} temporary` : ''} · ` : ''}Speed ${view.speed ?? '?'} ft.`);
    if (view.senses) line('p', view.senses);
    const status = [view.inspiration ? 'Inspiration' : '', view.exhaustion ? `Exhaustion ${view.exhaustion}` : '',
      view.concentration ? `Concentrating: ${view.concentration}` : '', ...(view.conditions || [])].filter(Boolean);
    if (status.length) line('p', status.join(' · '));
    if (view.publicNotes) line('p', view.publicNotes);
    if (view.attacks?.length) {
      line('h3', 'Actions');
      const list = document.createElement('ul');
      for (const item of view.attacks) {
        const entry = document.createElement('li');
        entry.textContent = `${item.name} · ${item.type}${item.attackBonus === null ? '' : ` · ${item.attackBonus >= 0 ? '+' : ''}${item.attackBonus} to hit`}${item.damageDice ? ` · ${item.damageDice} ${item.damageType}` : ''}${item.saveDC === null ? '' : ` · ${item.saveAbility} DC ${item.saveDC}`}`;
        if (item.effect) entry.append(document.createElement('br'), document.createTextNode(item.effect));
        list.append(entry);
      }
      panel.append(list);
    }
    if (view.resources?.length) {
      line('h3', 'Remaining');
      const list = document.createElement('ul');
      for (const item of view.resources) {
        const entry = document.createElement('li');
        entry.textContent = `${item.name}: ${item.current ?? '?'}/${item.max ?? '?'}`;
        list.append(entry);
      }
      panel.append(list);
    }
  }

  function renderCampaignSelect() {
    const select = $('campaign-select');
    const available = campaignRegistry.campaigns.filter(item => !item.archived);
    const signature = available.map(item => `${item.id}:${item.name}`).join('|');
    if (select.dataset.signature !== signature) {
      select.replaceChildren();
      for (const campaign of available) {
        const option = document.createElement('option');
        option.value = campaign.id; option.textContent = campaign.name;
        select.appendChild(option);
      }
      select.dataset.signature = signature;
    }
    select.value = activeCampaignId;
  }

  function renderSessionSelect() {
    const select = $('session-select');
    const packOrder = ['next-session-4','next-session-5','next-session-6','phandalin-aftermath-next', 'phandalin-session-2', 'gundren-session-3', 'lmop-part-4-visuals', 'phandalin-waterdeep-transition', 'mending-court-home', 'waterdeep-undermountain-1', 'silent-library-expedition', 'lmop-part-3-visuals', 'cragmaw-continuation'];
    const packs = (globalThis.ECHO_CONTENT_PACKS || []).filter(pack =>
      !campaignIndex.sessions.some(session => session.packId === pack.id ||
        session.name === (pack.defaultName || 'Cragmaw Hideout · continuation')))
      .sort((a, b) => packOrder.indexOf(a.id) - packOrder.indexOf(b.id));
    const signature = `${campaignIndex.sessions.map(s => `${s.id}:${s.name}:${s.packId || ''}`).join('|')}::${packs.map(p => p.id).join('|')}`;
    if (select.dataset.signature !== signature) {
      select.replaceChildren();
      const saved = document.createElement('optgroup');
      saved.label = 'Saved sessions';
      for (const session of campaignIndex.sessions) {
        const option = document.createElement('option');
        option.value = session.id; const siblings=campaignIndex.sessions.filter(s=>s.name===session.name); option.textContent = session.name+(siblings.length>1?` · saved copy ${siblings.findIndex(s=>s.id===session.id)+1}`:'');
        saved.appendChild(option);
      }
      select.appendChild(saved);
      if (packs.length) {
        const ready = document.createElement('optgroup');
        ready.label = 'Start from a session pack';
        for (const pack of packs) {
          const option = document.createElement('option');
          option.value = `pack:${pack.id}`;
          option.textContent = `${pack.defaultName || pack.name} · create`;
          ready.appendChild(option);
        }
        select.appendChild(ready);
      }
      select.dataset.signature = signature;
    }
    select.value = activeSessionId;
    $('delete-session').disabled = activeSessionId === 'session-01' || campaignIndex.sessions.length <= 1;
  }

  function renderSceneSelect() {
    const select = $('scene-select');
    const scenes = sceneEntries();
    const signature = `${activeSessionId}:${scenes.map(s => `${s.id}:${s.title}`).join('|')}`;
    if (select.dataset.signature !== signature) {
      select.replaceChildren();
      for (const scene of scenes) {
        const option = document.createElement('option');
        option.value = scene.id; option.textContent = scene.title;
        select.appendChild(option);
      }
      select.dataset.signature = signature;
    }
    select.value = state.scene;
  }

  function renderEncounterSelect() {
    const select = $('encounter-select');
    const encounters = sessionEncounters();
    const signature = `${activeSessionId}:${encounters.map(e => `${e.id}:${e.name}`).join('|')}`;
    if (select.dataset.signature !== signature) {
      select.replaceChildren();
      const all = document.createElement('option');
      all.value = 'all'; all.textContent = 'All encounters'; select.appendChild(all);
      for (const encounter of encounters) {
        const option = document.createElement('option');
        option.value = encounter.id; option.textContent = encounter.name; select.appendChild(option);
      }
      select.dataset.signature = signature;
    }
    if (selectedEncounter !== 'all' && !encounters.some(e => e.id === selectedEncounter)) selectedEncounter = encounters[0]?.id || 'all';
    select.value = selectedEncounter;
  }

  function updateBuilderSelect(id, choices, includeBlank = true) {
    const select = $(id);
    const signature = choices.map(item => `${item.id}:${item.title || item.name}`).join('|');
    if (select.dataset.signature === signature) return;
    const prior = select.value;
    select.replaceChildren();
    if (includeBlank) {
      const none = document.createElement('option');
      none.value = ''; none.textContent = 'None'; select.appendChild(none);
    }
    for (const choice of choices) {
      const option = document.createElement('option');
      option.value = choice.id; option.textContent = choice.title || choice.name;
      select.appendChild(option);
    }
    select.value = choices.some(item => item.id === prior) ? prior : '';
    select.dataset.signature = signature;
  }

  function renderHandoutChoices() {
    const select = $('handout-image');
    const scenes = state.sessionKind === 'custom' ? state.scenes.filter(s => s.image && s.kind !== 'black') : [];
    const catalog = globalThis.LMOP_VISUAL_CATALOG || [];
    const signature = `${activeSessionId}:${scenes.map(s => `${s.id}:${s.title}`).join('|')}:${catalog.length}`;
    if (select.dataset.signature === signature) return;
    const prior = select.value;
    select.querySelectorAll('option[data-session-image]').forEach(option => option.remove());
    for (const scene of scenes) {
      const option = document.createElement('option');
      option.value = `scene:${scene.id}`;
      option.textContent = `This session · ${scene.title}`;
      option.dataset.sessionImage = 'true';
      select.appendChild(option);
    }
    for (const item of catalog) {
      const option = document.createElement('option');
      option.value = item.image;
      option.textContent = `${item.chapter} · ${item.title}`;
      option.dataset.sessionImage = 'true';
      select.appendChild(option);
    }
    select.value = [...select.options].some(option => option.value === prior) ? prior : '';
    select.dataset.signature = signature;
  }

  function resetBuilderForms() {
    editingSceneId = null; editingBeatId = null;
    for (const id of ['scene-name', 'new-encounter-name', 'new-encounter-note', 'new-token-name',
      'beat-title', 'beat-read', 'beat-run', 'beat-private']) if ($(id)) $(id).value = '';
    if ($('scene-image-file')) $('scene-image-file').value = '';
    if ($('scene-kind')) $('scene-kind').value = 'map';
    if ($('scene-fog')) $('scene-fog').checked = false;
    if ($('scene-grid')) $('scene-grid').checked = false;
    if ($('scene-columns')) $('scene-columns').value = '30';
    if ($('new-token-count')) $('new-token-count').value = '1';
    if ($('save-scene')) $('save-scene').textContent = 'Add scene';
    if ($('save-beat')) $('save-beat').textContent = 'Add beat';
    if ($('cancel-scene-edit')) $('cancel-scene-edit').hidden = true;
    if ($('cancel-beat-edit')) $('cancel-beat-edit').hidden = true;
  }

  function editScene(id) {
    const scene = getScene(id);
    if (!scene || state.sessionKind !== 'custom') return;
    editingSceneId = id;
    $('scene-name').value = scene.title;
    $('scene-kind').value = scene.kind === 'black' ? 'visual' : scene.kind;
    $('scene-fog').checked = scene.fog === true;
    $('scene-grid').checked = scene.grid === true;
    $('scene-columns').value = scene.gridColumns || 30;
    $('scene-image-file').value = '';
    $('save-scene').textContent = 'Save scene';
    $('cancel-scene-edit').hidden = false;
    $('scene-name').closest('details').open = true;
    $('scene-name').focus();
  }

  function removeScene(id) {
    const scene = getScene(id);
    if (!scene || ['cover', 'black'].includes(id)) return;
    if (!window.confirm(`Remove “${scene.title}” and its map marks from this session?`)) return;
    state.scenes = state.scenes.filter(item => item.id !== id);
    state.tokens.forEach(t => { if (t.scene === id) { t.scene = ''; t.placed = false; } });
    state.annotations = state.annotations.filter(mark => mark.scene !== id);
    state.runbookBeats.forEach(beat => { if (beat.scene === id) beat.scene = ''; });
    $('runbook-content').dataset.current = '';
    delete state.sceneFog[id];
    if (state.turn.scene === id) state.turn = { scene: '', round: 0, order: [], index: 0 };
    state.requests = [];
    if (state.scene === id) state.scene = 'cover';
    if (editingSceneId === id) resetBuilderForms();
    commit(`Removed scene: ${scene.title}`);
  }

  function renderSessionBuilder() {
    const custom = state.sessionKind === 'custom';
    $('custom-session-tools').hidden = !custom;
    $('session-builder-help').textContent = custom
      ? 'The party carried forward from the previous session. Add maps, encounters, combatants, and the words you want ready at the table.'
      : 'Session 1 is ready to run. Use New session to prepare what happens next.';
    renderHandoutChoices();
    if (!custom) return;
    updateBuilderSelect('new-token-encounter', state.encounters);
    updateBuilderSelect('beat-encounter', state.encounters);
    updateBuilderSelect('beat-scene', state.scenes.filter(s => s.kind !== 'black'));
    const sceneList = $('scene-builder-list');
    sceneList.replaceChildren();
    for (const scene of state.scenes) {
      const row = document.createElement('div');
      row.className = 'builder-row';
      const text = document.createElement('span');
      text.textContent = `${scene.title} · ${scene.kind}${scene.fog ? ' · fog' : ''}`;
      row.appendChild(text);
      if (scene.id !== 'black') addSmallButton(row, 'Edit', () => editScene(scene.id));
      if (!['cover', 'black'].includes(scene.id) && !TOWN_MAP_IDS.includes(scene.id))
        addSmallButton(row, 'Remove', () => removeScene(scene.id));
      sceneList.appendChild(row);
    }
    const encounterList = $('encounter-builder-list');
    encounterList.replaceChildren();
    for (const encounter of state.encounters) {
      const row = document.createElement('div');
      row.className = 'builder-row';
      const text = document.createElement('span');
      text.textContent = encounter.name;
      row.appendChild(text);
      addSmallButton(row, 'Edit', () => {
        const name = window.prompt('Encounter name:', encounter.name);
        if (name === null || !name.trim()) return;
        const note = window.prompt('DM note:', encounter.note);
        if (note === null) return;
        encounter.name = name.trim().slice(0, 80);
        encounter.note = note.trim().slice(0, 500);
        commit(`Updated encounter: ${encounter.name}`);
      });
      addSmallButton(row, 'Remove', () => {
        if (!window.confirm(`Remove “${encounter.name}”? Its combatants will remain available.`)) return;
        state.encounters = state.encounters.filter(item => item.id !== encounter.id);
        delete state.combat.plans[encounter.id];
        state.tokens.forEach(t => { if (t.encounter === encounter.id) t.encounter = ''; });
        state.runbookBeats.forEach(beat => { if (beat.encounter === encounter.id) beat.encounter = ''; });
        selectedEncounter = 'all';
        commit(`Removed encounter: ${encounter.name}`);
      });
      encounterList.appendChild(row);
    }
  }

  async function readMapImage(file) {
    if (!file) return '';
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG, or WebP image.');
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error('The image could not be opened.'));
        element.src = url;
      });
      const ratio = Math.min(1, 1800 / image.width, 1200 / image.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * ratio));
      canvas.height = Math.max(1, Math.round(image.height * ratio));
      const context = canvas.getContext('2d');
      context.fillStyle = '#16151a'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', .82);
      if (data.length >= 8000000) throw new Error('That image is too large for a session.');
      return data;
    } finally { URL.revokeObjectURL(url); }
  }

  async function saveSceneFromForm() {
    if (state.sessionKind !== 'custom') return;
    const title = $('scene-name').value.trim().slice(0, 80);
    if (!title) { toast('Give the scene a name.'); return; }
    const kind = $('scene-kind').value;
    const existing = editingSceneId ? getScene(editingSceneId) : null;
    let image = existing?.image || '';
    const file = $('scene-image-file').files?.[0];
    if (file) try {
      const data = await readMapImage(file);
      const assetId = `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      state.assets[assetId] = data;
      image = `asset:${assetId}`;
    } catch (error) { toast(error.message); return; }
    const id = existing?.id || `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const scene = { id, title, kind, image, fog: kind === 'map' && $('scene-fog').checked,
      grid: kind === 'map' && $('scene-grid').checked,
      gridColumns: Math.max(5, Math.min(100, bounded($('scene-columns').value || 30, 100))) };
    if (existing) Object.assign(existing, scene);
    else state.scenes.splice(Math.max(1, state.scenes.length - 1), 0, scene);
    if (scene.fog && !state.sceneFog[id]) state.sceneFog[id] = [];
    if (!scene.fog) delete state.sceneFog[id];
    if (kind !== 'map') {
      state.tokens.forEach(t => { if (t.scene === id) { t.scene = ''; t.placed = false; } });
      if (state.turn.scene === id) state.turn = { scene: '', round: 0, order: [], index: 0 };
    }
    state.scene = id; state.grid = scene.grid;
    resetBuilderForms();
    commit(`${existing ? 'Updated' : 'Added'} scene: ${title}`);
  }

  function addEncounterFromForm() {
    if (state.sessionKind !== 'custom') return;
    const name = $('new-encounter-name').value.trim().slice(0, 80);
    if (!name) { toast('Give the encounter a name.'); return; }
    const encounter = { id: `encounter-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name, note: $('new-encounter-note').value.trim().slice(0, 500) };
    state.encounters.push(encounter);
    selectedEncounter = encounter.id;
    $('new-encounter-name').value = ''; $('new-encounter-note').value = '';
    commit(`Added encounter: ${name}`);
  }

  function addCombatantsFromForm() {
    if (state.sessionKind !== 'custom') return;
    const name = $('new-token-name').value.trim().slice(0, 60);
    if (!name) { toast('Give the combatant a name.'); return; }
    const count = Math.max(1, Math.min(20, bounded($('new-token-count').value, 20)));
    const team = $('new-token-team').value;
    const type = $('new-token-type').value;
    const hp = bounded($('new-token-hp').value);
    const ac = $('new-token-ac').value === '' ? AC_DEFAULTS[type] ?? null : bounded($('new-token-ac').value, 99);
    const encounter = team === 'enemy' ? $('new-token-encounter').value : '';
    for (let i = 0; i < count; i++) {
      const number = i + 1;
      const display = count > 1 ? `${name} ${number}` : name;
      const label = count > 1 ? `${name[0].toUpperCase()}${number}`.slice(0, 4)
        : name.split(/\s+/).map(word => word[0].toUpperCase()).join('').slice(0, 3);
      const t = token(`custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, display,
        label || '?', type, team, hp, encounter);
      t.ac = ac;
      state.tokens.push(t);
    }
    if (encounter) selectedEncounter = encounter;
    $('new-token-name').value = '';
    commit(`Added ${count} ${name}${count === 1 ? '' : ' combatants'}`);
  }

  function editBeat(id) {
    const beat = state.runbookBeats?.find(item => item.id === id);
    if (!beat) return;
    editingBeatId = id;
    $('beat-title').value = beat.title;
    $('beat-scene').value = beat.scene;
    $('beat-encounter').value = beat.encounter;
    $('beat-read').value = beat.read.join('\n\n');
    $('beat-run').value = beat.run.join('\n\n');
    $('beat-private').value = beat.private.join('\n\n');
    $('save-beat').textContent = 'Save beat';
    $('cancel-beat-edit').hidden = false;
    $('beat-title').closest('details').open = true;
    $('beat-title').focus();
  }

  function saveBeatFromForm() {
    if (state.sessionKind !== 'custom') return;
    const title = $('beat-title').value.trim().slice(0, 100);
    if (!title) { toast('Give this DM beat a title.'); return; }
    const paragraphs = id => $(id).value.split(/\n\s*\n/).map(text => text.trim()).filter(Boolean);
    const id = editingBeatId || `beat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const beat = { id, title, scene: $('beat-scene').value,
      encounter: $('beat-encounter').value, read: paragraphs('beat-read'),
      run: paragraphs('beat-run'), private: paragraphs('beat-private') };
    const current = state.runbookBeats.find(item => item.id === id);
    if (current) Object.assign(current, beat);
    else state.runbookBeats.push(beat);
    state.runbook = id;
    $('runbook-content').dataset.current = '';
    resetBuilderForms();
    commit(`${current ? 'Updated' : 'Added'} DM beat: ${title}`);
  }

  function renderDM() {
    globalThis.ECHO_ACTION_RECEIPTS?.setScope(activeCampaignId+'/'+activeSessionId);
    globalThis.ECHO_SETTLEMENTS_UI?.refresh();
    const townButton=$('quick-settlements');if(townButton&&globalThis.ECHO_SETTLEMENTS){const count=globalThis.ECHO_SETTLEMENTS.due(globalThis.ECHO_SETTLEMENTS.data(campaignIndex.tableExtras)).length;townButton.textContent=`♜ Towns${count?' ('+count+' due)':''}`;}
    globalThis.ECHO_ATMOSPHERE_UI?.sync();globalThis.ECHO_ATMOSPHERE_UI?.refresh();
    globalThis.ECHO_DUNGEON_UI?.refresh();
    const dungeonButton=$('quick-dungeon');if(dungeonButton){const n=dungeonData()?.requests.filter(r=>['waiting','approved'].includes(r.status)).length||0;dungeonButton.textContent=`▥ Dungeon${n?' ('+n+')':''}`;}

    globalThis.ECHO_TRAVEL_UI?.refresh?.();
    const travelButton=$('quick-travel');if(travelButton){const n=globalThis.ECHO_TRAVEL?.data(campaignIndex.tableExtras).requests.filter(r=>r.status==='waiting').length||0;travelButton.textContent=`⚑ Travel${n?' ('+n+')':''}`;}
    if (IS_PLAYER) return;
    renderCampaignSelect();
    renderSessionSelect();
    renderSceneSelect();
    renderEncounterSelect();
    $('show-grid').checked = state.grid;
    $('player-reveal').checked = state.playerReveal;
    $('grid-control').hidden = !currentIsMap() || (state.sessionKind === 'session1' && !['road', 'approach'].includes(state.scene));
    $('fog-panel').hidden = !sceneHasFog();
    $('bring-party').disabled = !currentIsMap();
    $('inspiring-leader').hidden = !getToken('ally-dracuseth');
    $('leader-temp-hp-label').hidden = !getToken('ally-dracuseth');
    $('leader-temp-hp').value = state.leaderTempHp;
    $('party-help').textContent = 'Current campaign sheets supply HP and AC. Damage uses temporary HP first; use Characters & party for sheet changes.';
    $('dm-scene-title').textContent = displaySceneTitle(getScene(state.scene)?.title) || 'Scene';
    $('map-instruction').textContent = sceneHasFog()
      ? 'Drag across shaded squares to reveal this map.'
      : currentIsMap() ? 'Drag roster icons onto this map.' : 'Choose a battle map when combat begins.';
    renderStage('dm');
    renderRunbook();
    renderRosters();
    renderRequests();
    globalThis.ECHO_PHONE?.refresh();
    renderDMTurnBar();
    globalThis.ECHO_COMBAT_RUN?.render();
    globalThis.ECHO_COMBAT_PLUS_UI?.render();
    renderRollHistory();
    renderCombatCard();
    renderSessionLog();
    renderHandoutControls();
    globalThis.ECHO_TV_TEXT?.renderDM();
    renderSessionBuilder();
    $('map-tools').hidden = !currentIsMap();
    updateConnection();
    globalThis.ECHO_PARTY_UI?.refresh();
    globalThis.ECHO_COMBAT_UI?.refresh();
    globalThis.ECHO_MAP_UI?.render();
    if(!expeditionEditing)globalThis.ECHO_STORY_UI?.render();
    globalThis.ECHO_PRESENTATION?.renderDM();
    globalThis.ECHO_TABLE?.render();
    globalThis.ECHO_PLAYER_TOOLS_UI?.render();
    globalThis.ECHO_ERGONOMICS?.render();
    globalThis.ECHO_RELIABILITY?.render();
    globalThis.ECHO_GUIDED?.render();
    globalThis.ECHO_COCKPIT?.refresh();
    globalThis.ECHO_TABLE_FLOW?.render();
    globalThis.ECHO_HYBRID_UI?.refresh();
  }

  let tvInteraction=false;
  function applyTVPresentation(){const app=$('player-app'),d=state.map?.display||{},quiet=d.tvPreset!=='classic';app.classList.toggle('tv-quiet',quiet);app.classList.toggle('tv-interaction',tvInteraction);for(const surface of app.querySelectorAll('.player-frame,.player-text-cards button,.player-handout button,.player-journal button,.player-character button,.player-presentation button'))surface.inert=!tvInteraction;app.dataset.objective=String(d.showObjective!==false);app.dataset.subtitles=String(d.showSubtitles!==false);app.style.setProperty('--tv-overlay-edge',Math.max(0,Math.min(15,Number(d.safeEdge)||0))+'%');const b=$('player-interaction-toggle');b.textContent=tvInteraction?'Interaction on · close controls':'Controls & interaction';b.setAttribute('aria-pressed',String(tvInteraction));b.title='Map interaction still requires DM permission';}
  function renderPlayer() {
    let practice=$('practice-tv-label');if(!practice){practice=document.createElement('div');practice.id='practice-tv-label';practice.textContent='PRACTICE CAMPAIGN';$('player-app').append(practice);}practice.hidden=!String(state.sessionName||'').startsWith('PRACTICE · ');
    if (!IS_PLAYER) return;
    applyTVPresentation();
    $('player-scene-title').textContent = globalThis.ECHO_MAP_DATA.displayTitle(displaySceneTitle(getScene(state.scene)?.title));
    const calibration=$('player-calibration-overlay');
    calibration.hidden=state.calibrationCheck!==true;
    calibration.style.inset=`${Math.max(0,Math.min(15,Number(state.map?.display?.safeEdge)||0))}%`;
   $('player-hint').textContent = state.map?.playerInput === false ? 'The DM is guiding this scene.' : sceneHasFog()
     ? state.playerReveal ? 'Drag your hero; click dark areas to explore.' : 'Drag your hero; click dark areas to ask the DM to explore.'
      : TOWN_MAP_IDS.includes(state.scene) ? 'Click glowing stars to explore places. Drag your hero to move.'
        : currentIsMap() ? 'Drag your hero to move.' : state.sessionName || '';
    renderStage('player');
    applyDisplayCalibration();
    renderPlayerTurnBar();
    renderPlayerHandout();
    globalThis.ECHO_TV_TEXT?.renderPlayer(state.tvTextCards, state.mainQuest);
    renderPlayerCharacter();
    renderPlayerJournal();
    window.__echoPlayerJournal = state.journal || [];
    globalThis.ECHO_PRESENTATION?.renderPlayer(state.presentation);
    globalThis.ECHO_VOICE_SUBTITLES?.render(state.narration);
    globalThis.ECHO_TABLE?.renderPlayer(state);
    globalThis.ECHO_ATMOSPHERE_VIEW?.finish(state);
    renderPlayerAtlas();
    applyTVPresentation();
  }

  let playerJournalOpen = false;
  function renderPlayerJournal() {
    const entries = state.journal || [];
    const button = $('player-journal-button'), panel = $('player-journal');
    button.hidden = !entries.length;
    if (!entries.length) playerJournalOpen = false;
    button.textContent = playerJournalOpen ? 'Close journal' : `Journal (${entries.length})`;
    panel.hidden = !playerJournalOpen;
    panel.replaceChildren();
    if (!playerJournalOpen) return;
    const heading = document.createElement('h2'); heading.textContent = 'Party journal'; panel.appendChild(heading);
    for (const entry of entries) {
      const article = document.createElement('article');
      const title = document.createElement('h3'); title.textContent = entry.title; article.appendChild(title);
      const meta = document.createElement('small'); meta.textContent = [entry.kind, entry.when].filter(Boolean).join(' · '); article.appendChild(meta);
      const body = document.createElement('p'); body.textContent = entry.text; article.appendChild(body);
      panel.appendChild(article);
    }
  }

  function handleDMMessage(event) {
    const data = event.data;
    if (!data || data.app !== APP) return;
    if (tvChannel && !event.broadcast) return;
    if (location.protocol !== 'file:' && event.origin !== location.origin) return;
    if (data.kind === 'hello') {
      try {
        if (location.protocol === 'file:' && !event.broadcast) {
          // Opaque file origins can forbid reading the popup location even for our own TV.
          if (event.source !== playerWindow && !playerClients.has(event.source) && event.source?.opener !== window) return;
        } else if (event.source?.opener !== window || event.source.location.hash !== '#player') return;
      } catch { return; }
      const info = playerClients.get(event.source) || { heartbeat: 0, ackAt: 0, bootId: '', error: '', viaChannel: !!event.broadcast };
      const newPlayerBoot = data.bootId !== info.bootId;
      info.bootId = data.bootId;
      info.heartbeat = Date.now();
      playerClients.set(event.source, info);
      playerWindow = event.source;
      const viewportChanged = !playerViewport || playerViewport.width !== data.width || playerViewport.height !== data.height;
      if (Number.isFinite(data.width) && Number.isFinite(data.height)) playerViewport = { width: data.width, height: data.height };
      if (Number.isFinite(data.renderMs)) playerRenderMs = data.renderMs;
      connected = true;
      if (newPlayerBoot || viewportChanged || !info.ackAt || Date.now() - info.ackAt > 6500)
        sendToPlayer(event.source);
      else {
        event.source.postMessage({ app: APP, kind: 'dm-heartbeat' }, '*');
        updateConnection();
      }
      if (viewportChanged) globalThis.ECHO_MAP_UI?.render();
      return;
    }
    const info = playerClients.get(event.source);
    if (!info) return;
    if (data.kind === 'ack') {
      if (Number.isInteger(data.revision) && data.revision <= lastSentRevision) {
        info.ackAt = Date.now(); info.ackRevision=Math.max(info.ackRevision||0,data.revision);if(info.ackRevision>=info.sentRevision)info.pendingSince=0;info.error = '';
      }
      updateConnection(); return;
    }
    if (data.kind === 'render-error') {
      info.error = String(data.message || 'unknown error').slice(0, 120);
      updateConnection(); return;
    }
    if (data.kind === 'media-request') {
      const id = String(data.id || '');
      const allowed = globalThis.ECHO_PRESENTATION?.publicMediaIds(state.presentation, campaignIndex.presentation) || [];
      if (allowed.includes(id)) void readRecord(`media:${id}`).then(blob => {
        if (blob instanceof Blob && !event.source.closed)
          event.source.postMessage({ app: APP, kind: 'media-asset', id, blob }, '*');
      });
      return;
    }
    if (state.map?.playerInput === false) return;
    if (data.kind === 'move-token') {
      const t = getToken(data.id);
      if (!t || t.team !== 'pc' || !t.placed || t.scene !== state.scene ||
        !Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
      state.phoneRequests = state.phoneRequests.filter(request => !(request.kind === 'move' && request.characterId === t.id && request.scene === state.scene));
      state.phoneRequests.push({ id: `tv-move-${Date.now()}-${t.id}`, kind: 'move', scene: state.scene,
        characterId: t.id, x: pointValue(data.x), y: pointValue(data.y) });
      state.phoneRequests = state.phoneRequests.slice(-40);
      commit(`${t.name} requested movement from the TV`);
    } else if (data.kind === 'explore-request' && sceneHasFog() && currentTile(data.key)) {
      if (!fogForScene().includes(data.key) && !state.requests.includes(data.key)) {
        state.requests.push(data.key); commit(); toast('The players asked to explore a map area.');
      }
    } else if (data.kind === 'reveal-tile' && sceneHasFog() && state.playerReveal && currentTile(data.key)) {
      revealTile(data.key);
    } else if (data.kind === 'point-request') {
      const point = presentedMapScene().points.find(p => p.id === data.id && p.visible && p.approved);
      if (point && globalThis.ECHO_TOWN_MAPS?.isTown(state.scene) && point.clue) {
        state.handout = { visible: true, image: '', title: point.title, text: point.clue };
        commit(`Players explored: ${point.title}`);
        toast(`Players explored: ${point.title}`);
      } else if (point) {
        toast(`Players explored: ${point.title}`);
        state.sessionLog.unshift({ label: `Players explored: ${point.title}`, time: new Date().toLocaleTimeString(), round: state.turn.round, actor: '' });
        renderSessionLog();
      }
    } else if (data.kind === 'link-request') {
      const link = mapSceneData().links.find(p => p.id === data.id && p.visible);
      if (link) toast(`Players want to use ${link.title}. Open Maps & exploration to change scenes.`);
    }
  }

  function handleTVChannelMessage(event) {
    const data = event.data;
    if (!data || data.app !== APP || !data.clientId || (data.toDm && data.toDm !== dmInstanceId)) return;
    let source = channelSources.get(data.clientId);
    if (!source) {
      source = {
        opener: window, location: { hash: '#player' }, closed: false,
        postMessage(message) {
          tvChannel.postMessage({ ...message, toClient: data.clientId, dmId: dmInstanceId, dmStartedAt });
        }
      };
      channelSources.set(data.clientId, source);
    }
    handleDMMessage({ data, source, origin: location.origin, broadcast: true });
  }

  function applyDisplayCalibration() {
    if (!IS_PLAYER) return;
    const display = state.map?.display;
    const stage = $('player-stage');
    if (!display) return;
    const columns = getScene(state.scene)?.gridColumns || MAP_SQUARES_ACROSS;
    const result = globalThis.ECHO_MAP_DATA?.calibration(display, columns, window.innerWidth, window.innerHeight);
    if (result) { stage.style.width = `${result.width}px`; stage.style.maxHeight = 'none'; }
    $('player-app').classList.toggle('portrait-display', display.orientation === 'portrait');
  }

  function updatePlayerLink() {
    if (!IS_PLAYER) return;
    const age=Date.now()-(activeDmAt||playerStartedAt),stale=age>7500;
    const status=$('player-link-status'),warning=$('player-link-warning');
    status.dataset.state=stale?'stale':playerLastAppliedRevision?'current':'waiting';
    status.textContent=stale?`DM disconnected · update ${playerLastAppliedRevision||'none'}`:
      playerLastAppliedRevision?`DM seen ${Math.max(0,Math.round(age/1000))}s ago · update ${playerLastAppliedRevision}`:'Waiting for DM · no update yet';
    warning.hidden=!stale;
    if(stale)warning.textContent=`TV connection lost · this view may be out of date. Last update ${playerLastAppliedRevision||'none'}${activeDmAt?' at '+new Date(activeDmAt).toLocaleTimeString():''}. Ask the DM to resync.`;
  }

  function handlePlayerMessage(event) {
    if (tvChannel ? !event.broadcast : event.source !== window.opener) return;
    const data = event.data;
    if (!data || data.app !== APP) return;
    if (event.broadcast) {
      if (data.toClient !== tvClientId) return;
      if (activeDmId && data.dmId !== activeDmId && data.dmStartedAt < activeDmStartedAt && Date.now() - activeDmAt < 7500) return;
      activeDmId = data.dmId;
      activeDmStartedAt = data.dmStartedAt;
      activeDmAt = Date.now();
    }
    if (data.kind === 'dm-heartbeat') { activeDmAt=Date.now(); updatePlayerLink(); return; }
    if (data.kind === 'media-asset') { globalThis.ECHO_PRESENTATION?.receiveMedia(data.id, data.blob); return; }
    if (data.kind !== 'state') return;
    try {
      activeDmAt=Date.now();
      state = data.payload;
      $('player-app').classList.toggle('reduce-motion', state.reduceMotion === true);
      renderPlayer();
      connected = true;
      playerLastAppliedRevision=data.revision;
      updatePlayerLink();
      document.getElementById('player-sync-error')?.remove();
      postToDM({ app: APP, kind: 'ack', revision: data.revision });
    } catch (error) {
      const message = String(error?.message || error).slice(0, 120);
      postToDM({ app: APP, kind: 'render-error', message });
      let notice = document.getElementById('player-sync-error');
      if (!notice) {
        notice = document.createElement('p'); notice.id = 'player-sync-error'; notice.className = 'load-error';
        $('player-app').prepend(notice);
      }
      notice.textContent = 'The player screen could not update. Check the DM screen, then reload this window.';
    }
  }

  function initPlayer() {
    $('dm-app').hidden = true;
    $('player-app').hidden = false;
    document.title = 'The Echo Below — Player Battlefield';
    $('player-interaction-toggle').addEventListener('click',()=>{tvInteraction=!tvInteraction;applyTVPresentation();});window.addEventListener('keydown',event=>{if(event.key==='Escape'&&tvInteraction){tvInteraction=false;applyTVPresentation();}});
    if(IS_PRIVATE_PREVIEW){document.body.classList.add('private-tv-preview');globalThis.ECHO_TV_LINK={sendToDM:message=>{if(message.kind==='media-request')window.parent.postMessage({...message,kind:'preview-media-request'},'*');}};window.addEventListener('message',event=>{if(event.source!==window.parent||event.data?.app!==APP)return;if(event.data.kind==='preview-media'){globalThis.ECHO_PRESENTATION?.receiveMedia(event.data.id,event.data.blob);return;}if(event.data.kind!=='private-preview-state')return;state=event.data.payload;renderPlayer();});return;}
    $('player-fullscreen').addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    });
    $('player-journal-button').addEventListener('click', () => { playerJournalOpen = !playerJournalOpen; renderPlayerJournal(); });
    window.addEventListener('message', handlePlayerMessage);
    if (tvChannel) tvChannel.onmessage = event => handlePlayerMessage({ data: event.data, broadcast: true });
    globalThis.ECHO_TV_LINK = { sendToDM: postToDM };
    const bootId = `${Date.now()}-${Math.random()}`;
    playerStartedAt=Date.now();
    const hello = () => postToDM({ app: APP, kind: 'hello', bootId, width: innerWidth, height: innerHeight, renderMs: lastMapRenderMs });
    hello();
    setInterval(hello, 2000);
    setInterval(updatePlayerLink, 1000);
    updatePlayerLink();
    window.addEventListener('resize', () => { applyDisplayCalibration(); hello(); });
    renderPlayer();
  }

  function combatTokenRecord(id) {
    return state.combat.tokens[id] ||= globalThis.ECHO_COMBAT_DATA.creatureDefense(getToken(id)?.type, state.combat.creatures);
  }

  function deployEncounterWave(encounterId, index) {
    if (!currentIsMap()) { toast('Choose a battle map before deploying a wave.'); return; }
    const requiredScene = globalThis.ECHO_COMBAT_DATA.expectedScene(encounterId,state.combat.plans);
    if (requiredScene && state.scene !== requiredScene) {
      toast(`Show the ${getScene(requiredScene)?.title || 'matching'} map before deploying this wave.`);
      return;
    }
    const plan = state.combat.plans[encounterId];
    const wave = plan?.waves[index];
    if (!wave) return;
    for (const [position, id] of wave.tokenIds.entries()) {
      const t = getToken(id);
      if (!t || t.hp<=0) continue;
      const point = globalThis.ECHO_COMBAT_DATA.positionFor(wave,id,state.scene,globalThis.ECHO_COMBAT_DATA.expectedScene(encounterId)),sameMap=t.placed&&t.scene===state.scene;
      t.placed = true; t.scene = state.scene;
      t.x = sameMap?t.x:point?.x ?? Math.min(90, 30 + position * 8);
      t.y = sameMap?t.y:point?.y ?? 40;
    }
    wave.deployed = true;
    commit(`Deployed ${wave.name}`);
  }

  function saveEncounterTemplate(encounterId) {
    const encounter = sessionEncounters().find(e => e.id === encounterId);
    if (!encounter) return;
    const plan = state.combat.plans[encounterId] || globalThis.ECHO_COMBAT_DATA.blank(encounterId);
    const combatants = state.tokens.filter(t => t.encounter === encounterId).map(t => ({
      originalId: t.id, name: t.name, label: t.label, type: t.type, team: t.team,
      maxHp: t.maxHp, ac: t.ac, x: t.x, y: t.y }));
    const id = `template-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    state.combat.library.push({ id, name: encounter.name, plan: structuredClone(plan), combatants });
    commit(`Saved ${encounter.name} template`);
  }

  function useEncounterTemplate(templateId) {
    if (state.sessionKind !== 'custom') { toast('Open a custom session to reuse an encounter template.'); return; }
    const entry = state.combat.library.find(item => item.id === templateId);
    if (!entry) return;
    const encounterId = `encounter-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const encounter = { id: encounterId, name: entry.name, note: entry.plan.objective || '' };
    state.encounters.push(encounter);
    const remap = {};
    for (const item of entry.combatants) {
      const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      remap[item.originalId] = id;
      const t = token(id, item.name, item.label, SAFE_TOKEN_TYPES.has(item.type) || state.combat.creatures[item.type] ? item.type : 'custom',
        item.team, bounded(item.maxHp), encounterId);
      t.ac = item.ac; t.x = item.x; t.y = item.y; state.tokens.push(t);
    }
    const plan = globalThis.ECHO_COMBAT_DATA.normalizePlan(entry.plan, encounterId);
    plan.waves = plan.waves.map(wave => ({ ...wave, deployed: false,
      tokenIds: wave.tokenIds.map(id => remap[id] || (getToken(id) ? id : null)).filter(Boolean),
      positions: Object.fromEntries(Object.entries(wave.positions || {}).filter(([id]) => remap[id] || getToken(id))
        .map(([id, value]) => [remap[id] || id, value])) }));
    state.combat.plans[encounterId] = plan;
    selectedEncounter = encounterId;
    commit(`Added ${entry.name} from template`);
  }

  function rollCombatShortcut(label, count, sides, modifier, mode) {
    const c = Math.max(1, Math.min(20, Number(count) || 1));
    const d = [4, 6, 8, 10, 12, 20, 100].includes(Number(sides)) ? Number(sides) : 20;
    const m = signedInteger(modifier, -99, 99);
    let entry;
    if (mode === 'advantage' || mode === 'disadvantage') {
      if (c !== 1 || d !== 20) { toast('Advantage needs one d20.'); return null; }
      entry = recordDiceRoll(label, 2, 20, 0);
      entry.total = (mode === 'advantage' ? Math.max(...entry.parts) : Math.min(...entry.parts)) + m;
      entry.notation = `${mode === 'advantage' ? 'adv' : 'dis'} 2d20${m >= 0 ? '+' : ''}${m}`;
    } else entry = recordDiceRoll(label, c, d, m);
    commit(`Private roll: ${label} = ${entry.total}`);
    return entry;
  }

  function applyReviewedDamage(draft) {
    if(!draft.selected?.length)throw Error('Choose the damage or healing targets.');
    const request=globalThis.ECHO_COMBAT_ACTIONS.stage(state,{actorId:draft.selected[0],actionType:'action',entry:{name:draft.label|| (draft.mode==='heal'?'Manual healing':'Manual damage'),type:'No action',effect:'DM correction / damage event. Review the actual amount, defenses, reactions, and follow-up effects.'},targetIds:draft.selected});
    const plan=globalThis.ECHO_PHONE_ACTIONS.initialPlan(state,request);plan.effectRulingRequired=false;
    plan.steps.forEach(step=>{const defense=draft.overrides?.[step.targetId]||'recorded';Object.assign(step,{kind:draft.mode==='heal'?'heal':'damage',notation:'',manual:draft.amounts?.[step.targetId]??draft.amount,damageType:draft.type,condition:draft.conditions?.[step.targetId]||'',overrides:{[step.targetId]:({recorded:'auto',normal:'none',resist:'resistances',vulnerable:'vulnerabilities',immune:'immunities'})[defense]},concentrationMethod:'reminder'});});
    commit('Staged damage / healing review');
    globalThis.ECHO_PHONE_ACTIONS_UI.open(request.id,plan);
  }

  function combatSaveBonus(id, ability) {
    const sheet = state.party[id];
    if (sheet) return globalThis.ECHO_PARTY_DATA.rankValue(sheet, ability, 'saves');
    const t = getToken(id), creature = globalThis.ECHO_COMBAT_DATA.CREATURES[t?.type] || state.combat.creatures[t?.type];
    return globalThis.ECHO_COMBAT_DATA.creatureSaveBonus(creature, ability);
  }

  function addCreatureCombatant(creatureId, encounterId) {
    if (state.sessionKind !== 'custom') { toast('Open a custom session to add a creature.'); return; }
    const creature = globalThis.ECHO_COMBAT_DATA.CREATURES[creatureId] || state.combat.creatures[creatureId];
    if (!creature) return;
    const name = window.prompt('Name this combatant:', creature.name);
    if (!name?.trim()) return;
    const label = name.trim().split(/\s+/).map(word => word[0].toUpperCase()).join('').slice(0, 3) || '?';
    const t = token(`custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name.trim().slice(0, 60),
      label, creatureId, creatureId === 'sildar-equipped' ? 'ally' : 'enemy', bounded(creature.hp), encounterId || '');
    t.ac = creature.ac ?? null;
    state.tokens.push(t);
    state.combat.tokens[t.id] = globalThis.ECHO_COMBAT_DATA.creatureDefense(creatureId, state.combat.creatures);
    commit(`Added ${t.name} from creature library`);
  }

  function captureDeskLayout(){return {context:contextTab,details:Object.fromEntries([...document.querySelectorAll('.dm-layout details[id]')].map(el=>[el.id,el.open]))};}
  function applyDeskLayout(name){
    if(!globalThis.ECHO_DM_DESK?.layouts.includes(name))return;
    const data=globalThis.ECHO_DM_DESK.data(campaignIndex.tableExtras),preset=data.layouts[name];data.layout=name;
    setWorkspaceMode('run');
    void saveCampaignIndex();renderContextSidebar();
  }
  function restoreDeskLayout(){
    if(!globalThis.ECHO_DM_DESK)return;
    const data=globalThis.ECHO_DM_DESK.data(campaignIndex.tableExtras),name=data.layout,preset=data.layouts[name];
    $('dm-app').dataset.playLayout=name;$('desk-layout').value=name;
    contextTab=preset?.context||({combat:'turn',conversation:'encounter',exploration:'scene'})[name];
    for(const [id,open]of Object.entries(preset?.details||{})){const el=$(id);if(el?.matches?.('.dm-layout details'))el.open=open;}
  }
  function reviewDeskItem(item){
    if(item.otherScene&&!['action','search'].includes(item.kind)){toast(`This item belongs to ${getScene(item.scene)?.title||item.scene}. Return there before resolving it.`);return;}
    if(item.kind==='action')return globalThis.ECHO_PHONE_ACTIONS_UI?.open(item.id);
    if(item.kind==='inventory')return globalThis.ECHO_PLAYER_TOOLS_UI?.open(item.id);
    if(item.kind==='travel')return globalThis.ECHO_TRAVEL_UI?.open();
    if(item.kind==='search')return globalThis.ECHO_DUNGEON_UI?.open();
    if(item.kind==='town')return globalThis.ECHO_SETTLEMENTS_UI?.open('jobs',campaignIndex.tableExtras.settlements?.jobs.find(j=>j.id===item.id)?.town);
    if(['phone','fog'].includes(item.kind))return globalThis.ECHO_DM_DESK_UI?.legacy(item);
    if(item.kind==='timer')return globalThis.ECHO_MAP_UI?.open('explore');
    if(['save','reaction','damage','reminder'].includes(item.kind))return globalThis.ECHO_COMBAT_PLUS_UI?.open(item.kind==='save'?'saves':item.kind==='reminder'?'areas':'damage');
    if(item.kind==='effect')return globalThis.ECHO_COMBAT_UI?.open('flow');
    if(item.tokenId)return openCombatCard(item.tokenId);
    if(item.kind==='continuity')return globalThis.ECHO_STORY_UI?.open('continuity');
    if(['expedition','choice'].includes(item.kind))return globalThis.ECHO_EXPEDITION_UI?.open(item.kind==='choice'?'endings':'floor');
    contextTab='turn';renderContextSidebar();
  }
  function setWorkspaceMode(mode) {
    if (!['prep', 'run', 'review'].includes(mode)) mode = 'run';
    const run = mode === 'run';
    if(run)restoreDeskLayout();
    $('dm-app').classList.toggle('run-mode', run);
    $('dm-app').classList.toggle('prep-mode', mode === 'prep');
    $('dm-app').classList.toggle('review-mode', mode === 'review');
    $('mode-run').classList.toggle('active', run);
    $('mode-prep').classList.toggle('active', mode === 'prep');
    $('mode-review').classList.toggle('active', mode === 'review');
    $('mode-run').setAttribute('aria-pressed', String(run));
    $('mode-prep').setAttribute('aria-pressed', String(mode === 'prep'));
    $('mode-review').setAttribute('aria-pressed', String(mode === 'review'));
    $('review-workspace').hidden = mode !== 'review';
    if (mode !== 'run') document.querySelector('.handout-panel')?.classList.remove('quick-open');
    if (campaignIndex.ergonomics) { campaignIndex.ergonomics.mode = mode; void saveCampaignIndex(); }
    globalThis.ECHO_ERGONOMICS?.render();
    globalThis.ECHO_COCKPIT?.workspace(mode);
    document.querySelector('.sidebar')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function initDM() {
    $('player-app').hidden = true;
    populateHandoutFields();
    globalThis.ECHO_ENCOUNTER_LAUNCH?.init({
      get state() { return state; }, beats: () => sessionRunbook(), encounters: () => sessionEncounters(), scenes: () => sceneEntries(),
      media: () => campaignIndex.presentation?.media || [],
      musicHint: () => storyPlan().music || '', selectedEncounter: () => selectedEncounter,
      sceneImage: scene => resolveImage(scene?.image || ''), toast, launch: launchPreparedEncounter,
      showEncounter: id => { selectedEncounter = id; contextTab = 'encounter'; renderEncounterSelect(); renderRosters(); renderContextSidebar(); },
      refresh: renderContextSidebar
    });
    for (const button of document.querySelectorAll('[data-context-tab]')) button.addEventListener('click', () => {
      contextTab = button.dataset.contextTab; renderContextSidebar();
    });
    $('quick-scene').addEventListener('click', () => { contextTab = 'scene'; previewSceneId = state.scene; renderContextSidebar(); });
    $('quick-inbox')?.addEventListener('click',()=>{contextTab='requests';renderContextSidebar();});
    $('quick-desk')?.addEventListener('click',()=>globalThis.ECHO_DM_DESK_UI?.open());
    $('desk-layout')?.addEventListener('change',event=>applyDeskLayout(event.target.value));
    $('quick-expedition')?.addEventListener('click',()=>globalThis.ECHO_EXPEDITION_UI?.open());
    $('quick-settlements')?.addEventListener('click',()=>globalThis.ECHO_SETTLEMENTS_UI?.open());
    $('quick-atmosphere')?.addEventListener('click',()=>globalThis.ECHO_ATMOSPHERE_UI?.open());
    $('quick-dungeon')?.addEventListener('click',()=>globalThis.ECHO_DUNGEON_UI?.open());
    $('quick-travel')?.addEventListener('click',()=>globalThis.ECHO_TRAVEL_UI?.open());
    $('quick-region-map').addEventListener('click', () => { previewSceneId='region-lmop';contextTab='scene';renderContextSidebar(); });
    for (const id of ['handout-image', 'handout-title', 'handout-text']) {
      $(id).addEventListener('input', renderHandoutPreview);
      $(id).addEventListener('change', renderHandoutPreview);
    }
    globalThis.ECHO_TV_TEXT?.initDM({ cards: () => state.tvTextCards, commit, toast });
    $('quick-tv-text').addEventListener('click', () => {
      const panel = $('tv-text-panel');
      panel.querySelector('details').open = true;
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('tv-text-title').focus();
    });
    const restoreEntries=new Map();
    globalThis.ECHO_WHOLE_BACKUP?.init({
      context:()=>({campaignId:activeCampaignId}),archive:buildCampaignArchive,normalize,toast,
      content:(title,fill)=>globalThis.ECHO_COCKPIT.content(title,fill),open:activateCampaign,
      stageBrowser:async(archive,id,service,preview)=>{
        await saveQueue;const prepared=globalThis.ECHO_RECOVERY.prepare(archive,normalize),entries=new Map();
        if(campaignRegistry.campaigns.some(c=>c.id===id))throw Error('Restore identity already exists.');
        const head=service.head;
        prepared.index.story.reconciliation={version:1,enabled:preview.linkedStores===true,head:head.hash||'',revision:head.revision||0,at:head.receipt?.at||''};
        await globalThis.ECHO_PRESENTATION.importMedia(archive.mediaFiles,prepared.index.presentation,async(key,blob)=>{
          const previous=await readRecord(key);
          if(previous!=null){if(!(previous instanceof Blob)||previous.type!==blob.type||await globalThis.ECHO_RECOVERY.mediaHash(previous)!==await globalThis.ECHO_RECOVERY.mediaHash(blob))throw Error('An imported media ID belongs to a different file. Existing media was not replaced.');return;}
          entries.set(key,blob);
        });
        for(const s of prepared.sessions)entries.set(campaignSessionKey(s.id,id),JSON.stringify(s.state));
        entries.set(campaignIndexKey(id),JSON.stringify(prepared.index));
        await writeRecordsAtomic([...entries]);restoreEntries.set(id,[...entries.keys()]);
        for(const [key,value]of entries){const actual=await readRecord(key);if(value instanceof Blob){if(!(actual instanceof Blob)||await globalThis.ECHO_RECOVERY.mediaHash(value)!==await globalThis.ECHO_RECOVERY.mediaHash(actual))throw Error('Imported media verification failed.');}else if(actual!==value)throw Error('Restored browser record could not be verified.');}
      },
      register:async(id,name,originId)=>{if(campaignRegistry.campaigns.length>=100)throw Error('Archive or remove another campaign before restoring.');const next=structuredClone(campaignRegistry);next.campaigns.push({id,name:String(name||'Restored campaign').slice(0,80),originId,archived:false});await writeRecordsAtomic([[CAMPAIGN_REGISTRY_KEY,JSON.stringify(next)]]);campaignRegistry=next;restoreEntries.delete(id);},
      discard:async id=>{for(const key of restoreEntries.get(id)||[])await deleteRecord(key);restoreEntries.delete(id);}
    });
    globalThis.ECHO_RELIABILITY?.init({
      statusContext:()=>({campaignId:activeCampaignId,practiceSource:campaignRegistry.campaigns.find(c=>c.id===activeCampaignId)?.practiceSource||'',campaignName:campaignRegistry.campaigns.find(c=>c.id===activeCampaignId)?.name,sessionId:activeSessionId,sessionName:campaignIndex.sessions.find(s=>s.id===activeSessionId)?.name,state,sceneTitle:displaySceneTitle(getScene(state.scene)?.title),events:globalThis.ECHO_CONTINUITY.effective(campaignContinuity()),linkedStore:campaignIndex.story?.reconciliation||null}),
      readStatus:id=>readRecord(`campaign:${id||activeCampaignId}:readiness-evidence`),
      saveStatus:async(value,id)=>{if(id&&id!==activeCampaignId)throw Error('The campaign changed. Record this review again in the intended group.');await writeRecord(`campaign:${activeCampaignId}:readiness-evidence`,value);},
      refreshStatus:()=>globalThis.ECHO_RELIABILITY.render(),openOutcomes:()=>globalThis.ECHO_STORY_UI.open('outcomes'),
      readRehearsal:id=>readRecord(`campaign:${id}:table-observations`),
      saveRehearsal:async(value,expected,owner)=>{const group=campaignRegistry.campaigns.find(c=>c.id===activeCampaignId),key=group?.practiceSource||activeCampaignId;if(expected!==activeCampaignId||owner!==key)throw Error('The campaign changed. Reopen the rehearsal before saving observations.');await writeRecord(`campaign:${key}:table-observations`,value);},
      rehearsalTool:key=>{if(!activeCampaignId.startsWith('practice-'))throw Error('Use a separate practice campaign for rehearsal controls.');if(key==='table')return globalThis.ECHO_RELIABILITY.runTableCheck();if(key==='phones')return globalThis.ECHO_PHONE.open();if(key==='audio')return globalThis.ECHO_PRESENTATION.open('audio');if(key==='handouts')return globalThis.ECHO_PRESENTATION.open('handouts');if(key==='quests')return globalThis.ECHO_STORY_UI.open('quests');if(key==='opening')return globalThis.ECHO_SESSION_FLOW_UI.open('before');if(key==='closing')return globalThis.ECHO_SESSION_FLOW_UI.open('close');if(key==='inbox')return $('quick-inbox').click();if(key==='combat'||key==='explore')return globalThis.ECHO_HYBRID_UI.go(key);},
      get state() { return state; }, get registry() { return campaignRegistry; },
      get campaignId() { return activeCampaignId; },
      get campaignName() { return campaignRegistry.campaigns.find(item => item.id === activeCampaignId)?.name || 'Campaign'; },
      get sessionName() { return campaignIndex.sessions.find(item => item.id === activeSessionId)?.name || 'Session'; },
      get sessionId() { return activeSessionId; },
      get restorePoints() { return campaignIndex.restorePoints || []; },
      get migrationReport() { return campaignIndex.migrationReport || []; },
      get scenes() { return sceneEntries(); }, get beats() { return sessionRunbook(); }, get media() { return campaignIndex.presentation?.media || []; },
      get story() { return campaignIndex.story; },
      resolveImage, readMedia: id => readRecord(`media:${id}`),
      toast,
      sceneImage: scene => resolveImage(scene.image),
      storyPortrait: portrait => portrait?.startsWith('asset:') ? campaignIndex.story?.assets?.[portrait.slice(6)] || '' : resolveImage(portrait),
      performance:()=>({tokens:state.tokens.filter(t=>t.placed&&t.scene===state.scene).length,dmMs:lastMapRenderMs,tvMs:playerRenderMs,tvConnected:livePlayerClients().length>0,effects:campaignIndex.tableExtras.atmosphere?.mode||'subtle'}),
      connection: connectionHealth, resync: resyncPlayer,
      openTV: () => { if (!livePlayerClients().length) $('open-player').click(); else resyncPlayer(); },
      phoneCheck: () => globalThis.ECHO_PHONE?.checkStatus() || Promise.resolve({ service: false, error: 'Phone companion unavailable.' }),
      openPhones: () => globalThis.ECHO_PHONE?.open(),
      audioTest: () => globalThis.ECHO_PRESENTATION?.playSfx('recorded-coins') || Promise.resolve(false),
      openAudio: () => globalThis.ECHO_PRESENTATION?.open('audio'),
      openAssets: () => globalThis.ECHO_PRESENTATION?.open('media'),
      createRestorePoint: captureRestorePoint, pruneRestorePoints, restorePoint, downloadPoint,
      createCampaign, switchCampaign: activateCampaign, duplicateCampaign, archiveCampaign,
      rehearseBackup:async archive=>globalThis.ECHO_RECOVERY.rehearse(archive||await buildCampaignArchive(),normalize),
      downloadPackage:()=>globalThis.ECHO_WHOLE_BACKUP.download(),downloadBrowserData,
      checkWholeStore:()=>globalThis.ECHO_WHOLE_BACKUP.check(),
      downloadBackup: downloadCampaign, validateBackup: buildCampaignArchive
    });
    $('quick-table-check').addEventListener('click', () => { void globalThis.ECHO_RELIABILITY?.runTableCheck(); });
    globalThis.ECHO_SETTLEMENTS?.bindContinuity?.(()=>campaignContinuity());
    $('open-undermountain-arc')?.addEventListener('click',()=>globalThis.ECHO_UNDERMOUNTAIN_ARC_UI?.open());
    $('open-expeditions')?.addEventListener('click',()=>globalThis.ECHO_STORY_UI?.open('expeditions'));
    $('open-downtime')?.addEventListener('click',()=>globalThis.ECHO_STORY_UI?.open('downtime'));
    $('open-courtyard')?.addEventListener('click',()=>globalThis.ECHO_STORY_UI?.open('courtyard'));
    $('open-quests')?.addEventListener('click',()=>globalThis.ECHO_STORY_UI?.open('quests'));
    globalThis.ECHO_STORY_UI?.init({
      story: () => campaignIndex.story, plan: storyPlan, save: saveStory, toast,
      outcomePlaces:()=>globalThis.ECHO_SETTLEMENTS.data(campaignIndex.tableExtras).towns.map(t=>({id:t.id,name:t.name})),
      publishClue:(id,published)=>{const plan=globalThis.ECHO_COMMANDS.prepareStory(campaignIndex.story,
        {type:'publish-clue',id,published,expectedRevision:globalThis.ECHO_COMMANDS.revision(campaignIndex.story)});
        if(plan.changed){campaignIndex.story=globalThis.ECHO_COMMANDS.applyStory(campaignIndex.story,plan);saveStory(plan.label);actionReceipt({title:plan.label,status:'resolved',committed:plan.effects,undo:'conditional'});}return plan.effects;},
      undoCluePublication:()=>{const plan=globalThis.ECHO_COMMANDS.prepareStory(campaignIndex.story,
        {type:'undo-clue-publication',expectedRevision:globalThis.ECHO_COMMANDS.revision(campaignIndex.story)});
        campaignIndex.story=globalThis.ECHO_COMMANDS.applyStory(campaignIndex.story,plan);saveStory(plan.label);return plan.effects;},
      applyOutcome:(draftId,review,context)=>{const plan=globalThis.ECHO_COMMANDS.prepareStory(campaignIndex.story,
        {type:'confirm-outcome',draftId,review,expectedRevision:globalThis.ECHO_COMMANDS.revision(campaignIndex.story)},{...context,objective:campaignIndex.tableExtras.playerHub?.objective});
        campaignIndex.story=globalThis.ECHO_COMMANDS.applyStory(campaignIndex.story,plan);actionReceipt({title:review.event?.approved===false?'Outcome approval withdrawn':plan.label,status:'resolved',committed:[...plan.effects,...Object.keys(review.changes||{}).map(k=>'Reviewed '+k+' updates applied')],pending:commandReceiptPending(review),details:['Approved outcome review · '+draftId],undo:'conditional'});return plan;},
      aftermathApplied:meta=>{globalThis.ECHO_STORY_UI.close();const p=state.combat.plans[meta.encounterId];if(p?.aftermath?.runKey===meta.runKey){p.aftermath.step=4;p.aftermath.ending=meta.ending;p.aftermath.pending=meta.pending;p.aftermath.reviewedNotes=globalThis.ECHO_COMBAT_AFTERMATH.notesSignature(p);commit('Opened reviewed aftermath return');openCombatAftermath(meta.encounterId);}},
      extras:()=>campaignIndex.tableExtras,
      expeditionContext,expeditionSessions:()=>campaignIndex.sessions,
      chapterSessions:()=>campaignIndex.sessions.filter(s=>s.packId==='silent-library-expedition'),
      chapterCreatePack:async()=>{await createPackedSession('silent-library-expedition',false);},
      arcSessions:()=>campaignIndex.sessions.filter(s=>s.packId==='waterdeep-undermountain-1'),
      arcCreate:async()=>{if(campaignIndex.sessions.some(s=>s.packId==='waterdeep-undermountain-1'))throw Error('A saved first floor already exists. Review its return instead.');await createPackedSession('waterdeep-undermountain-1',false);},
      arcReturn:reviewArcReturn,
      arcRoom:id=>{globalThis.ECHO_STORY_UI.close();globalThis.ECHO_EXPEDITION_UI.openRoom(id);},
      arcPhones:()=>{globalThis.ECHO_STORY_UI.close();globalThis.ECHO_PHONE.open();for(const d of document.querySelectorAll('#phones-drawer details'))if(d.querySelector('summary')?.textContent.includes('Private clues'))d.open=true;},
      arcLetter:h=>{globalThis.ECHO_STORY_UI.close();globalThis.ECHO_PHONE.open();globalThis.ECHO_TABLE.stageClue({to:h.owner,title:h.title,text:h.body});},
      expeditionRouteList:()=>globalThis.ECHO_EXPEDITION.routes(globalThis.ECHO_EXPEDITION.data(campaignIndex.tableExtras),campaignIndex.story.routes),
      setExpeditionRoute:(route,status)=>{globalThis.ECHO_EXPEDITION.data(campaignIndex.tableExtras).routes[route.id]={status,notes:route.notes||''};commit('Updated shared dungeon route record');void saveCampaignIndex();},
      expeditionSave:(label,quiet=false)=>{expeditionEditing=quiet;try{commit(label);}finally{expeditionEditing=false;}return saveCampaignIndex();},
      previewExpeditionReturn,applyExpeditionReturn,
      expeditionRest:()=>{globalThis.ECHO_STORY_UI.close();globalThis.ECHO_PARTY_UI.openRest();},
      expeditionDungeon:()=>{globalThis.ECHO_STORY_UI.close();globalThis.ECHO_DUNGEON_UI.open();},
      expeditionRooms:()=>{if(state.contentPackId==='lmop-part-4-visuals')globalThis.ECHO_STORY_UI.open('wave-echo');else if(state.scenes?.some(s=>s.id==='um1-table')){globalThis.ECHO_STORY_UI.close();globalThis.ECHO_EXPEDITION_UI.open('floor');}else globalThis.ECHO_STORY_UI.open('runbook');},
      expeditionTime:(id,minutes,expected)=>{if(!Number.isSafeInteger(minutes)||minutes<1||minutes>43200)throw Error('Choose 1–43,200 whole minutes.');const r=globalThis.ECHO_EXPEDITIONS.get(expeditionContext(),id);if(!r||r.sessionId!==activeSessionId)throw Error('Open this expedition first.');if(r.phase==='away')throw Error('Advance time away in Between expeditions; its interval is reviewed on return.');if(state.turn.order.length||campaignIndex.tableExtras.settlements.minutes!==expected)throw Error('Combat or time changed; review again.');if(state.contentPackId==='lmop-part-4-visuals')globalThis.ECHO_WAVE_ECHO.record(state.waveEcho,'Reviewed expedition time',minutes);globalThis.ECHO_EXPEDITIONS.log(expeditionContext(),r,'elapsed',minutes+' minutes; recovery reviewed separately.');advanceDowntimeBlock(minutes,expected);},
      expeditionBookRooms:expeditionBookRooms,expeditionBind:bindExpeditionRooms,
      expeditionResolveLink:(id,b,authority)=>{const r=globalThis.ECHO_EXPEDITIONS.get(expeditionContext(),id),old=[...r.bindings];r.bindings=r.bindings.filter(x=>x!==b);try{globalThis.ECHO_EXPEDITIONS.bind(expeditionContext(),r,b,authority);commit('Resolved room record conflict');void saveCampaignIndex();}catch(e){r.bindings=old;throw e;}},
      downtimeAdvance:advanceDowntimeBlock,
      ensureDowntimeTown:(id,name)=>{ensureDowntimeTown(id,name);commit('Started settlement tracking');void saveCampaignIndex();},
      downtimeVisit:id=>{const M=globalThis.ECHO_SETTLEMENTS,d=M.data(campaignIndex.tableExtras),t=d.towns.find(t=>t.id===id);t.departed?M.arrive(d,id):M.leave(d,id);commit('Recorded settlement visit');void saveCampaignIndex();},
      prepareTownPlan:q=>{const M=globalThis.ECHO_SETTLEMENTS,d=M.data(campaignIndex.tableExtras);ensureDowntimeTown(q.town,q.town==='waterdeep'?'Waterdeep':q.town);M.addJob(d,{...q,kind:'plan',owner:q.owner||'',requirements:Array.isArray(q.requirements)?q.requirements.join(' • '):q.requirements,proposal:[q.proposal,q.uncertainty,...(q.consequences||[])].filter(Boolean).join('\n'),due:q.dueAfterMinutes==null?null:d.minutes+q.dueAfterMinutes,source:'Optional original campaign proposal'});commit('Prepared optional NPC plan');void saveCampaignIndex();},
      prepContext:questPrepContext, prepImage:resolveImage, prepStage:(beat,id)=>globalThis.ECHO_ENCOUNTER_LAUNCH?.stage(beat,id),
      prepPreviewScene:id=>{if(!getScene(id)){toast('Open this scene’s pack in Session first.');return;}previewSceneId=id;contextTab='scene';renderContextSidebar();},
      prepMedia:(tab='media')=>{globalThis.ECHO_STORY_UI.close();globalThis.ECHO_PRESENTATION?.open(tab);},
      prepSessionTools:()=>{globalThis.ECHO_STORY_UI.close();globalThis.ECHO_COCKPIT.open('Session');},
      prepTableCheck:()=>globalThis.ECHO_RELIABILITY?.runTableCheck(),
      transitionScene:id=>SCENES[id]||getScene(id),
      courtyardSession:async()=>{const packId='mending-court-home',existing=campaignIndex.sessions.find(s=>s.packId===packId);if(existing){if(existing.id!==activeSessionId)await switchSession(existing.id);}else await createPackedSession(packId,false);},
      courtyardPreview:()=>{globalThis.ECHO_STORY_UI.close();globalThis.ECHO_COURTYARD_UI.preview(SCENES['mc-court'],()=>{if(getScene('mc-court'))changeScene('mc-court',false);else toast('Open the home session before showing its plan on TV.');},!!getScene('mc-court'));},
      transitionSession:async()=>{const packId='phandalin-waterdeep-transition',existing=campaignIndex.sessions.find(s=>s.packId===packId);if(existing){if(existing.id!==activeSessionId)await switchSession(existing.id);}else await createPackedSession(packId,false);},
      continuity: campaignContinuity,
      settlementNpc:id=>campaignIndex.tableExtras.settlements?.npcs.find(n=>n.id===id),
      openSettlements:(tab,town)=>{globalThis.ECHO_STORY_UI?.close();if(town)ensureDowntimeTown(town,town==='waterdeep'?'Waterdeep':town);globalThis.ECHO_SETTLEMENTS_UI?.open(tab,town);},
      spotlights: () => globalThis.ECHO_SPOTLIGHTS.ensure(campaignIndex.story),
      roster: () => state.tokens.filter(t=>t.team==='pc').map(t=>({id:t.id,name:t.name})),
      continuityMarkers: () => navigationSourceMarkers().concat(TOWN_MAP_IDS.flatMap(scene => {const raw=mapSceneData(scene),base=scene==='region-lmop'&&globalThis.ECHO_TRAVEL?globalThis.ECHO_TRAVEL.projectMap(globalThis.ECHO_TRAVEL.data(campaignIndex.tableExtras),raw):raw;return (base.points||[]).map(p=>({scene,point:p.id,title:`${getScene(scene)?.title || scene} · ${p.title}`,visible:p.visible,approved:p.approved,clue:p.clue||''}));})),
      expedition: () => state.waveEcho ||= globalThis.ECHO_WAVE_ECHO.normalize(),
      commitExpedition: commit, openParty: () => { globalThis.ECHO_STORY_UI?.close(); globalThis.ECHO_PARTY_UI?.open(); },
      partyLevel: () => Object.values(state.party || {}).filter(item => item.role === 'pc')
        .map(item => `${item.name} ${item.level ?? '?'}`).join(', '),
      openBook: (book, page) => globalThis.ECHO_RULES_UI?.openBook(book, page),
      openPrinted: (book, page) => globalThis.ECHO_RULES_UI?.openBook(book,
        globalThis.ECHO_RULES_UI.printedToPdf(book, page).page),
      sessionId: () => activeSessionId,
      sessionName: () => campaignIndex.sessions.find(item => item.id === activeSessionId)?.name || 'Session',
      sceneId: () => state.scene, scenes: () => sceneEntries(), encounters: () => sessionEncounters(),
      beats: () => sessionRunbook(),
      sceneTitle: id => getScene(id)?.title || '',
      encounterTitle: id => sessionEncounters().find(item => item.id === id)?.name || '',
      encounterTokens: id => state.tokens.filter(t => t.encounter === id),
      changeScene,
      selectBeat: id => { selectRunbook(id); $('runbook-content').scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      moveBeat: (id, direction) => { const list = sessionRunbook().map(beat => beat.id);
        const index = list.indexOf(id), next = index + direction;
        if (index < 0 || next < 0 || next >= list.length) return;
        [list[index], list[next]] = [list[next], list[index]];
        storyPlan().order = list; saveStory('Reorder runbook'); globalThis.ECHO_STORY_UI?.render(); },
      openHandout: () => { const panel = document.querySelector('.handout-panel');
        panel?.classList.add('quick-open'); panel?.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
      openRules: () => $('open-rules').click(),
      showHandout: (title, text) => { state.handout = { visible: true, image: '', title, text }; commit(`Show journal handout: ${title}`); },
      showText: (title, text) => globalThis.ECHO_TV_TEXT?.add(title, text),
      portrait: value => value?.startsWith('asset:') ? campaignIndex.story.assets[value.slice(6)] || '' : '',
      importPortrait: async file => {
        if (!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Choose a PNG, JPEG, or WebP portrait.');
        const url = URL.createObjectURL(file);
        try {
          const image = await new Promise((resolve, reject) => { const img = new Image();
            img.onload = () => resolve(img); img.onerror = () => reject(new Error('Portrait could not be opened.')); img.src = url; });
          const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
          const ctx = canvas.getContext('2d');
          const side = Math.min(image.width, image.height);
          ctx.drawImage(image, (image.width-side)/2, (image.height-side)/2, side, side, 0, 0, 256, 256);
          const data = canvas.toDataURL('image/jpeg', .78);
          if (data.length > 800000) throw new Error('Portrait is too large.');
          const id = `npc_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
          campaignIndex.story.assets[id] = data;
          return `asset:${id}`;
        } finally { URL.revokeObjectURL(url); }
      }
    });
    globalThis.ECHO_MAP_UI?.init({
      continuityNotes: id => (globalThis.ECHO_CONTINUITY.effective(campaignContinuity()) || []).filter(e=>e.approved&&e.status!=='planned'&&e.markers.some(m=>m.scene===state.scene&&m.point===id)).map(e=>`${e.status}: ${e.title} — ${e.detail}`),
      map: () => state.map, scene: () => mapSceneData(), sceneId: () => state.scene,
      sceneName: () => `${displaySceneTitle(getScene(state.scene)?.title) || state.scene}${mapSceneData().floor ? ` · ${mapSceneData().floor}` : ''}`,
      scenes: () => sceneEntries(), tokens: () => state.tokens, commit, toast,
      floorSections:()=>{const master=globalThis.ECHO_ATLAS?.proposal(getScene(state.scene)?.image);return master?.isFloorMaster?globalThis.ECHO_ATLAS.proposals().filter(p=>p.floorProposalId===master.id):[];},
      focusFloor:id=>{const selected=globalThis.ECHO_ATLAS.proposal(id),master=globalThis.ECHO_ATLAS.proposal(getScene(state.scene)?.image);if(!selected||!master||selected.floorProposalId!==master.id)return;floorFocusPreview={sceneId:state.scene,campaign:activeCampaignId,session:activeSessionId,proposalId:id,view:globalThis.ECHO_FLOOR_MAPS.focus(master,selected)};previewSceneId=state.scene;contextTab='scene';globalThis.ECHO_MAP_UI.close();renderContextSidebar();toast('Section staged privately. Use Show on TV to apply its view.');},
      floorOverlays:()=>globalThis.ECHO_ATLAS?.proposal(getScene(state.scene)?.image)?.revealOverlays||[],
      setTool: setMapTool, preview: () => mapPreviewMode,
      setPreview: value => { mapPreviewMode = !!value; renderStage('dm'); },
      changeScene, goBack: () => { const previous = state.map.history.pop();
        if (!previous || !getScene(previous)) return; const current = state.scene; changeScene(previous, false);
        if (state.map.history.at(-1) === current) { state.map.history.pop(); saveLocal(); } },
      performance: () => { const tokens = state.tokens.filter(t => t.placed && t.scene === state.scene).length;
        const lines = mapSceneData().lines.length, points = mapSceneData().points.length;
        return { tokens, lines, points, renderMs: lastMapRenderMs, playerRenderMs,
          warning: tokens > 100 || lines > 100 || points > 60 || lastMapRenderMs > 50 || playerRenderMs > 50 ? 'Large or slow scene: hide unused layers or split across floors' : '' }; },
      calibration: () => globalThis.ECHO_MAP_DATA.calibration(state.map.displays[state.map.displayIndex],
        getScene(state.scene)?.gridColumns || MAP_SQUARES_ACROSS, playerViewport?.width || window.innerWidth, playerViewport?.height || window.innerHeight),
      viewport: () => playerViewport,
      openPlayer: () => $('open-player').click(),
      calibrationCheck: () => tvCalibrationCheck,
      setCalibrationCheck: value => { tvCalibrationCheck=!!value;sendToPlayer();globalThis.ECHO_MAP_UI?.render(); },
      revealVisible: (id, radius) => { if(mapSceneData().floorFog){toast('Use manual reveal on this source floor; its walls have not been imported as sight barriers.');return;} const t = getToken(id);
        if (!t || !t.placed || t.scene !== state.scene || !sceneHasFog()) { toast('Choose a placed hero on a fog map.'); return; }
        const tiles = globalThis.ECHO_MAP_DATA.visibleTiles({ x: t.x, y: t.y }, Math.max(1, Math.min(100, radius || 18)), presentedMapScene().lines, mapSceneData().fineFog);
        setFogForScene(state.scene, [...new Set([...fogForScene(), ...tiles])]); commit(`Revealed ${tiles.length} visible squares from ${t.name}`); },
      setFineFog: enabled => { if(mapSceneData().floorFog){toast('This floor keeps its calibrated fine reveal cells. Focus a section to reveal precisely.');return;} if (!sceneHasFog()) { toast('Choose a fog map first.'); return; }
        if (mapSceneData().fineFog === enabled) return;
        const converted = new Set();
        for (const key of fogForScene()) {
          const [row, col] = key.split(',').map(Number);
          if (enabled) for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 2; dc++) converted.add(`${row * 2 + dr},${col * 2 + dc}`);
          else converted.add(`${Math.floor(row / 2)},${Math.floor(col / 2)}`);
        }
        mapSceneData().fineFog = enabled; setFogForScene(state.scene, [...converted]);
        commit(`Fog detail: ${enabled ? 'fine' : 'standard'}`); },
      showClue: point => { const shown = presentedMapScene().points.find(p=>p.id===point.id) || point; state.handout = { visible: true, image: '', title: shown.title, text: shown.clue }; commit(`Show clue: ${shown.title}`); },
      regionScene: id => globalThis.ECHO_TOWN_MAPS?.regionScene(id) || '',
      openRegionScene: id => {
        const target = globalThis.ECHO_TOWN_MAPS?.regionScene(id);
        if (!target) return;
        if ((globalThis.LMOP_BATTLE_MAP_CATALOG || []).some(item => item.id === target)) showCatalogBattleMap(target);
        else if (getScene(target)) changeScene(target, false);
        else toast('This location’s detailed map is not in the current session.');
      },
      advanceTime: (minutes, label) => { const clock = state.map.clock, before = clock.minutes;
        clock.minutes += minutes; for (const timer of clock.timers) timer.remaining = Math.max(0, timer.remaining - minutes);
        globalThis.ECHO_TABLE?.advanceMinutes(minutes);
        const check = clock.wanderEvery && Math.floor(clock.minutes / clock.wanderEvery) > Math.floor(before / clock.wanderEvery);
        commit(`Time +${minutes} min · ${label}`);
        if (check) toast('Wandering encounter check is due.');
        else if (clock.timers.some(t => t.remaining === 0)) toast('An exploration timer is due.'); },
      importPortrait: async file => { const data = await readMapImage(file);
        const id = `portrait_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; state.assets[id] = data; return `asset:${id}`; },
      duplicateToken: id => { const original = getToken(id); if (!original) return;
        const copy = structuredClone(original); copy.id = `${id}-copy-${Date.now()}`;
        const count = state.tokens.filter(t => t.name === original.name || t.name.startsWith(`${original.name} `)).length + 1;
        copy.name = `${original.name} ${count}`; copy.label = `${original.label}${count}`.slice(0,4);
        copy.x = pointValue(original.x + 5); copy.y = pointValue(original.y + 5);
        state.tokens.push(copy); if (state.map.tokenMeta[id]) state.map.tokenMeta[copy.id] = structuredClone(state.map.tokenMeta[id]); commit(`Duplicated ${original.name}`); }
    });
    $('mode-run').addEventListener('click', () => setWorkspaceMode('run'));
    $('mode-prep').addEventListener('click', () => setWorkspaceMode('prep'));
    $('mode-review').addEventListener('click', () => setWorkspaceMode('review'));
    $('campaign-select').addEventListener('change', event => { void activateCampaign(event.target.value); });
    $('new-campaign').addEventListener('click', () => { void createCampaign(); });
    $('quick-redo').addEventListener('click', redoLast);
    $('redo-last').addEventListener('click', redoLast);
    $('open-restore-points').addEventListener('click', () => globalThis.ECHO_RELIABILITY?.open('snapshots'));
    $('resync-player').addEventListener('click', resyncPlayer);
    $('quick-search').addEventListener('click', () => globalThis.ECHO_ERGONOMICS?.open('search'));
    $('quick-notes').addEventListener('click', () => globalThis.ECHO_ERGONOMICS?.open('notes'));
    $('quick-encounter-card').addEventListener('click', () => globalThis.ECHO_ERGONOMICS?.open('encounter'));
    document.querySelector('.run-more-content').addEventListener('click', event => {
      if (event.target.closest('button')) document.querySelector('.run-more').open = false;
    });
    $('open-ergonomics').addEventListener('click', () => globalThis.ECHO_ERGONOMICS?.open('search'));
    globalThis.ECHO_GUIDED?.init({
      desk:()=>globalThis.ECHO_DM_DESK.data(campaignIndex.tableExtras),save:()=>{void saveCampaignIndex();},refresh:()=>{globalThis.ECHO_ERGONOMICS?.render();renderDM();},toast,
      context:()=>{const desk=globalThis.ECHO_DM_DESK.data(campaignIndex.tableExtras),local=globalThis.ECHO_DM_DESK.session(desk,activeSessionId);return {state,session:campaignIndex.sessions.find(s=>s.id===activeSessionId)?.name||'Session',beat:sessionRunbook().find(b=>b.id===state.runbook),next:nextRunbookBeat(),items:globalThis.ECHO_DM_DESK.inbox(state,campaignIndex.tableExtras,local),questLead:globalThis.ECHO_QUEST_PREP?.live(campaignIndex.story,activeSessionId),objective:globalThis.ECHO_OUTCOMES?.tableObjective(campaignContinuity(),campaignIndex.tableExtras.playerHub?.objective)?.text||globalThis.ECHO_QUEST_PREP?.live(campaignIndex.story,activeSessionId)?.objective||local.objective||campaignIndex.tableExtras.playerHub?.objective?.text||''};},
      openQuestLead:()=>globalThis.ECHO_STORY_UI.openQuestBoard(activeSessionId),
      review:reviewDeskItem,inbox:()=>{contextTab='requests';renderContextSidebar();},turn:()=>{contextTab='turn';renderContextSidebar();},
      previewScene:id=>{if(!getScene(id)){toast('That scene is not in this session.');return;}previewSceneId=id;contextTab='scene';renderContextSidebar();},chooseScene:()=>{$('quick-scene').click();},selectBeat:selectRunbook,
      stage:(beat,id)=>globalThis.ECHO_ENCOUNTER_LAUNCH.stage(beat,id),build:buildTurnOrder,next:force=>advanceTurn(1,force),
      combat:()=>globalThis.ECHO_COMBAT_UI.open('flow'),bringParty:()=>{$('bring-party').click();},outcome:()=>openCombatAftermath(),end:()=>{$('end-combat').click();},
      closeSession:(full=true)=>full&&globalThis.ECHO_SESSION_FLOW_UI?globalThis.ECHO_SESSION_FLOW_UI.open('close'):globalThis.ECHO_DM_DESK_UI.open('pace'),
      initiative:(id,value)=>{const t=getToken(id);if(!t?.placed||t.scene!==state.scene){toast('That combatant is no longer on this map.');return;}t.initiative=value;commit('Entered '+t.name+' initiative');},
      begin:()=>{if(!currentIsMap()){toast('Preview and show a battle map first.');return;}if(state.turn.order.length){toast('Combat already has a turn order.');return;}const placed=state.tokens.filter(t=>t.placed&&t.scene===state.scene&&(t.team!=='enemy'||t.hp>0));if(!placed.length){toast('Place combatants before collecting initiative.');return;}for(const t of placed)if(t.team!=='pc'&&!Number.isFinite(t.initiative))t.initiative=recordDiceRoll(t.name+' initiative',1,20,t.initBonus??0).total;state.combatRun.initiativePrompt={open:true,scene:state.scene};applyDeskLayout('combat');commit('Collected phone initiative and rolled missing NPC initiatives');},
      tool:key=>{const actions={check:()=>globalThis.ECHO_RELIABILITY.runTableCheck(),phones:()=>globalThis.ECHO_PHONE.open(),party:()=>globalThis.ECHO_PARTY_UI.open(),players:()=>globalThis.ECHO_PHONE.open(),travel:()=>globalThis.ECHO_TRAVEL_UI.open(),dungeon:()=>globalThis.ECHO_DUNGEON_UI.open(),town:()=>globalThis.ECHO_SETTLEMENTS_UI.open(),story:()=>globalThis.ECHO_STORY_UI.open(),presentation:()=>globalThis.ECHO_PRESENTATION.open('live'),rules:()=>globalThis.ECHO_RULES_UI.open(),improv:()=>globalThis.ECHO_DM_DESK_UI.open('improv'),close:()=>globalThis.ECHO_SESSION_FLOW_UI.open('close'),backup:()=>globalThis.ECHO_RELIABILITY.open('backup')};return actions[key]?.();}
    });
    globalThis.ECHO_ERGONOMICS?.init({
      get state() { return state; }, get settings() { return campaignIndex.ergonomics; },
      get story() { return campaignIndex.story; }, get library() { return campaignIndex.presentation; },
      get rules() { return campaignIndex.rules; },
      get scenes() { return sceneEntries(); }, get beats() { return sessionRunbook(); },
      get encounters() { return sessionEncounters(); }, get combatLibrary() { return campaignIndex.combatLibrary; },
      get sessionName() { return campaignIndex.sessions.find(s => s.id === activeSessionId)?.name || 'Session'; },
      get sessionId() { return activeSessionId; },
      get tvConnected() { return connectionHealth().level === 'connected'; },
      get selectedEncounter() { return selectedEncounter; },
      setMode: setWorkspaceMode,
      commit, saveSession: () => { lastCommittedSnapshot = gameSnapshot(state); return saveLocal(); },
      saveSettings: saveCampaignIndex, syncPlayer: sendToPlayer,
      toast, changeScene, selectBeat: selectRunbook,
      showText: (title, text) => globalThis.ECHO_TV_TEXT?.add(title, text),
      advanceTime: (minutes, label) => {
        const clock = state.map.clock, amount = Math.max(0, Math.min(1440, Math.round(Number(minutes) || 0)));
        if (!amount) return;
        const before = clock.minutes;
        clock.minutes += amount;
        globalThis.ECHO_TABLE?.advanceMinutes(amount);
        for (const timer of clock.timers) timer.remaining = Math.max(0, timer.remaining - amount);
        const wanderDue = clock.wanderEvery && Math.floor(clock.minutes / clock.wanderEvery) > Math.floor(before / clock.wanderEvery);
        commit(`Time +${amount} min · ${label}`);
        if (wanderDue) toast('Wandering encounter check is due.');
        else if (clock.timers.some(timer => timer.remaining === 0)) toast('An exploration timer is due.');
      },
      openCombat: tab => globalThis.ECHO_COMBAT_UI?.open(tab),
      selectEncounter: id => { selectedEncounter = id; contextTab = 'encounter'; renderEncounterSelect(); renderContextSidebar(); globalThis.ECHO_ERGONOMICS?.render(); },
      nextTurn: () => advanceTurn(1), undo: undoLast, redo: redoLast,
      reveal: () => {
        if (!sceneHasFog()) { toast('Choose a fog map to reveal an area.'); return; }
        if (state.requests.length) { revealTile(state.requests[0]); return; }
        const hero = state.tokens.find(t => t.team === 'pc' && t.placed && t.scene === state.scene);
        if (!hero) { toast('Place a hero or click a shaded square to reveal it.'); return; }
        const tiles = globalThis.ECHO_MAP_DATA.visibleTiles({ x: hero.x, y: hero.y }, 18, presentedMapScene().lines, mapSceneData().fineFog);
        setFogForScene(state.scene, [...new Set([...fogForScene(), ...tiles])]);
        commit(`Revealed visible area from ${hero.name}`);
      },
      toggleBlack: () => {
        const live = state.presentation;
        live.mode = live.mode === 'black' ? (getScene(state.scene)?.kind === 'map' ? 'battle' : 'scene') : 'black';
        commit(`TV ${live.mode === 'black' ? 'blackout' : 'restored'}`);
      },
      nextScene: direction => { const scenes = sceneEntries().map(s => s.id), index = scenes.indexOf(state.scene);
        changeScene(scenes[Math.max(0, Math.min(scenes.length - 1, index + direction))]); },
      mute: () => globalThis.ECHO_PRESENTATION?.toggleMute(),
      openRules: query => globalThis.ECHO_RULES_UI?.openSearch(query),
      openParty: id => globalThis.ECHO_PARTY_UI?.open(id),
      openCreature: id => globalThis.ECHO_COMBAT_UI?.openCreature(id),
      openStory: tool => globalThis.ECHO_STORY_UI?.open(tool),
      openHandout: id => globalThis.ECHO_PRESENTATION?.open('handouts', id),
      openBook: (book, page) => globalThis.ECHO_RULES_UI?.openBook(book, page)
    });
    $('quick-roll').addEventListener('click', () => globalThis.ECHO_COMBAT_UI?.open('rolls'));
    $('quick-damage').addEventListener('click', () => globalThis.ECHO_COMBAT_UI?.open('damage'));
    $('quick-effects').addEventListener('click', () => globalThis.ECHO_COMBAT_UI?.open('flow'));
    $('quick-area').addEventListener('click', () => globalThis.ECHO_COMBAT_UI?.open('area'));
    $('quick-encounter').addEventListener('click', () => globalThis.ECHO_COMBAT_UI?.open('encounters'));
    $('quick-undo').addEventListener('click', undoLast);
    $('quick-director').addEventListener('click', () => {
      if (!livePlayerClients().length) $('open-player').click();
      globalThis.ECHO_PRESENTATION?.open('live');
    });
    $('quick-overlays').addEventListener('click', () => {
      const overlays = state.presentation.overlays;
      const show = !Object.values(overlays).every(value => value === false);
      for (const key of Object.keys(overlays)) overlays[key] = !show;
      commit(show ? 'Hid TV overlays' : 'Showed TV overlays');
    });
    $('open-presentation').addEventListener('click', () => globalThis.ECHO_PRESENTATION?.open('live'));
    $('quick-mute').addEventListener('click', () => globalThis.ECHO_PRESENTATION?.toggleMute());
    globalThis.ECHO_PRESENTATION?.init({
      get state() { return state; }, get library() { return campaignIndex.presentation; },
      get scenes() { return sceneEntries(); }, get beats() { return sessionRunbook(); },
      get story() { return campaignIndex.story; },
      get sessionId() { return activeSessionId; },
      atmosphere: () => globalThis.ECHO_ATMOSPHERE?.data(campaignIndex.tableExtras),
      setEffectsMode: mode => { if(!['off','subtle','full'].includes(mode))return;atmosphereData().mode=mode;campaignIndex.tableExtras.reducedEffects=mode==='off'; },
      sceneImage: scene => resolveImage(scene.image || ''),
      commit, saveLibrary: saveCampaignIndex, changeScene, showCatalogBattleMap,
      readMedia: id => readRecord(`media:${id}`),
      writeMedia: writeMediaRecord,
      toast
    });
    globalThis.ECHO_PLAYER_TOOLS_UI?.init({
      context:()=>({extras:campaignIndex.tableExtras,party:state.party,turn:state.turn,queue:state.combatRun.queue,scene:state.scene}),
      show:()=>globalThis.ECHO_PHONE.open(),toast,
      save:label=>{void saveCampaignIndex();commitParty(label);globalThis.ECHO_PHONE?.sync();},
      apply:next=>{const before=globalThis.ECHO_PLAYER_TOOLS.data(campaignIndex.tableExtras).requests;const resolved=globalThis.ECHO_PLAYER_TOOLS.data(next.extras).requests.find(r=>r.status==='resolved'&&before.find(o=>o.id===r.id)?.status!=='resolved');campaignIndex.tableExtras=next.extras;state.party=next.party;state.combatRun.queue=next.queue;if(resolved)actionReceipt({...globalThis.ECHO_ACTION_RECEIPTS.inventory(resolved),undo:'conditional'});void saveCampaignIndex();commitParty('Resolved player inventory request');globalThis.ECHO_PHONE?.sync();}
    });
    globalThis.ECHO_DM_DESK_UI?.init({state:()=>state,extras:()=>campaignIndex.tableExtras,campaignId:()=>activeCampaignId,sessionId:()=>activeSessionId,sessionName:()=>campaignIndex.sessions.find(s=>s.id===activeSessionId)?.name||'Session',sceneTitle:()=>displaySceneTitle(getScene(state.scene)?.title)||state.scene,beats:()=>sessionRunbook(),token:getToken,inboxRoot:()=>$('desk-inbox'),toast,
      tracks:()=>globalThis.ECHO_CONTINUITY?.trackers(campaignContinuity())||[],save:label=>{commit(label);void saveCampaignIndex();},review:reviewDeskItem,
      describe:item=>{const r=state.phoneRequests.find(r=>r.id===item.id);if(item.kind==='fog')return 'Reveal square '+item.id+' on the TV.';if(r?.kind==='tile')return 'Reveal square '+r.key+' on the TV.';if(r?.kind==='move')return `Place ${state.party[r.characterId]?.name||'the character'} at the requested position on the map.`;const p=presentedMapScene().points.find(p=>p.id===r?.pointId);return r?.kind==='action'?'Ask the player to resend this action with targets.':p?'Show clue on TV: '+p.title+' — '+(p.clue||'No clue text attached.'):'This map point is no longer available.';},
      legacy:(item,approve)=>{if(item.scene&&item.scene!==state.scene)throw Error('The scene changed. Review the request again.');if(item.kind==='fog'){if(!state.requests.includes(item.id))throw Error('Request no longer pending.');if(approve)revealTile(item.id);else{state.requests=state.requests.filter(k=>k!==item.id);commit('Dismissed fog request');}}else{if(!state.phoneRequests.some(r=>r.id===item.id))throw Error('Request no longer pending.');approve?approvePhoneRequest(item.id):dismissPhoneRequest(item.id);}},
      captureLayout:captureDeskLayout,applyLayout:applyDeskLayout,snapshot:()=>captureRestorePoint('Session closing review','automatic'),wrap:()=>globalThis.ECHO_STORY_UI?.open('wrap'),
      promote:async(kind,title,text,id)=>{globalThis.ECHO_DM_DESK.promote(campaignIndex.story,kind,title,text,id);await saveCampaignIndex();toast('Saved private permanent '+kind+' record. Find it with Search or Story.');},
      tokenAction:(id,key)=>{const t=getToken(id);if(!t)return;if(key==='card')return openCombatCard(id);if(key==='sheet')return globalThis.ECHO_PARTY_UI?.open(id);if(key==='damage')return globalThis.ECHO_COMBAT_UI?.prepareDamage([id],0,'slashing');
        if(['target','move','ping'].includes(key)&&(!t.placed||t.scene!==state.scene))throw Error('Place this token on the current map first.');
        if(key==='target'){globalThis.ECHO_COMBAT_RUN?.target(id);contextTab='turn';renderContextSidebar();renderStage('dm');return;}
        if(key==='move'){setMapTool('move');toast(`Drag ${t.name} to its new spot on the DM map.`);return;}
        if(key==='visibility'&&t.team!=='pc'){t.visible=!t.visible;commit('Changed '+t.name+' visibility');return;}
        if(key==='reaction'){combatTokenRecord(id).reactionUsed=!combatTokenRecord(id).reactionUsed;commit('Changed '+t.name+' reaction');return;}
        if(key==='ping'){if(!publicState().tokens.some(x=>x.id===id))throw Error('Reveal this token before pinging it on the TV.');state.ping={id:'ping-'+Date.now(),scene:state.scene,x:t.x,y:t.y,created:Date.now()};renderMapOverlays('dm');sendToPlayer();clearTimeout(pingTimer);pingTimer=setTimeout(()=>{state.ping=null;renderMapOverlays('dm');sendToPlayer();},6500);}
      }
    });
    globalThis.ECHO_EXPEDITION_UI?.init({expeditionRecord:()=>globalThis.ECHO_STORY_UI.open('expeditions'),extras:()=>campaignIndex.tableExtras,routes:()=>campaignIndex.story.routes,toast,
      save:label=>{commit(label);void saveCampaignIndex();},book:(book,page)=>globalThis.ECHO_RULES_UI?.openBook(book,globalThis.ECHO_RULES_UI.printedToPdf(book,page).page),
      stage:()=>{},image:id=>SCENES[id]?.image||'',
      show:id=>{if(state.turn.order.length)throw Error('End combat before changing the battlefield.');if(!getScene(id)&&SCENES[id])state.scenes.push({id,...SCENES[id]});changeScene(id,false,false);state.presentation.mode='battle';state.handout.visible=false;commit('Show reviewed expedition visual');},
      publish:(title,text)=>{state.handout={visible:true,image:'',title,text};state.presentation.mode='battle';commit('Show reviewed expedition handout');},
      create:()=>{void createPackedSession('waterdeep-undermountain-1',false).catch(e=>toast(e.message));},towns:()=>globalThis.ECHO_SETTLEMENTS_UI?.open(),spotlights:()=>globalThis.ECHO_STORY_UI?.open('spotlights')
    });
    globalThis.ECHO_SETTLEMENTS_UI?.init({extras:()=>campaignIndex.tableExtras,npcs:()=>campaignIndex.story.npcs,events:()=>globalThis.ECHO_CONTINUITY.effective(campaignContinuity()),toast,
      openDowntime:()=>globalThis.ECHO_STORY_UI?.open('downtime'),
      reviewJob:(job,result)=>globalThis.ECHO_STORY_UI?.outcome({...globalThis.ECHO_DOWNTIME.jobDraft(job,globalThis.ECHO_SETTLEMENTS.data(campaignIndex.tableExtras).minutes),...(result?{downtime:{...globalThis.ECHO_DOWNTIME.jobDraft(job).downtime,result,at:globalThis.ECHO_SETTLEMENTS.data(campaignIndex.tableExtras).minutes}}:{})}),
      correctOutcome:id=>globalThis.ECHO_STORY_UI?.correctOutcome?.(id),
      worldReturn:id=>globalThis.ECHO_WORLD_RETURN.build(campaignContinuity(),globalThis.ECHO_SETTLEMENTS.data(campaignIndex.tableExtras),id,campaignIndex.story.npcs),
      returnSummary:id=>globalThis.ECHO_DOWNTIME.returnSummary(campaignContinuity(),globalThis.ECHO_SETTLEMENTS.data(campaignIndex.tableExtras),id),
      save:label=>{commit(label);void saveCampaignIndex();},
      publish:(title,text)=>{state.handout={visible:true,image:'',title,text};state.presentation.mode='battle';commit('Show reviewed town-return narration');},
      advance:minutes=>{if(state.turn.order.length)throw Error('End combat before advancing downtime.');state.map.clock.minutes+=minutes;for(const t of state.map.clock.timers)t.remaining=Math.max(0,t.remaining-minutes);globalThis.ECHO_TABLE?.advanceMinutes(minutes);commit('Advanced reviewed downtime');}
    });
    globalThis.ECHO_ATMOSPHERE_UI?.init({extras:()=>campaignIndex.tableExtras,state:()=>state,title:()=>displaySceneTitle(getScene(state.scene)?.title)||state.scene,media:()=>campaignIndex.presentation.media,visible:()=>publicState().tokens,
      save:label=>{void saveCampaignIndex();commit(label);},refresh:()=>{renderStage('dm');sendToPlayer();},toast,
      place:id=>{atmospherePlacement={id,scene:state.scene};setMapTool('move');toast('Click the map to place this animated feature.');},
      zones:()=>globalThis.ECHO_COMBAT_PLUS_UI?.open('areas')
    });
    globalThis.ECHO_DUNGEON_UI?.init({expeditionRecord:()=>globalThis.ECHO_STORY_UI.open('expeditions'),extras:()=>campaignIndex.tableExtras,state:()=>state,map:()=>mapSceneData(),title:()=>displaySceneTitle(getScene(state.scene)?.title)||state.scene,
      roster:()=>state.tokens.filter(t=>t.team==='pc').map(t=>({id:t.id,name:t.name,senses:state.party[t.id]?.senses||''})),scenes:()=>sceneEntries(),isMap:currentIsMap,columns:()=>getScene(state.scene)?.gridColumns||MAP_SQUARES_ACROSS,
      aspect:()=>{const image=$('dm-stage')?.querySelector('img');return image?.naturalWidth&&image?.naturalHeight?image.naturalWidth/image.naturalHeight:1.5;},toast,
      save:label=>{void saveCampaignIndex();commit(label);globalThis.ECHO_PHONE?.sync();},clearFog:()=>setFogForScene(state.scene,[]),mapTools:()=>globalThis.ECHO_MAP_UI.open('vision'),
      place:id=>{dungeonPlacement={id,scene:state.scene};setMapTool('move');toast('Click the dungeon map to place this record.');},
      traverse:id=>{
        if(state.turn.order.length)throw Error('End combat before moving the party between maps.');
        const d=dungeonData(),from=state.scene,{p,back}=globalThis.ECHO_DUNGEON.passage(d,from,id);if(!getScene(p.target))throw Error('This linked map is not available in the current session.');
        changeScene(p.target,false,false);
        const last=d.returnTrail.at(-1);if(last?.to===from&&last.returnId===id)d.returnTrail.pop();else d.returnTrail.push({from,to:p.target,passage:id,returnId:back.id,label:getScene(from)?.title||from});
        for(const [i,t]of state.tokens.filter(t=>t.team==='pc'&&t.placed&&t.scene===from).entries()){t.scene=p.target;t.x=Math.min(99,back.x+i*1.5);t.y=back.y;}
        state.handout.visible=false;void saveCampaignIndex();commit('Used paired dungeon passage');globalThis.ECHO_PHONE?.sync();
      }
    });
    globalThis.ECHO_TRAVEL_UI?.init({
      extras:()=>campaignIndex.tableExtras, roster:()=>Object.values(state.party).map(p=>({id:p.id,name:p.name})),
      scenes:()=>sceneEntries(),media:()=>campaignIndex.presentation.media,image:s=>resolveImage(s.image||''),toast,
      save:label=>{void saveCampaignIndex();commit(label);globalThis.ECHO_PHONE?.sync();globalThis.ECHO_ATLAS_UI?.refresh();},
      weather:value=>{state.sceneMood.weather=value;const cfg=globalThis.ECHO_ATMOSPHERE.scene(atmosphereData(),state.scene);cfg.weather=value==='mist'?'clear':value;cfg.mist=value==='mist';},rest:()=>globalThis.ECHO_PARTY_UI?.openRest(),
      apply:(next,minutes,kind)=>{
        if(state.turn.order.length)throw Error('End combat before advancing travel or camp time.');
        campaignIndex.tableExtras.travel=next;
        const clock=state.map.clock,before=clock.minutes;clock.minutes+=minutes;
        globalThis.ECHO_TABLE?.advanceMinutes(minutes);
        for(const timer of clock.timers)timer.remaining=Math.max(0,timer.remaining-minutes);
        void saveCampaignIndex();commit(kind==='camp'?'Applied reviewed camp':'Advanced reviewed travel');globalThis.ECHO_PHONE?.sync();globalThis.ECHO_ATLAS_UI?.refresh();
        if(clock.wanderEvery&&Math.floor(clock.minutes/clock.wanderEvery)>Math.floor(before/clock.wanderEvery))toast('Wandering encounter check due. Review events before continuing.');
        else if(clock.timers.some(t=>t.remaining===0))toast('An exploration timer is due.');
      },
      arrive:p=>{
        if(state.turn.order.length)throw Error('End combat before changing the battlefield.');
        if(!getScene(p.arrival.scene))throw Error('Choose an arrival map available in this session.');
        if(!globalThis.ECHO_TRAVEL.known(p))throw Error('Locate this place before showing its arrival map.');
        changeScene(p.arrival.scene,false,false);state.handout.visible=false;
        if(getScene(p.arrival.scene).fog){state.sceneFog[p.arrival.scene] ||= [];state.map.scenes[p.arrival.scene] ||= globalThis.ECHO_MAP_DATA.scene({fineFog:true});}
        commit(`Arrival: ${p.title}`);
        if(p.arrival.ambience)void globalThis.ECHO_PRESENTATION?.playGroup('ambience',p.arrival.ambience);
        toast('Destination shown on TV. Narration remains in your travel card.');
      }
    });
    globalThis.ECHO_TABLE?.init({
      continuityTracks: () => globalThis.ECHO_CONTINUITY?.trackers(campaignContinuity()) || [],
      getExtras: () => campaignIndex.tableExtras,
      saveExtras: label => { void saveCampaignIndex(); commit(label || 'Updated table tools'); globalThis.ECHO_PHONE?.sync(); },
      roster: () => state.tokens.filter(t => t.team === 'pc' && state.party[t.id]).map(t => ({ id:t.id, name:state.party[t.id].name })),
      media: () => campaignIndex.presentation?.media || [], mood: () => state.sceneMood,
      weather:value=>{const cfg=globalThis.ECHO_ATMOSPHERE.scene(atmosphereData(),state.scene);cfg.weather=value==='mist'?'clear':value;cfg.mist=value==='mist';},
      commit, toast, refreshLive: () => { sendToPlayer(); globalThis.ECHO_PHONE?.sync(); },
      playSfx: mediaId => globalThis.ECHO_PRESENTATION?.playSfx(mediaId),
      playAmbience: mediaId => globalThis.ECHO_PRESENTATION?.playGroup('ambience', mediaId)
    });
    globalThis.ECHO_COMBAT_PLUS_UI?.init({state:()=>state,replace:next=>state=next,root:()=>$('combat-plus-panel'),
      show:()=>{contextTab='turn';renderContextSidebar();$('combat-plus-panel').closest('details').open=true;},
      sharedDamage:job=>{const result=globalThis.ECHO_COMBAT_ACTIONS.fromDamage(state,job);commit('Staged damage in shared action review');globalThis.ECHO_PHONE_ACTIONS_UI.open(result.request.id,result.plan);},
      commit,toast,tool:setMapTool,columns:()=>getScene(state.scene)?.gridColumns||MAP_SQUARES_ACROSS,die:rollDie,saveBonus:combatSaveBonus,
      announce:(title,text)=>{state.handout={visible:true,image:'',title,text};commit('Show encounter announcement');}
    });
    globalThis.ECHO_COMBAT_RUN?.init({
      stageAction:stageCombatAction,pendingDMDrafts:id=>globalThis.ECHO_PHONE_ACTIONS.data(state).requests.filter(r=>r.source==='dm'&&r.characterId===id&&r.scene===state.scene&&globalThis.ECHO_PHONE_ACTIONS.pending(r)),resumeReview:id=>globalThis.ECHO_PHONE_ACTIONS_UI.open(id),activeReview:()=>globalThis.ECHO_PHONE_ACTIONS_UI?.active(),closeReview:()=>globalThis.ECHO_PHONE_ACTIONS_UI?.close(),
      allState:()=>state,columns:()=>getScene(state.scene)?.gridColumns||MAP_SQUARES_ACROSS,targetTool:()=>setMapTool('target'),stageDamage:value=>globalThis.ECHO_COMBAT_PLUS_UI.stageDamage(value),
      pauseAttack:(label,targetId)=>{globalThis.ECHO_COMBAT_PLUS.pause(state,{label,targets:[targetId]});commit('Paused attack for reactions');globalThis.ECHO_COMBAT_PLUS_UI.open('damage');},
      run: () => state.combatRun, turn: () => state.turn, scene: () => state.scene,
      isMap: currentIsMap, currentActor: () => state.turn.scene === state.scene ? getToken(state.turn.order[state.turn.index]) : null,
      tokens: () => state.tokens, party: () => state.party, combat: () => state.combat, encounters: () => sessionEncounters(),
      commit, endTurn: () => advanceTurn(1), toggleInitiative: toggleInitiativePrompt,
      rollEnemies: rollPlacedEnemies, buildOrder: buildTurnOrder,
      roll: rollCombatShortcut,
      previewDamage: (id, amount, type) => globalThis.ECHO_COMBAT_DATA.damagePreview(getToken(id), amount, type, 'damage', combatTokenRecord(id)),
      recordActionUse: (id, action) => {
        const sheet=state.party[id], item=sheet?.actions?.find(entry=>entry.id===action.id);
        if(!sheet||!item)throw Error('The character action changed. Review the sheet.');
        if(item.resourceId){
          const plan=globalThis.ECHO_COMMANDS.prepare(state,{type:'spend-resource',characterId:id,
            resourceId:item.resourceId,cost:Number(item.cost)||1,label:item.name,
            expectedRevision:globalThis.ECHO_COMMANDS.revision(state)});
          const type=String(item.type||'').toLowerCase();
          if(type.includes('bonus'))plan.next.combatRun.queue.bonusUsed=true;
          else if(type==='action')plan.next.combatRun.queue.actionUsed=true;
          if(type.includes('reaction'))(plan.next.combat.tokens[id] ||= {}).reactionUsed=true;
          state=globalThis.ECHO_COMMANDS.apply(state,plan);actionReceipt({title:plan.label,status:'resolved',committed:plan.effects,pending:['Effect awaits DM resolution.'],undo:'conditional'},id);
        }else{
          const type=String(item.type||'').toLowerCase();
          if(type.includes('bonus'))state.combatRun.queue.bonusUsed=true;
          else if(type==='action')state.combatRun.queue.actionUsed=true;
          if(type.includes('reaction'))combatTokenRecord(id).reactionUsed=true;
        }
        commit(`${sheet.name} used ${item.name}; effect awaits DM resolution`);
      },
      applyDamage: (id, amount, type, label) => applyReviewedDamage({ mode: 'damage', type, amount: String(amount), selected: [id], overrides: {}, amounts: {}, conditions: {}, label }),
      openCombat: tab => globalThis.ECHO_COMBAT_UI?.open(tab),
      openDamage: ids => globalThis.ECHO_COMBAT_UI?.prepareDamage(ids, 0, 'slashing'),
      requests: () => [...state.phoneRequests.filter(item => item.scene === state.scene), ...(globalThis.ECHO_PHONE_ACTIONS?.data(state).requests.filter(r=>r.source!=='dm'&&globalThis.ECHO_PHONE_ACTIONS.pending(r)) || []).map(r=>({...r,kind:'action'}))],
      approveRequest: approvePhoneRequest, dismissRequest: dismissPhoneRequest,
      setReaction: (id, used) => { combatTokenRecord(id).reactionUsed = used; commit(`${getToken(id)?.name || 'Combatant'} reaction ${used ? 'used' : 'ready'}`); },
      openParty: id => globalThis.ECHO_PARTY_UI?.open(id),
      openAftermath:openCombatAftermath,
      setEncounterStatus: (id, status) => { state.combatRun.encounterStatus[id] = status; commit(`${id}: ${status}`); },
      deployWave: deployEncounterWave
    });
    globalThis.ECHO_PHONE_ACTION_CONDITIONS = CONDITIONS;
    globalThis.ECHO_PHONE_ACTIONS_UI?.init({ state:()=>state, root:()=>$('phone-action-review-detail'),
      show:()=>{contextTab=state.turn.order.length?'turn':'requests';renderContextSidebar();$('desk-action-review').open=true;if(globalThis.ECHO_HYBRID_UI?.current()==='combat')globalThis.ECHO_HYBRID_UI.closeDrawer();}, showTurn:()=>{contextTab='turn';renderDM();},targetTool:()=>setMapTool('target'),toast,
      visible:r=>r?.source==='dm'?state.tokens.filter(t=>t.scene===state.scene&&t.placed).map(t=>t.id):publicState().tokens.map(t=>t.id), conditions:()=>CONDITIONS,
      distance:(a,b)=>globalThis.ECHO_COMBAT_PLUS.distance(a,b,globalThis.ECHO_COMBAT_PLUS.scale(state,getScene(state.scene)?.gridColumns||MAP_SQUARES_ACROSS)),
      status:setPhoneActionStatus,pause:(r,plan)=>{globalThis.ECHO_COMBAT_PLUS.pause(state,{label:`Reaction to ${r.label}`,targets:plan.steps.map(p=>p.targetId),source:r.id});plan.reactionsChecked=false;commit('Paused action for reactions');globalThis.ECHO_COMBAT_PLUS_UI.open('damage');},
      prepare:(id,plan,cache)=>{const r=state.phoneActions.requests.find(r=>r.id===id);return globalThis.ECHO_COMBAT_ACTIONS.prepare(state,r,plan,{visible:r.source==='dm'?state.tokens.filter(t=>t.scene===state.scene&&t.placed).map(t=>t.id):publicState().tokens.map(t=>t.id),die:rollDie,saveBonus:combatSaveBonus,cache});},
      resolve:review=>{const r=state.phoneActions.requests.find(r=>r.id===review.requestId);const command=globalThis.ECHO_COMMANDS.prepare(state,{type:'resolve-combat-action',review,expectedRevision:review.baseRevision},{visible:r.source==='dm'?state.tokens.filter(t=>t.scene===state.scene&&t.placed).map(t=>t.id):publicState().tokens.map(t=>t.id)});state=globalThis.ECHO_COMMANDS.apply(state,command);actionReceipt(globalThis.ECHO_ACTION_RECEIPTS.combat(state.phoneActions.requests.find(x=>x.id===r.id),state));commit(`Resolved action: ${r.label}`);},
      undo:id=>{state=globalThis.ECHO_COMBAT_ACTIONS.undo(state,id);commit('Undid combat action resolution');actionReceipt({title:'Combat resolution',status:'undone',pending:['Send a new request if needed.']});}
    });
    globalThis.ECHO_PHONE?.init({ snapshot: phoneSnapshot, onAction: handlePhoneAction, toast,
      requestCount: () => (dungeonData()?.requests.filter(r=>['waiting','approved'].includes(r.status)).length||0) + (globalThis.ECHO_TRAVEL?.data(campaignIndex.tableExtras).requests.filter(r=>r.status==='waiting').length||0) + (state.phoneRequests || []).length + (globalThis.ECHO_PHONE_ACTIONS?.data(state).requests.filter(r=>r.source!=='dm'&&globalThis.ECHO_PHONE_ACTIONS.pending(r)).length || 0) });
    $('quick-handout').addEventListener('click', () => {
      const panel = document.querySelector('.handout-panel');
      if (!panel) return;
      if (panel.classList.contains('quick-open')) { panel.classList.remove('quick-open'); return; }
      panel.classList.add('quick-open');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('handout-title').focus();
    });
    globalThis.ECHO_PARTY_UI?.init({
      getParty: () => state.party,
      stageAction:(id,type,index)=>{globalThis.ECHO_PARTY_UI.close();globalThis.ECHO_HYBRID_UI?.go('combat');stageCombatAction(id,type,index,[]);},
      getMeta: () => state.partyMeta,
      castTargets: () => publicState().tokens.map(t => ({id:t.id,name:t.name})),
      stageCast: (id,index,casting) => {
        stageCombatAction(id,'spell',index,casting.targetIds,casting);
      },
      replaceSheet: (id, value) => { state.party[id] = globalThis.ECHO_PARTY_DATA.normalizeSheet({ ...value, id }, state.party[id]); },
      spendResource: (characterId, resourceId, cost, label) => {
        const plan = globalThis.ECHO_COMMANDS.prepare(state, { type: 'spend-resource', characterId,
          resourceId, cost, label, expectedRevision: globalThis.ECHO_COMMANDS.revision(state) });
        state = globalThis.ECHO_COMMANDS.apply(state, plan);
        actionReceipt({title:plan.label,status:'resolved',committed:[...plan.effects,'Spent '+cost],details:[state.party[characterId]?.source||'Current character sheet'],undo:'conditional'},characterId);
        commit(plan.label);
      },
      commitParty, toast, downloadJson,
      roll: (label, count, sides, modifier, damageType = '') => {
        const actor = Object.values(state.party).find(s => label.startsWith(`${s.name}:`));
        globalThis.ECHO_COMBAT_UI?.prepareRoll(actor?.id || '', label, count, sides, modifier,
          label.includes('attack') ? 'attack' : 'damage', damageType);
      },
      rollHitDice: (name, count, sides, modifier) => {
        let healing = 0;
        for (let i = 0; i < count; i++) healing += Math.max(0,
          recordDiceRoll(`${name} Hit Die ${i + 1}`, 1, sides, modifier).total);
        commit(`${name} rolled ${count} Hit Dice for ${healing} healing`);
        return healing;
      },
      showOnTV: id => { state.partyShown = id; commit(`Show ${state.party[id]?.name || 'character'} on TV`); },
      hideTV: () => { state.partyShown = ''; commit('Hide character from TV'); },
      getCharacterOptions: id => globalThis.ECHO_RULES_UI?.optionsForCharacter(id) || [],
      openBook: (book, page) => globalThis.ECHO_RULES_UI?.openBook(book, page)
    });
    globalThis.ECHO_COMBAT_UI?.init({
      tokens: () => state.tokens, combat: () => state.combat, party: () => state.party,
      turn:()=>state.turn,continuity:campaignContinuity,aftermathEncounter,ensureAftermath,reviewAftermath:reviewCombatAftermath,finishAftermath:finishCombatAftermath,resumeAftermath:resumeCombatAftermath,encounterStatus:id=>state.combatRun.encounterStatus?.[id]||'fighting',
      encounters: () => sessionEncounters(), scene: () => state.scene,
      sessionName: () => campaignIndex.sessions.find(s => s.id === activeSessionId)?.name || 'Session',
      requestSaves:draft=>{globalThis.ECHO_COMBAT_PLUS.saveBatch(state,{label:'Area saving throw',ability:draft.ability,dc:Number(draft.dc),targets:draft.selected},combatSaveBonus);commit('Requested area saving throws');globalThis.ECHO_COMBAT_PLUS_UI.open('saves');},
      shapes: () => state.annotations.filter(mark => mark.scene === state.scene && ['circle', 'square', 'cone', 'line'].includes(mark.kind)),
      rolls: () => state.rolls, commit, toast,
      openBook: (book, page) => globalThis.ECHO_RULES_UI?.openBook(book, page),
      openCard: openCombatCard, deployWave: deployEncounterWave,
      saveTemplate: saveEncounterTemplate, useTemplate: useEncounterTemplate,
      addCreature: addCreatureCombatant,
      setInitiative: (id, value) => { const t = getToken(id); if (!t) return;
        t.initiative = value === '' ? null : signedInteger(value, -99, 999); commit(`Set ${t.name} initiative`); },
      setInitBonus: (id, value) => { const t = getToken(id); if (!t) return;
        t.initBonus = value === '' ? null : signedInteger(value, -99, 99); commit(`Set ${t.name} initiative bonus`); },
      rollInitiative: id => { const t = getToken(id); if (t) rollInitiative(t); },
      rollEnemies: rollPlacedEnemies, buildOrder: buildTurnOrder,
      rollCombat: rollCombatShortcut,
      showRoll: id => { state.publicRollId = id; commit('Show roll on TV'); },
      saveBonus: combatSaveBonus,
      checkBonus: (id, ability) => {
        const sheet = state.party[id];
        if (sheet) return globalThis.ECHO_PARTY_DATA.abilityMod(sheet.abilities[ability]);
        const t = getToken(id), creature = globalThis.ECHO_COMBAT_DATA.CREATURES[t?.type] || state.combat.creatures[t?.type];
        const score = creature?.abilities?.[['str', 'dex', 'con', 'int', 'wis', 'cha'].indexOf(ability)];
        return score === undefined || score === null ? null : Math.floor((Number(score) - 10) / 2);
      },
      setCondition: (id, condition, enabled) => {
        const t = getToken(id); if (!t) return;
        t.conditions = enabled ? [...new Set([...t.conditions, condition])] : t.conditions.filter(x => x !== condition);
        commit(`${t.name}: ${condition} ${enabled ? 'added' : 'removed'}`);
        if (enabled && publicState().tokens.some(token => token.id === id)) globalThis.ECHO_TABLE?.triggerEffect('condition',[id]);
      },
      setConcentration: (id, value) => {
        const t = getToken(id); if (!t) return;
        const record = combatTokenRecord(id); record.concentration = value;
        t.conditions = value ? [...new Set([...t.conditions, 'Concentrating'])] : t.conditions.filter(x => x !== 'Concentrating');
        if (state.party[id]) state.party[id].concentration = value;
        commit(`${t.name}: concentration ${value || 'ended'}`);
      },
      addEffect: value => {
        const effect = { ...value, id: `effect-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, due: false, fired: false };
        state.combat.effects.push(effect);
        const t = getToken(effect.tokenId);
        if (t && CONDITIONS.includes(effect.condition)) t.conditions = [...new Set([...t.conditions, effect.condition])];
        commit(`Added timed effect: ${effect.name}`);
      },
      endEffect: id => {
        const effect = state.combat.effects.find(item => item.id === id); if (!effect) return;
        state.combat.effects = state.combat.effects.filter(item => item.id !== id);
        const t = getToken(effect.tokenId);
        if (t && effect.condition && !state.combat.effects.some(item => item.tokenId === t.id && item.condition === effect.condition))
          t.conditions = t.conditions.filter(x => x !== effect.condition);
        commit(`Ended effect: ${effect.name}`);
      },
      applyDamage: applyReviewedDamage,
      prepareArea: draft => {
        const amount = Math.max(0, bounded(draft.damage));
        const amounts = {}, conditions = {};
        for (const id of draft.selected) {
          const result = draft.rolls[id];
          amounts[id] = result === 'pass' ? draft.success === 'none' ? 0 : Math.floor(amount / 2) : amount;
          if (result === 'fail' && CONDITIONS.includes(draft.condition)) conditions[id] = draft.condition;
        }
        globalThis.ECHO_COMBAT_UI.setAreaDamage({ mode: 'damage', type: draft.type, amount: String(amount),
          selected: [...draft.selected], overrides: {}, amounts, conditions });
      }
    });
    for (const button of document.querySelectorAll('.header-menu-content button'))
      button.addEventListener('click', () => { document.querySelector('.header-menu').open = false; });
    globalThis.ECHO_RULES_UI?.init({
      settings: campaignIndex.rules,
      getParty: () => state.party,
      save: rules => { campaignIndex.rules = rules; void saveCampaignIndex(); },
      toast,
      showHandout: entry => {
        state.handout = { visible: true, image: '', title: entry.title, text: entry.summary };
        commit(`Show rule on TV: ${entry.title}`);
      }
    });
    const runbookSelect = $('runbook-select');
    runbookSelect.addEventListener('change', () => selectRunbook(runbookSelect.value));
    $('runbook-prev').addEventListener('click', () => {
      const beats = sessionRunbook();
      const index = beats.findIndex(beat => beat.id === state.runbook);
      if (index > 0) selectRunbook(beats[index - 1].id);
    });
    $('runbook-next').addEventListener('click', () => {
      const next = nextRunbookBeat();
      if (next) selectRunbook(next.id);
    });
    const select = $('encounter-select');
    select.addEventListener('change', () => { selectedEncounter = select.value; contextTab = 'encounter'; renderRosters(); renderContextSidebar(); });
    $('session-select').addEventListener('change', async event => {
      try {
        const choice = event.target.value;
        if (choice.startsWith('pack:')) await createPackedSession(choice.slice(5), false);
        else await switchSession(choice);
      }
      catch { toast('That session could not be opened.'); renderSessionSelect(); }
    });
    $('restart-session').addEventListener('click', () => { void restartCurrentSession().catch(() => toast('The session could not be restarted.')); });
    $('new-session').addEventListener('click', () => { void createSession(); });
    $('new-session-pack').addEventListener('click', () => { void createPackedSession().catch(error => toast(error.message || 'The pack could not be created.')); });
    $('new-phandalin-pack').addEventListener('click', () => { void createPackedSession('phandalin-session-2').catch(error => toast(error.message || 'The Phandalin pack could not be created.')); });
    $('new-part3-pack').addEventListener('click', () => { void createPackedSession('lmop-part-3-visuals').catch(error => toast(error.message || 'The Part 3 visuals could not be opened.')); });
    $('new-part4-pack').addEventListener('click', () => { void createPackedSession('lmop-part-4-visuals').catch(error => toast(error.message || 'The Part 4 visuals could not be opened.')); });
    $('duplicate-session').addEventListener('click', () => { void createSession(true); });
    $('rename-session').addEventListener('click', () => { void renameSession(); });
    $('delete-session').addEventListener('click', () => { void deleteSession(); });
    $('download-campaign').addEventListener('click', () => { void downloadCampaign(); });
    $('load-campaign-button').addEventListener('click', () => $('load-campaign-file').click());
    $('load-campaign-file').addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (file) await restoreCampaign(file);
      event.target.value = '';
    });
    $('save-scene').addEventListener('click', () => { void saveSceneFromForm(); });
    $('cancel-scene-edit').addEventListener('click', resetBuilderForms);
    $('add-encounter').addEventListener('click', addEncounterFromForm);
    $('add-combatants').addEventListener('click', addCombatantsFromForm);
    $('save-beat').addEventListener('click', saveBeatFromForm);
    $('cancel-beat-edit').addEventListener('click', resetBuilderForms);
    $('undo-last').addEventListener('click', undoLast);
    $('show-handout').addEventListener('click', () => {
      const imageChoice = $('handout-image').value;
      const image = imageChoice.startsWith('scene:') ? getScene(imageChoice.slice(6))?.image || '' : imageChoice;
      const title = $('handout-title').value.trim().slice(0, 100);
      const text = $('handout-text').value.trim().slice(0, 1200);
      if (!image && !title && !text) { toast('Add an image or some text to the handout first.'); return; }
      state.handout = { visible: true, image: resolveImage(image) ? image : '', title, text };
      commit();
    });
    $('hide-handout').addEventListener('click', () => {
      state.handout.visible = false;
      commit();
    });
    for (const button of document.querySelectorAll('[data-map-tool]'))
      button.addEventListener('click', () => {
        setMapTool(button.dataset.mapTool);
        const menu = button.closest('.map-more');
        if (menu) menu.open = false;
      });
    $('clear-map-marks').addEventListener('click', () => {
      const before = state.annotations.length;
      state.annotations = state.annotations.filter(mark => mark.scene !== state.scene);
      if (state.annotations.length === before) { toast('No marks on this map.'); return; }
      commit(`Clear marks from ${getScene(state.scene).title}`);
    });
    $('build-turn-order').addEventListener('click', buildTurnOrder);
    $('request-initiative').addEventListener('click', toggleInitiativePrompt);
    $('start-combat').addEventListener('click', () => globalThis.ECHO_GUIDED?.enabled()?globalThis.ECHO_GUIDED.open('combat'):globalThis.ECHO_COMBAT_UI?.open('flow'));
    $('roll-enemy-initiative').addEventListener('click', rollPlacedEnemies);
    $('previous-turn').addEventListener('click', () => advanceTurn(-1));
    $('next-turn').addEventListener('click', () => advanceTurn(1));
    $('end-combat').addEventListener('click', () => openCombatAftermath());
    for (const button of document.querySelectorAll('[data-die]')) button.addEventListener('click', () => {
      const count = Math.max(1, Math.min(20, signedInteger($('dice-count').value, 1, 20)));
      const modifier = signedInteger($('dice-modifier').value, -99, 99);
      $('dice-count').value = count;
      $('dice-modifier').value = modifier;
      const entry = recordDiceRoll($('roll-label').value.trim(), count, Number(button.dataset.die), modifier);
      commit();
      toast(`${entry.notation}: ${entry.total}`);
    });
    $('log-manual-roll').addEventListener('click', () => {
      const input = $('manual-roll-total');
      if (input.value.trim() === '') { toast('Enter the total shown on your physical dice.'); return; }
      const entry = recordManualRoll($('roll-label').value.trim(), signedInteger(input.value, -999, 999));
      input.value = '';
      commit();
      toast(`Logged ${entry.label}: ${entry.total}`);
    });
    $('hide-tv-roll').addEventListener('click', () => { state.publicRollId = null; commit(); });
    $('scene-select').addEventListener('change', event => changeScene(event.target.value));
    $('show-grid').addEventListener('change', event => {
      state.grid = event.target.checked;
      if (state.sessionKind === 'custom' && getScene(state.scene)) getScene(state.scene).grid = state.grid;
      commit();
    });
    $('player-reveal').addEventListener('change', event => { state.playerReveal = event.target.checked; commit(); });
    $('open-player').addEventListener('click', () => {
      const url = location.href.split('#')[0] + '#player';
      playerWindow = window.open(url, 'echo-below-player-screen', 'width=1280,height=800');
      if (!playerWindow) toast('The browser blocked the player window. Allow this popup and try again.');
      else {
        if (!tvChannel) playerClients.set(playerWindow, { heartbeat: 0, ackAt: 0, bootId: '', error: '' });
        connected = false; updateConnection(); playerWindow.focus();
      }
    });
    $('bring-party').addEventListener('click', () => {
      if (!currentIsMap()) return;
      const party = state.tokens.filter(t => t.team === 'pc' || t.id === 'ally-dracuseth');
      party.forEach((t, i) => { t.placed = true; t.visible = true; t.scene = state.scene; t.x = 42 + i * 5; t.y = 84; });
      commit();
    });
    $('inspiring-leader').addEventListener('click', () => {
      const amount = state.leaderTempHp;
      for (const t of state.tokens.filter(t => t.team === 'pc' || t.id === 'ally-dracuseth'))
        t.tempHp = Math.max(t.tempHp, amount);
      commit();
    });
    $('leader-temp-hp').addEventListener('change', event => {
      state.leaderTempHp = bounded(event.target.value);
      commit('Updated Inspiring Leader temporary HP');
    });
    $('reveal-all').addEventListener('click', () => {
      if(globalThis.ECHO_DUNGEON)globalThis.ECHO_DUNGEON.scene(dungeonData(),state.scene).concealed=[];
      const { rows, cols } = tileDimensions();
      setFogForScene(state.scene, Array.from({ length: rows * cols }, (_, index) => `${Math.floor(index / cols)},${index % cols}`));
      state.requests = []; commit();
    });
    $('reset-fog').addEventListener('click', () => {
      if(globalThis.ECHO_DUNGEON&&!mapSceneData().floorFog){const {rows,cols}=tileDimensions();globalThis.ECHO_DUNGEON.manualFog(dungeonData(),state.scene,Array.from({length:rows*cols},(_,i)=>`${Math.floor(i/cols)},${i%cols}`),false,mapSceneData().fineFog);}
      setFogForScene(state.scene, state.sessionKind === 'session1' && state.scene === 'interior' ? entranceFog() : []);
      if(globalThis.ECHO_DUNGEON&&!mapSceneData().floorFog)globalThis.ECHO_DUNGEON.manualFog(dungeonData(),state.scene,fogForScene(),true,mapSceneData().fineFog);
      state.requests = []; commit();
    });
    $('download-save').addEventListener('click', () => {
      downloadJson(`echo-below-${activeSessionId}-save.json`, { ...state, campaignRules: campaignIndex.rules });
    });
    $('load-save-button').addEventListener('click', () => $('load-save-file').click());
    $('load-save-file').addEventListener('change', async event => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const imported = JSON.parse(await file.text());
        const candidate = normalize(imported);
        const rules = imported.campaignRules
          ? globalThis.ECHO_RULES_UI?.normalizeSettings(imported.campaignRules) || null : campaignIndex.rules;
        const sourceVersion = globalThis.ECHO_RELIABILITY.versionOf(imported);
        const restoreId = await captureRestorePoint(`Before importing ${file.name}`, 'automatic');
        const nextIndex = { ...campaignIndex, rules, schemaVersion: DATA_VERSION };
        if (sourceVersion < DATA_VERSION) nextIndex.migrationReport = [...(campaignIndex.migrationReport || []),
          { at:new Date().toISOString(), from:sourceVersion, to:DATA_VERSION, session:activeSessionId,
            restorePoint:restoreId, note:'Imported an older session after validating it; the previous session is recoverable.' }].slice(-30);
        await saveQueue;
        await writeRecordsAtomic([[campaignSessionKey(activeSessionId), JSON.stringify(candidate)],
          [campaignIndexKey(), JSON.stringify(nextIndex)]]);
        state = candidate;
        campaignIndex = nextIndex;
        if (imported.campaignRules) {
          campaignIndex.rules = rules;
          globalThis.ECHO_RULES_UI?.setSettings(campaignIndex.rules);
        }
        lastCommittedSnapshot = gameSnapshot(state);
        selectedEncounter = sessionEncounters()[0]?.id || 'all';
        selectedTokenId = null;
        resetBuilderForms();
        populateHandoutFields();
        sessionCache.set(activeSessionId, JSON.stringify(state)); renderDM(); sendToPlayer();
        toast('Session save loaded.');
      }
      catch (error) { toast(`Session import left the live campaign unchanged: ${error.message}`); }
      event.target.value = '';
    });
    window.addEventListener('message', handleDMMessage);
    if (tvChannel) tvChannel.onmessage = handleTVChannelMessage;
    window.addEventListener('pointermove', event => {
      if (!fogPainting || !sceneHasFog()) return;
      if(mapSceneData().floorFog){const stage=$('dm-stage'),box=stage.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)return;const key=tileForPoint({...mapPoint(event,stage),scene:state.scene});if(fogForScene().includes(key)===!fogCovering)return;revealTile(key,!fogCovering,false);const canvas=stage.querySelector('.floor-fog-canvas');if(canvas)globalThis.ECHO_FLOOR_MAPS.paint(canvas,fogForScene(),mapSceneData().floorFog,true);return;}
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const tile = target?.closest?.('#dm-stage .fog-tile');
      if (!tile) return;
      const key = tile.dataset.key;
      if (fogForScene().includes(key) === !fogCovering) return;
      revealTile(key, !fogCovering, false);
      tile.classList.toggle('revealed', !fogCovering);
    });
    window.addEventListener('pointerup', () => { if (fogPainting) { fogPainting = false; commit(); } });
    window.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        dungeonPlacement=null;
        if (selectedTokenId) { selectedTokenId = null; renderCombatCard(); }
        else if (activeMapTool !== 'move') setMapTool('move');
        return;
      }
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A', 'SUMMARY'].includes(document.activeElement?.tagName) || document.querySelector('dialog[open]')) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const scenes = sceneEntries().map(scene => scene.id);
        const index = scenes.indexOf(state.scene);
        changeScene(scenes[Math.max(0, Math.min(scenes.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)))]);
      } else if (event.key.toLowerCase() === 'b') changeScene(state.scene === 'black' ? priorScene : 'black');
    });
    globalThis.ECHO_COCKPIT?.init({previewPlayer:mountPrivatePreview,captureContext:()=>({key:activeCampaignId+'/'+activeSessionId,contextTab,selectedTokenId,selectedEncounter,selectedClueId,previewSceneId}),restoreContext:c=>{if(!c||c.key!==activeCampaignId+'/'+activeSessionId)return;selectedTokenId=getToken(c.selectedTokenId)?c.selectedTokenId:null;selectedEncounter=c.selectedEncounter;selectedClueId=c.selectedClueId;previewSceneId=getScene(c.previewSceneId)?c.previewSceneId:state.scene;contextTab=c.contextTab;},context:tab=>{contextTab=tab;renderContextSidebar();},ensureRun:()=>{if($('dm-app').classList.contains('review-mode'))setWorkspaceMode('run');},toast,image:resolveImage,
      flow:()=>({key:activeCampaignId+'/'+activeSessionId,
        phase:globalThis.ECHO_SESSION_FLOW.session(campaignIndex.tableExtras,activeSessionId).phase}),
      view:()=>({tab:contextTab,scene:{...getScene(state.scene),title:displaySceneTitle(getScene(state.scene)?.title),id:state.scene},preview:getScene(previewSceneId)?{...getScene(previewSceneId),id:previewSceneId}:null,beat:sessionRunbook().find(beat=>beat.id===state.runbook)||null,beatScene:(()=>{const beat=sessionRunbook().find(item=>item.id===state.runbook);return beat?.scene&&getScene(beat.scene)?{...getScene(beat.scene),id:beat.scene}:null;})(),beats:sessionRunbook().map(beat=>({id:beat.id,title:beat.title})),session:campaignIndex.sessions.find(s=>s.id===activeSessionId)?.name||'Session',objective:globalThis.ECHO_OUTCOMES?.tableObjective(campaignContinuity(),campaignIndex.tableExtras.playerHub?.objective)?.text||globalThis.ECHO_QUEST_PREP?.live(campaignIndex.story,activeSessionId)?.objective||globalThis.ECHO_DM_DESK.session(globalThis.ECHO_DM_DESK.data(campaignIndex.tableExtras),activeSessionId).objective||campaignIndex.tableExtras.playerHub?.objective?.text||''}),
      sessionMap:()=>({markerContext:navigationMarkerContext(),packId:state.contentPackId,key:activeCampaignId+'/'+activeSessionId,name:campaignIndex.sessions.find(s=>s.id===activeSessionId)?.name||'Session',rootMap:globalThis.ECHO_CONTENT_PACKS?.find(p=>p.id===state.contentPackId)?.rootMap,preparation:(()=>{const p=globalThis.ECHO_CONTENT_PACKS?.find(p=>p.id===state.contentPackId);return p?.preparationVersion===1?{audit:p.preparationAudit,label:p.preparationLabel}:null;})(),currentBeat:state.runbook,beats:sessionRunbook(),scenes:sceneEntries(),points:Object.fromEntries(sceneEntries().filter(s=>s.kind==='map').map(s=>[s.id,state.map.scenes[s.id]?.points||globalThis.ECHO_TOWN_MAPS?.scene(s.id)?.points||[]]))}),
      openMarkerNPC:id=>{if(campaignIndex.story.npcs.some(n=>n.id===id))globalThis.ECHO_STORY_UI.openPerson(id);else toast('This contact has no saved NPC card yet.');},
      reviewMapMarker:(scene,point,title)=>{const exists=navigationSourceMarkers().some(m=>m.scene===scene&&m.point===point)||(mapSceneData(scene)?.points||[]).some(m=>m.id===point);if(!exists)return toast('This location marker is no longer available.');globalThis.ECHO_STORY_UI.outcome({title:'Location outcome · '+title,detail:'',status:'planned',basis:'Open',share:'private',playerText:'',markers:[{scene,point,reveal:false}],source:'DM location review — enter what actually happened, including any decision to postpone.'});},
      reviewEncounter:id=>{const beat=sessionRunbook().find(b=>b.id===id);if(beat?.encounter&&state.combat.plans[beat.encounter]?.aftermath?.sessionId===activeSessionId)return openCombatAftermath(beat.encounter);if(beat)globalThis.ECHO_STORY_UI.outcome({kind:'other',title:'Outcome · '+beat.title,detail:'',playerText:'',status:'planned',basis:'Open',share:'private',markers:(()=>{const nav=globalThis.ECHO_SESSION_MAP?.selection();return nav?.markerId?[{scene:nav.board,point:nav.markerId,reveal:false}]:[];})(),sceneGuide:globalThis.ECHO_ENCOUNTER_FLOW?.reviewContext(activeCampaignId+'/'+activeSessionId,beat),source:'Prepared scene '+id+' — enter and review the actual account before confirming.'});},
      applySessionPreparation:async()=>{const pack=globalThis.ECHO_CONTENT_PACKS?.find(p=>p.id===state.contentPackId);if(pack?.preparationVersion!==1)return;await captureRestorePoint('Before revised '+pack.preparationLabel+' preparation','manual');state.runbookBeats=structuredClone(pack.runbook);for(const id of pack.scenes)if(!state.scenes.some(s=>s.id===id)&&SCENES[id])state.scenes.push({id,...SCENES[id],kind:SCENES[id].kind||'visual',fog:SCENES[id].fog===true,grid:SCENES[id].kind==='map'&&SCENES[id].grid!==false});if(!pack.beats.includes(state.runbook))state.runbook=pack.beats[0];commit('Updated '+pack.preparationLabel+' preparation; gameplay and TV unchanged');globalThis.ECHO_SESSION_MAP?.render();},
      previewSessionMap:id=>{if(!getScene(id)||!isMapScene(id))return;previewSceneId=id;contextTab='scene';renderContextSidebar();},
      returnLive:()=>{previewSceneId=state.scene;contextTab='guide';renderContextSidebar();},showPreview:showScenePreview,
      showBeatVisual:(artId)=>{const beat=sessionRunbook().find(item=>item.id===state.runbook);
        if(artId&&getScene(artId)?.kind!=='map'){
          const media=campaignIndex.presentation.media.find(m=>m.path===getScene(artId)?.image&&m.audience!=='dm');
          if(media){Object.assign(state.presentation,{mode:'scene',mediaId:media.id,handoutId:'',title:'',subtitle:'',banner:'',activePreset:''});if(campaignIndex.tableExtras.atlas)campaignIndex.tableExtras.atlas.shown=null;commit('Showed reviewed location art');return;}
        }
        if(!beat?.scene||!getScene(beat.scene)){toast('This beat has no prepared visual in the current session.');return;}
        if(state.turn.order.length&&state.turn.scene!==beat.scene){toast('End the current combat before showing a different scene.');return;}
        changeScene(beat.scene,false);
      },
      previewBeatScene:()=>{const beat=sessionRunbook().find(item=>item.id===state.runbook);
        if(!beat?.scene||!getScene(beat.scene)){toast('This beat has no prepared map.');return;}
        previewSceneId=beat.scene;contextTab='scene';renderContextSidebar();
      },
      combat:{
        snapshot:()=>({isMap:currentIsMap(),sceneId:state.scene,sceneTitle:displaySceneTitle(getScene(state.scene)?.title)||'Scene',
          precision:(()=>{const scene=getScene(state.scene),source=globalThis.ECHO_ATLAS?.proposal(scene?.image);
            if(source?.scale?.tacticalMeasurement===true)return 'Calibrated tactical grid · use its saved scale';
            if(source?.scale?.tacticalMeasurement===false||scene?.grid===false||/^lmop-map-wave/.test(state.scene))return 'Illustrative map · distances need a DM ruling';
            return 'Grid scale unverified · confirm before exact measurement';})(),
          encounterId:selectedEncounter,encounters:sessionEncounters().map(({id,name})=>({id,name})),
          tokens:state.tokens.map(({id,name,team,encounter,scene,placed,visible,hp,maxHp,ac,initiative,conditions})=>({id,name,team,encounter,scene,placed,visible,hp,maxHp,ac,initiative,conditions:[...conditions||[]]})),
          turn:{...state.turn,order:[...state.turn.order]},initiativeOpen:!!state.combatRun.initiativePrompt.open}),
        setMoveTool:()=>setMapTool('move'),
        previewCombatMap:()=>{if(!getScene(state.turn.scene))return;
          previewSceneId=state.turn.scene;contextTab='scene';renderContextSidebar();},
        selectEncounter:id=>{if(!sessionEncounters().some(item=>item.id===id))return;selectedEncounter=id;renderEncounterSelect();renderRosters();renderContextSidebar();globalThis.ECHO_HYBRID_UI?.refresh();},
        stageEncounter:()=>globalThis.ECHO_ENCOUNTER_LAUNCH?.stage('',selectedEncounter),
        stageCurrentBeat:()=>{const beat=sessionRunbook().find(item=>item.id===state.runbook);
          if(beat?.encounter)globalThis.ECHO_ENCOUNTER_LAUNCH?.stage(beat.id,beat.encounter);
          else globalThis.ECHO_ENCOUNTER_LAUNCH?.stage('',selectedEncounter);
        },
        openToken:id=>openCombatCard(id),
        targetToken:id=>{const token=getToken(id);if(!token?.placed||token.scene!==state.scene)return;
          globalThis.ECHO_COMBAT_RUN?.target(id);contextTab='turn';renderContextSidebar();renderStage('dm');},
        placeMissingParty:()=>{if(!currentIsMap())return;
          const missing=state.tokens.filter(token=>token.team==='pc'&&(!token.placed||token.scene!==state.scene));
          if(!missing.length)return;
          const placed=state.tokens.filter(token=>token.team==='pc'&&token.placed&&token.scene===state.scene).length;
          missing.forEach((token,index)=>{const slot=placed+index;token.placed=true;token.visible=true;token.scene=state.scene;
            token.x=Math.min(80,18+(slot%5)*11);token.y=Math.min(84,72+Math.floor(slot/5)*8);});
          commit(`Placed ${missing.length} party token${missing.length===1?'':'s'} on map`);
        },
        toggleToken:id=>{const token=getToken(id);if(!token)return;
          if(token.placed&&token.scene===state.scene){
            if(state.turn.order.includes(id)){toast('This token is in turn order. End combat before removing it, or hide it from the TV.');return;}
            token.placed=false;commit(`${token.name} removed from map`);return;
          }
          if(!currentIsMap()){toast('Choose a battle map before placing tokens.');return;}
          const teammates=state.tokens.filter(item=>item.id!==id&&item.team===token.team&&item.placed&&item.scene===state.scene);
          const slot=teammates.length;token.scene=state.scene;token.placed=true;
          token.x=token.team==='enemy'?Math.min(86,68+(slot%4)*6):Math.min(38,18+(slot%4)*6);
          token.y=Math.min(82,27+Math.floor(slot/4)*10);
          commit(`${token.name} placed on map`);
        },
        toggleVisibility:id=>{const token=getToken(id);if(!token||token.team==='pc')return;token.visible=!token.visible;commit(`${token.name} ${token.visible?'shown on':'hidden from'} TV`);},
        setInitiative:(id,value)=>{const token=getToken(id);if(!token)return;
          if(value==='')token.initiative=null;
          else if(!Number.isInteger(Number(value))||Number(value)<-99||Number(value)>999){toast('Initiative must be a whole number from -99 to 999.');return;}
          else token.initiative=Number(value);
          commit(`${token.name} initiative ${token.initiative??'cleared'}`);
        },
        requestInitiative:toggleInitiativePrompt,rollEnemies:rollPlacedEnemies,buildOrder:buildTurnOrder,
        nextTurn:()=>advanceTurn(1),endCombat:()=>$('end-combat').click()
      }
    });
    globalThis.ECHO_MAP_REGISTER_UI?.init({content:(title,fill)=>globalThis.ECHO_COCKPIT.content(title,fill)});
    initAtlas();
    globalThis.ECHO_RECONCILIATION?.init({
      context:()=>({campaignId:activeCampaignId,story:campaignIndex.story}),
      saveDraft:saveStory,
      persist:async()=>{const key=campaignIndexKey();await enqueueSave(key,JSON.stringify(campaignIndex));if(failedSaveKeys.has(key))throw Error('Browser save failed. The service was not updated; download a backup.');},
      refresh:()=>{} // Keep the current outcome form and its focus intact while background updates finish.
    });
    globalThis.ECHO_CAMPAIGN_ENGINE_UI?.setContext(()=>({campaignId:activeCampaignId,sessionId:activeSessionId,story:campaignIndex.story,
      title:campaignIndex.sessions.find(s=>s.id===activeSessionId)?.name||'Session',scratch:state.ergonomics?.scratch||'',
      recap:globalThis.ECHO_SESSION_FLOW?.session(campaignIndex.tableExtras,activeSessionId)?.notes?.recap||''}));
    const assistantContext=()=>({campaignId:activeCampaignId,sessionId:activeSessionId,state,story:campaignIndex.story,rules:campaignIndex.rules,
        scene:{...getScene(state.scene),title:displaySceneTitle(getScene(state.scene)?.title),id:state.scene},beat:sessionRunbook().find(b=>b.id===state.runbook),
        objectives:globalThis.ECHO_QUEST_PREP.cards(campaignContinuity()).filter(q=>q.status==='active'),
        pending:globalThis.ECHO_DM_DESK.inbox(state,campaignIndex.tableExtras,globalThis.ECHO_DM_DESK.session(globalThis.ECHO_DM_DESK.data(campaignIndex.tableExtras),activeSessionId),globalThis.ECHO_CONTINUITY.trackers(campaignContinuity()),true),
        clues:(presentedMapScene().points||[]).map(p=>({id:p.id,title:p.title,clue:p.clue,visible:p.visible,approved:p.approved}))});
    globalThis.ECHO_CAMPAIGN_ASSISTANT_UI?.init({
      content:(title,fill)=>globalThis.ECHO_COCKPIT.content(title,fill),toast,advance:id=>globalThis.ECHO_PARTY_UI.openAdvance(id),context:assistantContext,
      book:(book,page)=>globalThis.ECHO_RULES_UI.openBook(book,globalThis.ECHO_RULES_UI.printedToPdf(book,page).page),
      correct:id=>globalThis.ECHO_STORY_UI.correctOutcome(id),outcome:values=>globalThis.ECHO_STORY_UI.outcome(values)
    });
    globalThis.ECHO_AI_UI?.init({content:(title,fill)=>globalThis.ECHO_COCKPIT.content(title,fill),settings:()=>globalThis.ECHO_COCKPIT.open('Settings'),toast,
      context:()=>({state,story:campaignIndex.story,scene:{...getScene(state.scene),title:displaySceneTitle(getScene(state.scene)?.title),id:state.scene},beat:sessionRunbook().find(b=>b.id===state.runbook),sessionId:activeSessionId,campaignId:activeCampaignId})});
    globalThis.ECHO_VOICE_UI?.init({content:(title,fill)=>globalThis.ECHO_COCKPIT.content(title,fill),toast,advance:id=>globalThis.ECHO_PARTY_UI.openAdvance(id),
      get:()=>campaignIndex.story.voiceCast,blank:()=>campaignIndex.story.contentProfile==='blank',
      set:async value=>{campaignIndex.story.voiceCast=globalThis.ECHO_AI_VOICE_CAST.normalize(value);await saveCampaignIndex();},
      audioState:()=>globalThis.ECHO_PRESENTATION.audioState()});
    globalThis.ECHO_VOICE_STUDIO?.init({
      content:(title,fill)=>globalThis.ECHO_COCKPIT.content(title,fill),toast,advance:id=>globalThis.ECHO_PARTY_UI.openAdvance(id),campaign:()=>activeCampaignId,practice:()=>activeCampaignId.startsWith('practice-'),
      get:()=>campaignIndex.story.voiceStudio,cast:()=>campaignIndex.story.voiceCast,
      set:async value=>{campaignIndex.story.voiceStudio=globalThis.ECHO_VOICE_STUDIO_DATA.normalize(value);await saveCampaignIndex();},
      sources:()=>[...globalThis.ECHO_VOICE_STUDIO_SOURCES.collect({story:campaignIndex.story,beats:sessionRunbook(),sessionId:activeSessionId,handouts:campaignIndex.presentation.handouts}),...(campaignIndex.story.voiceStudio?.clips||[]).filter(c=>c.source.kind==='assistant').map(c=>({kind:'assistant',id:c.source.id,sessionId:c.source.sessionId,title:c.title,text:c.script,fingerprint:globalThis.ECHO_CAMPAIGN_ASSISTANT.signature(assistantContext()),allowed:c.source.fingerprint===globalThis.ECHO_CAMPAIGN_ASSISTANT.signature(assistantContext()),reason:'The assistant’s supporting records changed. Draft and review updated wording in DM assistant.'}))],
      media:()=>campaignIndex.presentation.media,readMedia:id=>readRecord('media:'+id),
      storeMedia:async(id,blob,title)=>{const campaign=activeCampaignId;await writeMediaRecord(id,blob);if(campaign!==activeCampaignId)throw Error('Campaign changed while saving the recording.');campaignIndex.presentation.media.push({id,name:'Voice · '+title,kind:'audio',category:'audio',audience:'dm',mime:blob.type,path:'',hash:'',size:blob.size,tags:['narration-private'],source:'DM-reviewed voice studio recording',license:'Provider-generated or imported; check selected voice rights before sharing'});await saveCampaignIndex();},
      volume:value=>{campaignIndex.presentation.audio.narration=value;void saveCampaignIndex();globalThis.ECHO_PRESENTATION.syncAudio();},
      publish:sendToPlayer,
      stage:async c=>{const media=campaignIndex.presentation.media.find(m=>m.id===c.visualId&&m.kind==='image'&&m.audience!=='dm');if(media){state.presentation.mode='scene';state.presentation.mediaId=media.id;commit('Showed explicitly staged narration visual');}if(c.ambienceId)await globalThis.ECHO_PRESENTATION.playGroup('ambience',c.ambienceId);}
    });
    globalThis.ECHO_TABLE_FLOW?.init({state:()=>state,extras:()=>campaignIndex.tableExtras,story:()=>campaignIndex.story,campaign:()=>activeCampaignId,session:()=>activeSessionId,beats:sessionRunbook,sceneTitle:()=>displaySceneTitle(getScene(state.scene)?.title)||'',save:()=>{void saveCampaignIndex();},toast,
      content:(title,fill)=>globalThis.ECHO_COCKPIT.content(title,fill),
      workspace:()=>({runbook:state.runbook,query:previewQuery,kind:previewKind,context:contextTab}),
      restoreWorkspace:w=>{if(sessionRunbook().some(b=>b.id===w.runbook))state.runbook=w.runbook;previewQuery=typeof w.query==='string'?w.query:'';previewKind=['all','map','art'].includes(w.kind)?w.kind:'all';if(['guide','turn','scene','encounter','clue','requests'].includes(w.context))contextTab=w.context;},
      preview:id=>{if(!getScene(id)){toast('That destination map is not in this session. Open Travel to stage its arrival.');return;}previewSceneId=id;contextTab='scene';renderContextSidebar();},
      note:value=>{state.ergonomics.scratch=String(value).slice(0,10000);commit('Saved private improv note');},returnNotes:id=>{if(sessionRunbook().some(b=>b.id===id))selectRunbook(id);globalThis.ECHO_COCKPIT.setFocus(false);contextTab='guide';renderContextSidebar();},storyOpen:()=>globalThis.ECHO_STORY_UI.open(),
      action:key=>{if(key==='music'){globalThis.ECHO_PRESENTATION.open('audio');return;}const ids={music:'open-presentation',damage:'quick-damage',roll:'quick-roll',travel:'quick-travel',notes:'quick-notes',party:'open-party',inbox:'quick-inbox'};if(ids[key]){$(ids[key]).click();return;}if(key==='turn'){contextTab='turn';renderContextSidebar();return;}if(key==='reveal'){if(!sceneHasFog()){toast('Choose a fog-enabled map before revealing squares. Maps & exploration has precise reveal settings.');return;}globalThis.ECHO_COCKPIT.showPanel('#fog-panel','Reveal tools');return;}if(key==='potion'){globalThis.ECHO_PLAYER_TOOLS_UI.open();return;}if(key==='clue'){globalThis.ECHO_PHONE.open();for(const d of document.querySelectorAll('#phones-drawer details'))if(d.querySelector('summary')?.textContent.includes('Private clues'))d.open=true;}},
      useItem:(owner,target,item)=>{const id=globalThis.ECHO_DM_DESK.id();globalThis.ECHO_PLAYER_TOOLS.receive(campaignIndex.tableExtras,state.party,{kind:'item-request',requestId:id,characterId:owner,verb:'use',source:item.source,itemId:item.id,itemName:item.name,targetId:target,quantity:1,note:''});commit('Prepared DM item-use review');globalThis.ECHO_PLAYER_TOOLS_UI.open(id);},
      practice:()=>activeCampaignId.startsWith('practice-'),leavePractice:async()=>{const source=campaignRegistry.campaigns.find(c=>c.id===activeCampaignId)?.practiceSource;if(!source)throw Error('Choose the original campaign in Session.');if(confirm('Return to the real campaign? Practice phone joins will close; reconnect phones after switching.'))await activateCampaign(source);}
    });
    globalThis.ECHO_SESSION_FLOW_UI?.init({
      context:()=>{const local=globalThis.ECHO_DM_DESK.session(globalThis.ECHO_DM_DESK.data(campaignIndex.tableExtras),activeSessionId),lead=globalThis.ECHO_QUEST_PREP?.live(campaignIndex.story,activeSessionId);return {campaignId:activeCampaignId,sessionId:activeSessionId,sessionName:campaignIndex.sessions.find(s=>s.id===activeSessionId)?.name||'Session',state,extras:campaignIndex.tableExtras,story:campaignIndex.story,beat:sessionRunbook().find(b=>b.id===state.runbook),sceneTitle:displaySceneTitle(getScene(state.scene)?.title)||state.scene,lead,objective:globalThis.ECHO_OUTCOMES?.tableObjective(campaignContinuity(),campaignIndex.tableExtras.playerHub?.objective)?.text||lead?.objective||local.objective||campaignIndex.tableExtras.playerHub?.objective?.text||'',activeQuests:globalThis.ECHO_QUEST_PREP.cards(campaignContinuity()).filter(q=>q.status==='active').map(q=>({id:q.id,title:q.title,status:q.status})),pending:globalThis.ECHO_DM_DESK.inbox(state,campaignIndex.tableExtras,local,globalThis.ECHO_CONTINUITY.trackers(campaignContinuity()),true),checks:globalThis.ECHO_RELIABILITY.tableStatus()};},
      content:(title,fill)=>globalThis.ECHO_COCKPIT.content(title,fill),toast,advance:id=>globalThis.ECHO_PARTY_UI.openAdvance(id),
      save:async()=>{const key=campaignIndexKey(),raw=JSON.stringify(campaignIndex);const pending=saveQueue.then(()=>writeRecord(key,raw));saveQueue=pending.catch(()=>{});await pending;},snapshot:label=>captureRestorePoint(label,'manual'),outcome:values=>globalThis.ECHO_STORY_UI.outcome(values),
      review:item=>{if(item.kind==='outcome')return globalThis.ECHO_STORY_UI.open('outcomes');if(item.kind==='decision')return globalThis.ECHO_DM_DESK_UI.open('pace');reviewDeskItem(item);},
      tool:key=>{const actions={spotlights:()=>globalThis.ECHO_STORY_UI.open('spotlights'),quests:()=>globalThis.ECHO_STORY_UI.openQuestBoard(activeSessionId),outcomes:()=>globalThis.ECHO_STORY_UI.open('outcomes'),recap:()=>{const draft=globalThis.ECHO_SESSION_FLOW.session(campaignIndex.tableExtras,activeSessionId).notes.recap;if(draft)globalThis.ECHO_CONTINUITY_UI.stageRecap(draft);else globalThis.ECHO_CONTINUITY_UI.selectTab('recap');globalThis.ECHO_STORY_UI.open('continuity');},explore:()=>{applyDeskLayout('exploration');globalThis.ECHO_HYBRID_UI?.go('explore');globalThis.ECHO_GUIDED.open('scene');},conversation:()=>{applyDeskLayout('conversation');globalThis.ECHO_HYBRID_UI?.go('scene');globalThis.ECHO_GUIDED.open('scene');},combat:()=>{globalThis.ECHO_HYBRID_UI?.go('combat');globalThis.ECHO_GUIDED.open('combat');},preview:()=>{const beat=sessionRunbook().find(b=>b.id===state.runbook);if(beat?.encounter)return globalThis.ECHO_ENCOUNTER_LAUNCH.stage(beat.id,beat.encounter);if(beat?.scene&&getScene(beat.scene)){previewSceneId=beat.scene;contextTab='scene';renderContextSidebar();}else $('quick-scene').click();},inventory:()=>globalThis.ECHO_PHONE.open(),party:()=>globalThis.ECHO_PARTY_UI.open(),music:()=>globalThis.ECHO_PRESENTATION.open('audio'),desk:()=>globalThis.ECHO_DM_DESK_UI.open('pace'),detour:()=>globalThis.ECHO_TABLE_FLOW.openDetour()};return actions[key]?.();}
    });
    const practiceButton=document.createElement('button');practiceButton.type='button';practiceButton.textContent='Create practice campaign';practiceButton.onclick=async()=>{if(activeCampaignId.startsWith('practice-')){toast('You are already in a practice campaign.');return;}if(!confirm('Create and open a separate practice copy? Phone access will close; use a new QR code in the practice campaign. Real campaign records remain separate.'))return;practiceButton.disabled=true;try{await duplicateCampaign(activeCampaignId,true);}catch(e){toast(e.message);}finally{practiceButton.disabled=false;}};$('cockpit-tools-Settings').append(practiceButton);
    renderDM();
    setWorkspaceMode(campaignIndex.ergonomics?.mode || 'run');
    if(globalThis.ECHO_DM_DESK&&campaignIndex.ergonomics?.mode==='run')applyDeskLayout(globalThis.ECHO_DM_DESK.data(campaignIndex.tableExtras).layout);
    if(campaignIndex.ergonomics?.mode==='run'){contextTab='guide';renderContextSidebar();}
    setInterval(updateConnection, 2000);
    setInterval(() => { void captureRestorePoint('Automatic during session', 'automatic').catch(() => {}); }, 20 * 60 * 1000);
  }

  if (IS_PLAYER) initPlayer();
  else void loadCampaign().then(initDM).catch(error => {
    console.error('Campaign initialization failed', error);
    $('dm-app').hidden = true;
    const message = document.createElement('p'); message.className = 'load-error';
    message.textContent = `Saved campaign data could not be opened safely: ${error.message}. Your stored records were not replaced. Keep your backup and update the app or restore from a valid file.`;
    document.body.prepend(message);
  });
  if(globalThis.ECHO_BOUNDARY){const message=ECHO_BOUNDARY.notice();if(message)setTimeout(()=>toast(message),1200);}
})();
