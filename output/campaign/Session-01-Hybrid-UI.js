/* DM presentation shell. Existing table modules still own saves, TV projection and actions. */
(() => {
  'use strict';
  if (location.hash === '#player') return;
  const $ = id => document.getElementById(id);
  const node = (tag, text, parent, className) => {
    const result = document.createElement(tag);
    if (text != null) result.textContent = String(text);
    if (className) result.className = className;
    parent?.append(result);
    return result;
  };
  const button = (parent, label, action, className) => {
    const result = node('button', label, parent, className);
    result.type = 'button'; result.addEventListener('click', action);
    return result;
  };
  const iconPaths = {
    book:'M8 12.5c4-2 8-2 12 0v34c-4-2-8-2-12 0zm12 0c4-2 8-2 12 0v34c-4-2-8-2-12 0M8 12.5v34m24-34v34',
    swords:'M10 9l28 28m-5 1l5-5 6 6-5 5-6-6M38 9L10 37m5 1l-5-5-6 6 5 5 6-6M9 9l10 3-7 7zM39 9l-10 3 7 7z',
    compass:'M26 7a19 19 0 1 0 0 38 19 19 0 0 0 0-38zm7 12-5 10-10 5 5-10z',
    party:'M19 26a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm14-3a6 6 0 1 0 0-12m-27 29c0-7 6-12 13-12s13 5 13 12zm29 0h6c0-6-4-10-10-11',
    scene:'M7 9h36v31H7zm6 6h24v19H13zm6 25v5m12-5v5',
    tokens:'M26 10a8 8 0 1 0 0 16 8 8 0 0 0 0-16zm-15 30c0-8 6-13 15-13s15 5 15 13z',
    fog:'M11 31a9 9 0 0 1 4-17 12 12 0 0 1 22 5 8 8 0 0 1 3 15H12m-2 6h28M16 45h21',
    audio:'M19 34V12l19-4v22M19 34c0 4-3 7-8 7s-8-3-8-7 4-6 8-6 8 2 8 6zm19-4c0 4-3 7-8 7s-8-3-8-7 4-6 8-6 8 2 8 6z',
    tv:'M6 11h40v27H6zm11 33h18m-9-6v6',
    undo:'M16 15 6 25l10 9M7 25h23a12 12 0 0 1 0 24',
    next:'M8 26h34m-10-10 10 10-10 10',
    tools:'M9 13h34m-34 13h34M9 39h34m-22-30v8m10 5v8m-12 5v8'
  };
  function icon(parent,key,className) {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 52 52');svg.setAttribute('aria-hidden','true');svg.classList.add(className);
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d',iconPaths[key]);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');
    path.setAttribute('stroke-width','2.6');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');
    svg.append(path);parent.append(svg);return svg;
  }
  const list = value => Array.isArray(value) ? value.filter(Boolean) : [];
  let api, initialized = false, screen = 'home', home, atlasSlot, sceneView, pilotView, combatRail, nextTurnButton, eveningBar, palette;
  let turnHead=null,sessionMapView=null,pilotGuide=false;
  let sceneSignature = '', pilotSignature = '', drawerOpen = false, lastSelectedTab = '';
  let turnPanelHome = null, turnPanel = null, combatTools = null;
  let eveningKey = '', eveningStep = 'ready', lastRunScreen='scene';
  let guideCollapsed=false, guidePreference=null;try{guidePreference=localStorage.getItem('echo-evening-collapsed');}catch{}
  const app = () => $('dm-app');
  const view = () => api?.host?.view?.() || {};
  const currentBeat = () => view().beat || null;
  function chooseBeat(id) {
    const select = $('runbook-select');
    if (!select || ![...select.options].some(option => option.value === id)) return;
    select.value = id; select.dispatchEvent(new Event('change', {bubbles:true}));
    update();
  }
  function showBeatVisual() {
    const selected=globalThis.ECHO_SESSION_MAP?.selection();
    api?.host?.showBeatVisual?.(selected?.sceneId);
  }
  function previewBeatMap() {
    changeScreen('combat');
    api?.host?.previewBeatScene?.();
    openDrawer('scene');
  }
  function prepareBeatEncounter() {
    api?.host?.combat?.stageCurrentBeat?.();
    openDrawer('encounter');
  }
  function openDrawer(tab) {
    if (tab) api.host.context(tab);
    drawerOpen = true; app().classList.add('hybrid-detail-open');
  }
  function closeDrawer() {
    if($('cockpit-guided-workflow')&&!$('cockpit-guided-workflow').hidden)globalThis.ECHO_COCKPIT?.closeGuide?.();
    drawerOpen = false; app().classList.remove('hybrid-detail-open');if(screen==='scene')globalThis.ECHO_ENCOUNTER_FLOW?.restoreView(sceneView?.querySelector('.hybrid-book-left'));else if(screen==='explore'&&pilotGuide)globalThis.ECHO_ENCOUNTER_FLOW?.restoreView(pilotView?.querySelector('.hybrid-pilot-main'));
  }
  function changeScreen(target, options = {}) {
    if (!initialized || !['home','scene','explore','combat','tv'].includes(target)) return;
    if(target==='explore')pilotGuide=options.guide===true;
    if (!app().classList.contains('run-mode')) $('mode-run')?.click();
    screen = target;
    if(['scene','explore','combat'].includes(target)){lastRunScreen=target;if(eveningKey)try{localStorage.setItem('echo-run-workspace:'+eveningKey,target);}catch{}}
    if (target === 'home' && app().classList.contains('cockpit-focus')) api.setFocus(false,false);
    for (const name of ['home','scene','explore','combat','tv']) app().classList.toggle('hybrid-'+name,name===target);
    home.hidden = target !== 'home'; sceneView.hidden = target !== 'scene'; pilotView.hidden = target !== 'explore'||!pilotGuide;
    if(sessionMapView)sessionMapView.hidden=target!=='explore'||pilotGuide;
    if(target==='explore')globalThis.ECHO_SESSION_MAP?.render();
    for (const control of document.querySelectorAll('[data-hybrid-screen]')) {
      const selected = control.dataset.hybridScreen === target || target === 'tv' && control.dataset.hybridScreen === 'combat';
      control.classList.toggle('active',selected);
      control.setAttribute('aria-current',selected?'page':'false');
    }
    closeDrawer();
    if(target==='scene')globalThis.ECHO_ENCOUNTER_FLOW?.restoreView(sceneView.querySelector('.hybrid-book-left'));if(target==='explore'&&pilotGuide){globalThis.ECHO_ENCOUNTER_FLOW?.restoreView(pilotView.querySelector('.hybrid-pilot-main'));globalThis.ECHO_ENCOUNTER_FLOW?.restoreView(pilotView.querySelector('.hybrid-pilot-side'));}
    if (target === 'home') {globalThis.ECHO_ATLAS_UI?.mountHome(atlasSlot);home.scrollTop=0;}
    if (target === 'combat') {
      api.host.combat?.setMoveTool?.();
      renderCombat();
    }
    if (target === 'tv') openDrawer('scene');
    if (options.drawer) openDrawer(options.drawer);
    update();
  }
  function setText(id,value) {const element=$(id);if(element&&element.textContent!==String(value||''))element.textContent=String(value||'');}
  function topbar() {
    const bar = node('header',null,app(),'hybrid-topbar');bar.id='hybrid-topbar';
    app().insertBefore(bar,app().firstChild);
    button(bar,'✦  Echo Below',()=>changeScreen('home'),'hybrid-brand');
    node('span','',bar,'hybrid-top-divider');
    const context=node('section',null,app(),'hybrid-table-context');context.id='hybrid-table-context';context.setAttribute('aria-label','Current table');app().insertBefore(context,bar.nextSibling);
    const scene=node('div',null,context,'hybrid-context-scene');node('small','SCENE',scene,'echo-eyebrow').id='hybrid-current-scene-label';node('strong','',scene).id='hybrid-current-scene';
    const objective=node('div',null,scene,'hybrid-evening-objective');node('small','OBJECTIVE',objective,'echo-eyebrow');node('span','',objective).id='hybrid-evening-objective';
    const next=button(context,'',()=>globalThis.ECHO_GUIDED?.runNext(),'hybrid-evening-next');next.id='hybrid-evening-next';
    const feedback=node('section',null,app(),'dm-feedback');feedback.id='dm-feedback';feedback.setAttribute('aria-label','Table notifications');context.after(feedback);const notice=$('toast');feedback.append(notice);const noticeDetails=node('details',null,feedback);const noticeSummary=node('summary','Notices · no issues',noticeDetails);noticeSummary.id='dm-feedback-summary';node('div',null,noticeDetails).id='dm-feedback-history';
    const supportObserver=new ResizeObserver(()=>{const top=document.querySelector('.dm-layout')?.getBoundingClientRect().top;if(top!==undefined)app().style.setProperty('--dm-support-top',Math.round(top+12)+'px');});supportObserver.observe(app());supportObserver.observe(feedback);supportObserver.observe(context);
    const nav=node('nav',null,bar,'hybrid-top-nav');nav.setAttribute('aria-label','DM workspaces');
    for(const [id,label] of [['scene','Scene'],['explore','Explore'],['combat','Map Desk']]) {
      const control=button(nav,label,()=>changeScreen(id),'hybrid-top-nav-button');control.dataset.hybridScreen=id;
    }
    button(nav,'← Back to session map',()=>{pilotGuide=false;globalThis.ECHO_SESSION_MAP?.back();},'hybrid-top-nav-button').id='session-map-return';
    const status=node('div',null,context,'hybrid-top-status');
    button(status,'',()=>{if($('connection-status')?.classList.contains('connected'))changeScreen('tv');else $('resync-player')?.click();},'hybrid-connected echo-status').id='hybrid-connection';
    node('span','',status,'hybrid-now-tv').id='hybrid-tv-now-top';
    const phones=button(status,'',()=>globalThis.ECHO_PHONE?.open(),'hybrid-phone-warning');phones.id='hybrid-phone-warning';phones.hidden=true;
    const search=button(bar,'⌕ Search',openPalette,'hybrid-top-search');search.id='hybrid-top-search';search.title='Press / to find an action';
    const inbox=button(bar,'Inbox',()=>openDrawer('requests'),'hybrid-top-inbox');inbox.id='hybrid-top-inbox';
    
    button(bar,'■ Stop sound',()=>{globalThis.ECHO_PRESENTATION?.stopAll();globalThis.ECHO_VOICE_STUDIO?.stop?.();},'hybrid-top-stop').id='hybrid-top-stop';
    const more=node('details',null,bar,'hybrid-top-more');more.id='hybrid-top-more';
    node('summary','Menu',more);
    const content=node('div',null,more,'hybrid-top-more-list');
    const action=(label,fn)=>button(content,label,()=>{more.open=false;fn();});
    const textLabel=node('label','Text size',content),textSize=node('select',null,textLabel);textSize.setAttribute('aria-label','DM text size');for(const [value,title]of [['1','Standard'],['1.5','Larger · 150%'],['2','Largest · 200%']]){const option=node('option',title,textSize);option.value=value;}const applyTextSize=value=>{const size=['1','1.5','2'].includes(value)?value:'1';textSize.value=size;app().style.setProperty('--echo-text-scale',size);app().dataset.textSize=size==='1'?'standard':'large';try{localStorage.setItem('echo-dm-text-size',size);}catch{}};textSize.onchange=()=>applyTextSize(textSize.value);let savedTextSize='1';try{savedTextSize=localStorage.getItem('echo-dm-text-size')||'1';}catch{}applyTextSize(savedTextSize);
    action('Mute / unmute audio',()=>$('quick-mute')?.click()).id='hybrid-top-mute';
    action('Audio board',()=>globalThis.ECHO_PRESENTATION?.open('audio'));
    action('Undo last change',()=>$('quick-undo')?.click());
    action('Session guide',()=>{changeScreen('explore');$('session-flow-open')?.click();openDrawer();});
    action('Prepare',()=>$('mode-prep')?.click());
    action('Review',()=>$('mode-review')?.click());
    action('Open player TV',()=>$('quick-director')?.click());
    for(const category of ['Party','Quests','World','Library','Session','Settings'])
      action(category,()=>{api.open(category);if(category!=='Quests')openDrawer();});
  }
  const eveningSteps=[['ready','Get ready'],['scene','Open scene'],['resolve','Resolve action'],['outcome','Record outcome'],['close','Close session']];
  function chooseEveningStep(step) {
    eveningStep=step;
    if(eveningKey)try{localStorage.setItem('echo-evening-step:'+eveningKey,step);}catch{}
    if(step==='ready')globalThis.ECHO_SESSION_FLOW_UI?.open('before');
    if(step==='scene')changeScreen('scene');
    if(step==='resolve')changeScreen(api.host.combat?.snapshot?.().turn?.order?.length?'combat':'explore');
    if(step==='outcome')globalThis.ECHO_STORY_UI?.open('outcomes');
    if(step==='close')globalThis.ECHO_SESSION_FLOW_UI?.open('close');
    update();
  }
  function makeEveningBar() {
    eveningBar=node('section',null,app(),'hybrid-evening-bar');eveningBar.id='hybrid-evening-bar';
    eveningBar.setAttribute('aria-label','Evening workflow');
    app().insertBefore(eveningBar,document.querySelector('.dm-layout'));
    const steps=node('nav',null,eveningBar,'hybrid-evening-steps');
    for(const [index,[id,label]] of eveningSteps.entries()){
      const control=button(steps,`${index+1} · ${label}`,()=>chooseEveningStep(id));
      control.dataset.eveningStep=id;
    }
    steps.id='hybrid-evening-steps';
    const controls=node('div',null,$('hybrid-table-context'),'hybrid-guide-controls');
    const current=button(controls,'',()=>chooseEveningStep(eveningStep),'hybrid-evening-current');current.id='hybrid-evening-current';
    const toggle=button(controls,'Collapse guide',()=>{guideCollapsed=!guideCollapsed;guidePreference=String(guideCollapsed);try{localStorage.setItem('echo-evening-collapsed',guidePreference);}catch{}update();},'hybrid-guide-toggle');toggle.id='hybrid-guide-toggle';toggle.setAttribute('aria-controls','hybrid-evening-steps');
  }
  function makePalette() {
    palette=node('dialog',null,document.body,'hybrid-palette');palette.id='hybrid-palette';
    const head=node('div',null,palette,'hybrid-palette-head');
    const input=node('input',null,head);input.type='search';input.placeholder='Find an action…';input.setAttribute('aria-label','Find an action');
    button(head,'Close',()=>palette.close());
    const results=node('div',null,palette,'hybrid-palette-results');
    const commands=[
      ['Get ready','table check devices backup',()=>chooseEveningStep('ready')],
      ['Open scene','runbook read aloud visual',()=>chooseEveningStep('scene')],
      ['Resolve action','explore combat turn',()=>chooseEveningStep('resolve')],
      ['Record outcome','discovery promise treasure npc',()=>chooseEveningStep('outcome')],
      ['Close session','review recap ending',()=>chooseEveningStep('close')],
      ['Open Map Desk','tokens movement combat',()=>changeScreen('combat')],
      ['Player requests','inbox approvals phones',()=>openDrawer('requests')],
      ['TV preview','stage player screen',()=>changeScreen('tv')],
      ['Players went elsewhere','detour improv alternate route',()=>globalThis.ECHO_TABLE_FLOW?.openDetour()],
      ['Search everything','rules characters monsters quests library',()=>$('quick-search')?.click()]
    ];
    const render=()=>{results.replaceChildren();const query=input.value.trim().toLowerCase();const matches=commands.filter(([label,tags])=>(label+' '+tags).toLowerCase().includes(query)).slice(0,8);
      if(!matches.length)node('p','No matching actions. Try Search everything for campaign records.',results);
      for(const [label,,action] of matches)button(results,label,()=>{palette.close();action();});
    };
    input.addEventListener('input',render);
    input.addEventListener('keydown',event=>{if(event.key==='Enter'){const first=results.querySelector('button');if(first){event.preventDefault();first.click();}}});
    document.addEventListener('keydown',event=>{const editable=event.target?.closest?.('input,textarea,select,[contenteditable="true"]');
      if(((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k')||event.key==='/'&&!editable&&!event.altKey){
      event.preventDefault();palette.open?palette.close():openPalette();
    }});
    render();
  }
  function openPalette(){if(!palette)return;if(!palette.open)palette.showModal();const input=palette.querySelector('input');input.value='';input.dispatchEvent(new Event('input'));input.focus();}
  function tile(parent,glyph,title,description,action) {
    const card=button(parent,'',action,'hybrid-tile');
    icon(card,glyph,'hybrid-tile-icon');node('strong',title,card);node('span',description,card,'hybrid-tile-description');
  }
  function makeHome(layout) {
    home=node('main',null,layout,'hybrid-launchpad');home.id='hybrid-home';home.setAttribute('aria-label','Table Launchpad');
    const summary=node('section',null,home,'hybrid-resume-card');summary.setAttribute('aria-label','Current session summary');
    const identity=node('div',null,summary);node('small','CURRENT SESSION',identity,'echo-eyebrow');node('h2','',identity).id='hybrid-session-name';
    const next=node('div',null,summary,'hybrid-resume-next');node('small','NEXT ACTION',next,'echo-eyebrow');node('strong','',next).id='hybrid-next-action';
    button(summary,'Resume session →',()=>{pilotGuide=false;changeScreen('explore');},'hybrid-primary').id='hybrid-resume';
    const body=node('div',null,home,'hybrid-home-body');
    const cards=node('div',null,body,'hybrid-tiles');
    tile(cards,'book','Run a scene','Read aloud, talk, and stage art',()=>changeScreen('scene'));
    tile(cards,'swords','Start combat','Maps, turns, and tokens',()=>changeScreen('combat'));
    tile(cards,'compass','Explore','Follow leads and discover places',()=>changeScreen('explore'));
    tile(cards,'party','Handle players','Requests, sheets, and notes',()=>openDrawer('requests'));
    const atlas=node('section',null,body,'hybrid-atlas-card');
    const head=node('div',null,atlas,'hybrid-atlas-title');node('small','WORLD ATLAS',head);node('h2',globalThis.ECHO_BOOT?.echo===false?'Your campaign atlas':'The Sword Coast',head);
    atlasSlot=node('div',null,atlas);atlasSlot.id='hybrid-atlas-slot';

  }
  function beatSelector(parent,id) {
    const control=node('select',null,parent,'hybrid-beat-select');control.id=id;control.setAttribute('aria-label','Choose prepared scene');
    control.addEventListener('change',()=>chooseBeat(control.value));return control;
  }
  function beatCards(parent,heading,lines,className) {
    if(!lines.length)return;
    const card=node('section',null,parent,'hybrid-beat-card '+(className||''));
    node('h3',heading,card);
    for(const line of lines)node('p',line,card);
  }
  function makeScene(layout) {
    sceneView=node('main',null,layout,'hybrid-scene-view');sceneView.id='hybrid-scene-view';sceneView.hidden=true;
    const book=node('div',null,sceneView,'hybrid-book');
    const left=node('section',null,book,'hybrid-book-page hybrid-book-left');
    const right=node('section',null,book,'hybrid-book-page hybrid-book-right');
    node('small','THE ECHO BELOW · SCENE',left,'hybrid-book-eyebrow');
    node('h1','',left).id='hybrid-scene-title';
    const scenePicker=node('details',null,left,'hybrid-scene-picker');node('summary','Change prepared scene',scenePicker);beatSelector(scenePicker,'hybrid-scene-beat');
    node('div',null,left,'hybrid-scene-copy').id='hybrid-scene-copy';
    const advanced=node('div',null,left,'hybrid-book-advanced');
    button(advanced,'Previous',()=>$('runbook-prev')?.click());
    button(advanced,'Full scene notes',()=>api.showPanel('.runbook-panel','Scene notes'));
    button(advanced,'If they go elsewhere',()=>globalThis.ECHO_TABLE_FLOW?.openDetour());
    node('div',null,right,'hybrid-book-art').id='hybrid-scene-art';
    node('p','Ready to show · private preview',right,'hybrid-preview-note').id='hybrid-scene-preview-label';node('p','',right,'hybrid-scene-now-showing').id='hybrid-scene-now-showing';const live=node('details',null,right,'hybrid-player-view-check');node('summary','Check exact player view',live);const playerPreview=node('div',null,live);live.addEventListener('toggle',()=>{if(live.open)api.host.previewPlayer?.(playerPreview,'','live');});
    const actions=node('div',null,right,'hybrid-book-actions');
    button(actions,'▣  Show scene on TV',showBeatVisual,'hybrid-primary');
    button(actions,'◫  Preview map',previewBeatMap);
    button(actions,'Prepare encounter',prepareBeatEncounter).classList.add('hybrid-prepare-encounter');
    button(actions,'Next scene  →',()=>{if(currentBeat()?.flowVersion===1){[...sceneView.querySelectorAll('.encounter-flow-steps button')].find(b=>b.textContent==='Continue')?.click();}else $('runbook-next')?.click();},'hybrid-next-scene');
  }
  function makePilot(layout) {
    pilotView=node('main',null,layout,'hybrid-pilot-view');pilotView.id='hybrid-pilot-view';pilotView.hidden=true;
    const timeline=node('aside',null,pilotView,'hybrid-pilot-timeline');
    node('small','SESSION PILOT',timeline);node('p','Follow the players. Use these beats when they fit.',timeline);
    beatSelector(timeline,'hybrid-pilot-beat');
    node('div',null,timeline,'hybrid-pilot-beats').id='hybrid-pilot-beats';
    const center=node('section',null,pilotView,'hybrid-pilot-main');
    node('small','PREPARED BEAT',center).id='hybrid-pilot-count';
    node('h1','',center).id='hybrid-pilot-title';
    const question=node('section',null,center,'hybrid-pilot-question');node('small','CURRENT QUESTION · DM ONLY',question);node('h2','What do the players want to do here?',question);node('div',null,question).id='hybrid-pilot-choices';const urgent=node('section',null,center,'hybrid-pilot-urgent');node('p','',urgent).id='hybrid-pilot-urgent-text';button(urgent,'Open urgent requests',()=>{api.host.context('requests');openDrawer();});
    const read=node('div',null,center,'hybrid-pilot-read');
    node('small','READ ALOUD',read);node('div',null,read).id='hybrid-pilot-read-text';
    const actions=node('div',null,center,'hybrid-pilot-actions');
    button(actions,'Choose another prepared beat',()=>$('hybrid-pilot-beat').focus());
    button(actions,'Preview prepared visual',previewBeatMap);
    button(actions,'Prepare encounter',prepareBeatEncounter).classList.add('hybrid-prepare-encounter');
    const right=node('aside',null,pilotView,'hybrid-pilot-side');
    const preview=node('section',null,right,'hybrid-pilot-card');node('small','VISUAL TO STAGE',preview);
    node('div',null,preview,'hybrid-pilot-preview').id='hybrid-pilot-preview';
    const notes=node('details',null,right,'hybrid-pilot-card');node('summary','Private guidance and sources',notes);
    node('div',null,notes).id='hybrid-pilot-notes';
    const detour=node('section',null,right,'hybrid-pilot-card hybrid-pilot-detour');node('small','IF THEY GO ELSEWHERE · DM ONLY',detour);
    node('div',null,detour).id='hybrid-pilot-detour-text';
    button(detour,'Nearby options & improv note',()=>globalThis.ECHO_TABLE_FLOW?.openDetour());
    button(right,'▣  Show on TV',showBeatVisual,'hybrid-primary');

  }
  function makeMapDock() {
    const dock=node('nav',null,app(),'hybrid-map-dock');dock.id='hybrid-map-dock';dock.setAttribute('aria-label','Map Desk controls');
    app().insertBefore(dock,$('review-workspace'));
    const item=(glyph,label,fn)=>{const control=button(dock,'',fn);icon(control,glyph,'hybrid-dock-icon');node('small',label,control);return control;};

    item('tokens','Tokens',()=>{if(!api.host.combat?.snapshot?.().isMap){openDrawer('scene');return;}closeDrawer();combatRail?.querySelector('.hybrid-combat-tokens')?.scrollIntoView({block:'nearest'});});
    item('fog','Fog',()=>api.showPanel('#fog-panel','Reveal tools'));


    item('undo','Undo',()=>$('quick-undo')?.click());
    nextTurnButton=item('next','Next turn',()=>$('next-turn')?.click());
    item('tools','Map tools',()=>app().classList.toggle('hybrid-map-tools-open'));
  }
  function makeCombatRail(layout) {
    combatRail=node('aside',null,layout,'hybrid-combat-rail');
    combatRail.id='hybrid-combat-rail';
    combatRail.setAttribute('aria-label','Combat and tokens');
  }
  let actionReview=null;
  function dockTurnPanel() {
    const panel=turnPanel || $('combat-live-panel');
    if(!panel||!combatRail)return;
    turnPanel=panel;
    const turnState=api.host.combat?.snapshot?.();if(!turnState?.turn?.order?.length||turnState.turn.scene!==turnState.sceneId){turnHead?.remove();turnHead=null;}
    combatTools ||= $('combat-plus-tools');
    actionReview ||= $('desk-action-review');
    if(!turnPanelHome)turnPanelHome=$('context-turn');
    if(screen==='combat'&&app().classList.contains('run-mode')){
      combatRail.insertBefore(panel,combatRail.querySelector('.hybrid-combat-tokens'));
      turnHead=panel.querySelector('.live-head')||turnHead;for(const old of combatRail.querySelectorAll(':scope > .live-head'))if(old!==turnHead)old.remove();if(turnHead)combatRail.insertBefore(turnHead,panel);
      if(actionReview)combatRail.insertBefore(actionReview,combatRail.querySelector('.hybrid-combat-tokens'));
      if(combatTools)combatRail.insertBefore(combatTools,combatRail.querySelector('.hybrid-combat-tokens'));
    }else if(turnPanelHome&&panel.parentElement!==turnPanelHome){
      if(turnHead)panel.prepend(turnHead);turnPanelHome.prepend(panel);
      if(combatTools)panel.after(combatTools);
      if(actionReview)$('context-requests').append(actionReview);
    }
  }
  function renderCombat() {
    if(!combatRail)return;
    if(screen!=='combat'){dockTurnPanel();return;}
    turnPanel ||= $('combat-live-panel');
    combatTools ||= $('combat-plus-tools');
    actionReview ||= $('desk-action-review');
    const data=api.host.combat?.snapshot?.();
    combatRail.replaceChildren();
    if(!data){dockTurnPanel();return;}
    if(nextTurnButton)nextTurnButton.disabled=!data.turn?.order?.length;
    const head=node('div',null,combatRail,'hybrid-combat-head');
    node('small','MAP DESK',head);
    node('h2',data.turn?.order?.length?'Run combat':'Set up combat',head);
    node('p',globalThis.ECHO_MAP_DATA.displayTitle(data.sceneTitle||'Choose a map'),head);
    if(data.isMap)node('small',data.precision||'Map scale unverified',head,'hybrid-map-precision');
    if(!data.isMap){
      node('p','Show a battle map to place tokens and begin combat.',combatRail,'hybrid-combat-help');
      if(currentBeat()?.encounter)button(combatRail,'Prepare this encounter',()=>{api.host.combat.stageCurrentBeat();openDrawer('encounter');},'hybrid-primary');
      button(combatRail,'Choose a map',()=>openDrawer('scene'),'hybrid-primary');
      dockTurnPanel();
      return;
    }
    const active=data.tokens.find(token=>token.id===data.turn?.order?.[data.turn?.index]);
    if(active&&data.turn.scene!==data.sceneId){
      node('p',`Combat is active on another map. ${active.name}'s turn is waiting.`,combatRail,'hybrid-combat-help');
      button(combatRail,'Preview combat map',()=>{api.host.combat.previewCombatMap();openDrawer('scene');},'hybrid-primary');
    }else if(active){
      const now=node('section',null,combatRail,'hybrid-combat-now');
      const order=node('div',null,now,'hybrid-combat-order');
      for(const [index,id] of data.turn.order.entries()){
        const token=data.tokens.find(item=>item.id===id);
        if(token)node('span',`${index===data.turn.index?'▶ ':''}${token.name} ${token.initiative??'—'}`,order,index===data.turn.index?'active':'');
      }
    }else{
      const start=node('section',null,combatRail,'hybrid-combat-start');
      node('p','Place combatants, collect initiative, then begin round 1. Tokens can be dragged freely on the map.',start);
      if(data.tokens.some(token=>token.team==='pc'&&(!token.placed||token.scene!==data.sceneId)))
        button(start,'Place missing party tokens',()=>api.host.combat.placeMissingParty());
      const row=node('div',null,start,'hybrid-combat-row');
      button(row,data.initiativeOpen?'Initiative requested':'Ask phones for initiative',()=>api.host.combat.requestInitiative(),data.initiativeOpen?'':'hybrid-primary');
      button(row,'Roll enemies',()=>api.host.combat.rollEnemies());
      const placed=data.tokens.filter(token=>token.placed&&token.scene===data.sceneId&&(token.team!=='enemy'||token.hp>0));
      const missing=placed.filter(token=>!Number.isFinite(token.initiative));
      const ready=placed.length>0&&!missing.length;
      const build=button(start,ready?'Begin round 1':`Build order · ${missing.length||'place tokens'} missing`,()=>api.host.combat.buildOrder(),'hybrid-primary');
      build.disabled=!ready;
      if(missing.length)node('small',`Waiting: ${missing.map(token=>token.name).join(', ')}`,start);
    }
    dockTurnPanel();
    const roster=node(active?'details':'section',null,combatRail,'hybrid-combat-tokens');
    if(active)node('summary',`Tokens · ${data.tokens.filter(token=>token.placed&&token.scene===data.sceneId).length} on map`,roster);
    const row=node('div',null,roster,'hybrid-combat-section-head');
    node('h3','Tokens',row);
    button(row,'Encounter setup',()=>{api.host.combat.stageEncounter();openDrawer('encounter');});
    const enemySelect=node('select',null,roster,'hybrid-combat-encounter');
    enemySelect.setAttribute('aria-label','Choose enemy group');
    for(const encounter of data.encounters){const option=node('option',encounter.name,enemySelect);option.value=encounter.id;}
    enemySelect.value=data.encounterId;
    enemySelect.addEventListener('change',()=>api.host.combat.selectEncounter(enemySelect.value));
    const shown=data.tokens.filter(token=>token.team!=='enemy'||token.encounter===data.encounterId||token.placed&&token.scene===data.sceneId);
    for(const team of ['pc','ally','enemy']){
      const members=shown.filter(token=>token.team===team);
      if(!members.length)continue;
      node('small',team==='pc'?'PARTY':team==='ally'?'ALLIES':'ENEMIES',roster,'hybrid-combat-team');
      for(const token of members){
        const item=node('div',null,roster,'hybrid-combat-token');
        const info=button(item,'',()=>{api.host.combat.openToken(token.id);openDrawer();},'hybrid-combat-token-info');
        node('strong',token.name,info);
        node('small',`HP ${token.hp}/${token.maxHp||'?'} · AC ${token.ac??'?'}${token.placed&&token.scene===data.sceneId?' · On map':''}`,info);
        const controls=node('div',null,item,'hybrid-combat-token-controls');
        const place=button(controls,token.placed&&token.scene===data.sceneId?'Remove':'Place',()=>api.host.combat.toggleToken(token.id));
        if(data.turn.order.includes(token.id)&&token.placed&&token.scene===data.sceneId){place.disabled=true;place.title='End combat before removing a creature from turn order.';}
        if(active&&token.id!==active.id&&token.placed&&token.scene===data.sceneId)
          button(controls,'Target',()=>{api.host.combat.targetToken(token.id);closeDrawer();});
        if(token.team!=='pc'&&token.placed&&token.scene===data.sceneId){
          const visibility=button(controls,token.visible?'Visible':'Hidden',()=>api.host.combat.toggleVisibility(token.id));
          visibility.title=token.visible?'Hide this token from player TV':'Show this token on player TV';
        }
        if(!data.turn.order.length&&token.placed&&token.scene===data.sceneId){
          const label=node('label','Init',controls);const input=node('input',null,label);
          input.type='number';input.min='-99';input.max='999';input.placeholder='—';input.value=token.initiative??'';
          input.setAttribute('aria-label',`${token.name} initiative`);
          input.addEventListener('change',()=>api.host.combat.setInitiative(token.id,input.value));
        }
      }
    }
    const foot=node('div',null,combatRail,'hybrid-combat-foot');
    button(foot,'Combat tools',()=>openDrawer(data.turn.order.length?'turn':'encounter'));
    if(data.turn.order.length)button(foot,'Review combat ending',()=>api.host.combat.endCombat());
  }
  function setBeatOptions(select,beats,selected) {
    if(!select)return;
    const signature=beats.map(beat=>`${beat.id}:${beat.title}`).join('|');
    if(select.dataset.signature!==signature){select.replaceChildren();for(const beat of beats)node('option',beat.title,select).value=beat.id;select.dataset.signature=signature;}
    select.value=selected||'';
  }
  function renderScene(data) {
    const showing=($('tv-now-badge')?.textContent||'').replace(/^Now showing:\s*/i,'').trim();const tvConnected=$('connection-status')?.classList.contains('connected');setText('hybrid-scene-now-showing',showing?(tvConnected?'Now showing · ':'TV offline · last presentation: ')+showing:'Player display · no presentation reported');
    const selected=globalThis.ECHO_SESSION_MAP?.selection();
    const beat=data.beat,art=selected?.sceneId?api.host.sessionMap?.().scenes.find(x=>x.id===selected.sceneId)||data.beatScene:data.beatScene;
    const signature=JSON.stringify([beat,art?.id,art?.image]);if(signature===sceneSignature)return;sceneSignature=signature;
    setBeatOptions($('hybrid-scene-beat'),list(data.beats),beat?.id);
    setText('hybrid-scene-title',beat?.title||art?.title||'Choose a scene');
    sceneView.classList.toggle('has-encounter-flow',beat?.flowVersion===1);
    const scrollNode=sceneView.querySelector('.hybrid-book-left');globalThis.ECHO_ENCOUNTER_FLOW?.rememberView(scrollNode);
    const copy=$('hybrid-scene-copy');
    if(!globalThis.ECHO_ENCOUNTER_FLOW?.render(copy,beat,{key:api.host.sessionMap?.().key,choose:chooseBeat,returnMap:id=>globalThis.ECHO_SESSION_MAP?.back(id),review:api.host.reviewEncounter})){
    copy.replaceChildren();
    globalThis.ECHO_ENCOUNTER_FLOW?.renderBrief(copy,beat);
    beatCards(copy,'Say aloud',list(beat?.read),'hybrid-say');
    beatCards(copy,'Ask the players',list(beat?.ask));
    beatCards(copy,'Choices',list(beat?.choices));
    const privateLines=[...list(beat?.run),...list(beat?.private)];
    if(privateLines.length){const details=node('details',null,copy,'hybrid-private-details');node('summary','DM notes and secrets',details);for(const line of privateLines)node('p',line,details);globalThis.ECHO_ENCOUNTER_FLOW?.bindDetails(details,api.host.sessionMap?.().key,beat,'legacy-private');}
    }
    if(beat&&beat.flowVersion!==1)globalThis.ECHO_ENCOUNTER_FLOW?.bindView(scrollNode,api.host.sessionMap?.().key,beat,'scene');
    if(!beat)node('p','Choose a prepared beat above to see its text.',copy);
    const frame=$('hybrid-scene-art');frame.replaceChildren();
    if(art?.image){const image=node('img',null,frame);image.src=api.host.image(art.image);image.alt='Private scene preview: '+(art.title||beat?.title||'scene');}
    else node('p','No visual is prepared for this beat. Choose another beat or open Map Desk.',frame);
    const next=sceneView.querySelector('.hybrid-next-scene');if(next){next.textContent=beat?.flowVersion===1?'Choose next step →':'Next scene →';next.hidden=beat?.flowVersion===1;}
    const show=sceneView.querySelector('.hybrid-book-actions .hybrid-primary');show.disabled=!beat?.scene;
    sceneView.querySelector('.hybrid-prepare-encounter').hidden=!beat?.encounter;
  }
  function renderPilot(data) {
    const beat=data.beat,art=data.beatScene,beats=list(data.beats);
    const urgentSummary=globalThis.ECHO_GUIDED?.summary();const signature=JSON.stringify([beat,art?.id,art?.image,beats,urgentSummary?.urgent]);if(signature===pilotSignature)return;pilotSignature=signature;
    globalThis.ECHO_ENCOUNTER_FLOW?.rememberView(pilotView.querySelector('.hybrid-pilot-main'));globalThis.ECHO_ENCOUNTER_FLOW?.rememberView(pilotView.querySelector('.hybrid-pilot-side'));
    setBeatOptions($('hybrid-pilot-beat'),beats,beat?.id);
    const index=beats.findIndex(row=>row.id===beat?.id);
    setText('hybrid-pilot-count',index<0?'PREPARED BEAT':`BEAT ${index+1} OF ${beats.length}`);
    setText('hybrid-pilot-title',beat?.title||'Choose the next scene');
    const timeline=$('hybrid-pilot-beats');timeline.replaceChildren();
    const start=Math.max(0,index<0?0:index-1);for(const [offset,row] of beats.slice(start,start+5).entries()){
      const number=start+offset+1;
      const item=button(timeline,'',()=>chooseBeat(row.id),'hybrid-pilot-step'+(row.id===beat?.id?' active':''));
      node('span',number,item);node('strong',row.title,item);
    }
    for(const id of ['hybrid-pilot-preview']){
      const frame=$(id);frame.replaceChildren();if(art?.image){const image=node('img',null,frame);image.src=api.host.image(art.image);image.alt='DM preview: '+(art.title||beat?.title||'scene');}
      else node('p','No visual prepared for this beat.',frame);
    }
    const main=pilotView.querySelector('.hybrid-pilot-main');globalThis.ECHO_ENCOUNTER_FLOW?.rememberView(main);
    const choices=$('hybrid-pilot-choices');choices.replaceChildren();const question=choices.parentElement;question.querySelector('h2').hidden=true;globalThis.ECHO_ENCOUNTER_FLOW?.renderBrief(choices,beat);const approaches=node('details',null,choices,'hybrid-pilot-alternatives');node('summary','Prepared approaches · optional',approaches);for(const line of list(beat?.choices))node('p',line,approaches);if(!choices.childElementCount)node('p','Hear their approach, then use the relevant prepared beat or nearby alternatives.',choices);const urgent=$('hybrid-pilot-urgent-text');urgent.textContent=(urgentSummary?.urgent||[]).map(x=>x.title).join(' · ');urgent.parentElement.hidden=!(urgentSummary?.urgent?.length);
    const read=$('hybrid-pilot-read-text');read.replaceChildren();for(const line of list(beat?.read))node('p',line,read);if(!read.childElementCount)node('p','No scripted read-aloud for this beat. Describe the scene in your own words.',read);
    const notes=$('hybrid-pilot-notes');notes.replaceChildren();node('h3','DM response guidance and mechanics',notes);for(const line of list(beat?.run))node('p',line,notes);node('h3','Private motives, background and sources',notes);for(const line of list(beat?.private))node('p',line,notes);
    if(!notes.childElementCount)node('p','Follow the players’ approach.',notes);
    const detour=$('hybrid-pilot-detour-text');detour.replaceChildren();
    for(const line of list(beat?.choices).slice(0,2))node('p',line,detour);
    if(!detour.childElementCount)node('p','Keep this beat prepared; open nearby leads and NPCs if the party changes course.',detour);
    if(beat){const key=api.host.sessionMap?.().key;globalThis.ECHO_ENCOUNTER_FLOW?.bindDetails(notes.parentElement,key,beat,'pilot-private');globalThis.ECHO_ENCOUNTER_FLOW?.bindDetails(approaches,key,beat,'pilot-approaches');globalThis.ECHO_ENCOUNTER_FLOW?.bindView(main,key,beat,'pilot');globalThis.ECHO_ENCOUNTER_FLOW?.bindView(pilotView.querySelector('.hybrid-pilot-side'),key,beat,'pilot-side');}
    pilotView.querySelector(':scope > .hybrid-pilot-side > .hybrid-primary').disabled=!beat?.scene;
    pilotView.querySelector('.hybrid-prepare-encounter').hidden=!beat?.encounter;
  }
  function update() {
    if(!initialized)return;
    globalThis.ECHO_SESSION_MAP?.render();
    const back=$('session-map-return');if(back)back.hidden=screen==='explore'||screen==='home';
    const data=view(),summary=globalThis.ECHO_GUIDED?.summary?.();
    const flow=api.host.flow?.();
    if(flow?.key&&flow.key!==eveningKey){eveningKey=flow.key;let saved='';try{saved=localStorage.getItem('echo-evening-step:'+eveningKey)||'';}catch{}
      eveningStep=flow.phase==='closed'?'close':flow.phase==='before'?'ready':eveningSteps.some(([id])=>id===saved&&id!=='ready')?saved:'scene';
      let workspace='';try{workspace=localStorage.getItem('echo-run-workspace:'+eveningKey)||'';}catch{}lastRunScreen=['scene','explore','combat'].includes(workspace)?workspace:api.host.combat?.snapshot?.().turn?.order?.length?'combat':'scene';
      guideCollapsed=guidePreference===null?flow.phase==='live':guidePreference==='true';}
    if(flow?.phase==='closed')eveningStep='close';
    else if(flow?.phase==='before')eveningStep='ready';
    else if(flow?.phase==='live'&&eveningStep==='ready')eveningStep='scene';
    if(guidePreference===null&&screen==='scene'&&data.beat?.flowVersion===1)guideCollapsed=true;
    for(const control of eveningBar?.querySelectorAll('[data-evening-step]')||[]){const active=control.dataset.eveningStep===eveningStep;
      control.classList.toggle('active',active);control.setAttribute('aria-current',active?'step':'false');}
    eveningBar.classList.toggle('guide-collapsed',guideCollapsed);$('hybrid-evening-steps').hidden=guideCollapsed;$('hybrid-evening-current').hidden=!guideCollapsed;
    setText('hybrid-evening-current',`${eveningSteps.findIndex(([id])=>id===eveningStep)+1} · ${eveningSteps.find(([id])=>id===eveningStep)?.[1]||'Session guide'}`);
    setText('hybrid-guide-toggle',guideCollapsed?'Expand guide':'Collapse guide');$('hybrid-guide-toggle').setAttribute('aria-expanded',String(!guideCollapsed));
    setText('hybrid-current-scene-label',['scene','explore'].includes(screen)?'PREPARED SCENE':'SCENE');
    setText('hybrid-current-scene',globalThis.ECHO_MAP_DATA.displayTitle(['scene','explore'].includes(screen)?data.beat?.title||data.scene?.title||'Choose a scene':data.scene?.title||'Choose a scene'));
    const encounterAim=screen==='scene'&&data.beat?.flowVersion===1?globalThis.ECHO_ENCOUNTER_FLOW?.describe(data.beat)?.purpose:'';
    setText('hybrid-evening-objective',encounterAim||data.objective||'Choose a party objective in Quests');const objectiveLabel=$('hybrid-evening-objective')?.parentElement.querySelector('small');if(objectiveLabel)objectiveLabel.textContent=encounterAim?'SCENE AIM':'OBJECTIVE';
    setText('hybrid-evening-next',summary?.next?.label||'Choose the next scene');
    setText('hybrid-session-name',data.session||'Current session');
    const tv=$('connection-status');const connected=tv?.classList.contains('connected'),stale=tv?.classList.contains('stale');
    const connection=$('hybrid-connection');connection.dataset.state=connected?'connected':stale?'stale':'closed';
    setText('hybrid-connection',connected?'TV connected':stale?'TV needs resync':'Open player TV');
    connection.setAttribute('aria-label',connected?'TV connected. Open TV controls.':stale?'TV needs resync. Resend the player view.':'Open the player TV.');
    const tvLabel=($('tv-now-badge')?.textContent||'').replace(/^Now showing:\s*/i,'').trim();
    const staged=tvLabel&&!/loading/i.test(tvLabel)?tvLabel.split(' · ').filter((part,i,parts)=>!i||part!==parts[i-1]).join(' · '):'Nothing staged';
    const displayLabel=connected?`Now showing · ${staged}`:stale?`TV stale · last staged: ${staged}`:`TV disconnected · last staged: ${staged}`;
    setText('hybrid-tv-now-top',tvLabel&&/loading/i.test(tvLabel)?'TV status loading…':displayLabel);
    const phoneWarning=$('phone-health-warning'),phoneBadge=$('hybrid-phone-warning');
    phoneBadge.hidden=!phoneWarning||phoneWarning.hidden;
    if(!phoneBadge.hidden){
      const count=phoneWarning.textContent.match(/^\d+ phones?/i)?.[0]||'Phone';
      setText('hybrid-phone-warning',`${count} needs review`);
      phoneBadge.setAttribute('aria-label',`${phoneWarning.textContent}. Open phone connections.`);
    }
    setText('hybrid-next-action',summary?.next?.label||data.beat?.title||'Choose a scene');
    setText('hybrid-top-inbox',summary?.urgent?.length?`Inbox · ${summary.urgent.length} urgent`:summary?.pending?`Inbox · ${summary.pending}`:'Inbox · clear');$('hybrid-top-inbox').classList.toggle('has-urgent',!!summary?.urgent?.length);
    $('hybrid-top-mute').setAttribute('aria-pressed',$('quick-mute')?.getAttribute('aria-pressed')||'false');
    renderScene(data);renderPilot(data);renderCombat();
  }
  function init(options) {
    if(initialized||!options?.host||!app())return false;
    api=options;initialized=true;app().classList.add('hybrid-ui');
    topbar();makeEveningBar();makePalette();makeHome(document.querySelector('.dm-layout'));makeScene(document.querySelector('.dm-layout'));
    makePilot(document.querySelector('.dm-layout'));makeMapDock();makeCombatRail(document.querySelector('.dm-layout'));
    sessionMapView=globalThis.ECHO_SESSION_MAP?.init({snapshot:()=>api.host.sessionMap(),reviewMarker:(...args)=>api.host.reviewMapMarker(...args),openNPC:id=>api.host.openMarkerNPC(id),improv:()=>globalThis.ECHO_TABLE_FLOW?.openDetour(),applyPreparation:()=>api.host.applySessionPreparation(),image:api.host.image,chooseBeat,go:changeScreen,refresh:update,preview:id=>{api.host.previewSessionMap(id);changeScreen('combat',{drawer:'scene'});},guide:()=>changeScreen('explore',{guide:true})},document.querySelector('.dm-layout'));
    button(pilotView.querySelector('.hybrid-pilot-timeline'),'← Session map',()=>{pilotGuide=false;changeScreen('explore');});
    const close=button(document.querySelector('.context-head'),'✕',closeDrawer,'hybrid-drawer-close');close.setAttribute('aria-label','Close details');
    const observed=['connection-status','tv-now-badge','phone-health-warning','dm-turn-summary','runbook-content','session-select','context-title','quick-mute'];
    for(const id of observed){const element=$(id);if(!element)continue;new MutationObserver(()=>{
      if(id==='context-title'){
        const tab=view().tab;
        if(tab!==lastSelectedTab){lastSelectedTab=tab;const embeddedGuide=['guide','scene'].includes(tab)&&['scene','explore'].includes(screen);if(['token','requests','tools','guide','scene','encounter','clue'].includes(tab)&&screen!=='home'&&!embeddedGuide)openDrawer();}
      }
      update();
    }).observe(element,{childList:true,subtree:true,characterData:true,attributes:id==='quick-mute'||id==='session-select'||id==='phone-health-warning'});}
    document.addEventListener('click',event=>{
      const id=event.target.closest('button')?.id;
      if(id==='session-flow-open'&&screen==='home')changeScreen('explore');
      if(id==='quick-inbox'&&screen==='home')changeScreen('explore');
    },true);
    changeScreen('home');return true;
  }
  function mode(value){if(!initialized)return;if(value==='run')changeScreen(screen);else closeDrawer();}
  function atlasReady(){if(initialized&&screen==='home')globalThis.ECHO_ATLAS_UI?.mountHome(atlasSlot);}
  globalThis.ECHO_HYBRID_UI={init,go:changeScreen,mode,atlasReady,refresh:update,current:()=>screen,openDrawer,closeDrawer};
})();
