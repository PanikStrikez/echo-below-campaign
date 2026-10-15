'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const app = path.resolve(__dirname, '..');

// Coordinator fixtures must load the same extracted seed adapter as the DM loader.
// Call after the fixture's chosen dependencies so the adapter sees those modules.
function loadTableContent() {
  require(path.join(app, 'Session-05-Phandalin-Aftermath.js'));
  const priorPacks = globalThis.ECHO_CONTENT_PACKS || [];
  const packs = path.join(app,'Session-Content-Packs.js');
  delete require.cache[require.resolve(packs)];
  require(packs);
  for (const pack of priorPacks) if (!globalThis.ECHO_CONTENT_PACKS.some(p=>p.id===pack.id)) globalThis.ECHO_CONTENT_PACKS.push(pack);
  const file = path.join(app, 'Echo-Below-Table-Content.js');
  delete require.cache[require.resolve(file)];
  require(file);
  assert.equal(typeof globalThis.ECHO_TABLE_CONTENT.defaultTokens, 'function');
}

function manifest() {
  const context = {};
  vm.runInNewContext(fs.readFileSync(path.join(app, 'Campaign-Module-Manifest.js'), 'utf8'), context);
  return context.ECHO_MODULES;
}

// Execute the real loader with an in-memory script element. Only the manifest is
// evaluated; other script requests are recorded and complete like a browser load.
async function loadedScripts(player = false, classic = false, start = "") {
  const files = [], failures = [];
  const context = {setTimeout,clearTimeout,URLSearchParams, location: { hash: player ? '#player' : '',search:start?'?start='+start:'' },
    localStorage: { getItem: () => classic ? 'true' : null },
    document: {
      createElement: () => ({}), body: { dataset:{}, prepend: node => failures.push(node.textContent) },
      head: { appendChild(script) {
        files.push(script.src);
        if (['Campaign-Module-Manifest.js','Session-01-Storage.js','Campaign-Boundary.js'].includes(script.src))
          vm.runInContext(fs.readFileSync(path.join(app, script.src), 'utf8'), sandbox);
        queueMicrotask(() => script.onload());
      } }
    }
  };
  const sandbox = vm.createContext(context);
  vm.runInContext(fs.readFileSync(process.env.ECHO_TEST_LOADER_SOURCE || path.join(app, 'Session-01-Loader.js'), 'utf8'), sandbox);
  for (let step = 0; step < 1000; step++) {
    await Promise.resolve();
    if (failures.length) throw Error(failures.join('\n'));
    if (files.at(-1) === 'Session-01-Battleboard.js') return files;
  }
  throw Error('The loader did not finish loading the table.');
}

async function assertPrivateModules(names) {
  const dm = await loadedScripts(), player = await loadedScripts(true);
  for (const name of names) {
    assert(dm.includes(name), `DM loader must load ${name}`);
    assert(!player.includes(name), `Player loader must exclude ${name}`);
  }
  return { dm, player };
}

module.exports = { app, loadTableContent, manifest, loadedScripts, assertPrivateModules };
