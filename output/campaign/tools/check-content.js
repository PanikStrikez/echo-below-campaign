const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
global.window = global;
global.location = { hash: '' };
for (const file of ['LMOP-Visual-Catalog.js', 'Session-01-Runbook.js', 'Session-02-Runbook.js', 'Session-Content-Packs.js', 'Session-01-Rules-Data.js',
  'Session-01-Rules-Index.js', 'Session-01-Rules-Library.js', 'Session-01-Presentation.js', 'Session-01-Combat-Data.js'])
  require(path.join(root, file));

const pack = global.ECHO_CONTENT_PACKS.find(item => item.id === 'cragmaw-continuation');
assert(pack);
for (const id of pack.beats) assert(global.ECHO_RUNBOOK.some(beat => beat.id === id), `Unknown beat: ${id}`);
for (const id of pack.encounters) assert(global.ECHO_COMBAT_DATA.PLANS[id], `Unknown encounter: ${id}`);
assert.equal(pack.firstScene, 'cave-mouth');
const phandalin = global.ECHO_CONTENT_PACKS.find(item => item.id === 'phandalin-session-2');
assert(phandalin);
assert.equal(phandalin.firstScene, 'lmop-barthen-exterior');
assert(phandalin.scenes.includes(phandalin.firstScene));
assert(phandalin.beats.includes('s2-barthen') && phandalin.beats.includes('s2-redbrands'));
assert(phandalin.runbook.every(beat => phandalin.beats.includes(beat.id)));
assert(fs.existsSync(path.join(root, 'session-02-visuals', 'phandalin-street.svg')));
assert(global.ECHO_COMBAT_DATA.CREATURES['redbrand-ruffian']);
assert.equal(global.ECHO_COMBAT_DATA.normalizePlan(null, 'redbrand-street').waves[0].tokenIds.length, 4);
assert(phandalin.scenes.includes('redbrand-hideout'));
assert(phandalin.beats.includes('s2-glasstaff') && phandalin.beats.includes('s2-crevasse'));
assert.equal(phandalin.encounters.length, 10);
for (const encounter of phandalin.encounters) assert(global.ECHO_COMBAT_DATA.PLANS[encounter], `Missing Session 2 plan: ${encounter}`);
for (const beat of phandalin.runbook) {
  if (beat.scene) assert(phandalin.scenes.includes(beat.scene), `Missing Session 2 scene: ${beat.scene}`);
  if (beat.encounter) assert(phandalin.encounters.includes(beat.encounter), `Missing Session 2 encounter: ${beat.encounter}`);
  if (beat.encounter && global.ECHO_COMBAT_DATA.expectedScene(beat.encounter))
    assert.equal(beat.scene, global.ECHO_COMBAT_DATA.expectedScene(beat.encounter), `Wrong map for ${beat.encounter}`);
}
for (const kind of ['redbrand-ruffian','skeleton','nothic','bugbear','evil-mage'])
  assert(global.ECHO_COMBAT_DATA.CREATURES[kind], `Missing creature: ${kind}`);
const hideoutSvg = fs.readFileSync(path.join(root, 'session-02-visuals', 'redbrand-hideout.svg'), 'utf8');
assert(hideoutSvg.includes('<svg') && hideoutSvg.includes('</svg>'));
for (const secret of ['Glasstaff','Iarno','nothic','Illefarn','treasure','secret door'])
  assert(!hideoutSvg.toLowerCase().includes(secret.toLowerCase()), `Player map leaks ${secret}`);
const boardText = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
assert(boardText.includes("kind: SCENES[sceneId].kind || 'visual'"));
assert(boardText.includes("'redbrand-ruffian'"));
assert(boardText.includes('session2ContentVersion: 7'));
assert(boardText.includes('session2EnemyTokens()'));
assert(boardText.includes("next.sceneFog['redbrand-hideout'] = []"));

const books = global.ECHO_RULES_DATA.books;
for (const id of ['phb', 'dmg', 'srd', 'lmop', 'tristaSheet', 'ringgoSheet', 'donavanSheet'])
  assert(fs.existsSync(path.resolve(root, books[id].file)), `Missing source: ${id}`);
assert.deepEqual(global.ECHO_RULES_UI.printedToPdf('phb', 316), { page: 293, exact: true });
assert.deepEqual(global.ECHO_RULES_UI.printedToPdf('phb', 196), { page: 180, exact: true });
assert.equal(global.ECHO_RULES_UI.pdfToPrinted('phb', 293), 316);
assert.equal(global.ECHO_RULES_UI.printedToPdf('dmg', 235).page, 235);
const settings = global.ECHO_RULES_UI.normalizeSettings(null);
assert(settings.exceptions.some(item => item.id === 'donavan-spells'));
const oldSettings = global.ECHO_RULES_UI.normalizeSettings({ exceptions: settings.exceptions.filter(item => item.id !== 'donavan-spells') });
assert(oldSettings.exceptions.some(item => item.id === 'donavan-spells'));
const removedSettings = global.ECHO_RULES_UI.normalizeSettings({ exceptionCatalogVersion: 2,
  exceptions: settings.exceptions.filter(item => item.id !== 'donavan-spells') });
assert(!removedSettings.exceptions.some(item => item.id === 'donavan-spells'));

