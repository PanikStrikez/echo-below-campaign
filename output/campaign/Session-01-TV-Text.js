(() => {
  'use strict';
  const POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
  const cut = (value, max) => String(value ?? '').slice(0, max);
  const $ = id => document.getElementById(id);
  function normalizeCards(raw) {
    return (Array.isArray(raw) ? raw : []).slice(0, 8).filter(card => card && typeof card === 'object').map((card, index) => ({
      id: /^[a-z0-9-]{1,80}$/i.test(card.id) ? card.id : `text-${index}`,
      title: cut(card.title, 100), text: cut(card.text, 3000),
      position: POSITIONS.includes(card.position) ? card.position : 'top-left',
      visible: card.visible === true
    })).filter(card => card.title || card.text);
  }
  function publicCards(cards) {
    return normalizeCards(cards).filter(card => card.visible).map(({ id, title, text, position }) => ({ id, title, text, position, visible: true }));
  }
  let host;
  function add(title, value) {
    const text = cut(value, 3000).trim();
    if (!text) { host.toast('Write player-facing text first.'); return false; }
    const cards = host.cards();
    if (cards.length >= 8) { host.toast('Remove an old TV text card before adding another.'); return false; }
    const occupied = new Set(cards.filter(card => card.visible).map(card => card.position));
    const position = POSITIONS.find(slot => !occupied.has(slot)) || 'top-left';
    cards.push({ id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: cut(title, 100).trim(), text, position, visible: true });
    host.commit(`Show text on TV: ${cut(title || text, 80)}`);
    return true;
  }
  function renderDM() {
    if (!host) return;
    const cards = host.cards(), list = $('tv-text-list');
    if (!list) return;
    list.replaceChildren();
    $('tv-text-count').textContent = `${cards.filter(card => card.visible).length} on TV`;
    $('tv-text-hide-all').disabled = !cards.some(card => card.visible);
    if (!cards.length) { const empty = document.createElement('p'); empty.className = 'help'; empty.textContent = 'No text cards on the TV. Send read-aloud, a clue, or your own text.'; list.append(empty); }
    for (const card of cards) {
      const row = document.createElement('div'); row.className = 'tv-text-row';
      const preview = document.createElement('div');
      const name = document.createElement('strong'); name.textContent = card.title || 'Untitled text';
      const body = document.createElement('small'); body.textContent = card.text;
      preview.append(name, body); row.append(preview);
      const controls = document.createElement('div'); controls.className = 'button-row';
      const position = document.createElement('select'); position.setAttribute('aria-label', `Position for ${card.title || 'text'}`);
      for (const slot of POSITIONS) { const option = document.createElement('option'); option.value = slot; option.textContent = slot.replace('-', ' '); position.append(option); }
      position.value = card.position;
      position.addEventListener('change', () => { card.position = position.value; host.commit(`Moved TV text: ${card.title || 'Untitled'}`); });
      controls.append(position);
      const toggle = document.createElement('button'); toggle.type = 'button'; toggle.textContent = card.visible ? 'Hide' : 'Show';
      toggle.addEventListener('click', () => { card.visible = !card.visible; host.commit(`${card.visible ? 'Show' : 'Hide'} TV text: ${card.title || 'Untitled'}`); });
      controls.append(toggle);
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove';
      remove.addEventListener('click', () => { const index = cards.findIndex(item => item.id === card.id); if (index >= 0) cards.splice(index, 1); host.commit(`Removed TV text: ${card.title || 'Untitled'}`); });
      controls.append(remove); row.append(controls); list.append(row);
    }
  }
  function renderPlayer(cards, mainQuest) {
    let questRoot=$('player-main-quest');
    const textRoot=$('player-text-cards');
    if(!questRoot&&textRoot?.parentElement){questRoot=document.createElement('aside');questRoot.id='player-main-quest';questRoot.className='player-main-quest';questRoot.setAttribute('aria-label','Main quest');textRoot.parentElement.append(questRoot);}
    if(questRoot){const signature=JSON.stringify(mainQuest||null);if(questRoot.dataset.quest!==signature){questRoot.dataset.quest=signature;questRoot.replaceChildren();questRoot.hidden=!mainQuest;if(mainQuest){const label=document.createElement('small');label.textContent='MAIN QUEST';const title=document.createElement('h2');title.textContent=mainQuest.title;const body=document.createElement('p');body.textContent=mainQuest.text;questRoot.append(label,title,body);}}}

    const root = $('player-text-cards'); if (!root) return;
    root.replaceChildren();
    const shown = publicCards(cards);
    root.hidden = !shown.length;
    if (!shown.length) return;
    for (const slot of POSITIONS) {
      const entries = shown.filter(card => card.position === slot);
      if (!entries.length) continue;
      const area = document.createElement('div'); area.className = `tv-text-slot ${slot}`;
      for (const card of entries) {
        const article = document.createElement('article'); article.className = 'tv-player-text';
        if (card.title) { const title = document.createElement('h2'); title.textContent = card.title; article.append(title); }
        const body = document.createElement('p'); body.textContent = card.text; article.append(body); area.append(article);
      }
      root.append(area);
    }
  }
  function initDM(options) {
    host = options;
    $('tv-text-add').addEventListener('click', () => {
      if (add($('tv-text-title').value, $('tv-text-body').value)) { $('tv-text-title').value = ''; $('tv-text-body').value = ''; }
    });
    $('tv-text-hide-all').addEventListener('click', () => {
      if (!host.cards().some(card => card.visible)) return;
      for (const card of host.cards()) card.visible = false;
      host.commit('Hide all TV text');
    });
  }
  globalThis.ECHO_TV_TEXT = { POSITIONS, normalizeCards, publicCards, initDM, add, renderDM, renderPlayer };
})();
