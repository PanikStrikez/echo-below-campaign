/* Private, pure expedition-return review. Existing dungeon saves remain authoritative. */
(() => {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const list = value => Array.isArray(value) ? value : [];
  const pcIds = value => Object.entries(value.party || {}).filter(([id, sheet]) =>
    sheet && (sheet.role === 'pc' || (!sheet.role && list(value.tokens).some(t => t.id === id && t.team === 'pc')))).map(([id]) => id);
  const positions = value => ({ placed: value?.placed === true, visible: value?.visible !== false,
    scene: String(value?.scene || ''), x: Number.isFinite(value?.x) ? value.x : 50, y: Number.isFinite(value?.y) ? value.y : 50 });
  function pointRecord(record = {}) {
    return { id: record.id || '', sessionId: record.sessionId || '', phase: record.phase || '',
      awayMinutes: record.phase === 'away' ? Number(record.awayMinutes || 0) : 0,
      retreat: record.retreat ? clone(record.retreat) : null };
  }
  function durable(value) {
    const { undoStack, redoStack, sessionLog, ping, assets, ...result } = value;
    return result;
  }
  // Transient pings and undo history do not invalidate a review; changed world/party data does.
  const fingerprint = (current, target, record) => JSON.stringify([durable(current), durable(target), pointRecord(record)]);
  function mapExists(target, id) {
    if (!id) return false;
    if (target.sessionKind === 'custom') return list(target.scenes).some(s => s.id === id && s.kind === 'map');
    return ['road', 'approach', 'interior'].includes(id) || Object.hasOwn(target.map?.scenes || {}, id);
  }
  function validate(current, target, record) {
    if (!current || !target || !Array.isArray(current.tokens) || !Array.isArray(target.tokens)) throw Error('Open valid current and expedition saves before reviewing a return.');
    if (list(current.turn?.order).length || list(target.turn?.order).length) throw Error('End combat in both saves before resuming an expedition.');
    if (current.combatRun?.initiativePrompt?.open || target.combatRun?.initiativePrompt?.open) throw Error('Close initiative collection before resuming an expedition.');
    for (const value of [current, target]) if (new Set(value.tokens.map(t => t.id)).size !== value.tokens.length) throw Error('Resolve duplicate token IDs before returning.');
    if (!Number.isSafeInteger(record.awayMinutes) || record.awayMinutes < 0 || record.awayMinutes > 10000000) throw Error('Review the elapsed time away before returning.');
    const ids = pcIds(current);
    if (!ids.length) throw Error('The current save has no player characters to carry into this expedition.');
    for (const id of ids) {
      const source = current.tokens.find(t => t.id === id), existing = target.tokens.find(t => t.id === id);
      if (source && source.team !== 'pc' || existing && existing.team !== 'pc') throw Error('A character ID belongs to a non-player token. Resolve that conflict before returning.');
      if (target.party?.[id]?.role && target.party[id].role !== 'pc') throw Error('A character ID belongs to a non-player sheet in the expedition save.');
    }
    const retreat = record.phase === 'away' ? record.retreat : null;
    if (retreat?.scene && !mapExists(target, retreat.scene)) throw Error('The saved retreat map is unavailable. Review the retreat position first.');
    const points = list(retreat?.positions);
    if (new Set(points.map(p => p.id)).size !== points.length) throw Error('The retreat contains duplicate character positions. Review it first.');
    for (const p of points.filter(p => ids.includes(p.id))) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100 ||
        (p.placed && !mapExists(target, p.scene))) throw Error('A saved retreat position is invalid. Review the retreat point first.');
    }
    const added = ids.filter(id => !target.tokens.some(t => t.id === id));
    if (target.tokens.length + added.length > 250) throw Error('The expedition is at its token limit. Remove an unused token before returning.');
    return ids;
  }
  function previewMerge(current, target, rawRecord = {}) {
    const record = pointRecord(rawRecord), ids = validate(current, target, record), warnings = [];
    const retreat = record.phase === 'away' ? record.retreat : null;
    const people = ids.map(id => {
      const sheet = current.party[id], old = target.party?.[id], source = current.tokens.find(t => t.id === id);
      const existing = target.tokens.find(t => t.id === id), point = list(retreat?.positions).find(p => p.id === id);
      if (!source) warnings.push(`${sheet.name || id}: no current token; token statistics will come from the current sheet.`);
      const location = positions(point || existing);
      if (!point && !existing) warnings.push(`${sheet.name || id}: new to this saved expedition; place the token manually after returning.`);
      return { id, name: sheet.name || source?.name || id, added: !existing,
        previousHp: old?.hp ?? existing?.hp ?? null, hp: sheet.hp ?? source?.hp ?? null,
        maxHp: sheet.maxHp ?? source?.maxHp ?? null, tempHp: sheet.tempHp ?? source?.tempHp ?? 0,
        resources: clone(sheet.resources || []), concentration: sheet.concentration || '',
        conditions: clone(sheet.conditions || source?.conditions || []), position: location,
        positionSource: point ? 'saved retreat' : existing ? 'saved dungeon position' : 'unplaced',
        changed: JSON.stringify(old) !== JSON.stringify(sheet) };
    });
    for (const t of target.tokens.filter(t => t.team === 'pc' && !ids.includes(t.id)))
      warnings.push(`${t.name}: absent from the current party; the earlier saved character remains unchanged. Review the roster if needed.`);
    const waveReturn = target.contentPackId === 'lmop-part-4-visuals' && record.phase === 'away';
    return { version: 1, record, fingerprint: fingerprint(current, target, record), people, warnings,
      scene: retreat?.scene || target.scene, runbook: retreat?.runbook || target.runbook,
      awayMinutes: record.awayMinutes, waveMinutes: waveReturn ? record.awayMinutes : 0,
      preserved: { enemies: target.tokens.filter(t => t.team !== 'pc').length, fog: true, maps: true, rooms: true },
      note: 'Carry current character sheets and resources into this saved dungeon. No healing or rest benefits are granted; defeated inhabitants stay defeated. Review all return positions before applying.' };
  }
  function applyMerge(current, target, review, currentRecord = review?.record) {
    if (!review || review.version !== 1 || review.fingerprint !== fingerprint(current, target, currentRecord)) throw Error('The party, dungeon, or return record changed. Preview the return again.');
    const checked = previewMerge(current, target, currentRecord), ids = checked.people.map(p => p.id), next = clone(target);
    next.party ||= {}; next.combat ||= {}; next.combat.tokens ||= {};
    for (const person of checked.people) {
      const id = person.id, sheet = clone(current.party[id]), source = current.tokens.find(t => t.id === id), existing = next.tokens.find(t => t.id === id);
      const replacement = source ? clone(source) : { id, name: sheet.name || id, label: (sheet.name || '?').slice(0, 4), type: existing?.type || 'custom', team: 'pc', encounter: '',
        hp: sheet.hp ?? 0, maxHp: sheet.maxHp ?? 0, tempHp: sheet.tempHp || 0, ac: sheet.ac ?? null,
        exhaustion: sheet.exhaustion || 0, conditions: [...(sheet.conditions || []), ...(sheet.concentration ? ['Concentrating'] : [])], initiative: null };
      Object.assign(replacement, person.position, { initiative: null, team: 'pc' });
      if (existing) next.tokens[next.tokens.indexOf(existing)] = replacement; else next.tokens.push(replacement);
      next.party[id] = sheet;
      next.combat.tokens[id] = clone(current.combat?.tokens?.[id] || { surprised: false, reactionUsed: false, ready: '', concentration: sheet.concentration || '', resistances: '', vulnerabilities: '', immunities: '' });
      // Concentration is a current character property; never resurrect an old save's spell.
      next.combat.tokens[id].concentration = sheet.concentration || '';
      if (next.combatRun?.resources) {
        if (Object.hasOwn(current.combatRun?.resources || {}, id)) next.combatRun.resources[id] = clone(current.combatRun.resources[id]);
        else delete next.combatRun.resources[id];
      }
    }
    next.combat.effects = [...list(next.combat.effects).filter(e => !ids.includes(e.tokenId)), ...clone(list(current.combat?.effects).filter(e => ids.includes(e.tokenId)))];
    const retreat = checked.record.phase === 'away' ? checked.record.retreat : null;
    if (retreat?.scene) next.scene = retreat.scene;
    const beats = target.sessionKind === 'custom' ? list(target.runbookBeats) : list(globalThis.RUNBOOK);
    if (retreat?.runbook && beats.some(b => b.id === retreat.runbook)) next.runbook = retreat.runbook;
    if (target.contentPackId === 'lmop-part-4-visuals' && checked.record.phase === 'away' && next.waveEcho) {
      next.waveEcho.minutes = Math.min(10000000, (Number(next.waveEcho.minutes) || 0) + checked.waveMinutes);
      next.waveEcho.visit = Math.min(999, (Number(next.waveEcho.visit) || 1) + 1);
      next.waveEcho.phase = 'exploring';
      next.waveEcho.log = [...list(next.waveEcho.log), { label: 'Return · preserved dungeon state', minute: next.waveEcho.minutes, visit: next.waveEcho.visit }].slice(-100);
    }
    return next;
  }
  globalThis.ECHO_EXPEDITION_RESUME = { previewMerge, applyMerge };
})();
