(() => {
  'use strict';
  const clip = (v,n=1800) => String(v ?? '').slice(0,n);
  const ids = v => [...new Set((Array.isArray(v)?v:[]).filter(x=>typeof x==='string').map(x=>clip(x,80)))].slice(0,40);
  const STATES = ['planned','rumor','confirmed','completed'];
  const TRACKS = ['promise','debt','rescue','escape','custody'];
  const owns = (value,key) => Object.prototype.hasOwnProperty.call(value,key);
  const RELATIONSHIP_FIELDS = ['wants','last','attitude','next','whereabouts'];
  function relationships(raw) {
    return (Array.isArray(raw)?raw:[]).slice(0,20).filter(r=>r&&typeof r==='object').map(r=>({
      npcId:clip(r.npcId,80),
      changes:Object.fromEntries(RELATIONSHIP_FIELDS.filter(key=>r.changes&&owns(r.changes,key)).map(key=>[key,clip(r.changes[key],key==='attitude'?120:1500)])),
      promiseKeys:[...new Set((Array.isArray(r.promiseKeys)?r.promiseKeys:[]).filter(key=>typeof key==='string').map(key=>clip(key,100)))].slice(0,40)
    }));
  }
  function courtyard(raw) {
    raw=raw&&typeof raw==='object'?raw:{};
    const rows=value=>(Array.isArray(value)?value:[]).slice(0,40).filter(r=>r&&typeof r==='object').map(r=>({id:clip(r.id,80),value:clip(r.value,1500)}));
    return {beatId:clip(raw.beatId,80),visit:['arrival','return','visit','disturbance'].includes(raw.visit)?raw.visit:'visit',returnKey:clip(raw.returnKey,80),terms:rows(raw.terms),spaces:rows(raw.spaces)};
  }
  function downtime(raw) {
    raw=raw&&typeof raw==='object'?raw:{};
    const blank=raw.minutes==null||typeof raw.minutes==='string'&&!raw.minutes.trim();
    const candidate=typeof raw.minutes==='number'||typeof raw.minutes==='string'?Number(raw.minutes):NaN;
    // Preserve invalid input for review instead of turning it into zero work.
    const minutes=blank?null:Number.isSafeInteger(candidate)&&candidate>=0?candidate:
      typeof raw.minutes==='number'||typeof raw.minutes==='string'?clip(raw.minutes,80):'Invalid value: '+clip(raw.minutes,60);
    const at=Number(raw.at);
    return {activityId:clip(raw.activityId,80),jobId:clip(raw.jobId,80),letterId:clip(raw.letterId,80),town:clip(raw.town,80),minutes,
      cost:clip(raw.cost,1200),result:['completed','partial','failed','declined'].includes(raw.result)?raw.result:'completed',
      at:Number.isFinite(at)&&at>=0?Math.min(at,1e8):0};
  }
  const QUESTS = [
    {id:'gundren',title:'Find Gundren',goal:'Confirm Gundren’s condition and safety at the inn, then decide the next lead.'},
    {id:'sildar',title:'Rescue Sildar',goal:'Get Sildar out of Cragmaw Hideout alive.'},
    {id:'redbrands',title:'The Redbrand threat',goal:'Learn their role and decide how to address their threat.'},
    {id:'orc-camp',title:'The orc camp',goal:'Resolve the camp threat; reward and report are separate events.'},
    {id:'black-spider',title:'Investigate the Black Spider',goal:'Find reliable evidence of the Spider’s plans and location.'},
    {id:'old-owl',title:'Old Owl Well',goal:'Investigate the ruins and record who is there.'},
    {id:'wave-echo',title:'Wave Echo Cave',goal:'Reach the mine, find Nundro, and decide the Forge’s future.'}
  ];
  function event(raw={}) {
    raw=raw&&typeof raw==='object'?raw:{};
    return {id:clip(raw.id,80),kind:['discovery','rescue','escape','promise','debt','custody','quest','other'].includes(raw.kind)?raw.kind:'other',publicTitle:clip(raw.publicTitle??raw.title,120),recipients:ids(raw.recipients).filter(x=>x.startsWith('pc-')),replaces:ids(raw.replaces),origins:(Array.isArray(raw.origins)?raw.origins:[]).filter(x=>x&&['evidence','journal','wrapUps'].includes(x.kind)&&x.id).slice(0,20).map(x=>({kind:x.kind,id:clip(x.id,80)})),session:clip(raw.session||'unassigned',80),title:clip(raw.title,120),
      detail:clip(raw.detail,2500),playerText:clip(raw.playerText,1800),source:clip(raw.source,250),
      status:STATES.includes(raw.status)?raw.status:'planned',basis:['Observed','Inferred','Claimed','Open'].includes(raw.basis)?raw.basis:'Open',
      approved:raw.approved===true,approvedAt:clip(raw.approvedAt,40),share:raw.share==='party'?'party':'private',knows:ids(raw.knows),
      quests:(Array.isArray(raw.quests)?raw.quests:[]).slice(0,15).filter(q=>q&&q.id).map(q=>({id:clip(q.id,80),state:['reference','planned','active','paused','completed','failed','abandoned','open','bypassed'].includes(q.state)?q.state:'reference',stepId:clip(q.stepId,100)})),
      markers:(Array.isArray(raw.markers)?raw.markers:[]).slice(0,15).filter(m=>m&&m.scene&&m.point).map(m=>({scene:clip(m.scene,80),point:clip(m.point,80),reveal:m.reveal===true})),
      tracks:(Array.isArray(raw.tracks)?raw.tracks:[]).slice(0,20).filter(t=>t&&TRACKS.includes(t.kind)).map(t=>({kind:t.kind,key:clip(t.key||t.subject,100),subject:clip(t.subject,120),holder:clip(t.holder,120),owedTo:clip(t.owedTo,120),state:['open','resolved','unknown'].includes(t.state)?t.state:'unknown',note:clip(t.note,500),public:t.public!==false})),
      ...(owns(raw,'relationships')?{relationships:relationships(raw.relationships)}:{}),
      ...(owns(raw,'courtyard')?{courtyard:courtyard(raw.courtyard)}:{}),
      ...(owns(raw,'downtime')?{downtime:downtime(raw.downtime)}:{}),
      ...(owns(raw,'mystery')?{mystery:globalThis.ECHO_MYSTERY?.eventMeta(raw.mystery) ?? raw.mystery}:{})};
  }
  const seed = (id,title,detail,opts={})=>event({id,session:'Session 1',title,detail,playerText:detail,status:'completed',basis:'Observed',approved:true,approvedAt:'2026-09-26',source:'DM-confirmed actual play in this chat',share:'party',knows:['party'],...opts});
  const SEEDS = [
    seed('actual-s1-hideout','Klarg defeated; Yeemik in charge','The party killed Klarg and left Yeemik in charge after their bargain to release Sildar.',{knows:['party','yeemik'],tracks:[{kind:'promise',key:'yeemik-bargain',subject:'Kill Klarg in exchange for Sildar’s release',holder:'Party',owedTo:'Yeemik',state:'resolved'}]}),
    seed('actual-s1-sildar','Sildar rescued','Sildar was rescued and traveled with the party to Phandalin.',{knows:['party','sildar'],quests:[{id:'sildar',state:'completed'}],tracks:[{kind:'rescue',key:'sildar',subject:'Sildar Hallwinter',holder:'With the party at the end of Session 1',state:'resolved'}]}),
    seed('actual-s1-coins','Copper and silver recovered','The party recovered copper and silver. Amounts and division were not recorded.',{tracks:[{kind:'custody',key:'hideout-coins',subject:'Hideout copper and silver',holder:'Unrecorded',state:'unknown',note:'Amounts unknown; do not invent quantities.'}]}),
    seed('actual-s1-token','Trista concealed the BELOW token','Trista found and hid the BELOW token. Its identity was not shared with the party.',{share:'private',playerText:'',knows:['pc-trista'],tracks:[{kind:'custody',key:'below-token',subject:'BELOW token',holder:'Trista',state:'open',note:'Private to Trista unless later shared.'}]}),
    seed('actual-s1-conceal','Donavan noticed concealment','Donavan noticed Trista hide something; he did not identify the object.',{share:'private',playerText:'',knows:['pc-donavan']}),
    seed('actual-s1-potion','Aldric revived; found potion spent','Aldric fell to 0 HP and the party revived him with a healing potion found in the hideout. That potion is spent.',{tracks:[{kind:'custody',key:'hideout-potion',subject:'Found healing potion',holder:'Consumed to heal Aldric',state:'resolved'}]}),
    seed('actual-s1-stop','Long rest and arrival at Barthen’s','The whole party and Sildar completed a long rest. Session 1 ended outside Barthen’s, before entering or making a delivery.',{knows:['party','sildar']}),
    seed('actual-gundren-truth','Gundren’s transfer · private campaign truth','Redbrands abducted Gundren and delivered him to Cragmaw Castle. The players had not learned the destination in Session 1.',{session:'Campaign truth',status:'confirmed',share:'private',playerText:'',knows:[],quests:[{id:'gundren',state:'reference'}],markers:[{scene:'region-lmop',point:'region-cragmaw-castle',reveal:false}]}),
    seed('actual-s23-spider','The party learned of the Black Spider','The party learned that the Black Spider exists.',{session:'Sessions 2–3 · assignment pending',status:'confirmed',basis:'Claimed',quests:[{id:'black-spider',state:'active'}]}),
    seed('actual-s23-redbrands','The party learned the Redbrands have Gundren','The party learned that the Redbrands have Gundren. His current location and rescue have not been confirmed in this report.',{session:'Sessions 2–3 · assignment pending',status:'confirmed',basis:'Claimed',quests:[{id:'gundren',state:'active'},{id:'redbrands',state:'active'}]}),
    seed('actual-s23-orcs','The orc camp was cleared','The party killed the orc camp. Individual enemy fates, loot, and any reward payment were not reported.',{session:'Sessions 2–3 · assignment pending',quests:[{id:'orc-camp',state:'completed'}]}),
    seed('actual-s23-koth','Hamun Kost disappeared without a fight','Hamun Kost, the wizard at Old Owl Well, disappeared instead of fighting. How he disappeared and where he went remain unknown.',{session:'Sessions 2–3 · combined record',quests:[{id:'old-owl',state:'active'}],markers:[{scene:'region-lmop',point:'region-old-owl-well',reveal:true}],tracks:[{kind:'escape',key:'kost-disappearance',subject:'Hamun Kost',holder:'Whereabouts unknown',state:'open',note:'Disappeared without combat. Do not assume death, teleportation, or surrender.'}]}),
    seed('actual-s23-stop','Stopped before the Redbrand hideout','The party stopped just before entering the Redbrand hideout. Its rooms, prisoners, treasure, and Glasstaff’s fate are still unplayed.',{session:'Sessions 2–3 · combined record',playerText:'The party stopped just before entering the Redbrand hideout. The exploration inside is still ahead.',markers:[{scene:'town-phandalin',point:'phandalin-manor',reveal:false},{scene:'region-lmop',point:'region-phandalin',reveal:false}]}),
    seed('actual-redbrand-gundren-with-party','The party recovered Gundren','Glasstaff put Gundren to sleep during the latest played session. The party recovered him before leaving him at an inn. How he came to this encounter and whether he remains asleep have not been reported.',{session:'Latest played Redbrand session',approvedAt:'2026-10-09',status:'confirmed',playerText:'Glasstaff put Gundren to sleep. The party recovered him.',replaces:['actual-gundren-truth'],quests:[{id:'gundren',state:'active'},{id:'redbrands',state:'active'}],tracks:[{kind:'custody',key:'gundren',subject:'Gundren Rockseeker',holder:'With the party after the encounter',state:'open',note:'Later left at an inn; see the newer custody record.'}]}),
    seed('actual-redbrand-rat-captured','The party captured a rat','The party captured Glasstaff’s rat. Who is physically keeping it, whether the party knows its magical nature, and what happens to it next have not been reported.',{session:'Latest played Redbrand session',approvedAt:'2026-10-09',status:'confirmed',playerText:'The party captured a rat in the Redbrand hideout.',tracks:[{kind:'custody',key:'glasstaff-rat',subject:'Glasstaff’s rat',holder:'Party; individual keeper unreported',state:'open',note:'Do not assume the players identified it as a familiar.',public:false}]}),
    seed('actual-redbrand-glasstaff-escaped','Glasstaff escaped','Glasstaff escaped during the latest played session. The party has not learned where he went.',{session:'Latest played Redbrand session',approvedAt:'2026-10-09',status:'confirmed',playerText:'Glasstaff escaped. His destination is unknown to the party.',quests:[{id:'redbrands',state:'active'}],tracks:[{kind:'escape',key:'glasstaff',subject:'Iarno Albrek (Glasstaff)',holder:'Whereabouts unknown to the party',state:'open',note:'The DM has a private destination record.'}]}),
    seed('actual-redbrand-glasstaff-destination','Glasstaff’s destination · DM only','Glasstaff escaped to Cragmaw Castle. The party does not know his destination. Do not reveal or mark the castle as discovered from this fact.',{session:'Latest played Redbrand session',approvedAt:'2026-10-09',status:'confirmed',share:'private',playerText:'',knows:['iarno'],quests:[{id:'redbrands',state:'reference'}],markers:[{scene:'region-lmop',point:'region-cragmaw-castle',reveal:false}],tracks:[{kind:'escape',key:'glasstaff',subject:'Iarno Albrek (Glasstaff)',holder:'Cragmaw Castle',state:'open',note:'Destination is DM-only until the party earns the lead.',public:false}]}),
    seed('actual-redbrand-gundren-at-inn','Gundren was left at an inn','After recovering Gundren, the party left him at an inn. The inn was not named and whether he remains asleep was not reported.',{session:'Latest played Redbrand session',approvedAt:'2026-10-09',status:'confirmed',playerText:'The party left Gundren at an inn.',quests:[{id:'gundren',state:'active'}],tracks:[{kind:'custody',key:'gundren',subject:'Gundren Rockseeker',holder:'At an inn; specific inn unreported',state:'open',note:'Present condition and safety unconfirmed. Do not mark the rescue complete.'}]}),
    seed('actual-redbrand-rat-with-trista','Trista has the captured rat','Trista is holding the rat the party captured from Glasstaff. The characters’ knowledge of its familiar nature has not been reported.',{session:'Latest played Redbrand session',approvedAt:'2026-10-09',status:'confirmed',playerText:'Trista is holding the rat the party captured.',tracks:[{kind:'custody',key:'glasstaff-rat',subject:'Captured rat',holder:'Trista',state:'open',note:'Do not assume the characters know it is a familiar.',public:true}]}),
    seed('actual-redbrand-stop-barthens','Stopped at Barthen’s Provisions','The party stopped at Barthen’s Provisions after leaving Gundren at an inn. Whether they entered, spoke to Barthen, delivered goods, or rested was not reported.',{session:'Latest played Redbrand session',approvedAt:'2026-10-09',status:'confirmed',playerText:'The party stopped at Barthen’s Provisions.'})
  ];
  for(const e of SEEDS)if(e.session==='Sessions 2–3 · assignment pending')e.session='Sessions 2–3 · combined record';
  function normalize(raw={}) {
    raw=raw&&typeof raw==='object'?raw:{};
    const unique=(values)=>[...new Map(values.filter(x=>x.id).map(x=>[x.id,x])).values()];
    return {version:1,...(globalThis.ECHO_OUTCOMES?{outcomes:globalThis.ECHO_OUTCOMES.normalize(raw.outcomes)}:{}),seedVersion:Number(raw.seedVersion)||0,
      ...(globalThis.ECHO_QUESTS ? {questGuide:globalThis.ECHO_QUESTS.normalize(raw.questGuide)} : {}),
      events:unique((Array.isArray(raw.events)?raw.events:[]).slice(-5000).map(event)),
      quests:unique((Array.isArray(raw.quests)?raw.quests:QUESTS).slice(0,100).filter(Boolean).map(q=>({id:clip(q.id,80),title:clip(q.title,120),goal:clip(q.goal,800)}))),
      sessionNotes:clip(raw.sessionNotes,4000),undo:(Array.isArray(raw.undo)?raw.undo:[]).slice(-10).filter(v=>typeof v==='string'&&v.length<1500000),
      redo:(Array.isArray(raw.redo)?raw.redo:[]).slice(-10).filter(v=>typeof v==='string'&&v.length<1500000)};
  }
  function ensure(story, campaign='default') {
    story.continuity ||= normalize();
    const d=story.continuity;
    if(campaign==='default'&&d.seedVersion<1){
      for(const e of SEEDS.slice(0,13))if(!d.events.some(x=>x.id===e.id))d.events.push(structuredClone(e));
      d.seedVersion=1;
      d.sessionNotes ||= 'Sessions 2 and 3 are recorded together because individual session assignment was not supplied. Confirmed: Black Spider discovery; the party learned the Redbrands have Gundren; the orc camp was cleared; Hamun Kost disappeared without fighting. Stopped immediately before entering the Redbrand hideout. Further loot, payment, promises, the camp’s individual occupants, and Kost’s destination remain unreported.';
      if(!story.journal.some(j=>j.id==='actual-s23-recap-draft'))story.journal.push({id:'actual-s23-recap-draft',title:'Next-session opening · before the Redbrand hideout',text:recap(d,'Sessions 2–3 · combined record'),kind:'recap',when:'Sessions 2–3',source:'DM-confirmed events in this chat; review before publication',published:false});
    }
    if(campaign==='default'&&d.seedVersion<2){
      if(d.seedVersion===1)checkpoint(d);
      for(const e of SEEDS.slice(13,17))if(!d.events.some(x=>x.id===e.id))d.events.push(structuredClone(e));
      d.seedVersion=2;
      // A previously published rescue objective may now be stale. The current
      // party-known outcome still appears on phones until the DM republishes it.
      if(d.questGuide?.records?.gundren)d.questGuide.records.gundren.published=null;
      const note='Latest played Redbrand session: Glasstaff put Gundren to sleep; the party recovered him. The party captured Glasstaff’s rat. Glasstaff escaped to Cragmaw Castle, a DM-only destination. Later custody and the stopping place are recorded separately.';
      if(!d.sessionNotes.includes('Latest played Redbrand session:'))d.sessionNotes=`${d.sessionNotes}\n\n${note}`.trim().slice(0,4000);
      if(!story.journal.some(j=>j.id==='actual-redbrand-recap-draft'))story.journal.push({id:'actual-redbrand-recap-draft',title:'Next-session opening · after Glasstaff escaped',text:recap(d,'Latest played Redbrand session'),kind:'recap',when:'Latest played Redbrand session',source:'DM-confirmed actual play in this chat; unpublished draft for review',published:false});
    }
    if(campaign==='default'&&d.seedVersion<3){
      if(d.seedVersion===2)checkpoint(d);
      const previousRecap=recap(d,'Latest played Redbrand session');
      const recovered=d.events.find(e=>e.id==='actual-redbrand-gundren-with-party');
      if(recovered?.source==='DM-confirmed actual play in this chat'&&recovered.playerText==='Glasstaff put Gundren to sleep. Gundren is with the party.'){
        recovered.title='The party recovered Gundren';recovered.publicTitle=recovered.title;
        recovered.detail=SEEDS[13].detail;recovered.playerText=SEEDS[13].playerText;
        if(recovered.tracks[0]?.key==='gundren')recovered.tracks[0].holder='With the party after the encounter';
      }
      for(const e of SEEDS.slice(17))if(!d.events.some(x=>x.id===e.id))d.events.push(structuredClone(e));
      d.seedVersion=3;
      const gundrenQuest=d.quests.find(q=>q.id==='gundren');
      if(gundrenQuest?.goal==='Follow evidence to Gundren and bring him to safety.')gundrenQuest.goal=QUESTS[0].goal;
      if(d.questGuide?.records?.gundren)d.questGuide.records.gundren.published=null;
      const main=d.questGuide?.records?.['echo-below'];
      if(main?.published?.text?.includes('Find Gundren')){
        main.published=null;
        main.draft={title:'The Echo Below',text:'Follow the evidence uncovered in Phandalin and choose the next lead together.'};
      }
      const note='Current position: Gundren was left at an unnamed inn; whether he remains asleep is unreported. Trista holds the captured rat. The party stopped at Barthen’s Provisions. Glasstaff reached Cragmaw Castle, a DM-only destination.';
      const oldNote='Latest played Redbrand session: Glasstaff put Gundren to sleep; the party recovered him. The party captured Glasstaff’s rat. Glasstaff escaped to Cragmaw Castle, a DM-only destination. Later custody and the stopping place are recorded separately.';
      const firstNote='Latest played Redbrand session: Glasstaff put Gundren to sleep; Gundren is with the party. The party captured Glasstaff’s rat. Glasstaff escaped to Cragmaw Castle, a DM-only destination. Gundren’s current condition, the rat’s individual keeper, and the stopping place are unreported.';
      d.sessionNotes=d.sessionNotes.includes(oldNote)?d.sessionNotes.replace(oldNote,note):d.sessionNotes.includes(firstNote)?d.sessionNotes.replace(firstNote,note):`${d.sessionNotes}\n\n${note}`.trim().slice(0,4000);
      const oldDraft=story.journal.find(j=>j.id==='actual-redbrand-recap-draft');
      if(oldDraft&&!oldDraft.published&&oldDraft.text===previousRecap){
        oldDraft.title='Next-session opening · at Barthen’s Provisions';
        oldDraft.text=recap(d,'Latest played Redbrand session');
        const summary=d.outcomes?.summaries?.find(s=>s.id===oldDraft.id);
        if(summary)summary.fingerprint=globalThis.ECHO_OUTCOMES?.fingerprint(d,'Latest played Redbrand session')||JSON.stringify(publicJournal(d).filter(j=>j.when==='Latest played Redbrand session'));
      }else if(!story.journal.some(j=>j.id==='actual-redbrand-current-recap-draft')){
        story.journal.push({id:'actual-redbrand-current-recap-draft',title:'Next-session opening · at Barthen’s Provisions',text:recap(d,'Latest played Redbrand session'),kind:'recap',when:'Latest played Redbrand session',source:'DM-confirmed actual play in this chat; unpublished draft for review',published:false});
      }
    }
    if(campaign==='default')for(const [id,name]of [['sildar','Sildar Hallwinter'],['yeemik','Yeemik'],['gundren','Gundren Rockseeker'],['hamun-kost','Hamun Kost'],['iarno','Iarno Albrek'],['nezznar','Nezznar'],['barthen','Elmar Barthen'],['harbin','Harbin Wester'],['nundro','Nundro Rockseeker']])
      if(!story.npcs.some(n=>n.id===id))story.npcs.push({id,name,source:'Lost Mine of Phandelver · reference identity; knowledge follows approved events',base:'',voice:'',goal:'',attitude:'distant',lastInteraction:'',promisedHelp:'',nextMove:'',notes:'Prepared identity. Presence here does not establish that the party has met this person.',portrait:''});
    globalThis.ECHO_QUESTS?.ensure(d,campaign);
    globalThis.ECHO_OUTCOMES?.ensure(story,d);
    return d;
  }
  function snapshot(d){return JSON.stringify({version:d.version,seedVersion:d.seedVersion,events:d.events,quests:d.quests,sessionNotes:d.sessionNotes,questGuide:d.questGuide,outcomes:d.outcomes?{...d.outcomes,original:undefined}:undefined});}
  function checkpoint(d){d.undo.push(snapshot(d));d.undo=d.undo.slice(-10);d.redo=[];}
  function restore(d,redo=false){const from=redo?d.redo:d.undo;if(!from.length)return false;const text=from.pop(),current=snapshot(d);const saved=normalize(JSON.parse(text));const undo=d.undo,forward=d.redo,original=d.outcomes?.original;Object.assign(d,saved,{undo,redo:forward});if(d.outcomes&&original)d.outcomes.original=original;(redo?d.undo:d.redo).push(current);return true;}
  const effective=d=>globalThis.ECHO_OUTCOMES?.effective(d)||d.events.filter(e=>!d.events.some(newer=>newer.approved&&newer.status!=='planned'&&newer.replaces.includes(e.id)));
  const approved=d=>effective(d).filter(e=>e.approved&&e.status!=='planned');
  const shared=e=>e.approved&&e.status!=='planned'&&e.share==='party'&&e.knows.includes('party')&&e.playerText.trim();
  function publicJournal(d){return effective(d).filter(shared).map(e=>({id:`continuity-${e.id}`,title:`${e.status==='rumor'?'Rumor · ':''}${e.publicTitle||e.title}`,text:e.playerText,kind:e.status,when:e.session}));}
  function questCards(d,publicOnly=false){return (globalThis.ECHO_OUTCOMES?.questDefinitions(d)||d.quests).map(q=>{
    const events=effective(d).filter(e=>e.quests.some(l=>l.id===q.id)&&(!publicOnly||shared(e)));
    const changes=events.filter(e=>e.approved&&['confirmed','completed'].includes(e.status)).flatMap(e=>e.quests.filter(l=>l.id===q.id&&l.state!=='reference'&&!l.stepId));
    return {...q,goal:publicOnly?(events.at(-1)?.playerText||''):q.goal,state:changes.at(-1)?.state||'planned',events};
  }).filter(q=>!publicOnly||q.events.length);}
  function trackers(d,publicOnly=false){const result=new Map();for(const e of approved(d)){
    if(e.status==='rumor'||(publicOnly&&!shared(e)))continue;
    for(const t of e.tracks.filter(t=>!publicOnly||t.public!==false))result.set(`${t.kind}:${t.key}`,{...t,eventId:e.id,session:e.session});
  }return [...result.values()];}
  function knowledge(d,id){return approved(d).filter(e=>e.knows.includes(id)||(id.startsWith('pc-')&&e.knows.includes('party')));}
  function projectMap(d,scene,sceneId){
    return {...scene,points:(scene.points||[]).map(p=>{
      const events=effective(d).filter(e=>e.approved&&e.status!=='planned'&&e.markers.some(m=>m.scene===sceneId&&m.point===p.id));
      const visible=events.filter(shared), reveal=visible.some(e=>e.status!=='rumor'&&e.markers.some(m=>m.scene===sceneId&&m.point===p.id&&m.reveal));
      const publicNotes=visible.map(e=>`${e.status==='rumor'?'Rumor':e.status==='completed'?'Completed':'Known'}: ${e.playerText}`).join('\n');
      return {...p,visible:p.visible||reveal,approved:p.approved||reveal,
        clue:publicNotes?`${p.clue||''}\n${publicNotes}`.slice(0,1000):p.clue,
        note:events.length?`${p.note||''}\nCampaign record:\n${events.map(e=>`${e.status}: ${e.title}`).join('\n')}`:p.note};
    })};
  }
  function recap(d,session='all'){
    const events=effective(d).filter(e=>shared(e)&&(session==='all'||e.session===session));
    if(!events.length)return 'No approved, party-known events are available for this selection.';
    return events.map(e=>`${e.status==='rumor'?'Rumor — ':''}${e.playerText}`).join('\n\n');
  }
  function adoptEvidence(e){return event({id:`evidence-${e.id}`,title:e.title,detail:e.detail,playerText:e.playerSaw,
    source:e.source,session:e.sessionId||'unassigned',status:e.status==='Observed'?'confirmed':'rumor',basis:e.status,
    share:'private',knows:[],approved:false});}
  globalThis.ECHO_CONTINUITY={effective,STATES,TRACKS,QUESTS,SEEDS,event,normalize,ensure,checkpoint,restore,shared,approved,publicJournal,questCards,trackers,knowledge,projectMap,recap,adoptEvidence};
})();
