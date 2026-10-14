/* Read-only plugin take metadata; only an explicit, listened selection saves a cast. */
(() => {
  'use strict';
  const REPORT = 'Voice-Audition-Results.json';
  const FLOW_URL = 'https://elevenlabs.io/app/flows/';
  const MODELS = new Set(['eleven_multilingual_v2', 'eleven_v3']);
  const M = () => globalThis.ECHO_AI_VOICE_CAST;
  const fail = () => { throw Error('The plugin audition records could not be verified. Keep the original report and use the chat previews.'); };
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const id = value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(value);
  const finite = (value, maximum, positive = false) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && (!positive || value > 0) && value <= maximum;
  const timestamp = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value));
  const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };

  function validate(raw) {
    const catalog = M()?.catalog;
    if (!object(raw) || raw.schemaVersion !== 1 || raw.provider !== 'elevenlabs' || !Array.isArray(catalog) || catalog.length !== 4 || !Array.isArray(raw.samples) || raw.samples.length !== catalog.length) fail();
    const roles = new Set(), generations = new Set();
    const samples = raw.samples.map(row => {
      if (!object(row)) fail();
      const profile = catalog.find(candidate => candidate.id === row.role);
      if (!profile || roles.has(row.role) || row.provider !== 'elevenlabs' || !MODELS.has(row.model) || row.voiceRights !== 'provider-stock' || row.status !== 'proposed' || row.selectionStatus !== 'awaiting-user-listening-and-selection') fail();
      if (row.script !== profile.script || row.scriptHash !== profile.scriptHash || !id(row.voiceId) || !id(row.flowId) || !id(row.sessionId) || !id(row.generationId) || generations.has(row.generationId)) fail();
      if (typeof row.voiceName !== 'string' || !row.voiceName.trim() || row.voiceName.length > 160 || /[\u0000-\u001f\u007f]/.test(row.voiceName)) fail();
      if (!finite(row.providerReportedCredits, 1000000) || !finite(row.audioDurationSeconds, 600, true) || !timestamp(row.submittedAt) || !timestamp(row.completionObservedAt) || Date.parse(row.completionObservedAt) < Date.parse(row.submittedAt)) fail();
      roles.add(row.role); generations.add(row.generationId);
      // An allowlist keeps account details, arbitrary URLs and extra metadata out of this bridge.
      return {role:row.role,provider:row.provider,voiceId:row.voiceId,voiceName:row.voiceName,model:row.model,
        status:row.status,selectionStatus:row.selectionStatus,script:row.script,scriptHash:row.scriptHash,
        voiceRights:row.voiceRights,flowId:row.flowId,sessionId:row.sessionId,generationId:row.generationId,
        providerReportedCredits:row.providerReportedCredits,audioDurationSeconds:row.audioDurationSeconds,
        submittedAt:row.submittedAt,completionObservedAt:row.completionObservedAt};
    });
    const total = samples.reduce((sum, row) => sum + row.providerReportedCredits, 0);
    if (!finite(raw.providerReportedCredits, 4000000) || Math.abs(raw.providerReportedCredits - total) > 0.000001) fail();
    return freeze({schemaVersion:1,provider:'elevenlabs',providerReportedCredits:total,
      samples:catalog.map(profile => samples.find(row => row.role === profile.id))});
  }

  function select(report, role, state, listened, options = {}) {
    if (listened !== true) throw Error('Listen privately, then confirm that you listened before selecting this voice.');
    const sample = validate(report).samples.find(row => row.role === role);
    const current = M().profile(state, role);
    if (!sample || !current || current.script !== sample.script || current.scriptHash !== sample.scriptHash) fail();
    return M().selectVoice(state, role, {provider:sample.provider,voiceId:sample.voiceId,voiceName:sample.voiceName,
      model:sample.model,scriptHash:sample.scriptHash,rights:sample.voiceRights,
      auditionId:'elevenlabs-plugin:' + sample.generationId}, true, options);
  }

  let host, report = null, loading = null, error = '', selecting = false;
  const heard = new Set(), mounts = new Set(), roles = new WeakMap(), availability = new Map();
  const isSelected = (profile, sample) => profile?.voice.status === 'selected' &&
    profile.voice.auditionId === 'elevenlabs-plugin:' + sample.generationId &&
    profile.voice.provider === sample.provider && profile.voice.voiceId === sample.voiceId &&
    profile.voice.model === sample.model && profile.voice.scriptHash === sample.scriptHash;
  const el = (tag, text, parent) => { const node = document.createElement(tag); if (text != null) node.textContent = String(text); parent?.append(node); return node; };
  function repaint() { for (const mount of mounts) { if (mount.isConnected) paint(mount); else mounts.delete(mount); } }
  async function load() {
    if (report || loading) return loading;
    loading = (async () => {
      try {
        const response = await fetch(REPORT, {cache:'no-store',credentials:'same-origin',redirect:'error'});
        if (!response.ok) fail();
        report = validate(await response.json());
      } catch (_) { error = 'Plugin audition records are unavailable or could not be verified. The private previews remain in your chat.'; }
      finally { loading = null; repaint(); }
    })();
    return loading;
  }
  function init(value) {
    host = value;
    heard.clear(); mounts.clear(); availability.clear(); error = ''; selecting = false;
  }
  function paint(box) {
    box.replaceChildren();
    if (error) el('p', error, box).className = 'ai-error';
    if (!report) { if (!error) el('p', 'Reading completed plugin auditions…', box); return; }
    el('p', 'Completed plugin samples remain proposed until you listen privately and select a voice. Plugin links open ElevenLabs separately; the app cannot control sound from that tab. Use headphones there.', box);
    el('small', `${report.providerReportedCredits.toFixed(2)} provider-reported credits total · tracked separately from local auditions`, box);
    for (const sample of report.samples.filter(s=>!roles.get(box)||s.role===roles.get(box))) {
      const profile = M().profile(host.get(), sample.role), selected = isSelected(profile, sample), row = el('div', null, box);
      el('h4', `${profile.name} · ${sample.voiceName}`, row);
      el('p', `${sample.audioDurationSeconds.toFixed(1)} seconds · ${sample.providerReportedCredits.toFixed(2)} credits · ${selected ? 'selected by you' : 'proposed'}`, row);
      const local=availability.get(sample.generationId);
      el('p',local?.label||(host.localStatus?'Checking local recording…':'Plugin only · not saved for offline replay'),row).className='ai-status';
      if(host.localStatus&&!availability.has(sample.generationId)){availability.set(sample.generationId,{label:'Checking local recording…'});Promise.resolve(host.localStatus(sample)).then(value=>{availability.set(sample.generationId,value);repaint();}).catch(()=>{availability.set(sample.generationId,{label:'Local file not verified · use recovery before offline play'});repaint();});}
      const link = el('a', 'Open in ElevenLabs · external playback', row);
      link.href = FLOW_URL + sample.flowId; link.target = '_blank'; link.rel = 'noopener noreferrer';
      if(host.prepareAudition){const handoff=el('button',local?.ready?'Open local recording':'Save this audition locally',row);handoff.type='button';handoff.addEventListener('click',()=>host.prepareAudition(sample));el('small','Download the existing sample from ElevenLabs, then import that file in Voice Studio. No new generation is needed. Importing does not select the campaign voice or approve table playback.',row);}
      const label = el('label', null, row), checkbox = el('input', null, label);
      checkbox.type = 'checkbox'; checkbox.checked = selected || heard.has(sample.generationId); checkbox.disabled = selected;
      el('span', 'I listened privately', label);
      const button = el('button', `${selected ? 'Selected for' : 'Use this voice for'} ${profile.name}`, row);
      button.type = 'button'; button.disabled = selecting || selected || !checkbox.checked;
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) heard.add(sample.generationId); else heard.delete(sample.generationId);
        button.disabled = selecting || selected || !checkbox.checked;
      });
      button.addEventListener('click', async () => {
        if (selecting || !heard.has(sample.generationId)) return;
        if (isSelected(M().profile(host.get(), sample.role), sample)) return;
        selecting = true; error = ''; repaint();
        try {
          if (host.blank?.()) throw Error('This audition cast does not belong to a blank campaign.');
          const next = select(report, sample.role, host.get(), true, {at:new Date().toISOString()});
          await host.save(next, `Selected ${sample.voiceName} for ${profile.name}.`);
        } catch (e) { error = e.message || 'The voice selection could not be saved.'; }
        finally { selecting = false; repaint(); }
      });
    }
  }
  function render(parent, role) {
    if (!host || host.blank?.()) return;
    const section = el('details', null, parent);
    section.open = false;
    el('summary', 'Completed plugin auditions · four proposed voices', section);
    const box = el('div', null, section);
    roles.set(box,role||'');availability.clear();
    mounts.add(box); paint(box);
    if (!report && !loading && !error) void load();
    return section;
  }
  globalThis.ECHO_AI_PLUGIN_AUDITIONS = Object.freeze({init,render,validate,select});
})();
