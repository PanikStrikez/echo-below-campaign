(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const code = new URLSearchParams(location.search).get('code') || '';
  let joined = false, loading = false, offline = false, latest = null, lastRevision = -1, lastMapImage = '', lastRoll = '';
  let activeTab = 'table', lastSheetSignature = '', lastTurnKey = '', lastReply = '', initiativeManualDraft = '';
  const openSections = new Set(['Actions']);
  const el = (tag, label = '') => { const node = document.createElement(tag); node.textContent = label; return node; };
  const signed = value => value === null || value === undefined ? '—' : `${value >= 0 ? '+' : ''}${value}`;
  function selectTab(tab) {
    activeTab = ['table', 'explore', 'sheet', 'clues', 'loot'].includes(tab) ? tab : 'table';
    for (const name of ['table', 'explore', 'sheet', 'clues', 'loot']) {
      $(`${name}-panel`).hidden = activeTab !== name;
      const button = $(`tab-${name}`);
      button.classList.toggle('active', name === activeTab);
      button.setAttribute('aria-selected', String(name === activeTab));
    }
  }

  async function request(path, data) {
    const options = data === undefined ? { cache: 'no-store', credentials: 'same-origin' } :
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'same-origin' };
    let response;
    try { response = await fetch(path, options); }
    catch { throw new Error('Cannot reach the table. Check Wi-Fi and ask your DM to reopen phone access.'); }
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'The table could not complete that action.');
    return result;
  }

  async function showJoin(message = '') {
    joined = false; $('play').hidden = true; $('join').hidden = false;
    $('connection').textContent = 'Waiting to join'; $('join-error').textContent = message;
    const choices = $('character-choices'); choices.replaceChildren();
    if (!code) { $('join-error').textContent ||= 'Scan the current QR code on your DM’s screen.'; return; }
    try {
      const result = await request(`/api/join-options?code=${encodeURIComponent(code)}`);
      for (const character of result.characters) {
        const button = el('button', `${character.name}${character.claimed ? ' · already joined' : ''}`);
        button.type = 'button'; button.disabled = character.claimed;
        button.addEventListener('click', async () => {
          button.disabled = true;
          try {
            await request('/api/join', { code, id: character.id });
            if(latest?.character?.id && latest.character.id!==view.character?.id){localStorage.removeItem('echo-phone-sheet-v1');location.reload();return;}
      joined = true; $('join').hidden = true; $('play').hidden = false;
            history.replaceState(null, '', '/join');
            await refresh();
          } catch (error) { $('join-error').textContent = error.message; button.disabled = false; }
        });
        choices.append(button);
      }
      if (!result.characters.length) $('join-error').textContent = 'Your DM is preparing the characters. Leave this page open.';
    } catch (error) { $('join-error').textContent = error.message; }
  }

  async function action(data, target) {
    if(offline){target.textContent='Reconnect before sending rolls or requests.';return false;}
    try {
      await request('/api/action', {...data,expectedCharacterId:latest?.character?.id});
      target.textContent = data.kind === 'explore' || ['action-request','action-revise','action-cancel'].includes(data.kind) ? 'Request sent to your DM.' :
        ['search-request','search-cancel','travel-request','travel-cancel','personal-note','share-clue','item-request','item-cancel'].includes(data.kind) ? 'Sent to the DM screen. Waiting for confirmation.' : ['save-response','reaction-response'].includes(data.kind) ? 'Response sent to the DM.' : data.kind === 'save-clue' ? 'Saved to your journal.' : data.kind === 'move' ? 'Movement sent to the table.' : 'Rolling on the DM screen…';
      return true;
    } catch (error) { target.textContent = error.message; return false; }
  }

  let combatPromptSignature='',combatInputs={},phoneDragging=false;
  function renderCombatPrompts(view){
    const prompts=view.combatPrompts||{},signature=JSON.stringify([prompts,view.rehearsal]);if(signature===combatPromptSignature)return;combatPromptSignature=signature;
    const root=$('combat-prompts');root.replaceChildren();root.hidden=!(prompts.saves?.length||prompts.reactions?.length);if(root.hidden)return;
    root.append(el('h2','Combat requests'));
    for(const b of prompts.saves||[]){const box=el('article');box.className='clue-card';box.append(el('h3',`${b.label} · ${String(b.ability).toUpperCase()} save`),el('p',`${b.status}${b.total!==null?' · total '+b.total:''} · ${b.mode} · modifier ${signed(b.bonus)}`));
      if(b.status==='waiting'){const roll=el('button','Roll saving throw'),total=el('input'),enter=el('button','Send physical-dice total'),message=el('p');total.type='number';total.placeholder='Final total including modifiers';total.setAttribute('aria-label','Saving throw total');total.value=combatInputs[b.id]||'';total.addEventListener('input',()=>combatInputs[b.id]=total.value);
       roll.disabled=view.rehearsal||!Number.isFinite(b.bonus);enter.disabled=view.rehearsal;
       roll.addEventListener('click',async()=>{roll.disabled=true;const ok=await action({kind:'save-response',batchId:b.id,expectedRevision:b.revision,method:'digital'},message);if(!ok)roll.disabled=false;});
       enter.addEventListener('click',async()=>{if(total.value===''){message.textContent='Enter your final total first.';return;}enter.disabled=true;const ok=await action({kind:'save-response',batchId:b.id,expectedRevision:b.revision,method:'physical',total:Number(total.value)},message);if(!ok)enter.disabled=false;});box.append(roll,total,enter,message);}
      root.append(box);
    }
    for(const p of prompts.reactions||[]){const box=el('article');box.className='clue-card';box.append(el('h3',`Reaction window · ${p.label}`),el('p',p.status==='waiting'?'Combat is paused. Pass or describe your reaction for DM review.':`${p.status} · ${p.note||''}`));
     if(p.status==='waiting'){const note=el('input'),ask=el('button','Request reaction'),pass=el('button','Pass'),message=el('p');note.placeholder='Shield, opportunity attack, or another reaction';note.maxLength=600;note.value=combatInputs[p.id]||'';note.addEventListener('input',()=>combatInputs[p.id]=note.value);ask.disabled=pass.disabled=view.rehearsal;
      const reply=async(response)=>{if(response==='request'&&!note.value.trim()){message.textContent='Describe the reaction first.';return;}ask.disabled=pass.disabled=true;if(!await action({kind:'reaction-response',pauseId:p.id,response,note:note.value},message))ask.disabled=pass.disabled=false;};ask.addEventListener('click',()=>reply('request'));pass.addEventListener('click',()=>reply('pass'));box.append(note,ask,pass,message);}
     root.append(box);
    }
  }
  function renderCharacter(view) {
    const card = view.character || {}, turn = view.turn || {};
    $('character-name').textContent = card.name || 'Your character';
    $('character-detail').textContent = [card.ancestry, card.className, card.level ? `Level ${card.level}` : ''].filter(Boolean).join(' · ');
    $('turn-pill').hidden = turn.activeId !== card.id;
    const turnKey = `${view.session}:${turn.round}:${turn.activeId}`;
    if (turn.activeId === card.id && lastTurnKey !== turnKey && !view.rehearsal) {
      if (navigator.vibrate) navigator.vibrate(120);
      document.title = `Your turn · ${card.name}`;
    } else if (turn.activeId !== card.id) document.title = 'The Echo Below · Player';
    lastTurnKey = turnKey;
    const reply = $('phone-action-status'); reply.hidden = !view.requests;
    reply.textContent = view.requests || '';
    if (view.requests && view.requests !== lastReply && /approved|resolved|declined|clarification|cancelled|undone/i.test(view.requests) && navigator.vibrate) navigator.vibrate(80);
    lastReply = view.requests || '';
    const vitals = $('vitals'); vitals.replaceChildren();
    for (const [value, label] of [[`${card.hp ?? '?'} / ${card.maxHp ?? '?'}`, 'HP'],
      [card.ac ?? '?', 'AC'], [card.tempHp ?? 0, 'Temp HP']]) {
      const item = el('div'); item.append(el('strong', String(value)), el('span', label)); vitals.append(item);
    }
    const conditions = (card.conditions || []).join(', ');
    const resources = (card.resources || []).map(item => `${item.name} ${item.current ?? '—'}/${item.max ?? '—'}`).join(' · ');
    const mood = view.sceneMood || {};
    const scene = [mood.phase, mood.weather].filter(Boolean).join(' · ');
    $('status').textContent = [view.rehearsal ? 'PRACTICE · no session changes' : '', scene, conditions, card.concentration ? `Concentrating: ${card.concentration}` : '',
      card.exhaustion ? `Exhaustion ${card.exhaustion}` : '', resources, card.publicNotes].filter(Boolean).join(' · ') || 'Ready for adventure.';
    renderPriority(view);
  }

  function renderPriority(view) {
    const priority = $('phone-priority');
    const onTurn = !!view.turn?.activeId && view.turn.activeId === view.character?.id;
    const initiative = view.initiative?.open === true;
    const reply = String(view.requests || '');
    const decision = /approved|resolved|declined|clarification|cancelled|undone/i.test(reply);
    const combat = !!view.turn?.activeId || initiative;
    $('tab-table').textContent = combat ? 'My turn' : 'Home';
    $('tab-table').classList.toggle('combat-priority', combat);
    priority.dataset.target = 'table';
    if((view.combatPrompts?.saves||[]).some(b=>b.status==='waiting')||(view.combatPrompts?.reactions||[]).some(p=>p.status==='waiting')){priority.textContent='Saving throw or reaction waiting · Tap to respond';priority.dataset.kind='combat';}
    else if (initiative && (view.initiative.total === null || view.initiative.total === undefined)) {
      priority.textContent = 'Roll initiative now · Tap to open'; priority.dataset.kind = 'initiative';
    } else if (onTurn) {
      priority.textContent = decision ? `YOUR TURN · ${reply} · Tap for actions` : 'YOUR TURN · Tap for actions and rolls';
      priority.dataset.kind = 'turn';
    } else if (decision) {
      priority.textContent = `${reply} · Tap to view the table`; priority.dataset.kind = 'decision';
    } else if (initiative) {
      priority.textContent = `Initiative ${view.initiative.total ?? 'pending'} · Tap to view`; priority.dataset.kind = 'initiative';
    } else if (view.dungeon?.enabled && view.isMap) {
      priority.textContent = 'Explore this area · Open the map and search tools'; priority.dataset.kind = 'explore';
    } else if (view.journey?.destination) {
      priority.textContent = `Explore the route to ${view.journey.destination}`; priority.dataset.kind = 'explore'; priority.dataset.target = 'explore';
    } else { priority.hidden = true; priority.dataset.kind = ''; return; }
    priority.hidden = false;
  }

  function renderInitiative(view) {
    const root = $('initiative-phone-panel'); root.replaceChildren();
    const status = view.initiative || {};
    root.hidden = !status.open;
    if (root.hidden) return;
    root.append(el('h2', 'Roll for initiative'));
    root.append(el('p', status.total === null || status.total === undefined ?
      'Combat is starting. Roll here or enter the total from your physical dice.' : `Your initiative is ${status.total}. You can change it while your DM keeps rolls open.`));
    if (Number.isInteger(status.bonus)) root.append(el('p', `Your initiative modifier: ${signed(status.bonus)}`));
    const row = el('div'); row.className = 'initiative-phone-actions';
    const roll = el('button', `Roll d20 ${signed(status.bonus)}`); roll.type = 'button'; roll.disabled = view.rehearsal || !Number.isInteger(status.bonus);
    const result = el('p'); result.className = 'roll-result';
    roll.addEventListener('click', () => action({kind:'initiative', mode:'roll'}, result));
    const total = el('input'); total.type = 'number'; total.min = '-99'; total.max = '999'; total.placeholder = 'Physical-die total'; total.value = initiativeManualDraft;
    total.setAttribute('aria-label', 'Total initiative rolled with physical dice'); total.addEventListener('input', () => { initiativeManualDraft = total.value; });
    const send = el('button', 'Enter total'); send.type = 'button'; send.disabled = view.rehearsal;
    send.addEventListener('click', async () => { if (total.value === '') { result.textContent = 'Enter your total first.'; return; }
      if (await action({kind:'initiative', mode:'manual', total:Number(total.value)}, result)) initiativeManualDraft = ''; });
    row.append(roll, total, send); root.append(row, result);
  }

  function renderTurnGuide(view) {
    const root = $('turn-guide'); root.replaceChildren();
    const card = view.character || {};
    root.hidden = false;
    if (root.hidden) return;
    if(view.actionProtocol!==1)root.append(el('p','Ask your DM to refresh the campaign app to enable action reviews.'));
    root.append(el('h2', view.rehearsal ? 'Practice turn' : view.turn?.activeId===card.id ? 'Your turn' : 'Request an action'));
    root.append(el('p', view.rehearsal ? 'This is a sample turn. The buttons are paused until your DM ends rehearsal.' :
      'Choose an action and its targets. Your DM reviews the rolls, costs, and effects together. Quick rolls do not spend resources.'));
    if (view.requests) root.append(el('p', view.requests));
    const groups = [['attack', card.attacks || []], ['action', card.actions || []], ['spell', card.spells || []], ['resource', card.resources || []]];
    const favorites=new Set(card.favorites||[]);
    if(favorites.size){const pinned=el('section');pinned.append(el('h3','Favorites'));for(const [type,entries]of groups)entries.forEach((item,index)=>{if(item.prepared===false||!favorites.has(`${type}:${item.id||item.name}`))return;const b=el('button',item.name);b.type='button';b.disabled=view.rehearsal||view.actionProtocol!==1;b.addEventListener('click',()=>openActionRequest(type,index));pinned.append(b);});root.append(pinned);}
    for (const [type, entries] of groups) {
      const group = type === 'spell' && entries.length ? el('details') : root;
      if (group !== root) { group.className = 'turn-spell-list'; group.append(el('summary', `All spells (${entries.length})`)); root.append(group); }
      entries.forEach((item, index) => {
      if (!item || type === 'spell' && item.prepared === false) return;
      const row = el('div'); row.className = 'turn-action';
      const info = el('div'); info.append(el('strong', item.name || type));
      const detail = [item.attackBonus !== null && item.attackBonus !== undefined ? `${signed(item.attackBonus)} to hit` : '',
        item.damageDice || '', item.level !== undefined ? item.level === 0 ? 'Cantrip' : `Level ${item.level}` : '',
        type === 'spell' && item.prepared === null ? 'Preparation unconfirmed · ask your DM' : '',
        type === 'resource' ? `${item.current ?? '—'} / ${item.max ?? '—'} left` : ''].filter(Boolean).join(' · ');
      if (detail) info.append(el('small', detail));
      row.append(info);
      const buttons = el('div'); buttons.className = 'sheet-action-buttons';
      if (Number.isFinite(item.attackBonus)) {
        const roll = el('button', 'Quick roll only'); roll.type = 'button';
        roll.addEventListener('click', () => action({kind:'roll', count:1, sides:20, modifier:item.attackBonus, mode:'normal', label:`${item.name} attack`}, $('turn-message')));
        roll.disabled = view.rehearsal; buttons.append(roll);
      }
      const ask = el('button', type === 'spell' ? 'Ask to cast' : type === 'resource' ? 'Ask to use' : 'Request action'); ask.type = 'button';
      ask.addEventListener('click', () => openActionRequest(type,index));
      ask.disabled = view.rehearsal || view.actionProtocol!==1; buttons.append(ask); row.append(buttons); group.append(row);
      });
    }
    const message = el('p'); message.id = 'turn-message'; message.className = 'roll-result'; root.append(message);
  }

  let actionDraft=null,requestSignature='';
  const actionFields={attack:'attacks',action:'actions',spell:'spells',resource:'resources'};
  function openActionRequest(type,index,existing=null){
    actionDraft={requestId:existing?.id||`pa-${Date.now()}-${Math.random().toString(36).slice(2,12)}`,actionType:type,actionIndex:index,expectedRevision:existing?.revision,
      actionName:existing?.label||latest.character[actionFields[type]]?.[index]?.name||'',targetIds:[...(existing?.targetIds||[])],note:existing?.note||'',mode:existing?.mode||'normal',editing:!!existing,casting:existing?.casting?{...existing.casting}:null};
    selectTab('table');renderActionComposer();renderMap(latest);$('action-composer').scrollIntoView({block:'start',behavior:'smooth'});
  }
  function renderActionComposer(){
    const root=$('action-composer');root.replaceChildren();root.hidden=!actionDraft;if(!actionDraft)return;
    const draft=actionDraft,card=latest.character;
    root.append(el('h2',draft.editing?'Revise request':'Request an action'));
    const label=el('label','Action'),select=el('select');
    for(const [type,field]of Object.entries(actionFields))for(const [index,item]of (card[field]||[]).entries()){
      if(item.prepared===false)continue;const o=el('option',`${item.name} (${type})`);o.value=`${type}:${index}`;select.append(o);
    }
    select.value=`${draft.actionType}:${draft.actionIndex}`;select.addEventListener('change',()=>{const [t,i]=select.value.split(':');draft.actionType=t;draft.actionIndex=Number(i);draft.actionName=latest.character[actionFields[t]]?.[Number(i)]?.name||'';draft.casting=null;renderActionComposer();});label.append(select);root.append(label);
    if(draft.actionType==='spell'){
      const spell=card.spells[draft.actionIndex];
      if(spell&&spell.level>0){
        const l=el('label','Cast using'),slot=el('select');
        for(const [value,title]of [['','Ask DM to choose slot'],...(card.resources||[]).filter(r=>r.slotLevel>=spell.level).map(r=>[r.id,`${r.name} · ${r.current}/${r.max}`]),['ritual','Request ritual / free casting']]){const o=el('option',title);o.value=value;slot.append(o);}
        slot.value=draft.casting?.mode==='ritual'?'ritual':draft.casting?.resourceId||'';
        slot.addEventListener('change',()=>{draft.casting=slot.value?{mode:slot.value==='ritual'?'ritual':'slot',resourceId:slot.value==='ritual'?'':slot.value,concentration:'auto',effect:'',notation:''}:null;});l.append(slot);root.append(l);
        root.append(el('p','For an upcast, describe the extra targets, dice, or duration below. Rituals and free casting need a reason for DM review.'));
      }
    }
    root.append(el('p','Choose everyone this action should affect. For a place, object, or effect without a token, describe it below. Your DM reviews range, costs, and the effect.'));
    const targets=new Map([[card.id,{id:card.id,name:`${card.name} (you)`}],...(latest.tokens||[]).map(t=>[t.id,t])]);
    for(const t of targets.values()){
      const l=el('label'),c=el('input');c.type='checkbox';c.checked=draft.targetIds.includes(t.id);
      c.addEventListener('change',()=>{draft.targetIds=draft.targetIds.filter(id=>id!==t.id);if(c.checked)draft.targetIds.push(t.id);});l.append(c,el('span',t.name||t.label));root.append(l);
    }
    const modeLabel=el('label','Requested d20 mode'),mode=el('select');for(const name of ['normal','advantage','disadvantage']){const o=el('option',name);o.value=name;mode.append(o);}mode.value=draft.mode;mode.addEventListener('change',()=>draft.mode=mode.value);modeLabel.append(mode);root.append(modeLabel);
    const noteLabel=el('label','Intent / target details'),note=el('textarea');note.rows=3;note.maxLength=600;note.value=draft.note;note.placeholder='Which spell level? Where does the area go? How are multiple attacks allocated?';note.addEventListener('input',()=>draft.note=note.value);noteLabel.append(note);root.append(noteLabel);
    const result=el('p');result.setAttribute('role','status');const send=el('button',draft.editing?'Send revision':'Send for DM review');send.type='button';send.disabled=latest.rehearsal===true||latest.actionProtocol!==1;
    send.addEventListener('click',async()=>{
      if(!draft.targetIds.length&&!draft.note.trim()){result.textContent='Choose a target or describe the intended effect.';return;}
      const item=latest.character[actionFields[draft.actionType]]?.[draft.actionIndex];if(!item||item.name!==draft.actionName){result.textContent='Your sheet changed. Choose the action again.';return;}
      send.disabled=true;
      const ok=await action({kind:draft.editing?'action-revise':'action-request',requestId:draft.requestId,expectedRevision:draft.expectedRevision,actionType:draft.actionType,actionIndex:draft.actionIndex,actionName:item.name,targetIds:draft.targetIds,note:draft.note,mode:draft.mode,casting:draft.casting?{...draft.casting,effect:draft.note}:null},result);
      if(ok){actionDraft=null;root.replaceChildren(el('p','Sent. Waiting for your DM screen to receive it.'));const close=el('button','Close');close.addEventListener('click',()=>{root.hidden=true;});root.append(close);}else send.disabled=false;
    });
    const close=el('button','Close draft');close.type='button';close.addEventListener('click',()=>{actionDraft=null;renderActionComposer();});root.append(send,close,result);
  }
  function renderActionRequests(view){
    const rows=view.actionRequests||[],signature=JSON.stringify([rows,view.rehearsal]);if(signature===requestSignature)return;requestSignature=signature;
    const root=$('action-requests');root.replaceChildren();root.hidden=!rows.length;if(!rows.length)return;root.append(el('h2','Your requests'));
    for(const r of rows.slice().reverse()){
      const box=el('article');box.className='clue-card';box.append(el('h3',`${r.label} · ${r.status}`),el('p',r.message||''),el('small',`Targets: ${(r.targetNames||[]).join(', ')||'See request note'}`));
      if(r.note)box.append(el('p',r.note));for(const roll of r.rolls||[])box.append(el('p',`${roll.label}: ${roll.notation} [${(roll.parts||[]).join(', ')}] = ${roll.total}`));
      if(['waiting','needs clarification'].includes(r.status)){
        const revise=el('button','Revise'),cancel=el('button','Cancel request'),message=el('p');revise.disabled=cancel.disabled=view.rehearsal===true;
        revise.addEventListener('click',()=>openActionRequest(r.actionType,r.actionIndex,r));
        cancel.addEventListener('click',async()=>{cancel.disabled=true;const ok=await action({kind:'action-cancel',requestId:r.id,expectedRevision:r.revision},message);if(!ok)cancel.disabled=false;else if(actionDraft?.requestId===r.id){actionDraft=null;renderActionComposer();}});
        box.append(revise,cancel,message);
      }
      root.append(box);
    }
  }

  function renderClues(view) {
    const root = $('clues-list'); root.replaceChildren();
    const quests=(view.quests||[]).length?sheetSection(root,'Party side quests'):root;
    for(const quest of view.quests || []) {
      const card=el('article');card.className='clue-card';card.append(el('h3',`${quest.title} · ${quest.state}`),el('p',quest.goal));quests.append(card);
    }
    const history=(view.campaignJournal||[]).length?sheetSection(root,'Campaign journal'):root;
    for(const entry of (view.campaignJournal || []).slice().reverse()) {
      const card=el('article');card.className='clue-card';card.append(el('h3',entry.title),el('p',entry.text),el('small',`${entry.when} · ${entry.kind}`));history.append(card);
    }
    const clues = view.privateClues || [];
    if (!clues.length) { root.append(el('p', 'No private clues have been sent to you.')); return; }
    const personal=clues.some(c=>c.id?.startsWith('quest-guide-'))?sheetSection(root,'Your character quests'):root;
    for (const clue of clues.slice().reverse()) {
      const card = el('article'); card.className = 'clue-card';
      card.append(el('h3', clue.title || 'Clue'), el('p', clue.text || ''));
      if (clue.image) { const img = el('img'); img.src = clue.image; img.alt = clue.title || 'Private clue'; img.loading = 'lazy'; card.append(img); }
      const questGuide = clue.id?.startsWith('quest-guide-'), outcome=clue.id?.startsWith('outcome-');
      const note = el('small', outcome ? 'Private campaign record · updated by your DM' : questGuide ? 'Private quest · your DM updates this objective' : clue.saved ? 'Saved in your journal' : 'Private to your character'); card.append(note);
      if (!clue.saved && !questGuide && !outcome) {
        const button = el('button', 'Save to my journal'); button.type = 'button';
        button.disabled = view.rehearsal === true;
        button.addEventListener('click', async () => { if (await action({kind:'save-clue', clueId:clue.id}, note)) button.disabled = true; });
        card.append(button);
      }
      if (!questGuide && !outcome) globalThis.ECHO_PHONE_PLAYER_TOOLS?.clueButtons(card,clue);
      (questGuide?personal:root).append(card);
    }
  }

  function renderLoot(view) {
    const root = $('loot-list'); root.replaceChildren();
    for(const entry of view.campaignTracks || []) {
      const row=el('div');row.className='loot-row';row.append(el('strong',`${entry.subject} · ${entry.state}`),el('small',[entry.kind,entry.holder,entry.owedTo&&`Owed to ${entry.owedTo}`,entry.note].filter(Boolean).join(' · ')));root.append(row);
    }
    const items = view.inventory || [];
    if (!items.length) { root.append(el('p', 'No separate item quantities are recorded in the party inventory.')); return; }
    for (const item of items) {
      const row = el('div'); row.className = 'loot-row';
      row.append(el('strong', `${item.name}${item.quantity === null ? '' : ` ×${item.quantity}`}`));
      row.append(el('small', `${item.holder === 'party' ? 'Carried by the party' : `Held by ${item.holderName || item.holder}`}${item.note ? ` · ${item.note}` : ''}`));
      root.append(row);
    }
  }

  function sheetSection(parent, title, expanded = false) {
    const box = el('details'); box.className = 'card sheet-section';
    box.open = openSections.has(title) || (expanded && !openSections.size);
    const head = el('summary', title); box.append(head);
    box.addEventListener('toggle', () => { if (box.open) openSections.add(title); else openSections.delete(title); });
    parent.append(box);
    return box;
  }

  function sheetLine(parent, main, secondary = '', badge = '') {
    const row = el('div'); row.className = 'sheet-line';
    const text = el('div'); text.append(el('strong', main));
    if (secondary) text.append(el('small', secondary));
    row.append(text);
    if (badge) row.append(el('span', badge));
    parent.append(row);
    return row;
  }

  function rollFromSheet(item, damage = false) {
    const text = item.damageDice || '';
    const match = /^(\d{1,2})d(4|6|8|10|12|20)([+-]\d{1,2})?$/.exec(text);
    const target = $('sheet-roll-result');
    if (damage && !match) { target.textContent = 'This effect needs a ruling or a custom roll.'; return; }
    const requestData = damage ? { kind: 'roll', count: Number(match[1]), sides: Number(match[2]),
      modifier: Number(match[3] || 0), mode: 'normal', label: `${item.name} damage` }
      : { kind: 'roll', count: 1, sides: 20, modifier: Number(item.attackBonus), mode: 'normal',
        label: `${item.name} attack` };
    action(requestData, target);
  }

  function renderSheet(card) {
    $('sheet-title').textContent = card.name || 'Your sheet';
    $('sheet-level').textContent = card.level ? `Level ${card.level}` : 'Level ?';
    $('sheet-summary').textContent = [card.ancestry, card.className, card.background,
      card.rules].filter(Boolean).join(' · ');
    const abilityGrid = $('sheet-abilities'); abilityGrid.replaceChildren();
    for (const name of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
      const entry = card.abilities?.[name] || {};
      const cell = el('div'); cell.className = 'ability-cell';
      cell.append(el('small', name.toUpperCase()), el('strong', signed(entry.modifier)),
        el('span', entry.score ?? '—'));
      abilityGrid.append(cell);
    }
    const passives = $('sheet-passives'); passives.replaceChildren();
    for (const name of ['Perception', 'Insight', 'Investigation'])
      passives.append(el('span', `Passive ${name} ${card.passives?.[name] ?? '—'}`));
    const root = $('sheet-sections'); root.replaceChildren();
    const actions = sheetSection(root, 'Actions', true);
    const rollHint = el('p', 'Roll buttons send dice to the table. Your DM applies effects and tracks spent resources.');
    rollHint.className = 'sheet-hint'; actions.append(rollHint);
    const actionList = [...(card.attacks || []), ...(card.actions || [])];
    if (!actionList.length) actions.append(el('p', 'No actions entered on the DM sheet yet.'));
    for (const item of actionList) {
      const stats = [item.type, item.attackBonus !== null && item.attackBonus !== undefined ? `${signed(item.attackBonus)} to hit` : '',
        item.damageDice ? `${item.damageDice} ${item.damageType || ''}`.trim() : '',
        item.saveDC ? `DC ${item.saveDC} ${item.saveAbility || ''}`.trim() : '',
        item.prepared === false ? 'Not prepared' : ''].filter(Boolean).join(' · ');
      const row = sheetLine(actions, item.name || 'Action', stats);
      if (item.effect) row.firstChild.append(el('p', item.effect));
      const buttons = el('div'); buttons.className = 'sheet-action-buttons';
      if (item.prepared !== false && Number.isFinite(item.attackBonus)) {
        const button = el('button', 'Quick roll only'); button.type = 'button';
        button.addEventListener('click', () => rollFromSheet(item)); buttons.append(button);
      }
      if (item.prepared !== false && /^\d{1,2}d(?:4|6|8|10|12|20)(?:[+-]\d{1,2})?$/.test(item.damageDice || '')) {
        const button = el('button', 'Roll damage'); button.type = 'button';
        button.addEventListener('click', () => rollFromSheet(item, true)); buttons.append(button);
      }
      if (buttons.childElementCount) row.firstChild.append(buttons);
    }
    const saves = sheetSection(root, 'Saves and skills');
    const saveGrid = el('div'); saveGrid.className = 'bonus-grid'; saves.append(saveGrid);
    for (const item of card.saves || []) sheetLine(saveGrid, item.name, item.rank ? 'Proficient' : '', signed(item.bonus));
    for (const item of card.skills || []) sheetLine(saveGrid, item.name,
      item.rank === 2 ? 'Expertise' : item.rank ? 'Proficient' : '', signed(item.bonus));
    const resources = sheetSection(root, 'Resources and status');
    sheetLine(resources, 'Hit dice', `${card.hitDice?.current ?? '—'} / ${card.hitDice?.max ?? '—'}`,
      card.hitDice?.details || `d${card.hitDice?.die ?? '?'}`);
    sheetLine(resources, 'Inspiration', card.inspiration ? 'Available' : 'None');
    for (const item of card.resources || []) sheetLine(resources, item.name,
      `${item.current ?? '—'} / ${item.max ?? '—'}${item.unit ? ` ${item.unit}` : ''}`);
    if (card.death) sheetLine(resources, 'Death saves',
      `${card.death.successes || 0} successes · ${card.death.failures || 0} failures${card.death.stable ? ' · stable' : ''}`);
    for (const item of card.effects || []) sheetLine(resources, item.name,
      [item.remaining, item.timing, item.note].filter(Boolean).join(' · '));
    if (card.conditions?.length) sheetLine(resources, 'Conditions', card.conditions.join(', '));
    if (card.concentration) sheetLine(resources, 'Concentration', card.concentration);
    if (card.exhaustion) sheetLine(resources, 'Exhaustion', String(card.exhaustion));
    const gear = sheetSection(root, 'Equipment and money');
    for (const item of card.equipment || []) sheetLine(gear, item.name,
      [item.category, item.notes, item.attuned ? 'Attuned' : '', item.equipped ? 'Equipped' : ''].filter(Boolean).join(' · '),
      item.quantity > 1 ? `×${item.quantity}` : '');
    const coin = card.money || {};
    sheetLine(gear, 'Coins', ['pp', 'gp', 'ep', 'sp', 'cp'].map(key => `${coin[key] || 0} ${key}`).join(' · '));
    const story = sheetSection(root, 'Features and character info');
    for (const item of card.features || []) sheetLine(story, item.name,
      [item.text, item.source].filter(Boolean).join(' · '));
    for (const [label, value] of [['Speed', card.speed ? `${card.speed} ft.` : ''], ['Senses', card.senses],
      ['Languages', card.languages], ['Background', card.background], ['Proficiency bonus', signed(card.proficiency)],
      ['About', card.publicNotes]]) if (value) sheetLine(story, label, String(value));
  }

  function mapPoint(event, stage) {
    const bounds = stage.getBoundingClientRect();
    return { x: Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)),
      y: Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100)) };
  }

  function renderMap(view) {
    if(phoneDragging)return;
    const stage = $('phone-map'); stage.onclick = null; stage.hidden = !view.isMap;
    $('scene-title').textContent = view.sceneTitle || 'Current scene';
    $('round').textContent = view.turn?.round ? `Round ${view.turn.round}` : '';
    $('map-hint').textContent = view.rehearsal ? 'Practice display is active. Map requests are paused.' : !view.isMap ? 'Your DM is showing a scene image. The map will return here.' :
      !view.playerInput ? 'The DM is guiding this scene.' : view.fogged ?
        'Drag your token to request a move. Tap a shaded square to ask your DM to reveal it.' : 'Drag your token to request a move. Tap a glowing star to explore.';
    if (!view.isMap) return;
    if (lastMapImage !== view.mapImage) {
      $('map-image').src = view.mapImage;
      lastMapImage = view.mapImage;
    }
    const fog = $('map-fog'); fog.replaceChildren();
    if (view.fogged) {
      const rows = view.fineFog ? 20 : 10, cols = view.fineFog ? 32 : 16, revealed = new Set(view.fog || []);
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
        const key = `${row},${col}`;
        if (revealed.has(key)) continue;
        const tile = el('button'); tile.type = 'button'; tile.className = 'fog-cell';
        tile.style.left = `${col * 100 / cols}%`; tile.style.top = `${row * 100 / rows}%`;
        tile.style.width = `${100 / cols}%`; tile.style.height = `${100 / rows}%`;
        tile.setAttribute('aria-label', 'Ask DM to explore this area');
        tile.disabled = !view.playerInput || view.rehearsal;
        tile.addEventListener('click', () => action({ kind: 'explore', key }, $('map-message')));
        fog.append(tile);
      }
    }
    const points = $('map-points'); points.replaceChildren();
    for (const point of view.points || []) {
      const marker = el('button', '✦'); marker.type = 'button'; marker.className = 'point';
      marker.title = point.title; marker.setAttribute('aria-label', `Ask DM to explore ${point.title}`);
      marker.style.left = `${point.x}%`; marker.style.top = `${point.y}%`;
      marker.disabled = !view.playerInput || view.rehearsal;
      marker.addEventListener('click', () => action({ kind: 'explore', pointId: point.id }, $('map-message')));
      points.append(marker);
    }
    const tokens = $('map-tokens'); tokens.replaceChildren();
    for (const token of view.tokens || []) {
      const marker = el('button', token.label || token.name?.slice(0, 1) || '•');
      marker.type = 'button'; marker.className = `phone-token ${token.id === view.character.id ? 'own' : token.team === 'enemy' ? 'enemy' : ''} ${token.id === view.turn?.activeId ? 'active' : ''}`;
      marker.title = token.name; marker.setAttribute('aria-label', token.name);
      marker.style.left = `${token.x}%`; marker.style.top = `${token.y}%`;
      if(actionDraft){marker.classList.toggle('targeted',actionDraft.targetIds.includes(token.id));marker.addEventListener('click',()=>{actionDraft.targetIds=actionDraft.targetIds.includes(token.id)?actionDraft.targetIds.filter(id=>id!==token.id):[...actionDraft.targetIds,token.id];renderActionComposer();renderMap(latest);});}
      if (token.id === view.character.id && view.playerInput && !view.rehearsal) {
        marker.addEventListener('pointerdown', event => {
          if (event.button !== 0 || actionDraft) return;
          phoneDragging=true;
          event.preventDefault(); marker.setPointerCapture(event.pointerId);
          let moved = false;
          const move = next => { moved = true; const p = mapPoint(next, stage); marker.style.left = `${p.x}%`; marker.style.top = `${p.y}%`; };
          const finish = next => {
            marker.removeEventListener('pointermove', move); marker.removeEventListener('pointerup', finish);
            marker.removeEventListener('pointercancel', finish);
            phoneDragging=false;
            if(moved&&next.type!=='pointercancel'){
              const destination=mapPoint(next,stage);renderMap(latest);
              void action({kind:'move',...destination},$('map-message'));
            }
            else renderMap(latest);
          };
          marker.addEventListener('pointermove', move); marker.addEventListener('pointerup', finish);
          marker.addEventListener('pointercancel', finish);
        });
      } else marker.disabled = !actionDraft || view.rehearsal;
      tokens.append(marker);
    }
  }

  let tourOwner='',tourStep=0,tourOpen=false;
  const tourSteps=[['Confirm your character','Check the name and HP on your character card. If this is not your character, use Saved sheet & joining to rejoin.','sheet'],['Find your actions','My sheet contains attacks, spells and resources. Choose an action and its targets to send the DM a request.','sheet'],['Roll dice','Table has digital dice. Initiative also accepts a physical-dice total when the DM requests it. Rolls are sent when you press a roll button.','table'],['Request movement','Drag your own token to the destination on the table map. The DM places it after approving your request.','table'],['Read private clues','Journal & clues contains information sent to you. Use Share with party deliberately; private clues are yours until shared.','clues']];
  function tourKey(){return 'echo-phone-tour-v1:'+tourOwner;}
  function renderTour(view){if(!view.character?.id||offline)return;let panel=$('phone-walkthrough');if(!panel){panel=el('section');panel.id='phone-walkthrough';panel.className='card phone-walkthrough';$('play').prepend(panel);const help=el('button','Phone walkthrough');help.type='button';help.onclick=()=>{tourStep=0;tourOpen=true;renderTour(latest);};document.querySelector('.phone-tabs').after(help);}
    if(tourOwner!==view.character.id){tourOwner=view.character.id;tourStep=0;try{tourOpen=localStorage.getItem(tourKey())!=='done';}catch{tourOpen=true;}}
    panel.hidden=!tourOpen;if(!tourOpen)return;panel.replaceChildren();const [title,message,tab]=tourSteps[tourStep];panel.append(el('small',`PHONE WALKTHROUGH · ${tourStep+1} / ${tourSteps.length}`),el('h3',title),el('p',message));
    const add=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;panel.append(b);};add('Show me where',()=>{selectTab(tab);const target=tourStep===2?document.querySelector('.dice-card'):tourStep===3?$('phone-map'):$(tab+'-panel');target?.scrollIntoView({block:'start',behavior:'smooth'});});if(tourStep)add('Back',()=>{tourStep--;renderTour(latest);});add(tourStep===4?'Finish':'Next',()=>{if(tourStep===4){tourOpen=false;try{localStorage.setItem(tourKey(),'done');}catch{}}else tourStep++;renderTour(latest);});add('Skip for now',()=>{tourOpen=false;renderTour(latest);});
  }
  let atlasSignature = '';
  function renderAtlas(view) {
    const container = $('phone-atlas'), title = $('phone-atlas-title'), status = $('phone-atlas-status');
    if (!container || !title || !status) return;
    const renderer = globalThis.ECHO_ATLAS_VIEW;
    const atlas = renderer?.normalize(view.atlas);
    const signature = JSON.stringify([atlas, view.atlasImage || '', offline]);
    if (signature === atlasSignature) return;
    atlasSignature = signature;
    title.textContent = atlas?.board.title || 'Campaign atlas';
    container.hidden = !atlas;
    if (!atlas) {
      container.replaceChildren();
      status.textContent = 'Your DM has not shared an atlas view yet. Journey requests remain available below.';
      return;
    }
    status.textContent = offline ? 'Last shared atlas · reconnect for current discoveries.' : 'Shared by your DM · known places and rumors only.';
    const endpoint = typeof view.atlasImage === 'string' && /^\/api\/atlas-map(?:\?v=[a-f0-9]{1,64})?$/.test(view.atlasImage) ? view.atlasImage : '/api/atlas-map';
    renderer.render(container, atlas, {image: endpoint});
  }
  function render(view) {
    latest = view;
    renderTour(view);
    $('connection').textContent = `${view.session || 'Campaign session'} · Connected`;
    for (const button of document.querySelectorAll('[data-quick-roll], #roll-custom')) button.disabled = view.rehearsal === true;
    globalThis.ECHO_PHONE_PLAYER_TOOLS?.render(view);
    globalThis.ECHO_PHONE_TRAVEL?.render(view);
    renderAtlas(view);
    renderCharacter(view); renderCombatPrompts(view); renderInitiative(view); renderMap(view); renderTurnGuide(view); renderActionRequests(view); renderClues(view); renderLoot(view); globalThis.ECHO_PHONE_DUNGEON?.render(view);
    const signature = JSON.stringify(view.character || {});
    if (signature !== lastSheetSignature) { lastSheetSignature = signature; renderSheet(view.character || {}); }
    if (view.roll && view.roll.id !== lastRoll) {
      lastRoll = view.roll.id;
      $('roll-result').textContent = `${view.roll.label}: ${view.roll.parts.join(', ')} → ${view.roll.total}`;
      $('sheet-roll-result').textContent = `${view.roll.label}: ${view.roll.parts.join(', ')} → ${view.roll.total}`;
    } else if (!view.rehearsal && lastRoll === 'practice-roll') {
      lastRoll = ''; $('roll-result').textContent = ''; $('sheet-roll-result').textContent = '';
    }
  }

  let lastSynced='',lastCachedSignature='',lastCachedAt=0;
  function readSaved(){try{const saved=JSON.parse(localStorage.getItem('echo-phone-sheet-v1')||'null');return saved?.character?.id&&saved?.at?saved:null;}catch{return null;}}
  function showFreshness(){$('reconnect-phone').hidden=!offline;const saved=readSaved(),at=lastSynced||saved?.at;$('sheet-freshness').textContent=at?`${offline?'Offline copy':'Last synced'} · ${new Date(at).toLocaleString()}`:'No saved sheet yet.';}
  function showCachedSheet(){const saved=readSaved();if(!saved)return false;offline=true;lastSynced=saved.at;joined=true;$('join').hidden=true;$('play').hidden=false;render({character:saved.character,session:saved.session,tokens:[],turn:{},playerTools:{},actionProtocol:0,playerToolsProtocol:0});$('connection').textContent='Offline saved sheet · live values resume after reconnecting.';selectTab('sheet');showFreshness();return true;}
  globalThis.ECHO_PHONE_PLAYER_TOOLS?.init({action,openActionRequest,offline:()=>offline});
  globalThis.ECHO_PHONE_TRAVEL?.init({action,offline:()=>offline});
  globalThis.ECHO_PHONE_DUNGEON?.init({action,offline:()=>offline});
  $('reconnect-phone').addEventListener('click',()=>refresh());
  $('rejoin-phone').addEventListener('click',()=>showJoin('Scan the current QR code if this join link has expired.'));
  $('show-saved-sheet').addEventListener('click',()=>{if(!showCachedSheet())$('sheet-freshness').textContent='Connect once to save a character sheet.';});
  $('forget-saved-sheet').addEventListener('click',()=>{try{localStorage.removeItem('echo-phone-sheet-v1');}catch{}lastSynced='';showFreshness();});
  window.addEventListener('online',()=>refresh());showFreshness();

  $('tab-table').addEventListener('click', () => selectTab('table'));
  $('tab-explore').addEventListener('click', () => selectTab('explore'));
  $('phone-priority').addEventListener('click', () => { const tab=$('phone-priority').dataset.target||'table';selectTab(tab);
    const target = tab==='explore' ? $('explore-panel') : !$('combat-prompts').hidden ? $('combat-prompts') : !$('initiative-phone-panel').hidden ? $('initiative-phone-panel') : !$('turn-guide').hidden ? $('turn-guide') : $('table-panel');
    target.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('tab-sheet').addEventListener('click', () => selectTab('sheet'));
  $('tab-clues').addEventListener('click', () => selectTab('clues'));
  $('tab-loot').addEventListener('click', () => selectTab('loot'));

  function downloadOfflineSheet() {
    const card = latest?.character;
    if (!card) return;
    const html = globalThis.ECHO_CHARACTER_SUMMARY.html(card,{updatedAt:lastSynced,reconnectUrl:location.origin+'/join'});
    const url = URL.createObjectURL(new Blob([html], {type:'text/html'}));
    const link = document.createElement('a'); link.href = url; link.download = `${String(card.name || 'character').replace(/[^a-z0-9_-]+/gi,'-')}-offline-sheet.html`;
    document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  $('save-offline-sheet').addEventListener('click', downloadOfflineSheet);

  async function refresh() {
    if (loading) return;
    loading = true;
    try {
      const view = await request('/api/state');
      if(latest?.character?.id && latest.character.id!==view.character?.id){actionDraft=null;lastSheetSignature='';lastTurnKey='';lastReply='';initiativeManualDraft='';localStorage.removeItem('echo-phone-sheet-v1');}
      joined = true; $('join').hidden = true; $('play').hidden = false;
      lastSynced=new Date().toISOString();const cacheSignature=JSON.stringify(view.character);if(cacheSignature!==lastCachedSignature||Date.now()-lastCachedAt>30000){try{localStorage.setItem('echo-phone-sheet-v1',JSON.stringify({character:view.character,session:view.session,at:lastSynced}));lastCachedSignature=cacheSignature;lastCachedAt=Date.now();}catch{}}showFreshness();
      if (offline || view.revision !== lastRevision) { offline = false; lastRevision = view.revision; render(view); }
      else $('connection').textContent = `${view.session || 'Campaign session'} · Connected`;
      await request('/api/seen',{revision:view.revision,characterId:view.character?.id});
    } catch (error) {
      offline = true;
      $('connection').textContent = latest ? `Connection lost · Last sheet remains available. Rolls and requests are paused. ${/join|unavailable|closed/i.test(error.message) ? 'Scan the new QR code to rejoin.' : ''}` : error.message;
      showFreshness();globalThis.ECHO_PHONE_PLAYER_TOOLS?.render(latest||{character:{id:'',spells:[]}});globalThis.ECHO_PHONE_TRAVEL?.render(latest||{});globalThis.ECHO_PHONE_DUNGEON?.render(latest||{});renderAtlas(latest||{});
      for (const button of document.querySelectorAll('#table-panel button, #clues-panel button, #loot-panel button, #sheet-panel .sheet-action-buttons button, #spell-results button')) button.disabled = true;
      if (!latest) { if(!showCachedSheet()) await showJoin(error.message); }
    } finally { loading = false; }
  }

  for (const button of document.querySelectorAll('[data-quick-roll]')) button.addEventListener('click', () => {
    const modifier = Math.max(-99, Math.min(99, Number($('dice-modifier').value) || 0));
    action({ kind: 'roll', count: 1, sides: 20, modifier, mode: button.dataset.quickRoll,
      label: $('roll-label').value.trim() || 'd20' }, $('roll-result'));
  });
  $('roll-custom').addEventListener('click', () => action({ kind: 'roll',
    count: Math.max(1, Math.min(20, Number($('dice-count').value) || 1)),
    sides: Number($('dice-sides').value), modifier: Math.max(-99, Math.min(99, Number($('dice-modifier').value) || 0)),
    mode: 'normal', label: $('roll-label').value.trim() || 'Dice roll' }, $('roll-result')));
  $('map-image').addEventListener('load', event => {
    const picture = event.currentTarget;
    if (picture.naturalWidth && picture.naturalHeight)
      $('phone-map').style.aspectRatio = `${picture.naturalWidth} / ${picture.naturalHeight}`;
  });
  refresh().catch(() => showJoin());
  setInterval(() => { if (joined) refresh(); else if (code && !$('join').hidden && !$('character-choices').childElementCount) showJoin(); }, 950);
})();
