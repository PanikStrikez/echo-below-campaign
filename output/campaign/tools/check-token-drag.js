const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(process.env.ECHO_TEST_BOARD_SOURCE || path.join(__dirname, '..', 'Session-01-Battleboard.js'), 'utf8');
const start = source.indexOf('  function placeTokensDirect(');
const end = source.indexOf('\n  function revealTile(', start);
assert(start >= 0 && end > start, 'Direct token placement and drag handlers are available');
const handlers = source.slice(start, end);

function simulate(tool, drag, group = []) {
  const calls = [];
  const state = { scene: 'road', map: { group }, tokens: [
    { id: 'pc-pebble', name: 'Pebble', x: 10, y: 20, scene: 'road', placed: true },
    { id: 'enemy-test', name: 'Guard', x: 35, y: 40, scene: 'road', placed: true }
  ] };
  const element = {
    style: {}, handlers: {}, setPointerCapture() {},
    addEventListener(name, callback) { this.handlers[name] = callback; },
    removeEventListener(name) { delete this.handlers[name]; }
  };
  const context = {
    state, activeMapTool: tool, contextTab: 'turn', MAP_SQUARES_ACROSS: 20,
    pointValue(value) { return Math.max(0, Math.min(100, value)); },
    mapPoint(event) { return { x: event.clientX, y: event.clientY }; },
    getScene() { return { gridColumns: 20 }; },
    commit(label) { calls.push(`commit:${label}`); },
    renderStage() { calls.push('render'); },
    renderContextSidebar() { calls.push('sidebar'); },
    openCombatCard() { calls.push('card'); },
    toast(message) { calls.push(`toast:${message}`); },
    ECHO_COMBAT_RUN: { target() { calls.push('target'); } },
    beginMapTool() { calls.push('measurement'); },
    ECHO_COMBAT_PLUS: { placeToken(value, id, destination) {
      const next = structuredClone(value), token = next.tokens.find(item => item.id === id);
      const changed = token.x !== destination.x || token.y !== destination.y;
      token.x = destination.x; token.y = destination.y;
      return { state: next, changed, notes: [] };
    } }
  };
  context.getToken = id => context.state.tokens.find(token => token.id === id);
  context.structuredClone = structuredClone;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../Session-01-Commands.js'),'utf8') + `\n${handlers}\nthis.beginTokenDrag = beginTokenDrag;`, context);
  const down = { button: 0, pointerId: 1, clientX: 10, clientY: 20,
    preventDefault() {}, stopPropagation() { calls.push('stopped-map-tool'); } };
  context.beginTokenDrag(down, element, state.tokens[0], {}, 'dm');
  if (!element.handlers.pointerup) return { calls, state: context.state };
  if (drag) element.handlers.pointermove({ clientX: 24, clientY: 28 });
  element.handlers.pointerup({ type: 'pointerup', clientX: drag ? 24 : 10, clientY: drag ? 28 : 20 });
  return { calls, state: context.state };
}

for (const tool of ['move', 'target', 'ping']) {
  const result = simulate(tool, true);
  assert(result.calls.includes('stopped-map-tool'), `${tool} cannot start a ruler or shape`);
  assert.equal(result.calls.filter(call => call.startsWith('commit:')).length, 1, `${tool} drag saves once`);
  assert.equal(result.state.tokens[0].x, 24, `${tool} moves the token immediately`);
  assert.equal(result.state.tokens[0].y, 28, `${tool} moves the token immediately`);
  assert.equal(result.calls.includes('target'), false, `${tool} drag does not target`);
}
for (const tool of ['ruler','circle','cone','square','line']) {
  const result = simulate(tool,true);
  assert(result.calls.includes('measurement'), `${tool} uses the explicitly selected measurement tool`);
  assert.equal(result.state.tokens[0].x,10,'Measurement does not move tokens');
  assert.equal(result.calls.some(call=>call.startsWith('commit:')),false);
}
const grouped = simulate('move', true, ['pc-pebble', 'enemy-test']);
assert.equal(grouped.state.tokens[1].x, 49, 'Selected group moves with the dragged token');
assert.equal(grouped.state.tokens[1].y, 48, 'Selected group keeps its offset');
assert(simulate('target', false).calls.includes('target'), 'Target click still targets');
assert(simulate('move', false).calls.includes('card'), 'Token click still opens its card');
console.log('Direct token drag passed: free movement saves once, explicit measurement stays separate, grouped tokens move, and clicks keep their actions.');
