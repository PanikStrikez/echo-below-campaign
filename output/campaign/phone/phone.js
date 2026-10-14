(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  function currentJoinCode(){const supplied=new URLSearchParams(location.search).get('code')||'';try{if(supplied)sessionStorage.setItem('echo-phone-current-join',supplied);return supplied||sessionStorage.getItem('echo-phone-current-join')||'';}catch{return supplied;}}
  const code=currentJoinCode();
  let joined = false, loading = false, offline = false, latest = null, lastRevision = -1, lastResyncRequest = -1, lastMapImage = '', lastRoll = '', lastViewSignature = '';
  let activeTab = 'table', lastSheetSignature = '', lastTurnKey = '', lastReply = '', initiativeManualDraft = '';
  const openSections = new Set(['Actions']);
  const el = (tag, label = '') => { const node = document.createElement(tag); node.textContent = label; return node; };
  const signed = value => value === null || value === undefined ? '—' : `${value >= 0 ? '+' : ''}${value}`;
  // Read-only presentation of the owner's permitted sheet. Never resolves an effect.
  function actionCard(card,item,type){
    const linked=type==='spell'?[...(card.actions||[]),...(card.attacks||[])].find(a=>a.name===item.name):null,a={...(linked||{}),...item},detail=[a.effect,a.notes].filter((v,i,all)=>v&&all.indexOf(v)===i).join(' · '),featureCost=type==='spell'?String(a.notes||'').match(/costs?\s+(\d+)\s+Focus\s+Points?/i):null,pool=(card.resources||[]).find(r=>featureCost?/focus/i.test(r.name):r.id===a.resourceId),cost=featureCost?Number(featureCost[1]):Number.isFinite(a.cost)?a.cost:1;
    const time=a.type||a.actionType||detail.match(/^(Bonus action|Reaction|Action|Passive|Once per turn)\b/i)?.[1]||(type==='attack'?'Action':type==='resource'?'Resource pool':'Timing unconfirmed');
    const math=[Number.isFinite(a.attackBonus)?'d20 '+signed(a.attackBonus)+' to hit':'',Number.isFinite(a.saveDC)?(a.saveAbility||'Ability unconfirmed').toUpperCase()+' save DC '+a.saveDC:''].filter(Boolean).join(' / ')||'No structured roll or save · see rules';
    const damage=a.damageDice?[a.damageDice,a.damageType].filter(Boolean).join(' '):'',effect=[damage,detail].filter(Boolean).join(' · ')||'Effect not recorded — ask your DM';
    const short=v=>v.length>150?v.slice(0,147)+'…':v,states=[],notes=[];
    let expense='No tracked resource cost';
    if(type==='resource'){expense='Amount to use: DM review';states.push(Number.isFinite(item.current)?{id:item.current>0?'available':'depleted',text:`${item.current}/${item.max??'?'} remaining`}:{id:'unknown',text:'Remaining amount unconfirmed'});}
    else if(featureCost){expense=`${cost} ${pool?.name||'Focus points'}`;states.push(!pool||!Number.isFinite(pool.current)?{id:'unknown',text:'Remaining Focus unconfirmed'}:{id:pool.current>=cost?'available':'depleted',text:`${pool.current}/${pool.max??'?'} ${pool.name} remaining${pool.current<cost?' · insufficient for this cost':''}`});notes.push('Feature casting from the recorded spell notes; confirm timing and spending with your DM.');}
    else if(type==='spell'&&a.level>0){const slots=(card.resources||[]).filter(r=>r.slotLevel>=a.level);expense='1 spell slot · choose level';const known=slots.some(r=>Number.isFinite(r.current)),left=slots.filter(r=>r.current>0);states.push({id:left.length?'available':known?'depleted':'unknown',text:left.length?'Slots available: '+left.map(r=>`level ${r.slotLevel}: ${r.current}/${r.max??'?'}`).join(' · '):known?'No eligible slots left · exceptions need review':'Spell slots unconfirmed'});}
    else if(a.resourceId){expense=`${cost} ${pool?.name||'resource (name unconfirmed)'}`;states.push(!pool||!Number.isFinite(pool.current)?{id:'unknown',text:'Remaining resource unconfirmed'}:{id:pool.current>=cost?'available':'depleted',text:`${pool.current}/${pool.max??'?'} ${pool.name} remaining${pool.current<cost?' · insufficient for this cost':''}`});}
    if(a.prepared===false)states.push({id:'unavailable',text:'Not prepared / unavailable'});else if(a.prepared===null)states.push({id:'unknown',text:'Preparation unconfirmed'});
    if(a.support?.status==='reference'){states.push({id:'ruling',text:'DM ruling needed'});notes.push(a.support.reason);if(!a.resourceId&&type!=='spell'&&type!=='resource')expense='Cost not confirmed · DM ruling';}
    else if(a.support?.status==='choice'){states.push({id:'situational',text:'Choose details / check requirements'});notes.push(a.support.reason);}
    else if(!a.support&&type!=='resource'){states.push({id:'unknown',text:'Resolution support unconfirmed'});}
    if(!states.length)states.push({id:'available',text:'No tracked resource restriction'});
    return {name:a.name||'Action',type:time,roll:math,effect:short(effect),fullEffect:effect,cost:expense,states,requirements:notes.filter(Boolean),support:a.support,level:a.level};
  }
  globalThis.ECHO_PHONE_ACTION_CARDS={describe:actionCard};
  // Input is the existing owner-filtered response; this classifier does not reveal or mutate data.
  function attentionModel(view,disconnected=false){
    const urgent=[],pending=[],history=[],card=view.character||{},ownTurn=!!view.turn?.activeId&&view.turn.activeId===card.id;
    for(const r of view.actionRequests||[]){if(r.status==='needs clarification')urgent.push({key:'question:'+r.id+':'+r.revision,text:'Question from DM',focus:'action-requests'});else if(['waiting','approved'].includes(r.status))pending.push({id:r.id,label:r.label||'Action',state:r.status,kind:'action',focus:'action-requests',tab:'table'});else history.push(r);}
    for(const r of view.combatPrompts?.saves||[])if(r.status==='waiting')urgent.push({key:'save:'+r.id+':'+r.revision,text:'Saving throw',focus:'combat-prompts'});
    for(const r of view.combatPrompts?.reactions||[])if(r.status==='waiting')urgent.push({key:'reaction:'+r.id,text:'Reaction',focus:'combat-prompts'});
    if(view.initiative?.open&&view.initiative.eligible!==false&&view.initiative.total==null)urgent.push({key:'initiative:'+view.scene,text:'Roll initiative',focus:'initiative-phone-panel'});
    if(!urgent.length&&!view.actionRequests?.length&&/clarification/i.test(view.requests||''))urgent.push({key:'legacy:'+view.requests,text:'Question from DM',focus:'phone-action-status'});
    if(!urgent.length&&!/approved|resolved|declined|cancelled|undone/i.test(view.requests||'')&&/error|failed|unavailable|changed|needs correction|could not|no longer|cannot|invalid/i.test(view.requests||''))urgent.push({key:'error:'+view.requests,text:'Request needs correction',focus:'phone-action-status'});
    if(ownTurn)urgent.push({key:'turn:'+view.session+':'+view.turn.round+':'+card.id,text:'Your turn',focus:'turn-guide'});
    for(const [kind,rows,tab,focus]of [['travel',view.travelRequests||[],'explore','phone-travel'],['search',view.searchRequests||[],'table','phone-dungeon'],['item',view.playerTools?.itemRequests||[],'loot','inventory-request-history']])for(const r of rows)if(['waiting','approved'].includes(r.status))pending.push({id:r.id,label:kind==='item'?(r.name||r.verb||'Item'):(r.title||r.area||'Destination'),state:r.status,kind,focus,tab});
    const actor=(view.tokens||[]).find(t=>t.id===view.turn?.activeId),turn=ownTurn?'Your turn':view.turn?.activeId?`${actor?.name||'Another creature'}’s turn`:'No combat turn active';
    if(disconnected)urgent.unshift({key:'offline',text:'Offline · requests paused',focus:'connection-tools',tab:'connection'});
    return {urgent,pending,history,ownTurn,turn,round:view.turn?.round||0,objective:view.playerTools?.objective?.text||'No shared objective published yet.'};
  }
  globalThis.ECHO_PHONE_ATTENTION={model:attentionModel};
  let lastAttentionKeys=new Set(),waitingSignature='';
  function connection(message,state) {const badge=$('connection');if(badge.textContent!==message)badge.textContent=message;badge.dataset.state=state;}

  function selectTab(tab) {
    document.body.dataset.phoneTab = tab;
    activeTab = ['table', 'explore', 'sheet', 'clues', 'loot'].includes(tab) ? tab : 'table';
    for (const name of ['table', 'explore', 'sheet', 'clues', 'loot']) {
      $(`${name}-panel`).hidden = activeTab !== name;
      const button = $(`tab-${name}`);
      button.classList.toggle('active', name === activeTab);
      button.setAttribute('aria-selected', String(name === activeTab));
    }
  }

  const phoneFeedback=[];let phoneFeedbackTimer;
  function notify(message,failure=false){const root=$('phone-feedback-current');if(failure){root.textContent=message;root.dataset.state='failed';clearTimeout(phoneFeedbackTimer);phoneFeedbackTimer=setTimeout(()=>root.textContent='',5000);}const old=phoneFeedback.find(r=>r.text===message&&r.failure===failure);if(old)old.count++;else phoneFeedback.unshift({text:message,count:1,failure});phoneFeedback.splice(30);const history=$('phone-feedback-history');history.replaceChildren();for(const r of phoneFeedback)history.append(el('p',`${r.failure?'Needs attention':'Update'}: ${r.text}${r.count>1?' · repeated '+r.count+' times':''}`));$('phone-feedback-summary').textContent=`Updates · ${phoneFeedback.length}${phoneFeedback.some(r=>r.failure)?' · needs attention':''}`;}
  const textSize=$('phone-text-size');function applyTextSize(value){const size=['1','1.5','2'].includes(value)?value:'1';textSize.value=size;document.body.dataset.textSize=size==='1'?'standard':'large';document.body.style.setProperty('--echo-text-scale',size);try{localStorage.setItem('echo-phone-text-size',size);}catch{}}textSize.onchange=()=>applyTextSize(textSize.value);let storedTextSize='1';try{storedTextSize=localStorage.getItem('echo-phone-text-size')||'1';}catch{}applyTextSize(storedTextSize);
  async function request(path, data) {
    const options = data === undefined ? { cache: 'no-store', credentials: 'same-origin' } :
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'same-origin' };
    const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),12000);
    try { const response=await fetch(path,{...options,signal:abort.signal});const result=await response.json();
      if(!response.ok)throw new Error(result.error||'The table could not complete that action.');return result;
    }catch(error){if(error.name==='AbortError')throw new Error('Table update timed out. Your last sheet is preserved; requests are paused until reconnecting.');throw error;
    }finally{clearTimeout(timer);}
  }

  async function showJoin(message = '') {
    joined = false; $('play').hidden = true; $('join').hidden = false;
    connection('Waiting to join','waiting'); $('join-error').textContent = message;
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
    if(offline){target.textContent='Reconnect before sending rolls or requests.';notify(target.textContent,true);return false;}
    try {
      await request('/api/action', {...data,expectedCharacterId:latest?.character?.id});
      target.textContent = data.kind === 'explore' || ['action-request','action-revise','action-cancel'].includes(data.kind) ? 'Request sent to your DM.' :
        ['search-request','search-cancel','travel-request','travel-cancel','personal-note','share-clue','item-request','item-cancel'].includes(data.kind) ? 'Sent to the DM screen. Waiting for confirmation.' : ['save-response','reaction-response'].includes(data.kind) ? 'Response sent to the DM.' : data.kind === 'save-clue' ? 'Saved to your journal.' : data.kind === 'move' ? 'Movement requested. Waiting for DM placement.' : 'Rolling on the DM screen…';
      notify(target.textContent);return true;
    } catch (error) { target.textContent = 'Failed · '+error.message;notify('Failed · '+error.message+' Check current status before retrying.',true);return false; }
  }

  let combatPromptSignature='',combatInputs={},phoneDragging=false,combatHistoryOwner='';const combatResponseHistory=new Map();
  function renderCombatPrompts(view){
    const incoming=view.combatPrompts||{},owner=view.character?.id||'';if(combatHistoryOwner!==owner){combatResponseHistory.clear();combatHistoryOwner=owner;combatInputs={};}
    for(const [kind,rows]of [['saves',incoming.saves||[]],['reactions',incoming.reactions||[]]])for(const r of rows){const key=kind+':'+r.id;if(r.status==='waiting')combatResponseHistory.delete(key);else combatResponseHistory.set(key,{kind,row:structuredClone(r)});}while(combatResponseHistory.size>40)combatResponseHistory.delete(combatResponseHistory.keys().next().value);
    const prompts=Object.fromEntries(['saves','reactions'].map(kind=>[kind,[...(incoming[kind]||[]).filter(r=>r.status==='waiting'),...[...combatResponseHistory.values()].filter(v=>v.kind===kind).map(v=>v.row)]])),signature=JSON.stringify([owner,prompts,view.rehearsal]);if(signature===combatPromptSignature)return;combatPromptSignature=signature;
    const root=$('combat-prompts');root.replaceChildren();root.hidden=!(prompts.saves?.length||prompts.reactions?.length);if(root.hidden)return;
    root.append(el('h2','Combat responses'));const finished=[...(prompts.saves||[]),...(prompts.reactions||[])].filter(r=>r.status!=='waiting');let history;if(finished.length){history=el('details');history.id='combat-response-history';history.open=openSections.has('combat-response-history');history.addEventListener('toggle',()=>{if(history.open)openSections.add('combat-response-history');else openSections.delete('combat-response-history');});history.append(el('summary',`Response history (${finished.length})`),el('small','Last responses received on this phone'));root.append(history);}
    for(const b of prompts.saves||[]){const box=el('article');box.className='clue-card';box.append(el('h3',`${b.label} · ${String(b.ability).toUpperCase()} save`),el('p',`${b.status}${Number.isFinite(b.total)?' · total '+b.total:''} · ${b.mode} · modifier ${signed(b.bonus)}`));
      if(b.status==='waiting'){const roll=el('button','Roll saving throw'),total=el('input'),enter=el('button','Send physical-dice total'),message=el('p');total.type='number';total.placeholder='Final total including modifiers';total.setAttribute('aria-label','Saving throw total');total.value=combatInputs[b.id]||'';total.addEventListener('input',()=>combatInputs[b.id]=total.value);
       roll.disabled=view.rehearsal||!Number.isFinite(b.bonus);enter.disabled=view.rehearsal;
       roll.addEventListener('click',async()=>{roll.disabled=true;const ok=await action({kind:'save-response',batchId:b.id,expectedRevision:b.revision,method:'digital'},message);if(!ok)roll.disabled=false;});
       enter.addEventListener('click',async()=>{if(total.value===''){message.textContent='Enter your final total first.';return;}enter.disabled=true;const ok=await action({kind:'save-response',batchId:b.id,expectedRevision:b.revision,method:'physical',total:Number(total.value)},message);if(!ok)enter.disabled=false;});box.append(roll,total,enter,message);}
      (b.status==='waiting'?root:history).append(box);
    }
    for(const p of prompts.reactions||[]){const box=el('article');box.className='clue-card';box.append(el('h3',`Reaction window · ${p.label}`),el('p',p.status==='waiting'?'Combat is paused. Pass or describe your reaction for DM review.':`${p.status} · ${p.note||''}`));
     if(p.status==='waiting'){const note=el('input'),ask=el('button','Request reaction'),pass=el('button','Pass'),message=el('p');note.placeholder='Shield, opportunity attack, or another reaction';note.maxLength=600;note.value=combatInputs[p.id]||'';note.addEventListener('input',()=>combatInputs[p.id]=note.value);ask.disabled=pass.disabled=view.rehearsal;
      const reply=async(response)=>{if(response==='request'&&!note.value.trim()){message.textContent='Describe the reaction first.';return;}ask.disabled=pass.disabled=true;if(!await action({kind:'reaction-response',pauseId:p.id,response,note:note.value},message))ask.disabled=pass.disabled=false;};ask.addEventListener('click',()=>reply('request'));pass.addEventListener('click',()=>reply('pass'));box.append(note,ask,pass,message);}
     (p.status==='waiting'?root:history).append(box);
    }
  }
  function renderCharacter(view) {
    const card = view.character || {}, turn = view.turn || {};
    $('character-name').textContent = card.name || 'Your character';
    $('phone-identity').textContent=card.name||'Your adventure';
    $('phone-hp').textContent=`HP ${card.hp??'?'} / ${card.maxHp??'?'}`;
    document.body.dataset.combat=String(!!turn.activeId||view.initiative?.open===true);
    $('character-detail').textContent = [card.ancestry, card.className, card.level ? `Level ${card.level}` : ''].filter(Boolean).join(' · ');
    $('turn-pill').hidden = turn.activeId !== card.id;
    const turnKey = `${view.session}:${turn.round}:${turn.activeId}`;
    if (turn.activeId === card.id && lastTurnKey !== turnKey && !view.rehearsal) {
      document.title = `Your turn · ${card.name}`;
    } else if (turn.activeId !== card.id) document.title = 'The Echo Below · Player';
    lastTurnKey = turnKey;
    const reply = $('phone-action-status'); reply.hidden = !view.requests;
    reply.textContent = view.requests || '';
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
    const priority=$('phone-priority'),m=attentionModel(view,offline),combat=!!view.turn?.activeId||view.initiative?.open;
    $('tab-table-label').textContent=combat?'My turn':'Home';$('tab-table').classList.toggle('combat-priority',combat);
    priority.hidden=false;priority.disabled=!m.urgent.length;priority.dataset.kind=offline?'offline':m.urgent.length?'urgent':'quiet';priority.dataset.target=m.urgent[0]?.tab||'table';priority.dataset.focus=m.urgent[0]?.focus||'turn-guide';priority.setAttribute('aria-live',m.urgent.length?'polite':'off');
    const text=offline?'Offline · saved sheet available. Reconnect to send requests.':m.urgent.length?[...new Set(m.urgent.map(r=>r.text))].join(' · ')+' · Tap to respond':m.round?`${m.turn} · Round ${m.round} · No response needed`:'No response needed · Keep your attention on the table.';
    if(priority.textContent!==text)priority.textContent=text;
    const keys=new Set(m.urgent.map(r=>r.key));if(!view.rehearsal&&navigator.vibrate&&m.urgent.some(r=>r.key!=='offline'&&!lastAttentionKeys.has(r.key)))navigator.vibrate(120);lastAttentionKeys=keys;
    if(offline)document.title='Offline · '+(view.character?.name||'Player');else if(m.urgent.length)document.title=m.urgent[0].text+' · '+(view.character?.name||'Player');
    renderWaiting(view,m);
  }
  function openPhoneTask(tab,focus){if(tab==='connection'){const tools=$('connection-tools');tools.open=true;tools.scrollIntoView({block:'start'});return;}selectTab(tab||'table');const target=$(focus)||$('table-panel');const details=target.closest?.('details');if(details)details.open=true;if(focus==='phone-action-status'){const card=document.querySelector('.character-card');if(card)card.open=true;}if(focus==='action-requests'){const pending=$('pending-action-requests');if(pending)pending.open=true;}target.scrollIntoView({block:'start',behavior:'smooth'});}
  function renderWaiting(view,m){const root=$('phone-waiting');if(!root)return;const show=!!view.turn?.activeId&&!m.ownTurn||m.pending.length>0;root.hidden=!show;if(!show)return;const signature=JSON.stringify([m.turn,m.round,m.objective,m.pending]);if(signature===waitingSignature)return;waitingSignature=signature;root.replaceChildren();root.append(el('small','WHILE YOU WAIT'),el('h2','Current objective'),el('p',m.objective));
    if(m.pending.length){const groups=new Map();for(const r of m.pending)if(!groups.has(r.kind))groups.set(r.kind,r);root.append(el('p',`${m.pending.length} request${m.pending.length===1?'':'s'} waiting for DM review or resolution.`));for(const r of groups.values()){const b=el('button',r.label+' · '+(r.state==='approved'?'Approved; awaiting resolution':'Waiting for DM'));b.type='button';b.addEventListener('click',()=>openPhoneTask(r.tab,r.focus));root.append(b);}}
    else root.append(el('p','Nothing to respond to now. You can prepare a private action or follow the table.'));
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

  const actionCardSections=new Set();let turnGuideSignature='';
  function renderTurnGuide(view) {
    const signature=JSON.stringify([view.character,view.turn,view.rehearsal,view.requests,view.actionProtocol,offline]);if(signature===turnGuideSignature)return;turnGuideSignature=signature;
    const root = $('turn-guide'); root.replaceChildren();
    const card = view.character || {};
    loadPrepared(view);const summary=el('section');summary.id='private-draft-summary';root.append(summary);renderDraftSummary();
    root.hidden = false;
    if (root.hidden) return;
    if(view.actionProtocol!==1)root.append(el('p','Ask your DM to refresh the campaign app to enable action reviews.'));
    root.append(el('h2', view.rehearsal ? 'Practice turn' : view.turn?.activeId===card.id ? 'Your turn' : 'Request an action'));
    root.append(el('p', view.rehearsal ? 'This is a sample turn. The buttons are paused until your DM ends rehearsal.' :
      'Choose an action and its targets. Your DM reviews the rolls, costs, and effects together. Quick rolls do not spend resources.'));
    const groups = [['attack', card.attacks || []], ['action', card.actions || []], ['spell', card.spells || []], ['resource', card.resources || []]],favorites=new Set(card.favorites||[]);
    const isFavorite=(type,item)=>favorites.has(`${type}:${item.id||item.name}`);
    const custom=(card.actions||[]).findIndex(a=>a.id==='request-freeform');
    if(custom>=0){const free=el('button','Describe another action');free.type='button';free.className='phone-freeform';free.disabled=view.rehearsal||view.actionProtocol!==1||offline;free.addEventListener('click',()=>openActionRequest('action',custom));root.append(free);}
    function renderRow(parent,type,item,index){
      const model=actionCard(card,item,type),row=el('article');row.className='turn-action';row.dataset.actionName=model.name;row.dataset.actionKey=type+':'+index;
      const head=el('div');head.className='phone-action-head';const variant=type==='spell'?item.notes?.match(/^(Wizard|Cleric|Monk|Warlock|Sorcerer|Bard|Druid|Paladin|Ranger)\b/i)?.[1]:null;head.append(el('strong',model.name+(variant?' · '+variant:'')),el('span',model.type+(type==='spell'?' · '+(item.level===0?'Cantrip':'Level '+item.level):''))); row.append(head);
      const math=el('p',model.roll);math.className='action-math';row.append(math);
      const effect=el('p',model.effect);effect.className='phone-action-effect';row.append(effect);
      const cost=el('p','Cost: '+model.cost);cost.className='phone-action-cost';row.append(cost);
      const availability=el('div');availability.className='phone-action-availability';for(const state of model.states){const badge=el('span',state.text);badge.className='echo-status';badge.dataset.state=state.id;availability.append(badge);}row.append(availability);
      const buttons=el('div');buttons.className='sheet-action-buttons';
      const ask=el('button',type==='spell'?'Ask to cast':type==='resource'?'Ask to use':'Request action');ask.type='button';ask.className='primary';ask.disabled=view.rehearsal||view.actionProtocol!==1||offline||item.prepared===false;ask.addEventListener('click',()=>openActionRequest(type,index));buttons.append(ask);if(type!=='resource'){const prepare=el('button','Prepare next turn');prepare.type='button';prepare.dataset.localDraft='true';prepare.disabled=view.rehearsal||item.prepared===false;prepare.addEventListener('click',()=>openActionRequest(type,index,null,true));buttons.append(prepare);}row.append(buttons);
      const details=el('details');details.className='phone-action-rules';const key=type+':'+index+':'+(item.id||item.name);details.open=actionCardSections.has(key);details.addEventListener('toggle',()=>{if(details.open)actionCardSections.add(key);else actionCardSections.delete(key);});details.append(el('summary','Rules & quick roll'));
      if(model.fullEffect!==model.effect)details.append(el('p',model.fullEffect));for(const requirement of model.requirements)details.append(el('p',requirement));
      if(model.support){const badge=el('span',model.support.label);badge.className='echo-status action-support';badge.dataset.state=model.support.status;details.append(badge);const source=model.support.source;if(source)details.append(el('p',[source.book,source.printedPage?'p. '+source.printedPage:'',source.rule,source.confidence].filter(Boolean).join(' · ')));}
      if(Number.isFinite(item.attackBonus)){const quick=el('button','Quick roll only');quick.type='button';quick.disabled=view.rehearsal||offline;quick.addEventListener('click',()=>action({kind:'roll',count:1,sides:20,modifier:item.attackBonus,mode:'normal',label:`${item.name} attack`},$('turn-message')));details.append(el('p','A quick roll sends dice only. It does not spend resources or apply effects.'),quick);}row.append(details);parent.append(row);
    }
    const pinned=groups.flatMap(([type,entries])=>entries.map((item,index)=>({type,item,index}))).filter(x=>x.item&&x.item.id!=='request-freeform'&&isFavorite(x.type,x.item));
    if(pinned.length){const section=el('section');section.className='phone-action-favorites';section.append(el('h3','Favorites'));for(const x of pinned)renderRow(section,x.type,x.item,x.index);root.append(section);}
    for(const [type,entries]of groups){const remaining=entries.map((item,index)=>({item,index})).filter(x=>x.item&&x.item.id!=='request-freeform'&&!isFavorite(type,x.item));if(!remaining.length)continue;
      const group=type==='attack'?el('section'):el('details'),title=({attack:'Attacks',spell:'Spells',action:'Abilities',resource:'Resources'})[type];group.className='turn-spell-list';group.append(el(type==='attack'?'h3':'summary',`${title} (${remaining.length})`));if(type!=='attack'){group.open=actionCardSections.has('group:'+type);group.addEventListener('toggle',()=>{if(group.open)actionCardSections.add('group:'+type);else actionCardSections.delete('group:'+type);});}root.append(group);for(const x of remaining)renderRow(group,type,x.item,x.index);
    }
    const message = el('p'); message.id = 'turn-message'; message.className = 'roll-result'; root.append(message);
  }

  let actionDraft=null,preparedAction=null,draftScope='',draftStorageFailed=false,requestSignature='';
  const draftMechanical=a=>{if(!a)return '';const v={...a};delete v.support;delete v.derived;return JSON.stringify(v);};
  function draftConflicts(d,v){const errors=[],card=v.character||{},item=card[actionFields[d.actionType]]?.[d.actionIndex];
    if(d.characterId!==card.id)errors.push('This draft belongs to another character.');
    if(d.scene!==v.scene)errors.push('The scene changed. Review the current action and choose targets again.');
    if(!item||item.name!==d.actionName||draftMechanical(item)!==d.entrySignature)errors.push('Your action details changed. Choose the current action or refresh this draft after reviewing it.');
    if(item?.prepared===false)errors.push('That action is no longer available / prepared.');
    const visible=new Set([card.id,...(v.tokens||[]).map(t=>t.id)]);for(const id of d.targetIds||[])if(!visible.has(id))errors.push('A selected target is no longer visible. Remove it or choose another target.');
    if(!d.targetIds?.length&&!d.note?.trim())errors.push('Choose a target or describe the intended effect.');
    if(item){const model=actionCard(card,item,d.actionType);if(model.states.some(s=>s.id==='depleted')&&d.casting?.mode!=='ritual')errors.push('The required resource is depleted. Choose another action or a supported casting method.');
      const key=d.casting?.mode==='slot'?d.casting.resourceId:item.resourceId,pool=(card.resources||[]).find(r=>r.id===key);if(key&&(!pool||!Number.isFinite(pool.current)||pool.current<(d.casting?.mode==='slot'?1:item.cost??1)))errors.push('The selected resource is unavailable or its remaining amount is unconfirmed.');}
    if(d.editing){const r=(v.actionRequests||[]).find(r=>r.id===d.requestId);if(!r||!['waiting','needs clarification'].includes(r.status)||r.revision!==d.expectedRevision)errors.push('The submitted request changed. Reopen its current status before revising.');}
    if(v.turn?.activeId&&v.turn.activeId!==card.id&&!/reaction/i.test(item?.type||''))errors.push('Waiting for your turn. This draft will not submit automatically.');
    return [...new Set(errors)];
  }
  globalThis.ECHO_PHONE_TURN_DRAFTS={conflicts:draftConflicts,mechanical:draftMechanical};
  function loadPrepared(v){const scope=location.origin+'|'+code+'|'+v.character?.id;if(scope===draftScope)return;draftScope=scope;preparedAction=null;try{const value=JSON.parse(localStorage.getItem('echo-private-turn-v1:'+scope));if(value?.prepared&&value.characterId===v.character?.id&&actionFields[value.actionType]&&Number.isInteger(value.actionIndex)){preparedAction={...value,targetIds:(value.targetIds||[]).filter(x=>typeof x==='string').slice(0,20),note:String(value.note||'').slice(0,600)};}}catch{}if(actionDraft?.prepared)actionDraft=null;}
  function persistPrepared(){draftStorageFailed=false;if(actionDraft?.prepared)preparedAction=structuredClone(actionDraft);try{if(preparedAction)localStorage.setItem('echo-private-turn-v1:'+draftScope,JSON.stringify(preparedAction));else localStorage.removeItem('echo-private-turn-v1:'+draftScope);}catch{draftStorageFailed=true;}renderDraftSummary();}
  function renderDraftSummary(){const root=$('private-draft-summary');if(!root)return;root.replaceChildren();root.hidden=!preparedAction;if(!preparedAction)return;root.append(el('strong','Private next-turn draft'),el('p',preparedAction.actionName+' · not sent'+(draftStorageFailed?' · storage unavailable; keep this tab open':'')));const b=el('button','Resume prepared action');b.type='button';b.dataset.localDraft='true';b.addEventListener('click',()=>{actionDraft=structuredClone(preparedAction);selectTab('table');renderActionComposer();$('action-composer').scrollIntoView({block:'start'});});root.append(b);}
  function captureDraft(){const item=latest.character[actionFields[actionDraft.actionType]]?.[actionDraft.actionIndex];actionDraft.characterId=latest.character.id;actionDraft.scene=latest.scene;actionDraft.entrySignature=draftMechanical(item);actionDraft.actionName=item?.name||'';persistPrepared();}
  function refreshDraftFeedback(){if(!actionDraft?.prepared)return;const box=$('prepared-draft-feedback'),send=$('prepared-draft-send');if(!box||!send)return;const issues=draftConflicts(actionDraft,latest);renderDraftTargets($('action-target-options'),actionDraft,latest);box.textContent=offline?'Offline · draft saved locally. Reconnect before submitting.':(issues.join(' ')||'Ready for your review. Nothing has been sent or spent.')+(draftStorageFailed?' Storage unavailable; keep this tab open to retain the draft.':'');send.disabled=offline||latest.rehearsal===true||latest.actionProtocol!==1||!!issues.length;const targets=$('prepared-target-conflicts');if(targets){targets.replaceChildren();const visible=new Set([latest.character.id,...(latest.tokens||[]).map(t=>t.id)]);for(const id of actionDraft.targetIds.filter(id=>!visible.has(id))){const remove=el('button','Remove unavailable target');remove.type='button';remove.dataset.localDraft='true';remove.addEventListener('click',()=>{actionDraft.targetIds=actionDraft.targetIds.filter(t=>t!==id);persistPrepared();refreshDraftFeedback();});targets.append(remove);}}}

  const actionFields={attack:'attacks',action:'actions',spell:'spells',resource:'resources'};
  function openActionRequest(type,index,existing=null,prepare=false){
    actionDraft={requestId:existing?.id||`pa-${Date.now()}-${Math.random().toString(36).slice(2,12)}`,actionType:type,actionIndex:index,expectedRevision:existing?.revision,
      actionName:existing?.label||latest.character[actionFields[type]]?.[index]?.name||'',targetIds:[...(existing?.targetIds||[])],note:existing?.note||'',mode:existing?.mode||'normal',editing:!!existing,casting:existing?.casting?{...existing.casting}:null};
    if(prepare){actionDraft.prepared=true;captureDraft();}selectTab('table');renderActionComposer();renderMap(latest);$('action-composer').scrollIntoView({block:'start',behavior:'smooth'});
  }
  function renderDraftTargets(root,draft,view){if(!root)return;const card=view.character,targets=new Map([[card.id,{id:card.id,name:`${card.name} (you)`}],...(view.tokens||[]).map(t=>[t.id,t])]),signature=JSON.stringify([[...targets].map(([id,t])=>[id,t.name||t.label]),draft.targetIds]);if(root.dataset.signature===signature)return;root.dataset.signature=signature;root.replaceChildren();for(const t of targets.values()){const l=el('label'),c=el('input');c.type='checkbox';c.checked=draft.targetIds.includes(t.id);c.addEventListener('change',()=>{draft.targetIds=draft.targetIds.filter(id=>id!==t.id);if(c.checked)draft.targetIds.push(t.id);persistPrepared();refreshDraftFeedback();});l.append(c,el('span',t.name||t.label));root.append(l);}}
  function renderActionComposer(){
    const root=$('action-composer');root.replaceChildren();root.hidden=!actionDraft;if(!actionDraft)return;
    const draft=actionDraft,card=latest.character;
    root.append(el('h2',draft.prepared?'Prepare your next turn':draft.editing?'Revise request':'Request an action'));if(draft.prepared)root.append(el('p','Private draft · saved on this phone. No rolls, reservations, spending or automatic submission.'));
    const label=el('label','Action'),select=el('select');
    for(const [type,field]of Object.entries(actionFields))for(const [index,item]of (card[field]||[]).entries()){
      if(item.prepared===false)continue;const o=el('option',`${item.name} (${type})`);o.value=`${type}:${index}`;select.append(o);
    }
    select.value=`${draft.actionType}:${draft.actionIndex}`;select.addEventListener('change',()=>{const [t,i]=select.value.split(':');draft.actionType=t;draft.actionIndex=Number(i);draft.actionName=latest.character[actionFields[t]]?.[Number(i)]?.name||'';draft.casting=null;if(draft.prepared)captureDraft();renderActionComposer();});label.append(select);root.append(label);
    const chosenAction=card[actionFields[draft.actionType]]?.[draft.actionIndex];
    if(chosenAction){const model=actionCard(card,chosenAction,draft.actionType);root.append(el('p',model.type+' · '+model.roll),el('p',model.fullEffect),el('p','Cost: '+model.cost),el('p',model.states.map(s=>s.text).join(' · ')));}
    const cardSupport=chosenAction?.support;if(cardSupport)root.append(el('p',cardSupport.label+' · '+cardSupport.reason));
    if(draft.actionType==='spell'){
      const spell=card.spells[draft.actionIndex];
      if(spell&&spell.level>0&&!/costs?\s+\d+\s+Focus\s+Points?/i.test(spell.notes||'')){
        const l=el('label','Cast using'),slot=el('select');
        for(const [value,title]of [['','Ask DM to choose slot'],...(card.resources||[]).filter(r=>r.slotLevel>=spell.level).map(r=>[r.id,`${r.name} · ${r.current}/${r.max}`]),['ritual','Request ritual / free casting']]){const o=el('option',title);o.value=value;slot.append(o);}
        slot.value=draft.casting?.mode==='ritual'?'ritual':draft.casting?.resourceId||'';
        slot.addEventListener('change',()=>{draft.casting=slot.value?{mode:slot.value==='ritual'?'ritual':'slot',resourceId:slot.value==='ritual'?'':slot.value,concentration:'auto',effect:'',notation:''}:null;persistPrepared();refreshDraftFeedback();});l.append(slot);root.append(l);
        root.append(el('p','For an upcast, describe the extra targets, dice, or duration below. Rituals and free casting need a reason for DM review.'));
      }
    }
    root.append(el('p','Choose everyone this action should affect. For a place, object, or effect without a token, describe it below. Your DM reviews range, costs, and the effect.'));
    const targetOptions=el('div');targetOptions.id='action-target-options';root.append(targetOptions);renderDraftTargets(targetOptions,draft,latest);
    const modeLabel=el('label','Requested d20 mode'),mode=el('select');for(const name of ['normal','advantage','disadvantage']){const o=el('option',name);o.value=name;mode.append(o);}mode.value=draft.mode;mode.addEventListener('change',()=>{draft.mode=mode.value;persistPrepared();});modeLabel.append(mode);root.append(modeLabel);
    const noteLabel=el('label','Intent / target details'),note=el('textarea');note.rows=3;note.maxLength=600;note.value=draft.note;note.placeholder='Which spell level? Where does the area go? How are multiple attacks allocated?';note.addEventListener('input',()=>{draft.note=note.value;persistPrepared();refreshDraftFeedback();});noteLabel.append(note);root.append(noteLabel);
    if(draft.prepared){const feedback=el('p');feedback.id='prepared-draft-feedback';feedback.setAttribute('role','status');root.append(feedback);const update=el('button','Review current action / scene');update.type='button';update.dataset.localDraft='true';update.addEventListener('click',()=>{captureDraft();renderActionComposer();});root.append(update);const conflicts=el('div');conflicts.id='prepared-target-conflicts';root.append(conflicts);}
    const result=el('p');result.setAttribute('role','status');const send=el('button',draft.editing?'Send revision':'Send for DM review');send.type='button';send.className='primary';if(draft.prepared)send.id='prepared-draft-send';send.disabled=latest.rehearsal===true||latest.actionProtocol!==1;
    send.addEventListener('click',async()=>{
      if(draft.prepared){send.disabled=true;try{const fresh=await request('/api/state');latest=fresh;const issues=draftConflicts(draft,fresh);if(issues.length){result.textContent=issues.join(' ');renderActionComposer();return;}}catch(e){result.textContent=e.message;refreshDraftFeedback();return;}}
      if(!draft.targetIds.length&&!draft.note.trim()){result.textContent='Choose a target or describe the intended effect.';return;}
      const item=latest.character[actionFields[draft.actionType]]?.[draft.actionIndex];if(!item||item.name!==draft.actionName){result.textContent='Your sheet changed. Choose the action again.';return;}
      send.disabled=true;
      const ok=await action({kind:draft.editing?'action-revise':'action-request',requestId:draft.requestId,expectedRevision:draft.expectedRevision,actionType:draft.actionType,actionIndex:draft.actionIndex,actionName:item.name,targetIds:draft.targetIds,note:draft.note,mode:draft.mode,casting:draft.casting?{...draft.casting,effect:draft.note}:null,...(draft.prepared?{draftEntry:latest.character[actionFields[draft.actionType]][draft.actionIndex],draftScene:draft.scene}:{})},result);
      if(ok){if(draft.prepared){preparedAction=null;actionDraft=null;persistPrepared();}else actionDraft=null;root.replaceChildren(el('p','Sent. Waiting for your DM screen to receive it.'));const close=el('button','Close');close.addEventListener('click',()=>{root.hidden=true;});root.append(close);}else send.disabled=false;
    });
    const close=el('button',draft.prepared?'Save draft for later':'Close draft');close.type='button';close.dataset.localDraft='true';close.addEventListener('click',()=>{persistPrepared();actionDraft=null;renderActionComposer();});root.append(send,close,result);if(draft.prepared){const cancel=el('button','Cancel private draft');cancel.type='button';cancel.dataset.localDraft='true';cancel.addEventListener('click',()=>{preparedAction=null;actionDraft=null;persistPrepared();renderActionComposer();});root.append(cancel);refreshDraftFeedback();}
  }
  function renderActionRequests(view){
    const rows=view.actionRequests||[],receipts=view.receipts||[],signature=JSON.stringify([view.character?.id,rows,receipts,view.rehearsal]);if(signature===requestSignature)return;requestSignature=signature;
    const root=$('action-requests');root.replaceChildren();root.hidden=!rows.length&&!receipts.length;if(!rows.length&&!receipts.length)return;root.append(el('h2','Your requests & results'));if(receipts.length){const results=el('details');results.append(el('summary','Other committed changes'));for(const receipt of receipts.slice().reverse())globalThis.ECHO_ACTION_RECEIPTS?.render(results,receipt);root.append(results);}
    const latestResult=rows.slice().reverse().find(r=>!['waiting','approved','needs clarification'].includes(r.status));if(latestResult){const latestBox=el('section');latestBox.id='latest-action-receipt';latestBox.append(el('small','Latest action result'));globalThis.ECHO_ACTION_RECEIPTS?.render(latestBox,latestResult.receipt||{title:latestResult.label,status:latestResult.status,committed:latestResult.status==='resolved'?[latestResult.message]:[],pending:latestResult.status==='resolved'?[]:[latestResult.message],undo:'ask-dm'});root.append(latestBox);}
    const pendingRows=rows.filter(r=>['waiting','approved'].includes(r.status)),doneRows=rows.filter(r=>!['waiting','approved','needs clarification'].includes(r.status));let pendingBox,historyBox;for(const [id,title,count]of [['pending-action-requests','Pending requests',pendingRows.length],['action-request-history','Completed request history',doneRows.length]])if(count){const box=el('details');box.id=id;box.open=openSections.has(id);box.addEventListener('toggle',()=>{if(box.open)openSections.add(id);else openSections.delete(id);});box.append(el('summary',`${title} (${count})`));root.append(box);if(id==='pending-action-requests')pendingBox=box;else historyBox=box;}
    for(const r of rows.slice().reverse()){
      const box=el('article');box.className='clue-card';box.dataset.status=r.status;
      const statusText=({waiting:'Waiting for DM', 'needs clarification':'Needs your reply', approved:'Approved', resolved:'Resolved', declined:'Declined', cancelled:'Cancelled'})[r.status]||r.status;
      const badge=el('strong',statusText);badge.className='echo-status';badge.dataset.state=r.status.replace(/\s+/g,'-');box.append(el('h3',r.label),badge,el('p',r.message||''),el('small',`Targets: ${(r.targetNames||[]).join(', ')||'See request note'}`));
      if(r.receipt&&globalThis.ECHO_ACTION_RECEIPTS)globalThis.ECHO_ACTION_RECEIPTS.render(box,r.receipt);else for(const roll of r.rolls||[])box.append(el('p',`${roll.label}: ${roll.notation} = ${roll.total}`));
      if(r.note)box.append(el('p',r.note));
      if(['waiting','needs clarification'].includes(r.status)){
        const revise=el('button','Revise'),cancel=el('button','Cancel request'),message=el('p');revise.disabled=cancel.disabled=view.rehearsal===true;
        revise.addEventListener('click',()=>openActionRequest(r.actionType,r.actionIndex,r));
        cancel.addEventListener('click',async()=>{cancel.disabled=true;const ok=await action({kind:'action-cancel',requestId:r.id,expectedRevision:r.revision},message);if(!ok)cancel.disabled=false;else if(actionDraft?.requestId===r.id){actionDraft=null;renderActionComposer();}});
        box.append(revise,cancel,message);
      }
      (r.status==='needs clarification'?root:['waiting','approved'].includes(r.status)?pendingBox:historyBox).append(box);
    }
  }

  let questState='active',clueSignature='',lootSignature='';
  function renderClues(view) {
    const signature=JSON.stringify([view.character?.id,questState,view.quests,view.privateClues,view.campaignJournal,view.rehearsal,offline]);if(signature===clueSignature)return;clueSignature=signature;
    const root=$('clues-list');root.replaceChildren();
    const nav=el('div');nav.className='quest-state-tabs';nav.setAttribute('aria-label','Quest status');
    for(const [key,label]of [['active','Active'],['completed','Completed']]){const b=el('button',label);b.type='button';b.setAttribute('aria-pressed',String(questState===key));b.dataset.localControl='true';b.onclick=()=>{questState=key;renderClues(latest);};nav.append(b);}root.append(nav);
    const shared=el('section');shared.append(el('h3','Shared quests'),el('small','Shared with the party'));root.append(shared);
    const completed=q=>['completed','resolved','failed','abandoned'].includes(String(q.state||q.status||'').toLowerCase());
    const rows=(view.quests||[]).filter(q=>completed(q)===(questState==='completed'));
    for(const q of rows){const card=el('article');card.className='clue-card';card.append(el('h4',q.title),el('p',q.goal),el('small',q.state||q.status||'Active'));globalThis.ECHO_ACTION_RECEIPTS?.render(card,{title:'Quest publication',status:'resolved',committed:['Current shared quest: '+(q.state||q.status||'Active')],pending:['Objectives change only after DM review.'],undo:'ask-dm'});shared.append(card);}if(!rows.length)shared.append(el('p',`No ${questState} shared quests.`));
    const personal=el('section');personal.append(el('h3','Character quests'),el('small','Only you and the DM'));root.append(personal);
    const clues=sheetSection(root,'Clues · private to you',true);let ownCount=0;
    for(const clue of (view.privateClues||[]).slice().reverse()){
      const questGuide=clue.id?.startsWith('quest-guide-'),outcome=clue.id?.startsWith('outcome-');
      if(questGuide&&completed(clue)!==(questState==='completed'))continue;
      const card=el('article');card.className='clue-card';card.append(el('h4',clue.title||'Clue'),el('p',clue.text||''));
      if(clue.image){const img=el('img');img.src=clue.image;img.alt=clue.title||'Private clue';img.loading='lazy';card.append(img);}
      if(questGuide)globalThis.ECHO_ACTION_RECEIPTS?.render(card,{title:'Owner-only quest publication',status:'resolved',committed:['Current character quest: '+(clue.state||clue.status||'Active')],undo:'ask-dm'});
      const note=el('small',questGuide?'Owner-only quest · status updated by DM':outcome?'Private campaign record':clue.saved?'Saved in your journal · private':'Private to your character');card.append(note);
      if(!clue.saved&&!questGuide&&!outcome){const b=el('button','Save to my journal');b.disabled=view.rehearsal===true||offline;b.onclick=async()=>{if(await action({kind:'save-clue',clueId:clue.id},note))b.disabled=true;};card.append(b);}
      if(!questGuide&&!outcome)globalThis.ECHO_PHONE_PLAYER_TOOLS?.clueButtons(card,clue);
      (questGuide?personal:clues).append(card);if(questGuide)ownCount++;
    }
    if(!ownCount)personal.append(el('p',`No ${questState} character quests published.`));
    const history=sheetSection(root,'Campaign journal & history');for(const entry of (view.campaignJournal||[]).slice().reverse()){const card=el('article');card.className='clue-card';card.append(el('h4',entry.title),el('p',entry.text),el('small',`${entry.when} · ${entry.kind}`));globalThis.ECHO_ACTION_RECEIPTS?.render(card,{title:'Journal publication',status:'resolved',committed:['Reviewed entry published to your journal.'],details:[entry.id||'Published journal entry'],undo:'ask-dm'});history.append(card);}
  }

  function renderLoot(view) {
    const signature=JSON.stringify([view.character?.id,view.campaignTracks,view.inventory]);if(signature===lootSignature)return;lootSignature=signature;
    const root = $('loot-list'); root.replaceChildren();
    root.append(el('h3','Important item custody & promises'));
    const historical=sheetSection(root,'Resolved promises & historical loot');
    for(const entry of view.campaignTracks||[]){const row=el('div');row.className='loot-row';row.append(el('strong',`${entry.subject} · ${entry.state}`),el('small',[entry.kind,entry.holder,entry.owedTo&&`Owed to ${entry.owedTo}`,entry.note].filter(Boolean).join(' · ')));(['resolved','completed','spent','lost'].includes(entry.state)?historical:root).append(row);}
    const shared=sheetSection(root,'Party inventory · all carriers');
    const items = view.inventory || [];
    if (!items.length) { root.append(el('p', 'No separate item quantities are recorded in the party inventory.')); return; }
    for (const item of items) {
      const row = el('div'); row.className = 'loot-row';
      row.append(el('strong', `${item.name}${item.quantity === null ? '' : ` ×${item.quantity}`}`));
      row.append(el('small', `${item.holder === 'party' ? 'Carried by the party' : `Held by ${item.holderName || item.holder}`}${item.note ? ` · ${item.note}` : ''}`));
      shared.append(row);
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
      if(item.support)row.append(el('small',item.support.label+' · '+item.support.reason));
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
        'Drag only your token to request DM placement. Tap a shaded square to request a reveal.' : 'Drag only your token to request DM placement. Tap a glowing star to request exploration.';
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
      if(actionDraft){marker.classList.toggle('targeted',actionDraft.targetIds.includes(token.id));marker.addEventListener('click',()=>{actionDraft.targetIds=actionDraft.targetIds.includes(token.id)?actionDraft.targetIds.filter(id=>id!==token.id):[...actionDraft.targetIds,token.id];persistPrepared();renderActionComposer();renderMap(latest);});}
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
  const tourSteps=[['Confirm your character','Check the name and HP at the top. Sheet has your full character. If the name is wrong, open Connection & saved sheet → Saved sheet & joining.','sheet'],['Find your actions','Home becomes My turn in combat. Request action sends an intent for DM review; it does not spend resources. Prepare next turn saves a private draft and never sends automatically.','table'],['Roll dice','Quick dice sends only a roll, not an action or resource use. Saving throws and initiative accept physical totals when requested. Nothing rolls until you press its roll button.','table'],['Request movement','When map input is open, drag only your own token to request movement. The DM decides placement; dragging does not move it immediately. Close an action draft before dragging: map taps in a draft choose targets. Exploration and destination requests also wait for DM approval.','table'],['Read private clues','Journal contains shared quests, your character quests and clues sent to you. Use Share with party deliberately; private clues are yours until shared.','clues']];
  function tourKey(){return 'echo-phone-tour-v1:'+tourOwner;}
  function renderTour(view){if(!view.character?.id||offline)return;let panel=$('phone-walkthrough');if(!panel){panel=el('section');panel.id='phone-walkthrough';panel.className='card phone-walkthrough';$('play').prepend(panel);const help=el('button','Phone walkthrough');help.type='button';help.onclick=()=>{tourStep=0;tourOpen=true;renderTour(latest);};const tools=document.querySelector('.connection-tools details');if(tools)tools.append(help);else document.querySelector('.phone-tabs').after(help);}
    if(tourOwner!==view.character.id){tourOwner=view.character.id;tourStep=0;try{tourOpen=localStorage.getItem(tourKey())!=='done'&&localStorage.getItem(tourKey()+':table:'+code)!=='skipped';}catch{tourOpen=true;}}
    panel.hidden=!tourOpen;if(!tourOpen)return;panel.replaceChildren();const [title,message,tab]=tourSteps[tourStep];panel.append(el('small',`PHONE WALKTHROUGH · ${tourStep+1} / ${tourSteps.length}`),el('h3',title),el('p',message));
    const add=(label,fn)=>{const b=el('button',label);b.type='button';b.onclick=fn;panel.append(b);};add('Show me where',()=>{selectTab(tab);const target=tourStep===2?document.querySelector('.dice-card'):tourStep===3?$('phone-map'):tourStep===1?$('turn-guide'):$(tab+'-panel');target?.scrollIntoView({block:'start',behavior:'smooth'});});if(tourStep)add('Back',()=>{tourStep--;renderTour(latest);});add(tourStep===4?'Finish':'Next',()=>{if(tourStep===4){tourOpen=false;try{localStorage.setItem(tourKey(),'done');}catch{}}else tourStep++;renderTour(latest);});add('Skip for now',()=>{tourOpen=false;try{localStorage.setItem(tourKey()+':table:'+code,'skipped');}catch{}renderTour(latest);});
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
    connection(`${view.session || 'Campaign session'} · Connected`,'connected');
    for (const button of document.querySelectorAll('[data-quick-roll], #roll-custom')) button.disabled = view.rehearsal === true;
    globalThis.ECHO_PHONE_PLAYER_TOOLS?.render(view);
    globalThis.ECHO_PHONE_TRAVEL?.render(view);
    renderAtlas(view);
    loadPrepared(view);refreshDraftFeedback();renderCharacter(view); renderCombatPrompts(view); renderInitiative(view); renderMap(view); renderTurnGuide(view); renderActionRequests(view); renderClues(view); renderLoot(view); globalThis.ECHO_PHONE_DUNGEON?.render(view);
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
  function showFreshness(){$('reconnect-phone').hidden=!offline;const saved=readSaved(),at=offline?(saved?.at||lastSynced):(lastSynced||saved?.at),revision=offline?(saved?.revision??lastRevision):latest?.revision;$('sheet-freshness').textContent=at?`${offline?'Offline copy':'Last synced'} · ${new Date(at).toLocaleString()}${Number.isInteger(revision)&&revision>=0?' · update '+revision:''}${offline?' · requests paused':''}`:'No saved sheet yet.';}
  function showCachedSheet(){const saved=readSaved();if(!saved)return false;offline=true;lastSynced=saved.at;lastRevision=Number.isInteger(saved.revision)?saved.revision:lastRevision;joined=true;$('join').hidden=true;$('play').hidden=false;render({character:saved.character,session:saved.session,tokens:[],turn:{},playerTools:{},actionProtocol:0,playerToolsProtocol:0});connection('Offline saved sheet · live values resume after reconnecting.','offline');selectTab('sheet');showFreshness();return true;}
  globalThis.ECHO_PHONE_PLAYER_TOOLS?.init({action,openActionRequest,offline:()=>offline});
  globalThis.ECHO_PHONE_TRAVEL?.init({action,offline:()=>offline});
  globalThis.ECHO_PHONE_DUNGEON?.init({action,offline:()=>offline});
  $('reconnect-phone').addEventListener('click',()=>refresh());
  $('rejoin-phone').addEventListener('click',()=>showJoin('Scan the current QR code if this join link has expired.'));
  $('show-saved-sheet').addEventListener('click',()=>{if(!showCachedSheet())$('sheet-freshness').textContent='Connect once to save a character sheet.';});
  $('forget-saved-sheet').addEventListener('click',()=>{try{localStorage.removeItem('echo-phone-sheet-v1');}catch{}lastSynced='';showFreshness();});
  const phoneNavigation=document.querySelector('.phone-tabs');if(phoneNavigation&&typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(()=>{document.body.style.setProperty('--phone-nav-height',(phoneNavigation.getBoundingClientRect().height+12)+'px');document.body.style.setProperty('--phone-alert-height',($('phone-priority').getBoundingClientRect().height||64)+'px');});observer.observe(phoneNavigation);observer.observe($('phone-priority'));}
  window.addEventListener('online',()=>refresh());document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});showFreshness();

  $('tab-table').addEventListener('click', () => selectTab('table'));
  $('tab-explore').addEventListener('click', () => selectTab('explore'));
  $('phone-priority').addEventListener('click',()=>openPhoneTask($('phone-priority').dataset.target,$('phone-priority').dataset.focus));
  $('tab-sheet').addEventListener('click', () => selectTab('sheet'));
  $('phone-quests-shortcut').addEventListener('click',()=>{selectTab('clues');window.scrollTo(0,0);});
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
      const viewSignature=JSON.stringify(view);
      if(latest?.character?.id && latest.character.id!==view.character?.id){actionDraft=null;renderActionComposer();phoneFeedback.length=0;$('phone-feedback-history').replaceChildren();$('phone-feedback-current').textContent='';$('phone-feedback-summary').textContent='Updates';lastAttentionKeys=new Set();waitingSignature='';lastSheetSignature='';lastTurnKey='';lastReply='';initiativeManualDraft='';localStorage.removeItem('echo-phone-sheet-v1');}
      joined = true; $('join').hidden = true; $('play').hidden = false;
      lastSynced=new Date().toISOString();const cacheSignature=JSON.stringify(view.character);if(cacheSignature!==lastCachedSignature||Date.now()-lastCachedAt>30000){try{localStorage.setItem('echo-phone-sheet-v1',JSON.stringify({character:view.character,session:view.session,revision:view.revision,at:lastSynced}));lastCachedSignature=cacheSignature;lastCachedAt=Date.now();}catch{}}
      if (offline || view.revision !== lastRevision || view.resyncRequest !== lastResyncRequest || viewSignature !== lastViewSignature) { offline = false; lastRevision = view.revision; lastResyncRequest = view.resyncRequest; render(view); lastViewSignature=viewSignature; $('play').dataset.appliedRevision=String(view.revision); $('play').dataset.characterId=view.character?.id||''; }
      else connection(`${view.session || 'Campaign session'} · Connected`,'connected');
      await request('/api/seen',{revision:view.revision,characterId:view.character?.id});
      showFreshness();
    } catch (error) {
      offline = true;
      connection(latest ? `Connection lost · Last sheet remains available. Rolls and requests are paused. ${/join|unavailable|closed/i.test(error.message) ? 'Scan the new QR code to rejoin.' : ''}` : error.message,'offline');
      if(latest){renderTurnGuide(latest);renderPriority(latest);}refreshDraftFeedback();showFreshness();globalThis.ECHO_PHONE_PLAYER_TOOLS?.render(latest||{character:{id:'',spells:[]}});globalThis.ECHO_PHONE_TRAVEL?.render(latest||{});globalThis.ECHO_PHONE_DUNGEON?.render(latest||{});renderAtlas(latest||{});
      for (const button of document.querySelectorAll('#table-panel button, #clues-panel button, #loot-panel button, #sheet-panel .sheet-action-buttons button, #spell-results button')) if(!button.dataset.localDraft&&!button.dataset.localControl)button.disabled = true;
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
  // Quicker combat/request feedback; keep the quieter exploration polling cadence.
  const pollAgain=()=>{const active=!offline&&(!!latest?.turn?.activeId||(latest?.actionRequests||[]).some(r=>['waiting','needs clarification','approved'].includes(r.status)));setTimeout(async()=>{try{if(joined)await refresh();else if(code&&!$('join').hidden&&!$('character-choices').childElementCount)await showJoin();}catch{connection('Connection unavailable · reconnect to resume','offline');}finally{pollAgain();}},active?450:950);};
  pollAgain();
})();
