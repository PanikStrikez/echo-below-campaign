(() => {
  'use strict';
  let host, tool = 'prep', chosenNpc = 'durnan', chosenSite = 'undermountain', chosenFloor = 1,
    chosenPack = 'phandalin', chosenHandout = 'echo-document-1', chosenRune = 'Ana Rath', runeFace = 'Bane';
  const $ = id => document.getElementById(id);
  const data = () => host.story();
  const plan = () => host.plan();
  const uid = prefix => globalThis.ECHO_STORY_DATA.uid(prefix);
  const el = (tag, text, parent, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text;
    if (cls) n.className = cls; parent.appendChild(n); return n; };
  const btn = (parent, text, fn, cls = '') => { const b = el('button', text, parent, cls); b.type = 'button'; b.addEventListener('click', fn); return b; };
  const row = parent => el('div', null, parent, 'story-row');
  const section = (parent, title, note) => { const s = el('section', null, parent, 'story-section'); el('h3', title, s);
    if (note) el('p', note, s, 'help'); return s; };
  const note = (parent, text) => el('p', text || 'Nothing recorded yet.', parent, 'story-note');
  const field = (parent, title, value, change, options = {}) => { const l = el('label', title, parent, 'story-field');
    const i = options.multiline ? el('textarea', null, l) : el('input', null, l);
    if (!options.multiline) i.type = options.type || 'text';
    if (options.type === 'checkbox') i.checked = !!value; else i.value = value ?? '';
    if (options.multiline) i.rows = options.rows || 3;
    if (options.placeholder) i.placeholder = options.placeholder;
    i.addEventListener('change', () => { change(options.type === 'checkbox' ? i.checked : options.type === 'number' ? Number(i.value) : i.value); });
    return i; };
  const select = (parent, title, value, choices, change) => { const l = el('label', title, parent, 'story-field'); const s = el('select', null, l);
    for (const [id,name] of choices) { const o = el('option', name, s); o.value = String(id); } s.value = String(value ?? '');
    s.addEventListener('change', () => change(s.value)); return s; };
  const save = label => host.save(label);
  const clip = (v, max = 1200) => String(v || '').slice(0, max);
  const split = value => String(value || '').split(/\n\s*\n/).map(x => x.trim()).filter(Boolean);
  const panelHistory=[];
  function open(next = 'prep') { if(!$('story-drawer').hidden&&next!==tool)panelHistory.push({tool,scroll:$('story-drawer').scrollTop});else if($('story-drawer').hidden)panelHistory.length=0;tool = next; $('story-drawer').hidden = false; $('story-scrim').hidden = false; render(); }
  function outcome(values={}) { globalThis.ECHO_OUTCOMES_UI.start(host,values); }
  function close() { $('story-drawer').hidden = true; $('story-scrim').hidden = true; }
  function render(force=false) { if (!host || $('story-drawer').hidden) return;
    if(!force&&['expeditions','finale'].includes(tool)&&$('story-content').contains(document.activeElement)&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
    let back=$('story-panel-back');if(!back){back=btn(document.querySelector('.story-head'),'← Back',()=>{const prior=panelHistory.pop();if(!prior){close();return;}tool=prior.tool;render();requestAnimationFrame(()=>$('story-drawer').scrollTop=prior.scroll);});back.id='story-panel-back';}
    back.hidden=!panelHistory.length;
    document.querySelector('.story-head h2').textContent=$('story-tool').querySelector(`option[value="${tool}"]`)?.textContent||'Campaign details';
    $('story-context').textContent = host.sessionName(); $('story-tool').value = tool;
    const root = $('story-content'); root.replaceChildren();
    ({ finale: root => globalThis.ECHO_FINALE_UI?.render(root,host), chapters: root => globalThis.ECHO_ADVENTURES_UI?.render(root,host), mystery: root => globalThis.ECHO_MYSTERY_UI?.render(root,host), 'undermountain-arc': root => globalThis.ECHO_UNDERMOUNTAIN_ARC_UI?.render(root,host), expeditions: root => globalThis.ECHO_EXPEDITIONS_UI?.render(root,host), downtime: root => globalThis.ECHO_DOWNTIME_UI?.render(root,host), courtyard: root => globalThis.ECHO_COURTYARD_UI?.render(root,host), transition: root => globalThis.ECHO_TRANSITION_UI?.render(root,host), 'quest-workspace': root => globalThis.ECHO_QUEST_PREP_UI?.render(root,host), outcomes: root => globalThis.ECHO_OUTCOMES_UI?.render(root,host), 'quest-preview': root => globalThis.ECHO_QUESTS_UI?.renderPreview(root,host), quests: root => globalThis.ECHO_QUESTS_UI?.render(root,host), spotlights: root => globalThis.ECHO_SPOTLIGHTS_UI?.render(root,host), continuity: root => globalThis.ECHO_CONTINUITY_UI?.render(root, host), 'wave-echo': root => globalThis.ECHO_WAVE_ECHO?.render(root, host), prep:prepView,adventures:adventuresView,handouts:handoutsView,runbook:runbookView,evidence:evidenceView,journal:journalView,people:peopleView,
      waterdeep:waterdeepView,sites:sitesView,dungeon:dungeonView,calendar:calendarView,wrap:wrapView }[tool] || prepView)(root); }
  function listBeatOptions() { return host.beats().map(b => [b.id,b.title]); }
  function bookButton(parent, label, book, printedPage) {
    btn(parent, label, () => host.openPrinted(book, printedPage));
  }
  const DM_MAPS = {
    'cragmaw-hideout':'lmop-cragmaw-hideout.jpg', phandalin:'lmop-phandalin.jpg',
    redbrand:'lmop-redbrand-hideout.jpg', 'spiders-web':'lmop-thundertree.jpg',
    'cragmaw-castle':'lmop-cragmaw-castle.jpg', 'wave-echo':'lmop-wave-echo-cave.jpg',
    'floor-1':'madmage-floor-1.jpg', 'floor-2':'madmage-floor-2.jpg', 'floor-3':'madmage-floor-3.jpg'
  };
  function privateMap(parent, key, label) {
    const file = DM_MAPS[key]; if (!file) return;
    const preview = el('details',null,parent,'story-private-map');
    el('summary',`Preview marked DM map · ${label}`,preview);
    note(preview,'Private source page. It includes keyed areas and may show secrets.');
    const img = el('img',null,preview); img.src=`private-maps/${file}`;
    img.alt=`Marked Dungeon Master map for ${label}`; img.loading='lazy';
  }
  function adventuresView(root) {
    const packs = globalThis.ECHO_STORY_DATA.PHANDELVER_PACKS;
    let s = section(root, 'Phandelver path', 'Choose the next pack from what happened at the table. Book room maps and marked pages stay on the DM screen.');
    select(s, 'Pack', chosenPack, packs.map(p => [p.id, `${p.name} · ${data().adventureProgress[p.id]}`]), value => { chosenPack = value; render(); });
    const pack = packs.find(p => p.id === chosenPack) || packs[0];
    s = section(root, pack.name, `Lost Mine of Phandelver · printed pp. ${pack.page}–${pack.end}. ${pack.verifiedRooms ? 'Room headings and pages checked against the scan.' : 'Scene links are chapter-area pointers; check the keyed room before play.'}`);
    select(s, 'Progress', data().adventureProgress[pack.id], [['ready','Ready'],['in-progress','In progress'],['complete','Complete']],
      value => { data().adventureProgress[pack.id] = value; save(`${pack.name} progress`); render(); });
    bookButton(s, 'Open chapter', 'lmop', pack.page);
    if (pack.id === 'wave-echo') {
      btn(s, 'Open Wave Echo journal', () => open('wave-echo'));
      note(s, 'Use Session 4 · Wave Echo Cave and homecoming in the top session selector for all 20 room cards, staged encounters, and return visits.');
    }
    if(pack.visual && host.scenes().some(scene=>scene.id===pack.visual))btn(s,'Show safe scene art on TV',()=>host.changeScene(pack.visual));
    const aloud = section(root, 'Opening description · paraphrase'); String(pack.say||'').split(/\n\s*\n/).forEach(t=>note(aloud,t));
    btn(aloud, 'Show this text on TV', () => host.showText(pack.name, pack.say));
    s = section(root, 'DM scene card');
    for (const [title, value] of [['Objective',pack.objective],['People and conflicts',pack.people],
      ['Enemies and allies',pack.enemies],['Treasure',pack.treasure],['Likely exits',pack.exits]]) note(s, `${title}: ${value}`);
    const rules=row(s);for(const [label,book,page] of pack.rules||[])bookButton(rules,`${label} · ${book.toUpperCase()} p. ${page}`,book,page);
    s = section(root, 'Scene and page links', pack.verifiedRooms ? 'Room headings and printed page links checked. Consult each room for starts, hazards, and treasure.' :
      'These chapter pointers are not a verified room-by-room index. Consult the printed room key before placing creatures or awarding treasure.');
    if(pack.mapPage){bookButton(s,`Marked DM map · printed p. ${pack.mapPage}`,'lmop',pack.mapPage);
      privateMap(s,pack.id,pack.id==='spiders-web'?'Thundertree':pack.name);}
    for (const [name,page] of pack.scenes) { const line = row(s); el('strong', name, line); bookButton(line, `Book p. ${page}`, 'lmop', page); }
    if(pack.encounters?.length){s=section(root,'Encounter starts','Use the marked book map privately. Set player-facing positions only on a checked, clean map; ask for player choices before placing hidden enemies.');
      for(const encounter of pack.encounters){const card=el('div',null,s,'story-card');
        el('strong',encounter.name,card);bookButton(card,`Keyed room · p. ${encounter.page}`,'lmop',encounter.page);
        for(const [label,value] of [['Starts',encounter.start],['Creatures',encounter.creatures],['Trigger',encounter.trigger],
          ['Environment',encounter.environment],['Other outcomes',encounter.exits]])note(card,`${label}: ${value}`);
      }}
    s = section(root, 'Private Echo overlay · optional'); note(s, pack.echo);
    btn(s, 'Add as open clue', () => { data().evidence.push({ id:uid('evidence'), title:`${pack.name} · Echo lead`,
      detail:pack.echo, whoKnows:'DM only', playerSaw:'', source:'Echo Below custom overlay', sessionId:host.sessionId(),
      status:'Open', published:false }); save('Add open Echo clue'); host.toast('Open clue added to Evidence.'); });
    s = section(root, 'Other paths');
    for (const other of packs.filter(item => item.id !== pack.id)) { const line=row(s); el('span', `${other.name} · ${data().adventureProgress[other.id]}`, line);
      btn(line, 'Open', () => { chosenPack=other.id; render(); }); }
  }
  function handoutsView(root) {
    const entries=globalThis.ECHO_SOURCE_HANDOUTS||[];
    let s=section(root,'Secret handouts','Private preview first. Only “Show on TV” publishes the selected text. Mad Mage cards need player-safe wording entered from the book before they can be shown.');
    select(s,'Handout',chosenHandout,entries.map(item=>[item.id,`${item.kind} · ${item.title}`]),value=>{chosenHandout=value;render();});
    const item=entries.find(entry=>entry.id===chosenHandout)||entries[0];if(!item)return;
    const record=data().sourceHandouts[item.id] ||= {text:'',whoKnows:'',status:'Open',shown:false};
    const source = item.book ? `${globalThis.ECHO_RULES_DATA.books[item.book].short} PDF p. ${item.pdfPage}` : (item.sourceLabel || 'Custom campaign material');
    s=section(root,item.title,`${item.kind} · ${source}`);
    if(item.book) btn(s,'Open private source',()=>host.openBook(item.book,item.pdfPage));
    const text=record.text||item.text;
    const preview=el('div',null,s,'story-card');el('strong','DM preview · player-facing text',preview);
    const body=note(preview,text||'No text staged. Read the source and enter a player-safe version below.');body.style.whiteSpace='pre-wrap';
    if(!item.text)field(s,'Text to show on TV',record.text,value=>{record.text=clip(value,3500);save('Stage secret handout');render();},{multiline:true,rows:5});
    field(s,'Who has learned this',record.whoKnows,value=>{record.whoKnows=clip(value,600);save('Handout knowledge');});
    select(s,'Evidence status',record.status,['Open','Claimed','Inferred','Observed'].map(value=>[value,value]),value=>{record.status=value;save('Handout status');});
    note(s,record.shown?'Shown on TV previously':'Not shown on TV');
    btn(s,'Show on TV',()=>{const content=record.text||item.text;if(!content.trim()){host.toast('Stage player-safe text first.');return;}
      host.showHandout(item.title,content);record.shown=true;save('Show secret handout');render();}).disabled=!text.trim();
  }
  function beatOverlay(id) { return plan().beats[id] ||= { trigger:'',consequence:'',next:'',elsePlan:'',music:'',handout:'',likelyRules:'',optional:false,status:'ready' }; }
  function prepView(root) {
    if(globalThis.ECHO_QUEST_PREP_UI){btn(root,'Build session from quests',()=>globalThis.ECHO_QUEST_PREP_UI.openBoard());const b=globalThis.ECHO_QUEST_PREP.live(data(),host.sessionId());if(b){const linked=section(root,'Current quest objective',b.title);note(linked,b.objective);note(linked,'Next useful action: '+b.nextAction);btn(linked,'Open this session’s quest board',()=>openQuestBoard(host.sessionId()));}}
    btn(root,'Character stories & spotlights',()=>open('spotlights'));
    let s = section(root, 'At the table next', 'The session board pulls the selected runbook beat, scene, encounter, and your private prep into one place.');
    const p = plan(); const choices = listBeatOptions();
    if (!p.nextBeat || !choices.some(([id])=>id===p.nextBeat)) p.nextBeat = choices[0]?.[0] || '';
    select(s, 'Next beat', p.nextBeat, choices, v => { p.nextBeat=v; save('Next story beat'); render(); });
    const beat = host.beats().find(b=>b.id===p.nextBeat), overlay = beat && beatOverlay(beat.id);
    if (beat) {
      const head = el('div', null, s, 'story-spotlight');
      el('strong', beat.title, head);
      note(head, `Scene: ${host.sceneTitle(beat.scene) || 'Choose a scene'} · Encounter: ${host.encounterTitle(beat.encounter) || 'None'}`);
      const actions=row(head); if (beat.scene) btn(actions,'Show scene on TV',()=>host.changeScene(beat.scene));
      btn(actions,'Open in live runbook',()=>host.selectBeat(beat.id));
      el('h4','Say aloud',head); if (beat.read?.length) for(const line of beat.read) { note(head,line); btn(head,'Show text on TV',()=>host.showText('Say aloud',line)); } else note(head,'Add read-aloud to this beat in the Runbook tool.');
      el('h4','Ask / run',head); for(const line of [...(beat.ask||[]),...(beat.run||[])]) note(head,line);
      if (overlay?.trigger) note(head,`Trigger: ${overlay.trigger}`);
      if (overlay?.consequence) note(head,`Consequence: ${overlay.consequence}`);
      const enemies=host.encounterTokens(beat.encounter); if(enemies.length) note(head,`Enemies / allies: ${enemies.map(t=>t.name).join(', ')}`);
    }
    s=section(root,'Opening and fallback','A short opening, then one clear choice if the party goes elsewhere.');
    const opening=field(s,'Opening / welcome',p.opening,v=>{p.opening=clip(v,1000);save('Session opening');},{multiline:true});
    btn(s,'Show opening on TV',()=>host.showText('Opening',opening.value));
    field(s,'If they do something else',p.elsePlan,v=>{p.elsePlan=clip(v);save('Fallback plan');},{multiline:true});
    field(s,'Private prep notes',p.notes,v=>{p.notes=clip(v,1800);save('Prep notes');},{multiline:true});
    s=section(root,'Table cues','Music, handout, and likely rules are reminders; only the handout button sends anything to the TV.');
    field(s,'Music cue / track',p.music,v=>{p.music=clip(v,300);save('Music cue');});
    field(s,'Handout cue',p.handout,v=>{p.handout=clip(v,300);save('Handout cue');});
    field(s,'Likely rules or book pages',p.likelyRules,v=>{p.likelyRules=clip(v,600);save('Likely rules');});
    const actions=row(s);btn(actions,'Open handout controls',()=>{close();host.openHandout();});
    btn(actions,'Open rules & books',()=>{close();host.openRules();});
  }
  function runbookView(root) {
    let s=section(root,'Branches and order','Move beats as the party changes course. Optional beats can be skipped without losing their notes.');
    if (host.beats().some(beat => beat.id === 's2-barthen')) {
      privateMap(s,'phandalin','Phandalin · LMoP p. 17');
      privateMap(s,'redbrand','Redbrand Hideout · LMoP p. 21');
    }
    else privateMap(s,'cragmaw-hideout','Cragmaw Hideout · LMoP p. 9');
    btn(s,'Add optional beat',()=>{const title=prompt('Title for the new beat:'); if(!title?.trim())return;
      plan().order=host.beats().map(b=>b.id);
      const id=uid('story-beat'); plan().extraBeats.push({id,title:clip(title,100),scene:host.sceneId(),encounter:'',read:[],ask:[],run:[],choices:[],private:[]});
      plan().order.push(id); beatOverlay(id).optional=true; save('Add optional beat'); render();});
    const beats=host.beats();
    for(let i=0;i<beats.length;i++){
      const beat=beats[i], b=beatOverlay(beat.id), item=el('article',null,s,'story-card');
      const top=row(item);el('strong',`${i+1}. ${beat.title}`,top);
      const page=globalThis.ECHO_STORY_DATA.CRAGMAW_PAGES[beat.id];
      if(page)bookButton(top,`LMoP p. ${page}`,'lmop',page);
      btn(top,'↑',()=>host.moveBeat(beat.id,-1)).disabled=i===0;
      btn(top,'↓',()=>host.moveBeat(beat.id,1)).disabled=i===beats.length-1;
      btn(top,'Run',()=>host.selectBeat(beat.id));
      for(const [label,book,printed] of globalThis.ECHO_STORY_DATA.LIVE_RULES[beat.id]||[])
        bookButton(item,`${label} · ${book.toUpperCase()} p. ${printed}`,book,printed);
      if(beat.storyExtra)btn(top,'Remove',()=>{plan().extraBeats=plan().extraBeats.filter(x=>x.id!==beat.id);plan().order=plan().order.filter(x=>x!==beat.id);delete plan().beats[beat.id];save('Remove optional beat');render();});
      if(beat.storyExtra){
        field(item,'Title',beat.title,v=>{beat.title=clip(v,100);save('Beat title');});
        select(item,'Scene',beat.scene,[['','No scene'],...host.scenes().map(x=>[x.id,x.title])],v=>{beat.scene=v;save('Beat scene');});
        select(item,'Encounter',beat.encounter,[['','No encounter'],...host.encounters().map(x=>[x.id,x.name])],v=>{beat.encounter=v;save('Beat encounter');});
        for(const [key,title] of [['read','Say aloud'],['ask','Ask players'],['run','How to run'],['choices','Other routes'],['private','DM only']]) {
          const input=field(item,title,(beat[key]||[]).join('\n\n'),v=>{beat[key]=split(v);save(`Beat ${key}`);},{multiline:true,rows:2});
          if(key==='read'||key==='ask') btn(item,'Show on TV',()=>host.showText(title,input.value));
        }
      }
      field(item,'Optional',b.optional,v=>{b.optional=v;save('Optional beat');},{type:'checkbox'});
      select(item,'Status',b.status,[['ready','Ready'],['done','Done'],['skipped','Skipped']],v=>{b.status=v;save('Beat status');});
      field(item,'Trigger',b.trigger,v=>{b.trigger=clip(v,600);save('Beat trigger');});
      field(item,'Consequence',b.consequence,v=>{b.consequence=clip(v,1000);save('Beat consequence');},{multiline:true,rows:2});
      select(item,'If this leads to',b.next,[['','Choose during play'],...beats.filter(x=>x.id!==beat.id).map(x=>[x.id,x.title])],v=>{b.next=v;save('Beat branch');});
      field(item,'If they take another route',b.elsePlan,v=>{b.elsePlan=clip(v,1000);save('Beat alternate');},{multiline:true,rows:2});
      const details=el('details',null,item);el('summary','Music, handout, rules',details);
      for(const [key,title] of [['music','Music cue'],['handout','Handout cue'],['likelyRules','Likely rules']])field(details,title,b[key],v=>{b[key]=clip(v,600);save(`Beat ${key}`);});
    }
  }
  function evidenceView(root) {
    let s=section(root,'Evidence ledger','Observed is witnessed, Inferred is a conclusion, Claimed is testimony, and Open is unresolved.');
    if(data().clueEvents?.length)btn(s,'Undo last clue publication',()=>{try{host.undoCluePublication();render();}catch(error){host.toast(error.message);render();}});
    if(globalThis.ECHO_MYSTERY_UI)btn(s,'Open evidence and research',()=>open('mystery'));
    btn(s,'Add evidence',()=>{const title=prompt('Short evidence title:'); if(!title?.trim())return;
      data().evidence.unshift({id:uid('evidence'),title:clip(title,120),detail:'',status:'Open',whoKnows:'',playerSaw:'',source:'',sessionId:host.sessionId(),published:false});save('Add evidence');render();});
    for(const e of data().evidence){const item=el('article',null,s,'story-card');
      const linked=globalThis.ECHO_OUTCOMES?.linked(host.continuity(),'evidence',e.id);
      if(globalThis.ECHO_OUTCOMES_UI)btn(item,linked?'Correct linked outcome':'Review as linked outcome',()=>globalThis.ECHO_OUTCOMES_UI.fromNote(host,'evidence',e));
      if(linked){el('strong',e.title,item);note(item,'Original reference preserved. Live views use: '+linked.title);note(item,linked.detail);continue;}
      field(item,'Title',e.title,v=>{e.title=clip(v,120);save('Evidence title');});
      select(item,'Evidence label',e.status,['Observed','Inferred','Claimed','Open'].map(x=>[x,x]),v=>{e.status=v;save('Evidence label');});
      field(item,'DM details',e.detail,v=>{e.detail=clip(v,2500);save('Evidence details');},{multiline:true});
      field(item,'Who knows this',e.whoKnows,v=>{e.whoKnows=clip(v,600);save('Evidence knowledge');});
      const observation=field(item,'What the players actually saw',e.playerSaw,v=>{e.playerSaw=clip(v,1000);save('Player observation');},{multiline:true,rows:2});
      btn(item,'Show observation on TV',()=>host.showText(e.title,observation.value));
      field(item,'Source / page / scene',e.source,v=>{e.source=clip(v,250);save('Evidence source');});
      const r=row(item);field(r,'Publish player observation to journal',e.published,v=>{try{host.publishClue(e.id,v);render();}catch(error){host.toast(error.message);render();}},{type:'checkbox'});
      btn(r,'Delete',()=>{if(!confirm(`Delete “${e.title}”?`))return;data().evidence=data().evidence.filter(x=>x.id!==e.id);save('Delete evidence');render();});
    }
  }
  function journalView(root) {
    let s=section(root,'Player journal','Only published entries appear on the table TV. DM notes and unpublished drafts stay here.');
    btn(s,'Open linked campaign events',()=>open('continuity'));
    for(const j of globalThis.ECHO_CONTINUITY?.publicJournal(host.continuity()) || []) {
      const item=el('article',null,s,'story-card');el('strong',j.title,item);note(item,j.text);note(item,`${j.when} · linked approved ${j.kind}`);
    }
    btn(s,'Add journal entry',()=>{data().journal.unshift({id:uid('journal'),title:'New entry',text:'',kind:'clue',when:'',source:'',published:false});save('Add journal entry');render();});
    for(const j of data().journal){const item=el('article',null,s,'story-card');
      const linked=globalThis.ECHO_OUTCOMES?.linked(host.continuity(),'journal',j.id);
      if(globalThis.ECHO_OUTCOMES_UI)btn(item,linked?'Correct linked outcome':'Review as linked outcome',()=>globalThis.ECHO_OUTCOMES_UI.fromNote(host,'journal',j));
      if(linked){el('strong',j.title,item);note(item,'Original reference preserved. Live views use: '+linked.title);continue;}
      const summary=host.continuity().outcomes?.summaries.find(x=>x.id===j.id),stale=summary&&summary.fingerprint!==globalThis.ECHO_OUTCOMES.fingerprint(host.continuity(),summary.session);
      if(stale){note(item,'Source outcomes changed. This recap is withheld from player displays until refreshed and reviewed.');btn(item,'Refresh recap from approved outcomes',()=>{j.text=globalThis.ECHO_CONTINUITY.recap(host.continuity(),summary.session);j.published=false;summary.fingerprint=globalThis.ECHO_OUTCOMES.fingerprint(host.continuity(),summary.session);save('Refreshed private recap draft');render();});}
      field(item,'Title',j.title,v=>{j.title=clip(v,120);save('Journal title');});
      select(item,'Type',j.kind,['clue','quest lead','location','NPC','promise','recap','other'].map(x=>[x,x]),v=>{j.kind=v;save('Journal type');});
      const journalText=field(item,'Player-safe text',j.text,v=>{j.text=clip(v,2500);save('Journal text');},{multiline:true});
      field(item,'When / session',j.when,v=>{j.when=clip(v,100);save('Journal date');});
      const r=row(item);field(r,'Publish on TV',j.published,v=>{if(v&&stale){host.toast('Refresh and review this recap first.');render();return;}j.published=v;save('Publish journal entry');},{type:'checkbox'});
      btn(r,'Show as handout now',()=>host.showHandout(j.title,j.text));
      btn(r,'Show text on TV',()=>host.showText(j.title,journalText.value));
      if(j.published&&!stale)btn(r,'Prepare spoken '+(j.kind==='recap'?'recap':'entry'),()=>{close();globalThis.ECHO_VOICE_STUDIO.fromSource({kind:'journal',id:j.id});});
      btn(r,'Delete',()=>{if(!confirm(`Delete “${j.title}”?`))return;data().journal=data().journal.filter(x=>x.id!==j.id);save('Delete journal entry');render();});
    }
  }
  function openPerson(id){chosenNpc=id;open('people');}
  function openQuestBoard(id){globalThis.ECHO_QUEST_PREP.ensure(data()).target=id;globalThis.ECHO_QUEST_PREP_UI.openBoard();}
  function peopleView(root) {
    let s=section(root,'Recurring people','The starting eight come from the campaign hub. Relationship changes should follow scenes at the table.');
    select(s,'Person',chosenNpc,data().npcs.map(n=>[n.id,n.name]),v=>{chosenNpc=v;render();});
    btn(s,'Add person',()=>{const name=prompt('Name:');if(!name?.trim())return;const n={id:uid('npc'),name:clip(name,100),source:'Table addition',base:'',voice:'',goal:'',attitude:'distant',lastInteraction:'',promisedHelp:'',nextMove:'',notes:'',portrait:''};data().npcs.push(n);chosenNpc=n.id;save('Add NPC');render();});
    const n=data().npcs.find(x=>x.id===chosenNpc)||data().npcs[0];if(!n)return;
    s=section(root,n.name,n.source);
    btn(s,'Dialogue suggestions',()=>{close();globalThis.ECHO_CAMPAIGN_ASSISTANT_UI.open({mode:'dialogue',npcId:n.id});});
    btn(s,'Voice studio',()=>{close();globalThis.ECHO_VOICE_STUDIO.open({npc:{id:n.id,name:n.name}});});
    if(globalThis.ECHO_VOICE_UI?.open && globalThis.ECHO_AI_VOICE_CAST?.catalog.some(profile=>profile.characterId && profile.characterId===n.id))
      btn(s,'Voice audition',()=>{close();globalThis.ECHO_VOICE_UI.open(n.id);});
    if(globalThis.ECHO_COURTYARD){const r=globalThis.ECHO_COURTYARD.relationship(host.continuity(),n.id),live=section(root,'Approved relationship','These changes come from the outcome ledger. NPC knowledge is assigned separately.');for(const [k,v]of Object.entries(r.changes))note(live,`${globalThis.ECHO_COURTYARD.fields[k]}: ${v||'(cleared)'}`);for(const t of r.promises)note(live,`Promise · ${t.state}: ${t.subject} · ${t.holder} → ${t.owedTo}`);if(!Object.keys(r.changes).length&&!r.promises.length)note(live,'No approved relationship changes.');btn(live,'Record an interaction',()=>outcome({title:n.name+' · interaction',detail:'',relationships:[{npcId:n.id,changes:{last:''},promiseKeys:[]}]}));if(globalThis.ECHO_COURTYARD_DATA.cast.some(x=>x.id===n.id))btn(live,'Open Mending Court',()=>open('courtyard'));}
    const current=host.settlementNpc?.(n.id);
    if(current){const live=section(root,'Preserved settlement notes','Manual notes retained for reference. Reconcile actual changes through Outcome review.');for(const [k,label]of [['wants','Wants'],['knowledge','Additional knowledge'],['last','Last interaction'],['plan','Next move'],['status','Status']])if(current[k])note(live,`${label}: ${current[k]}`);btn(live,'Open settlement records',()=>host.openSettlements?.());}
    for(const e of globalThis.ECHO_CONTINUITY?.knowledge(host.continuity(),n.id)||[])
      note(s,`Knows · ${e.status}: ${e.detail} (${e.session})`);
    const portrait=host.portrait(n.portrait); if(portrait){const image=el('img',null,s,'story-portrait');image.src=portrait;image.alt=`Portrait of ${n.name}`;}
    else el('div',n.name.slice(0,1).toUpperCase(),s,'story-silhouette');
    const file=field(s,'Portrait image','',()=>{},{type:'file'});file.accept='image/png,image/jpeg,image/webp';
    file.addEventListener('change',async()=>{if(!file.files?.[0])return;try{n.portrait=await host.importPortrait(file.files[0]);save('NPC portrait');render();}catch(err){host.toast(err.message||'Portrait could not be loaded.');}});
    field(s,'Name',n.name,v=>{n.name=clip(v,100);save('NPC name');});
    field(s,'Source',n.source,v=>{n.source=clip(v,250);save('NPC source');});
    field(s,'Base / usual location',n.base,v=>{n.base=clip(v,120);save('NPC base');});
    field(s,'Voice cue',n.voice,v=>{n.voice=clip(v,600);save('NPC voice');},{multiline:true,rows:2});
    note(s,'Fields below are preparation or preserved manual notes. Approved outcomes above supply the live relationship record.');
    field(s,'Goal / what they protect',n.goal,v=>{n.goal=clip(v,600);save('NPC goal');},{multiline:true,rows:2});
    select(s,'Attitude',n.attitude,['distant','known','trusted','strained','opposed'].map(x=>[x,x]),v=>{n.attitude=v;save('NPC attitude');});
    field(s,'Last interaction',n.lastInteraction,v=>{n.lastInteraction=clip(v,1200);save('NPC interaction');},{multiline:true,rows:2});
    field(s,'Promised help',n.promisedHelp,v=>{n.promisedHelp=clip(v,800);save('NPC promise');},{multiline:true,rows:2});
    field(s,'Next likely move',n.nextMove,v=>{n.nextMove=clip(v,800);save('NPC next move');},{multiline:true,rows:2});
    field(s,'Private notes',n.notes,v=>{n.notes=clip(v,2000);save('NPC notes');},{multiline:true});
    if(!globalThis.ECHO_STORY_DATA.NPC_SEED.some(seed=>seed[0]===n.id))btn(s,'Delete this person',()=>{if(!confirm(`Delete ${n.name}?`))return;data().npcs=data().npcs.filter(x=>x.id!==n.id);chosenNpc=data().npcs[0]?.id||'';save('Delete NPC');render();});
  }
  function waterdeepView(root) {
    let s=section(root,'Waterdeep home','For each return: one welcome, one change, and no more than two actionable leads.');
    const recent=data().waterdeep.returns.at(-1);
    if(recent)note(s,`Latest return: ${recent.welcome || 'No welcome'} · Change: ${recent.change || 'None noted'}`);
    btn(s,'Plan a return',()=>{data().waterdeep.returns.push({id:uid('return'),when:host.sessionName(),welcome:'',change:'',leadOne:'',leadTwo:'',notes:''});save('Plan Waterdeep return');render();});
    for(const r of data().waterdeep.returns.slice(-3).reverse()){const card=el('div',null,s,'story-card');
      field(card,'When',r.when,v=>{r.when=clip(v,100);save('Return date');});
      for(const [key,title] of [['welcome','One welcome'],['change','One changed relationship or consequence'],['leadOne','Lead 1'],['leadTwo','Lead 2'],['notes','Private notes']])
        field(card,title,r[key],v=>{r[key]=clip(v,1200);save(`Return ${key}`);},{multiline:key==='notes',rows:2});}
    s=section(root,'City places','These are campaign placements; consult the Waterdeep hub for full scenes and source notes.');
    for(const p of data().waterdeep.places){const d=el('details',null,s);el('summary',p.name,d);note(d,p.summary);
      field(d,'Welcome / what feels like home',p.welcome,v=>{p.welcome=clip(v,600);save('Place welcome');});
      field(d,'What changed',p.change,v=>{p.change=clip(v,600);save('Place change');});
      field(d,'Notes',p.notes,v=>{p.notes=clip(v,1200);save('Place notes');},{multiline:true,rows:2});}
    s=section(root,'Available leads','Mark up to two as active for the next city return.');
    btn(s,'Add lead',()=>{data().waterdeep.leads.push({id:uid('lead'),title:'New lead',destination:'',known:'',preparation:'',source:'',active:false});save('Add lead');render();});
    for(const l of data().waterdeep.leads){const card=el('div',null,s,'story-card');
      for(const [key,title] of [['title','Lead'],['destination','Destination'],['known','What is known'],['preparation','Useful preparation'],['source','Source']])
        field(card,title,l[key],v=>{l[key]=clip(v,800);save(`Lead ${key}`);});
      field(card,'Active',l.active,v=>{if(v&&data().waterdeep.leads.filter(x=>x.active).length>=2){host.toast('Keep at most two active leads.');render();return;}l.active=v;save('Active lead');},{type:'checkbox'});
      btn(card,'Delete',()=>{data().waterdeep.leads=data().waterdeep.leads.filter(x=>x.id!==l.id);save('Delete lead');render();});}
    s=section(root,'Factions and downtime');
    for(const f of data().waterdeep.factions){const d=el('details',null,s);el('summary',f.name,d);
      for(const [key,title] of [['stance','Current stance'],['goal','Goal'],['nextMove','Next move'],['notes','Notes']])
        field(d,title,f[key],v=>{f[key]=clip(v,1200);save(`Faction ${key}`);},{multiline:key==='notes'});}
    btn(s,'Add downtime thread',()=>{data().waterdeep.downtime.push({id:uid('downtime'),title:'New downtime',person:'',progress:'',next:''});save('Add downtime');render();});
    for(const d of data().waterdeep.downtime){const card=el('div',null,s,'story-card');
      for(const [key,title] of [['title','Activity'],['person','Who'],['progress','Progress'],['next','Next step']])field(card,title,d[key],v=>{d[key]=clip(v,500);save(`Downtime ${key}`);});
      btn(card,'Delete',()=>{data().waterdeep.downtime=data().waterdeep.downtime.filter(x=>x.id!==d.id);save('Delete downtime');render();});}
  }
  function sitesView(root) {
    let s=section(root,'The Nine','Undermountain is the center and eight sites surround it. Studying a site never automatically tunes or activates it.');
    select(s,'Site',chosenSite,data().sites.map(x=>[x.id,`${x.number}. ${x.name} · ${x.state}`]),v=>{chosenSite=v;render();});
    const x=data().sites.find(x=>x.id===chosenSite)||data().sites[0];if(!x)return;
    s=section(root,`${x.number}. ${x.name}`,x.source);
    if(globalThis.ECHO_ADVENTURES_UI&&x.id!=='undermountain')btn(s,'Open scoped satellite adventure',()=>globalThis.ECHO_ADVENTURES_UI.openSite(x.id));
    note(s,`${x.location} · Starting condition: ${x.startingCondition}`);
    const roles=globalThis.ECHO_WATERDEEP_DATA?.sites.find(site=>site.id===x.id);if(roles){note(s,`Pebble: ${roles.pebble}`);note(s,`Aldric: ${roles.aldric}`);note(s,`Choice: ${roles.decision}`);note(s,roles.boundary);btn(s,'Open site opportunities & ending choices',()=>{close();globalThis.ECHO_EXPEDITION_UI?.open('sites');});}
    select(s,'Current state',x.state,['unexamined','observed','deliberately tuned','isolated','severed'].map(v=>[v,v]),v=>{x.state=v;save('Site state');});
    field(s,'People affected',x.people,v=>{x.people=clip(v);save('Site people');},{multiline:true});
    field(s,'Evidence / what is known',x.evidence,v=>{x.evidence=clip(v);save('Site evidence');},{multiline:true});
    field(s,'Custody of discoveries',x.custody,v=>{x.custody=clip(v);save('Site custody');},{multiline:true});
    field(s,'Next consequence',x.nextConsequence,v=>{x.nextConsequence=clip(v);save('Site consequence');},{multiline:true});
    field(s,'Private notes',x.notes,v=>{x.notes=clip(v,2000);save('Site notes');},{multiline:true});
    s=section(root,'All sites at a glance');
    for(const site of data().sites)note(s,`${site.number}. ${site.name} — ${site.state}${site.nextConsequence?` · Next: ${site.nextConsequence}`:''}`);
  }
  function dungeonView(root) {
    const catalog=globalThis.ECHO_STORY_DATA;
    if(globalThis.ECHO_EXPEDITION_UI)btn(root,'Open complete Level 1 expedition cards',()=>{close();globalThis.ECHO_EXPEDITION_UI.open('floor');});
    let s=section(root,'Undermountain progress','Floor numbers are dungeon floors, not character levels. Keep the published map and room keys in the book.');
    select(s,'Floor',chosenFloor,data().floors.map(f=>[f.number,`${f.number}. ${f.name} · ${f.status}`]),v=>{chosenFloor=Number(v);render();});
    const f=data().floors.find(x=>x.number===chosenFloor)||data().floors[0];if(!f)return;
    s=section(root,`${f.number}. ${f.name}`,'Published adventure floor + custom Echo Below overlay');
    const chapter=catalog.FLOOR_PAGES[f.number-1], map=catalog.FLOOR_MAPS[f.number-1],
      aftermath=catalog.FLOOR_AFTERMATH[f.number-1], recommended=catalog.FLOOR_LEVELS[f.number-1];
    note(s,`Book advice: four characters of level ${recommended} · Current party: ${host.partyLevel()} · Floor ${f.number} is a dungeon floor number. Retreat and return remain possible.`);
    const links=row(s); bookButton(links,`Chapter · printed p. ${chapter}`,'madMage',chapter);
    if(map){bookButton(links,`Marked DM map · p. ${map}`,'madMage',map);
      privateMap(s,`floor-${f.number}`,`Floor ${f.number} · printed p. ${map}`);}
    bookButton(links,`Aftermath · p. ${aftermath}`,'madMage',aftermath);
    select(s,'Progress',f.status,['unvisited','exploring','resolved','bypassed'].map(x=>[x,x]),v=>{f.status=v;save('Dungeon progress');});
    field(s,'Routes and connections',f.routes,v=>{f.routes=clip(v);save('Dungeon routes');},{multiline:true});
    field(s,'Local factions and relationships',f.factions,v=>{f.factions=clip(v);save('Dungeon factions');},{multiline:true});
    field(s,'Unresolved rooms',f.rooms,v=>{f.rooms=clip(v);save('Dungeon rooms');},{multiline:true});
    const book=el('div',null,s,'story-source book');el('strong','BOOK · Dungeon of the Mad Mage',book);
    const prep=catalog.FLOOR_PREP[f.number];
    if(prep){
      note(book,`Factions: ${prep.factions}`); note(book,`Wandering: ${prep.wandering}`);
      note(book,`Bargains: ${prep.bargains}`); note(book,`Hazards: ${prep.hazards}`); note(book,`Rewards: ${prep.rewards}`);
      for(const room of prep.rooms){const line=row(book);el('span',room.name,line);bookButton(line,`Book p. ${room.page}`,'madMage',room.page);}
    }
    field(book,'Published map / room references',f.bookNote,v=>{f.bookNote=clip(v);save('Dungeon book note');},{multiline:true});
    const echo=el('div',null,s,'story-source echo');el('strong','ECHO BELOW · custom overlay',echo);note(echo,f.echoOverlay);
    field(echo,'What actually happened with the overlay',f.echoNotes,v=>{f.echoNotes=clip(v);save('Echo overlay notes');},{multiline:true});
    btn(echo,'Record clue as Open',()=>{data().evidence.push({id:uid('evidence'),title:`Floor ${f.number} · Echo clue`,detail:f.echoOverlay,
      whoKnows:'DM only',playerSaw:'',source:'Echo Below custom floor overlay',sessionId:host.sessionId(),status:'Open',published:false});
      save('Record floor clue');host.toast('Floor clue added to Evidence. Change its status when play supports it.');});
    s=section(root,'Known routes','Possible routes are book leads. Mark a route discovered only after the party finds or confirms it. Gate restrictions must be checked at their keyed room.');
    for(const route of host.expeditionRouteList?.()||data().routes){const card=el('div',null,s,'story-card');el('strong',`${route.from} → ${route.to} · ${route.kind}`,card);
      note(card,route.restriction);select(card,'Status',route.status,[['possible','Possible'],['discovered','Discovered'],['closed','Closed']],v=>{if(host.setExpeditionRoute)host.setExpeditionRoute(route,v);else route.status=v;save('Route status');});
      bookButton(card,`Source · p. ${route.sourcePage}`,'madMage',route.sourcePage);}
    btn(s,'Add a route or gate',()=>{const from=prompt('Route from:');if(!from?.trim())return;const to=prompt('Route to:');if(!to?.trim())return;
      const kind=prompt('Stairs, river, portal, gate, or return path:','gate');if(kind===null)return;
      const restriction=prompt('Book restriction or note (leave blank if not checked):','Check keyed book restriction before use.');if(restriction===null)return;
      data().routes.push({id:uid('route'),from:clip(from,100),to:clip(to,100),kind:clip(kind,40),restriction:clip(restriction,500),
        status:'possible',sourcePage:chapter});save('Add dungeon route');render();});
    s=section(root,'Elder rune · optional DM cue','Preview privately, then decide whether to use it. Entering an area never triggers a rune automatically. Check the exact effect in the book.');
    select(s,'Rune',chosenRune,catalog.ELDER_RUNES.map(entry=>[entry[0],entry[0]]),v=>{chosenRune=v;render();});
    select(s,'Face',runeFace,[['Bane','Bane'],['Boon','Boon']],v=>{runeFace=v;render();});
    const rune=catalog.ELDER_RUNES.find(entry=>entry[0]===chosenRune);
    if(rune)note(s,`Private preview: ${rune[runeFace==='Bane'?1:2]}`);
    bookButton(s,'Open exact rune · printed p. 318','madMage',318);
  }
  function calendarView(root) {
    let s=section(root,'Campaign calendar','Use an in-world date if you have one; the campaign day always advances from day 0.');
    const c=data().calendar;
    el('strong',`Day ${c.day}${c.label?` · ${c.label}`:''}`,s);
    const buttons=row(s);for(const [title,days] of [['Next day',1],['Travel week',7],['Downtime tenday',10]])btn(buttons,title,()=>{c.day+=days;save(`Calendar +${days} days`);render();});
    field(s,'In-world date / season label',c.label,v=>{c.label=clip(v,100);save('Calendar label');});
    s=section(root,'Faction and deadline clocks','Advance each clock manually when play justifies it.');
    btn(s,'Add clock',()=>{c.clocks.push({id:uid('clock'),name:'New clock',kind:'faction',current:0,max:4,next:'',notes:''});save('Add campaign clock');render();});
    for(const clock of c.clocks){const card=el('div',null,s,'story-card');
      field(card,'Clock',clock.name,v=>{clock.name=clip(v,120);save('Clock name');});
      select(card,'Kind',clock.kind,['faction','deadline','travel','downtime','home','other'].map(v=>[v,v]),v=>{clock.kind=v;save('Clock kind');});
      const bar=row(card);el('strong',`${clock.current} / ${clock.max}`,bar);
      btn(bar,'−',()=>{clock.current=Math.max(0,clock.current-1);save('Clock back');render();});
      btn(bar,'+',()=>{clock.current=Math.min(clock.max,clock.current+1);save('Clock advance');render();});
      field(card,'Maximum steps',clock.max,v=>{clock.max=Math.max(1,Math.min(1000,v||1));clock.current=Math.min(clock.current,clock.max);save('Clock size');},{type:'number'});
      field(card,'At next step',clock.next,v=>{clock.next=clip(v,800);save('Clock consequence');},{multiline:true,rows:2});
      field(card,'Notes',clock.notes,v=>{clock.notes=clip(v);save('Clock notes');},{multiline:true,rows:2});
      btn(card,'Delete',()=>{c.clocks=c.clocks.filter(x=>x.id!==clock.id);save('Delete clock');render();});}
    s=section(root,'Events and changes at home');
    btn(s,'Add event',()=>{c.events.push({id:uid('event'),day:c.day,title:'New event',kind:'home',person:'',note:''});save('Add event');render();});
    for(const event of [...c.events].sort((a,b)=>a.day-b.day)){const card=el('div',null,s,'story-card');
      field(card,'Day',event.day,v=>{event.day=Math.max(0,v||0);save('Event day');},{type:'number'});
      for(const [key,title] of [['title','Event'],['kind','Kind'],['person','Person or faction'],['note','What changes']])
        field(card,title,event[key],v=>{event[key]=clip(v,1200);save(`Event ${key}`);},{multiline:key==='note'});
      btn(card,'Delete',()=>{c.events=c.events.filter(x=>x.id!==event.id);save('Delete event');render();});}
  }
  function wrapView(root) {
    btn(root,'Review character spotlights',()=>open('spotlights'));
    btn(root,'Draft recap from approved campaign events',()=>{globalThis.ECHO_CONTINUITY_UI?.selectTab('recap');open('continuity');});
    const session=host.sessionId();let w=data().wrapUps.find(x=>x.sessionId===session);
    if(!w){w={id:uid('wrap'),sessionId:session,sessionName:host.sessionName(),decisions:'',npcChanges:'',treasure:'',progress:'',hooks:'',recap:'',nextScene:'',nextPlan:''};data().wrapUps.push(w);save('Start session wrap-up');}
    const s=section(root,`Close ${host.sessionName()}`,'Capture what happened before preparing the next session. The recap remains private until you publish a journal entry.');
    for(const [key,title] of [['decisions','Party decisions'],['npcChanges','NPC and faction changes'],['treasure','Treasure and custody'],['progress','Level / milestone progress'],['hooks','Unresolved hooks'],['nextScene','Likely next scene'],['nextPlan','What to prepare next']])
      field(s,title,w[key],v=>{w[key]=clip(v,key==='decisions'?2500:1600);save(`Wrap-up ${key}`);},{multiline:key!=='nextScene',rows:2});
    if(globalThis.ECHO_OUTCOMES_UI)btn(s,'Review these notes as a linked outcome',()=>globalThis.ECHO_OUTCOMES_UI.fromNote(host,'wrapUps',w));
    btn(s,'Draft recap from these notes',()=>{const parts=[
      w.decisions&&`The party chose: ${w.decisions}`,
      w.npcChanges&&`People and factions changed: ${w.npcChanges}`,
      w.treasure&&`They gained or entrusted: ${w.treasure}`,
      w.progress&&`Progress: ${w.progress}`,
      w.hooks&&`Still unresolved: ${w.hooks}`].filter(Boolean);
      w.recap=parts.join('\n\n').slice(0,2500);save('Draft recap');render();});
    field(s,'Edit player-safe recap',w.recap,v=>{w.recap=clip(v,2500);save('Edit recap');},{multiline:true,rows:6});
    btn(s,'Create unpublished journal recap',()=>{if(!w.recap.trim()){host.toast('Write or draft a recap first.');return;}
      data().journal.unshift({id:uid('journal'),title:`${w.sessionName} recap`,text:w.recap,kind:'recap',when:w.sessionName,source:'Session wrap-up',published:false});
      save('Create journal recap');open('journal');});
    const older=data().wrapUps.filter(x=>x.sessionId!==session).slice(-5).reverse();if(older.length){const past=section(root,'Previous session captures');for(const old of older)note(past,`${old.sessionName}: ${old.recap||old.decisions||'No recap yet'}`);}
  }
  function init(value) { host=value;$('open-finale')?.addEventListener('click',()=>open('finale'));$('open-chapters')?.addEventListener('click',()=>open('chapters'));$('open-mystery')?.addEventListener('click',()=>open('mystery'));$('open-story').addEventListener('click',()=>open());$('close-story').addEventListener('click',close);
    $('story-scrim').addEventListener('click',close);$('story-tool').addEventListener('change',e=>{tool=e.target.value;render();}); }
  globalThis.ECHO_STORY_UI={init,open,close,render,openPerson,openQuestBoard,outcome,correctOutcome:id=>globalThis.ECHO_OUTCOMES_UI.start(host,{},id)};
})();
