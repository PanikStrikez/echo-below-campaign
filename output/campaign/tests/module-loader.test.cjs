'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { app, manifest, loadedScripts, assertPrivateModules } = require('../tools/test-support.cjs');

test('actual DM loader follows manifest order with all declared dependencies present', async () => {
  const modules = manifest(), files = await loadedScripts();
  assert.equal(new Set(modules.ordered).size,modules.ordered.length);
  for (const file of modules.ordered) assert(fs.existsSync(path.join(app,file)),file);
  assert.deepEqual(files.filter(file=>modules.ordered.includes(file)),Array.from(modules.ordered));
  assert(files.indexOf('Echo-Below-Table-Content.js') < files.indexOf('Session-01-Battleboard.js'));
});
test('player loader excludes every DM module and extracted campaign content', async () => {
  await assertPrivateModules([...manifest().ordered,'Echo-Below-Table-Content.js','Campaign-Engine-UI.js']);
  const files=await loadedScripts(true);
  assert(!files.includes('Campaign-Module-Manifest.js'));
  assert.equal(files.at(-1),'Session-01-Battleboard.js');
});
test('classic fallback remains explicit and does not load the hybrid presentation shell', async () => {
  const files=await loadedScripts(false,true);
  assert(files.includes('Session-01-Cockpit-Classic.js'));
  assert(!files.includes('Session-01-Hybrid-UI.js'));
  await assertPrivateModules(['Session-01-Rules-Index.js','Session-01-Town-Maps.js']);
});

test('blank and fictional example select reusable dependencies without requesting Echo catalogs',async()=>{
 for(const start of ['blank','example']){
  const files=await loadedScripts(false,false,start),modules=manifest();
  for(const file of modules.reusable)assert(files.includes(file),file);
  for(const file of ['Echo-Below-Table-Content.js','Session-01-Party-Data.js','Campaign-Quests-Data.js','Campaign-Atlas-Data.js','Session-01-Story-Data.js','AI-Plugin-Auditions.js'])assert(!files.includes(file),file);
 }
});