const media = global.ECHO_PRESENTATION.normalizeLibrary().media;
const oldPresets = global.ECHO_PRESENTATION.normalizeLibrary({ presets: [{ id: 'battle', name: 'Battlefield', mode: 'battle' }] });
assert(oldPresets.presets.some(item => item.id === 's1-departure'));
assert(oldPresets.presets.some(item => item.id === 's2-barthen'));
assert.equal(global.ECHO_PRESENTATION.normalizeLibrary(oldPresets).presets.filter(item => item.id === 's1-departure').length, 1);
assert.equal(global.ECHO_PRESENTATION.normalizeLibrary(oldPresets).presets.filter(item => item.id === 's2-barthen').length, 1);
const previousSession2Presets = global.ECHO_PRESENTATION.normalizeLibrary({ presetCatalogVersion: 4,
  presets: [{ id: 's2-barthen', name: 'Session 2 · Barthen’s Provisions', mode: 'scene' }] });
assert.equal(previousSession2Presets.presets.filter(item => item.id === 's2-hideout').length, 1);
assert.equal(global.ECHO_PRESENTATION.normalizeLibrary(previousSession2Presets).presets.filter(item => item.id === 's2-hideout').length, 1);
const scoreIds = ['recorded-journey','recorded-forest','recorded-dark-forest','recorded-town','recorded-ambush','recorded-boss'];
const effectIds = ['recorded-goblin','recorded-wolf','recorded-splash'];
const expandedAudioIds = ['recorded-tavern','recorded-bard','recorded-battle-alt','recorded-investigation','recorded-victory',
  'recorded-cavern','recorded-rain','recorded-fire','recorded-blade','recorded-book','recorded-chain','recorded-creature-hurt',
  'recorded-roar','recorded-coins','recorded-gem','recorded-lock','recorded-metal','recorded-spell','recorded-fire-spell',
  'recorded-stones','recorded-wood'];
for (const id of [...scoreIds,'recorded-river',...effectIds,...expandedAudioIds]) {
  const item = media.find(entry => entry.id === id);
  assert(item && item.kind === 'audio', `Missing scene audio: ${id}`);
  const file=fs.readFileSync(path.join(root,item.path));
  assert(file.length > 10000,`Empty scene audio: ${id}`);
  assert(item.mime === 'audio/mpeg' || (item.mime === 'audio/ogg' && file.toString('ascii',0,4) === 'OggS') ||
    (item.mime === 'audio/wav' && file.toString('ascii',0,4) === 'RIFF'),`Invalid audio file: ${id}`);
}
const soundtrack = global.ECHO_PRESENTATION.normalizeLibrary();
assert.equal(soundtrack.presets.filter(item => item.id.startsWith('s1-')).length,14);
assert(soundtrack.presets.some(item => item.id === 's2-stonehill' && item.musicId === 'recorded-tavern'));
assert(soundtrack.presets.some(item => item.id === 's3-castle-infiltration' && item.musicId === 'recorded-investigation'));
const expandedPresets = global.ECHO_PRESENTATION.normalizeLibrary({presetCatalogVersion:6,
  presets:[{id:'s2-town',name:'Custom town scene',mode:'scene',musicId:'recorded-town'}]});
assert(expandedPresets.presets.some(item => item.id === 's2-stonehill'));
assert(expandedPresets.presets.some(item => item.id === 's3-castle-infiltration'));
assert.equal(global.ECHO_PRESENTATION.normalizeLibrary(expandedPresets).presets.filter(item => item.id === 's2-stonehill').length,1);
for (const preset of soundtrack.presets.filter(item=>item.id.startsWith('s1-') && item.musicId))
  assert(scoreIds.includes(preset.musicId),`Unknown scene music: ${preset.name}`);
assert.equal(soundtrack.cuesByBeat.bridge[0].value,'recorded-splash');
assert.equal(global.ECHO_PRESENTATION.normalizeLibrary(soundtrack).cuesByBeat.bridge.length,1);
const migrated = global.ECHO_PRESENTATION.normalizeLibrary({presetCatalogVersion:2,cueCatalogVersion:1,
  presets:[{id:'s1-ambush',name:'Session 1 · Road battle',mode:'battle',musicId:'score-goblin-ambush',ambienceId:'road-wind'}],
  cuesByBeat:{ambush:[{id:'s1-goblins-reveal',action:'sound',value:'fx-goblins-reveal',label:'Goblins emerge'}]}});
assert.equal(migrated.presets[0].musicId,'recorded-ambush');
assert.equal(migrated.cuesByBeat.ambush[0].value,'recorded-goblin');
const board = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
const basic = fs.readFileSync(path.join(root, 'Session-01-TV-Display-basic.html'), 'utf8');
for (const name of ['road-ambush-painted-gridless.png', 'cave-approach-painted-gridless.png', 'cragmaw-hideout-painted-gridless.png']) {
  assert(fs.existsSync(path.join(root, 'session-01-visuals', name)));
  assert(fs.readFileSync(path.join(root,'Echo-Below-Table-Content.js'),'utf8').includes(name) && basic.includes(name), `Map not wired into both views: ${name}`);
}
assert(board.includes('if (isMapScene() && state.grid && visibility?.grid !== false && (!denseFloor || (mapScene.view?.zoom||1)>=5))'));
assert(board.includes("sceneImage: scene => resolveImage(scene.image || '')"));
assert(!basic.includes('cragmaw-hideout-map-source-page.png'));
console.log('Content checks passed: source books, page links, creature pack, exceptions, and audio cues.');
