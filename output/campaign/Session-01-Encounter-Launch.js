(() => {
  'use strict';
  let host = null;
  let draft = null;
  const el = (tag, value = '', className = '') => { const node = document.createElement(tag); node.textContent = value; node.className = className; return node; };
  function planFor(encounterId, beatId = '') {
    const encounter = host.encounters().find(item => item.id === encounterId);
    if (!encounter) return null;
    const beat = host.beats().find(item => item.id === beatId) || host.beats().find(item => item.encounter === encounterId);
    const expected = globalThis.ECHO_COMBAT_DATA?.expectedScene(encounterId,host.state.combat?.plans);
    const sceneId = [draft?.encounterId===encounterId?draft.sceneId:'',expected, beat?.scene, host.state.scene].find(id => host.scenes().some(scene => scene.id === id && scene.kind === 'map'));
    const scene = host.scenes().find(item => item.id === sceneId);
    const wave = host.state.combat?.plans?.[encounterId]?.waves?.[0];
    const tokens = host.state.tokens.filter(item => item.encounter === encounterId && item.hp > 0);
    const initialIds = wave?.tokenIds?.length ? wave.tokenIds.filter(id => tokens.some(item => item.id === id)) : tokens.map(item => item.id);
    const cue = beat?.music || host.musicHint() || '';
    const sounds = host.media().filter(item => item.kind === 'audio' && (item.tags?.includes('music') || item.tags?.includes('ambience')));
    const sound = sounds.find(item => item.id === cue || item.name.toLowerCase() === String(cue).toLowerCase());
    return { encounter, beat, scene, wave, tokens, initialIds, cue, sounds, defaultMusic: sound?.id || '' };
  }
  function stage(beatId = '', encounterId = '') {
    if (!host) return;
    const beat = host.beats().find(item => item.id === beatId);
    const id = encounterId || beat?.encounter || host.selectedEncounter();
    const plan = planFor(id, beatId);
    if (!plan) { host.toast('Choose a prepared encounter first.'); return; }
    draft = { encounterId: id, beatId: plan.beat?.id || '', sceneId: plan.scene?.id || '',
      musicId: plan.defaultMusic, place: true, reveal: false, hideHandout: true };
    host.showEncounter(id);
  }
  function render(root, encounterId) {
    if (!host || !root) return;
    const box = el('section', '', 'encounter-launch');
    const start = el('button', draft?.encounterId === encounterId ? 'Encounter staged' : 'Stage this encounter');
    start.type = 'button'; start.disabled = draft?.encounterId === encounterId;
    start.addEventListener('click', () => stage('', encounterId)); box.append(start);
    if (!draft || draft.encounterId !== encounterId) { root.append(box); return; }
    const plan = planFor(draft.encounterId, draft.beatId);
    if (!plan) { draft = null; root.append(box); return; }
    box.append(el('small', 'DM PREVIEW · PLAYER TV UNCHANGED'));
    box.append(el('h3', plan.beat?.title || plan.encounter.name));
    box.append(el('p', `Map: ${plan.scene?.title || 'No battle map linked'}`));
    const sourceMaps=host.scenes().filter(s=>s.kind==='map'&&globalThis.ECHO_ATLAS?.proposal?.(s.image));if(sourceMaps.length){const row=el('label','Prepared battle map'),picker=document.createElement('select');picker.setAttribute('aria-label','Prepared battle map');for(const s of [plan.scene,...sourceMaps].filter((s,i,a)=>s&&a.findIndex(x=>x?.id===s.id)===i)){const option=el('option',s.title);option.value=s.id;picker.append(option);}picker.value=draft.sceneId;picker.onchange=()=>{draft.sceneId=picker.value;draft.place=false;draft.reveal=false;host.refresh();};row.append(picker);box.append(row);box.append(el('small','Changing map remains private. Placement and reveal are turned off; set new positions on the selected geometry. The previous map, fog and positions remain saved.'));}
    const source=globalThis.ECHO_ATLAS?.proposal?.(plan.scene?.image);
    if(/^lmop-map-wave/.test(plan.scene?.id||'')){box.append(el('p','Illustrative map · printed room geometry governs doors, exits and distance. This painting is not calibrated for exact movement.','encounter-launch-warning'));const exact=el('button','Review source-layout maps in Atlas');exact.type='button';exact.onclick=()=>globalThis.ECHO_ATLAS_UI?.open();box.append(exact);}
    else if(source){box.append(el('p',source.scale?.tacticalMeasurement===false?'Source-layout overview · use a tactical section for measured movement.':'Source-layout map · check calibration before measuring.'));if(source.scale?.calibrationCaveat)box.append(el('small',source.scale.calibrationCaveat));}
    if (plan.scene?.image) { const image = el('img', '', 'encounter-launch-image'); image.src = host.sceneImage(plan.scene); image.alt = `DM preview of ${plan.scene.title}`; box.append(image); }
    if (plan.beat?.read?.length) {
      const read = el('div', '', 'encounter-launch-read'); read.append(el('strong', 'Say aloud'));
      for (const paragraph of plan.beat.read) read.append(el('p', paragraph)); box.append(read);
    }
    if (plan.beat?.run?.length) { const details = el('details'); details.append(el('summary', 'DM running notes'));
      for (const paragraph of plan.beat.run) details.append(el('p', paragraph)); box.append(details); }
    box.append(el('p', `First wave: ${plan.initialIds.length ? plan.tokens.filter(item => plan.initialIds.includes(item.id)).map(item => item.name).join(', ') : 'No living combatants assigned'}`));
    const option = (label, key) => { const row = el('label', '', 'encounter-launch-option'); const input = document.createElement('input');
      input.type = 'checkbox'; input.checked = draft[key]; input.addEventListener('change', () => { draft[key] = input.checked; });
      row.append(input, document.createTextNode(` ${label}`)); box.append(row); };
    option('Place the first wave on the DM map', 'place');
    option('Reveal those enemies to players immediately', 'reveal');
    option('Hide the previous handout', 'hideHandout');
    const music = el('label', 'Music or ambience'); const select = document.createElement('select');
    const none = document.createElement('option'); none.value = ''; none.textContent = 'No audio change'; select.append(none);
    for (const item of plan.sounds) { const option = document.createElement('option'); option.value = item.id; option.textContent = item.name; select.append(option); }
    select.value = draft.musicId; select.addEventListener('change', () => { draft.musicId = select.value; }); music.append(select); box.append(music);
    if (plan.cue && !plan.defaultMusic) box.append(el('small', `Runbook music note: ${plan.cue}`));
    box.append(el('p', 'Show on TV changes the map once. Initiative and later waves stay under DM control.'));
    const combatActive = (host.state.turn?.order || []).length > 0;
    if (combatActive) box.append(el('p', 'A turn order is still active. End that combat before launching another encounter.', 'encounter-launch-warning'));
    const actions = el('div', '', 'button-row');
    const launch = el('button', 'Show map on TV and launch', 'primary'); launch.type = 'button'; launch.disabled = !plan.scene || combatActive;
    launch.addEventListener('click', () => { if (!draft) return; const choice = { ...draft }; draft = null; host.launch(choice); }); actions.append(launch);
    const cancel = el('button', 'Cancel staging'); cancel.type = 'button'; cancel.addEventListener('click', () => { draft = null; host.refresh(); }); actions.append(cancel);
    box.append(actions); root.append(box);
  }
  function init(context) { host = context; }
  globalThis.ECHO_ENCOUNTER_LAUNCH = { init, stage, render };
})();
