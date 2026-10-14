/* Pure, revision-checked session commands. No DOM, storage, or player transport. */
(() => {
  'use strict';
  const copy = value => structuredClone(value);
  const revision = state => Number.isSafeInteger(state?.commandRevision) ? state.commandRevision : 0;
  const token = (state, id) => state.tokens.find(item => item.id === id);
  const unique = values => [...new Set(values || [])];

  function prepare(state, command, helpers = {}) {
    if (!state || !command || typeof command !== 'object') throw Error('Choose an action to review.');
    const baseRevision = revision(state);
    if (command.expectedRevision !== undefined && command.expectedRevision !== baseRevision)
      throw Error('The table changed. Review this action again.');
    let next = copy(state), label = '', effects = [];
    if (command.type === 'move-token') {
      const actor = token(state, command.actorId);
      if (!actor?.placed || actor.scene !== state.scene) throw Error('Choose a token on this map.');
      const group = command.groupIds?.length ? command.groupIds : [actor.id];
      const movers = unique(group).map(id => token(state, id)).filter(item => item?.placed && item.scene === state.scene);
      if (!movers.some(item => item.id === actor.id)) throw Error('The selected token is no longer in this group.');
      const dx = Number(command.x) - actor.x, dy = Number(command.y) - actor.y;
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw Error('Choose a valid map position.');
      const names = [], notes = [];
      for (const item of movers) {
        const end = { x: helpers.pointValue(item.x + dx), y: helpers.pointValue(item.y + dy) };
        const result = globalThis.ECHO_COMBAT_PLUS.placeToken(next, item.id, end, command.columns);
        next = result.state;
        if (result.changed) names.push(item.name);
        notes.push(...result.notes);
      }
      if (!names.length) return { baseRevision, next: state, changed: false, label: '', effects: [] };
      label = `Moved ${names.join(', ')}`;
      effects = [`${names.join(', ')} moved`, ...unique(notes)];
    } else if (command.type === 'reviewed-damage') {
      const draft = command.draft;
      if (!draft || !['damage', 'heal'].includes(draft.mode) || !Array.isArray(draft.selected) || !draft.selected.length)
        throw Error('Review the damage or healing targets first.');
      const changed = [];
      for (const id of unique(draft.selected)) {
        const target = token(next, id);
        if (!target) throw Error('A selected target is no longer available. Review the damage again.');
        const record = next.combat.tokens[id] ||= globalThis.ECHO_COMBAT_DATA.creatureDefense(target.type, next.combat.creatures);
        const ruling = draft.overrides?.[id] || 'recorded';
        if (!['recorded', 'normal', 'resist', 'vulnerable', 'immune'].includes(ruling)) throw Error('Choose a valid defense ruling.');
        const defense = ruling === 'recorded' ? record : {
          resistances: ruling === 'resist' ? draft.type : '',
          vulnerabilities: ruling === 'vulnerable' ? draft.type : '',
          immunities: ruling === 'immune' ? draft.type : ''
        };
        const amount = draft.amounts?.[id] ?? draft.amount;
        const result = globalThis.ECHO_COMBAT_DATA.damagePreview(target, amount, draft.type, draft.mode, defense);
        target.hp = result.hp; target.tempHp = result.tempHp;
        const condition = draft.conditions?.[id];
        if (condition) {
          if (!helpers.conditions.includes(condition)) throw Error('Choose a valid condition.');
          target.conditions = unique([...target.conditions, condition]);
        }
        if (draft.mode === 'damage' && result.adjusted > 0 && record.concentration) {
          if (target.hp === 0) {
            record.concentration = '';
            target.conditions = target.conditions.filter(value => value !== 'Concentrating');
          } else next.combat.effects.push({ id: `effect-${Date.now()}-${Math.random()}`, tokenId: id,
            name: `Concentration save DC ${Math.max(10, Math.floor(result.adjusted / 2))}`,
            condition: '', triggerActor: id, triggerPoint: 'start', remaining: 0,
            repeatSave: false, due: true, fired: true, note: 'Resolve now; this is a reminder, not automatic damage.' });
        }
        if (next.party[id]) { next.party[id].hp = target.hp; next.party[id].tempHp = target.tempHp; }
        changed.push(`${target.name} ${target.hp} HP`);
      }
      label = `${draft.mode === 'heal' ? 'Healed' : 'Damaged'}: ${changed.join(', ')}`;
      effects = changed;
    } else if (command.type === 'resolve-combat-action') {
      const review=command.review;
      if(!review||review.baseRevision!==baseRevision)throw Error('The table changed. Review this action again.');
      next=globalThis.ECHO_COMBAT_ACTIONS.apply(state,review,helpers.visible);
      label='Resolved combat action';
      effects=review.patches.map(p=>`${p.kind} ${p.field}: ${JSON.stringify(p.before)} → ${JSON.stringify(p.after)}`);
    } else if (command.type === 'spend-resource') {
      const sheet = next.party?.[command.characterId];
      const pool = sheet?.resources?.find(item => item.id === command.resourceId);
      const cost = Number(command.cost);
      if (!pool || !Number.isSafeInteger(cost) || cost < 1 || !Number.isFinite(pool.current) || pool.current < cost)
        throw Error('That resource is unavailable or has too few uses. Review the sheet.');
      pool.current -= cost;
      label = `${sheet.name} used ${command.label || pool.name}`;
      effects = [`${pool.name}: ${pool.current}/${pool.max ?? '?'}`];
    } else throw Error('This action is not available through the command layer.');
    return { baseRevision, next, changed: true, label, effects };
  }

  function apply(state, prepared) {
    if (!prepared?.changed) return state;
    if (revision(state) !== prepared.baseRevision) throw Error('The table changed. Review this action again.');
    return prepared.next;
  }

  function prepareStory(story, command, context = {}) {
    const baseRevision = revision(story);
    if (command.expectedRevision !== undefined && command.expectedRevision !== baseRevision)
      throw Error('The campaign record changed. Review this publication again.');
    const next = copy(story);
    let label = '', effects = [];
    if (command.type === 'publish-clue') {
      const clue = next.evidence?.find(item => item.id === command.id);
      if (!clue) throw Error('This clue is no longer available.');
      if (command.published && (!clue.title?.trim() || !clue.playerSaw?.trim()))
        throw Error('Add a title and player-safe observation before publishing.');
      if (clue.published === command.published) return { baseRevision, next:story, changed:false, label:'', effects:[] };
      const before = clue.published === true;
      clue.published = command.published === true;
      next.clueEvents ||= [];
      next.clueEvents.push({id:clue.id,title:clue.title,before,after:clue.published,at:new Date().toISOString()});
      next.clueEvents = next.clueEvents.slice(-30);
      label = `${clue.published ? 'Published' : 'Unpublished'} clue: ${clue.title}`;
      effects = [`Player journal: ${clue.published ? 'show' : 'hide'} ${clue.title}`];
    } else if (command.type === 'undo-clue-publication') {
      const event = next.clueEvents?.at(-1),clue = next.evidence?.find(item=>item.id===event?.id);
      if (!event || !clue || clue.published !== event.after) throw Error('The last clue publication cannot be undone safely.');
      clue.published = event.before;
      next.clueEvents.pop();
      label = `Undid clue publication: ${clue.title}`;
      effects = [`Player journal: ${clue.published ? 'show' : 'hide'} ${clue.title}`];
    } else if (command.type === 'confirm-outcome') {
      const outcome = globalThis.ECHO_OUTCOMES.apply(next.continuity, command.draftId, command.review,
        { ...context, story:next });
      label = `Confirmed outcome: ${outcome.title}`;
      effects = [`${outcome.status}: ${outcome.title}`,
        outcome.share === 'party' ? 'Party journal will update.' : outcome.recipients?.length ? 'Owner-only phone entries will update.' : 'DM record only.'];
    } else throw Error('This campaign action is not available through the command layer.');
    return { baseRevision, next, changed:true, label, effects };
  }

  function applyStory(story, prepared) {
    if (!prepared?.changed) return story;
    if (revision(story) !== prepared.baseRevision) throw Error('The campaign record changed. Review this action again.');
    return prepared.next;
  }

  globalThis.ECHO_COMMANDS = { revision, prepare, apply, prepareStory, applyStory };
})();
