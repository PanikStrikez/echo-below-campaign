(() => {
  'use strict';
  const VERSION = 1;
  const copy = value => JSON.parse(JSON.stringify(value));
  const freeze = value => {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze); Object.freeze(value);
    }
    return value;
  };
  const text = (value, limit = 1200) => String(value ?? '').trim().slice(0, limit);
  const wordCount = value => text(value, 10000).split(/\s+/).filter(Boolean).length;
  // This fingerprint identifies exact audition text; it is not a security signature.
  const fingerprint = value => {
    let hash = 2166136261;
    for (const char of value) { hash ^= char.codePointAt(0); hash = Math.imul(hash, 16777619); }
    return 'fnv1a32:' + (hash >>> 0).toString(16).padStart(8, '0');
  };
  const unselected = () => ({status:'unselected',provider:'',voiceId:'',voiceName:'',model:'',scriptHash:'',rights:'',auditionId:'',selectedBy:'',selectedAt:''});
  const pronunciation = values => (Array.isArray(values) ? values : []).slice(0, 12).map(value => ({term:text(value?.term, 80),sayAs:text(value?.sayAs, 120),status:'proposed'})).filter(value => value.term && value.sayAs);
  const source = (id, note) => ({id,note});
  const original = source('echo-below:voice-auditions:v1','Original hypothetical audition dialogue, not a transcript or an approved campaign event. No source-book prose is sent for synthesis.');
  const seeds = [
    {
      id:'barthen',characterId:'barthen',name:'Elmar Barthen',role:'Phandalin provisioner',
      script:'Elmar Barthen, at your service. Mind that coil of rope by the counter. Tell me what you need for the road, and we’ll work through it properly. Food first, then dry blankets. A bargain is no use if it leaves you cold and hungry.',
      style:'Warm, grounded and conversational. A practical shopkeeper with an easy welcome and genuine concern; avoid a comic merchant caricature.',
      pacing:'Proposed: about 145 words per minute. Brief pause after the greeting; a little space between food and blankets. Let the last sentence sound like sensible advice.',
      pronunciation:[{term:'Elmar Barthen',sayAs:'EL-mar BAR-thun'},{term:'Phandalin',sayAs:'fan-DAL-in'}],
      emotionalRange:['Friendly welcome','Practical concern','Gentle exasperation','Firm but fair bargaining'],
      sourceRefs:[original,source('Session-02-Runbook.js#s2-barthen','Local character and shop reference. The source reference there is Lost Mine of Phandelver, printed p. 16; the audition words and vocal direction are original proposals.')]
    },
    {
      id:'sildar',characterId:'sildar',name:'Sildar Hallwinter',role:'Experienced soldier and ally',
      script:'Sildar Hallwinter. Take a breath, and start with what you saw. Then tell me what you were told. We can act quickly without acting blindly. If someone is in danger, say so plainly. We will weigh the risks, and you will choose your course.',
      style:'Steady, disciplined and humane. Clear consonants and quiet authority; listens before advising. Concern should remain audible beneath the military composure.',
      pacing:'Proposed: about 125 words per minute. Deliberate pauses after direct observation and secondhand information; slightly firmer on immediate danger, then soften the final choice.',
      pronunciation:[{term:'Sildar Hallwinter',sayAs:'SIL-dar HALL-win-ter'}],
      emotionalRange:['Measured reassurance','Protective urgency','Disappointment without contempt','Restrained relief'],
      sourceRefs:[original,source('Session-02-Runbook.js#s2-sildar','Local campaign direction: distinguish reliable evidence from rumors and leave the party its decisions. No knowledge, equipment or new outcome is assigned by this sample.')]
    },
    {
      id:'dracuseth',characterId:'dracuseth',name:'Dracuseth Maw of Flames',role:'Waterdeep contact',
      script:'Call me Dracuseth. Sit, if you like. There is no need to turn every conversation into a council of war. Tell me what help you want, and what you would rather keep to yourselves. I can make an introduction. What comes after is your choice.',
      style:'Warm, plainspoken and patient. A full, resonant voice is a proposed contrast with Sildar, but intelligibility comes first. Offer help without taking command; avoid constant growling or menace.',
      pacing:'Proposed: about 130 words per minute. An inviting pause after the name; a small dry smile in council of war. Give the final choice room to land.',
      pronunciation:[{term:'Dracuseth',sayAs:'DRAK-yoo-seth'},{term:'Waterdeep',sayAs:'WAW-ter-deep'}],
      emotionalRange:['Patient welcome','Dry amusement','Firm boundaries','Protective concern without threats'],
      sourceRefs:[original,source('Session-01-Story-Data.js#dracuseth','Approved custom Waterdeep contact: warm and plainspoken; protects ordinary people and preserves party choice.'),source('Campaign-Courtyard-Data.js#dracuseth','Proposed routine and voice direction: direct, patient, practical and bounded help. The audition does not establish an actual meeting or promise.')]
    },
    {
      id:'narrator',characterId:'',name:'General narrator',role:'Scene description',
      script:'Rain eases to a whisper against the shutters. Outside, Phandalin’s lamplight gathers in the puddles, and a cart rattles over uneven stone. For a moment, the room belongs to ordinary things: warm bread, tired feet, and a chair left open by the fire.',
      style:'Clear, intimate and observant. Describe sensory details with quiet curiosity. Leave interpretive space for the players; avoid announcing emotions they must feel or imposing a cinematic trailer voice.',
      pacing:'Proposed: about 120 words per minute. Pause between the outdoor and indoor images. Keep each phrase clear over low ambience; end gently without an ominous implication.',
      pronunciation:[{term:'Phandalin',sayAs:'fan-DAL-in'}],
      emotionalRange:['Everyday warmth','Wonder without certainty','Suspense without announcing a threat','Calm transition'],
      sourceRefs:[original,source('echo-below:narration-guidance:v1','Original proposed sensory narration for a hypothetical ordinary room. It establishes no actual weather, location visit, clue or event.')]
    }
  ];
  const catalog = freeze(seeds.map(seed => ({...seed,version:VERSION,revision:1,audience:'dm',scriptStatus:'proposed-original-audition',scriptRevision:1,scriptHash:fingerprint(seed.script),scriptWords:wordCount(seed.script),pronunciation:pronunciation(seed.pronunciation),notes:'Pronunciations, pacing and vocal direction are proposals for the DM to approve by listening. These samples are private auditions, not live scene dialogue.',proposedVoices:[],voice:unselected()})));
  const byId = id => catalog.find(profile => profile.id === id);
  const rights = new Set(['provider-stock','original-licensed']);
  const cleanVoice = (raw = {}, allowSelection = true) => {
    const provider = text(raw.provider, 50), voiceId = text(raw.voiceId, 160);
    if (!/^[a-z0-9][a-z0-9._-]{0,49}$/.test(provider) || !voiceId) return unselected();
    const selected = allowSelection && raw.status === 'selected' && raw.selectedBy === 'dm' && rights.has(raw.rights);
    const hash=text(raw.scriptHash,80);
    return {status:selected?'selected':'proposed',provider,voiceId,voiceName:text(raw.voiceName, 160) || voiceId,
      model:text(raw.model,120),scriptHash:/^(fnv1a32:[a-f0-9]{8}|sha256:[a-f0-9]{64}|[a-f0-9]{64})$/.test(hash)?hash:'',
      rights:rights.has(raw.rights)?raw.rights:'',auditionId:text(raw.auditionId || raw.sampleId, 160),selectedBy:selected?'dm':'',selectedAt:selected?text(raw.selectedAt, 60):''};
  };
  function cleanProfile(raw, seed) {
    raw = raw && typeof raw === 'object' ? raw : {};
    return {...copy(seed),revision:Number.isInteger(raw.revision)&&raw.revision>0?Math.min(raw.revision,1e9):1,
      style:text(raw.style, 1800)||seed.style,pacing:text(raw.pacing, 1200)||seed.pacing,
      pronunciation:Array.isArray(raw.pronunciation)?pronunciation(raw.pronunciation):copy(seed.pronunciation),
      emotionalRange:Array.isArray(raw.emotionalRange)?raw.emotionalRange.slice(0,12).map(value=>text(value,180)).filter(Boolean):copy(seed.emotionalRange),
      notes:raw.notes===undefined?seed.notes:text(raw.notes,1600),
      proposedVoices:(Array.isArray(raw.proposedVoices)?raw.proposedVoices:[]).slice(0,12).map(value=>cleanVoice(value,false)).filter(value=>value.status==='proposed'),
      voice:cleanVoice(raw.voice)};
  }
  function normalize(raw = {}) {
    if (raw && raw.version !== undefined && raw.version !== VERSION) throw Error('This voice-cast version is not supported. Keep the original save.');
    const profiles = catalog.map(seed => cleanProfile((Array.isArray(raw?.profiles)?raw.profiles:[]).find(profile=>profile?.id===seed.id),seed));
    const history = (Array.isArray(raw?.history)?raw.history:[]).slice(-30).filter(row=>byId(row?.profileId)&&['update','select','clear'].includes(row?.action)&&row.before).map(row=>({profileId:row.profileId,action:row.action,at:text(row.at,60),before:cleanProfile(row.before,byId(row.profileId))}));
    return freeze({version:VERSION,profiles,history});
  }
  const create = () => normalize();
  const profile = (state,id) => normalize(state).profiles.find(value=>value.id===id) || null;
  function change(state,id,action,updater,options={}) {
    const next = copy(normalize(state)), current = next.profiles.find(value=>value.id===id);
    if (!current) throw Error('Choose a known cast member.');
    const before = copy(current), updated = cleanProfile(updater(copy(current)),byId(id));
    updated.revision = current.revision + 1;
    next.profiles[next.profiles.findIndex(value=>value.id===id)] = updated;
    next.history.push({profileId:id,action,at:text(options.at,60),before});
    return normalize(next);
  }
  function updateProfile(state,id,patch={},options={}) {
    return change(state,id,'update',current=>{
      const changed = {...current};
      for (const key of ['style','pacing','pronunciation','emotionalRange','notes','proposedVoices']) if(Object.prototype.hasOwnProperty.call(patch,key)) changed[key]=patch[key];
      if (Object.prototype.hasOwnProperty.call(patch,'voice')) {
        const candidate = cleanVoice(patch.voice,false);
        const sameIdentity = ['provider','voiceId','model','scriptHash','rights'].every(key=>candidate[key]===current.voice[key]);
        changed.voice = sameIdentity && current.voice.status==='selected' ? {...candidate,status:'selected',selectedBy:'dm',selectedAt:current.voice.selectedAt} : candidate;
      }
      return changed;
    },options);
  }
  function selectVoice(state,id,choice,explicitSelection=false,options={}) {
    if (explicitSelection !== true) throw Error('Choose a voice explicitly after reviewing its audition.');
    const voice = cleanVoice(choice,false);
    if (voice.status!=='proposed' || !rights.has(voice.rights)) throw Error('Select an original licensed or provider stock voice. Voice cloning requires a separate consent workflow.');
    return change(state,id,'select',current=>({...current,voice:{...voice,status:'selected',selectedBy:'dm',selectedAt:text(options.at,60)}}),options);
  }
  const clearSelection = (state,id,options={}) => change(state,id,'clear',current=>({...current,voice:unselected()}),options);
  function undo(state) {
    const next=copy(normalize(state)), row=next.history.pop();
    if (!row) return normalize(next);
    next.profiles[next.profiles.findIndex(value=>value.id===row.profileId)]=row.before;
    return normalize(next);
  }
  function audition(state,id) {
    const value=profile(state,id);
    if(!value)throw Error('Choose a known cast member.');
    return freeze({profileId:value.id,profileRevision:value.revision,scriptRevision:value.scriptRevision,scriptHash:value.scriptHash,script:value.script,
      direction:{style:value.style,pacing:value.pacing,pronunciation:copy(value.pronunciation),emotionalRange:copy(value.emotionalRange)},audience:'dm',status:'proposed-original-audition'});
  }
  globalThis.ECHO_AI_VOICE_CAST=freeze({version:VERSION,catalog,create,normalize,profile,updateProfile,selectVoice,clearSelection,undo,audition});
})();
