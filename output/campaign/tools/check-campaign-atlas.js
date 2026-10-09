/* Isolated model/security checks: no app server, browser storage or campaign files are changed. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');
const context = vm.createContext({location: {hash: ''}});
for (const name of ['Session-01-Travel.js', 'Campaign-Atlas.js']) vm.runInContext(fs.readFileSync(path.join(base, name), 'utf8'), context, {filename: name});
const A = context.ECHO_ATLAS, T = context.ECHO_TRAVEL;
const plain = value => JSON.parse(JSON.stringify(value));
const fixture = {
  schemaVersion: 1, rootBoardId: 'world',
  boards: [
    {id: 'world', title: 'Sword Coast', kind: 'world', image: 'SECRET-world-nine.png', publicImage: 'safe-world.png', publicImageApproved: true, viewBox: [0, 0, 100, 70], children: ['region-phandelver'], locationIds: ['phandalin', 'nine-hidden', 'rumor']},
    {id: 'region-phandelver', title: 'Phandelver', kind: 'region', parentId: 'world', image: 'SECRET-region.png', publicImage: 'safe-region.png', publicImageApproved: true, viewBox: [0, 0, 100, 70], children: ['town-phandalin'], locationIds: ['phandalin', 'tresendar', 'redbrand', 'nine-hidden', 'rumor']},
    {id: 'town-phandalin', title: 'Phandalin', kind: 'settlement', parentId: 'region-phandelver', locationId: 'phandalin', image: 'SECRET-town.png', publicImage: 'safe-town.png', publicImageApproved: true, children: ['site-redbrand'], locationIds: ['tresendar', 'redbrand']},
    {id: 'site-redbrand', title: 'Redbrand Hideout', kind: 'interior', parentId: 'town-phandalin', locationId: 'redbrand', image: 'SECRET-room-keys.png', publicImage: 'safe-redbrand.png', publicImageApproved: true, locationIds: []},
    {id: 'unreviewed', title: 'Unreviewed artwork', kind: 'region', parentId: 'world', image: 'SECRET-unreviewed.png', publicImage: 'SECRET-unreviewed-player.png', publicImageApproved: false},
    {id: 'ungated-interior', title: 'Missing gate', kind: 'interior', parentId: 'world', publicImage: 'safe-looking-but-hidden.png', publicImageApproved: true}
  ],
  locations: [
    {id: 'phandalin', name: 'Phandalin', type: 'settlement', travelId: 'region-phandalin', boardIds: ['world', 'region-phandelver'], placements: {world: {x: 40, y: 30}, 'region-phandelver': {x: 46.5, y: 67.8}}, publicDescription: 'A frontier town.', dmDescription: 'SECRET private truth', npcIds: ['SECRET-npc']},
    {id: 'tresendar', name: 'Tresendar Manor', travelId: 'region-tresendar', boardIds: ['town-phandalin', 'region-phandelver'], placements: {'town-phandalin': {x: 70, y: 20}, 'region-phandelver': {x: 53, y: 77.5}}},
    {id: 'redbrand', name: 'Redbrand Hideout', travelId: 'atlas-redbrand', boardIds: ['town-phandalin'], placements: {'town-phandalin': {x: 70, y: 22}}, dmDescription: 'SECRET prisoners and entrance', mapIds: ['SECRET-dm-map']},
    {id: 'nine-hidden', name: 'SECRET Hollow Mountain', travelId: 'atlas-nine', boardIds: ['world', 'region-phandelver'], placements: {world: {x: 90, y: 40}, 'region-phandelver': {x: 90, y: 40}}, notes: ['SECRET ninth trigger']},
    {id: 'rumor', name: 'Rumored observatory', travelId: 'atlas-rumor', boardIds: ['world', 'region-phandelver'], placements: {world: {x: 9, y: 41}, 'region-phandelver': {x: 9, y: 41}}, publicDescription: 'SECRET precise bearings even though this is a rumor', dmDescription: 'SECRET sealed contents'}
  ],
  routes: [
    {id: 'safe-route', boardId: 'region-phandelver', from: 'phandalin', to: 'tresendar', public: true, points: [{x: 46.5, y: 67.8}, {x: 53, y: 77.5}]},
    {id: 'SECRET-hidden-route', boardId: 'world', from: 'phandalin', to: 'nine-hidden', public: true, points: [{x: 40, y: 30}, {x: 90, y: 40}]},
    {id: 'SECRET-rumor-route', boardId: 'world', from: 'phandalin', to: 'rumor', public: true, points: [{x: 40, y: 30}, {x: 9, y: 41}]},
    {id: 'SECRET-dm-route', boardId: 'region-phandelver', from: 'phandalin', to: 'tresendar', public: false}
  ]
};
const travel = plain(T.normalize());
const originalExisting = JSON.stringify(travel);
const definitions = A.mergeTravelDefinitions(T.definitions, fixture);
assert.equal(definitions.find(row => row.id === 'region-phandalin').status, 'visited');
assert.equal(definitions.find(row => row.id === 'region-phandalin').x, 46.5, 'Existing travel coordinates remain authoritative');
assert.equal(definitions.find(row => row.id === 'atlas-redbrand').status, 'hidden');
for (const row of definitions) if (!travel.places.some(old => old.id === row.id)) travel.places.push(plain(row));
travel.places.find(row => row.id === 'atlas-rumor').status = 'rumored';
const before = JSON.stringify(travel), dataBefore = JSON.stringify(fixture);

// Canonical drill-down uses the same parent chain, independently of discovery.
assert.deepEqual(plain(A.breadcrumbs(fixture, 'site-redbrand').map(row => row.id)), ['world', 'region-phandelver', 'town-phandalin', 'site-redbrand']);
assert.equal(A.children(fixture, 'world')[0].id, 'region-phandelver');
assert(A.gate(fixture, travel, 'world').allowed);
assert(A.gate(fixture, travel, 'town-phandalin').allowed);
assert(!A.gate(fixture, travel, 'site-redbrand').allowed, 'Located Tresendar does not locate Redbrand interior');
assert.throws(() => A.stage(fixture, travel, 'site-redbrand'), /Locate/);
assert.equal(A.publicProjection(fixture, travel, 'site-redbrand'), null);
assert.equal(A.publicProjection(fixture, travel, 'unreviewed'), null);
assert.equal(A.publicProjection(fixture, travel, 'ungated-interior'), null);

// No hidden Nine title, record, art path, source, private description or route geometry survives.
const projected = A.publicProjection(fixture, travel, 'world', {zoom: 2, panX: 12, panY: -4});
assert(!JSON.stringify(projected).includes('SECRET'));
assert.equal(projected.board.image, 'safe-world.png');
assert.equal(projected.routes.length, 0);
assert.equal(projected.places.length, 1);
assert.deepEqual(plain(projected.rumors), [{title: 'Rumored observatory', status: 'rumored'}]);
assert(!Object.hasOwn(projected.rumors[0], 'id'));
assert(!Object.hasOwn(projected.rumors[0], 'x'));
assert(!Object.hasOwn(projected.places[0], 'npcIds'));
assert.equal(projected.position.title, 'Phandalin');
assert.deepEqual(plain(projected.view), {zoom: 2, panX: 12, panY: -4});
assert.equal(A.publicProjection(fixture, travel, 'region-phandelver').routes.length, 1);

// Searches, projections, staging and view normalization are pure and never move the party or alter fog.
const campaign = {combat: {round: 4, active: 'pc-trista'}, fog: ['1,2'], party: [{id: 'pc-trista', hp: 7}], extras: {travel, atlas: {views: {world: {zoom: 2, panX: 12, panY: -4}}}}};
const campaignBefore = JSON.stringify(campaign);
assert.equal(A.search(fixture, travel, {query: 'Phandalin'}).length, 1);
assert.equal(A.search(fixture, travel, {status: 'hidden'}).length, 2);
const staged = A.stage(fixture, travel, 'world', campaign.extras.atlas.views.world);
assert.deepEqual(plain(A.assertStage(staged, fixture, travel)), plain(projected));
assert.equal(JSON.stringify(campaign), campaignBefore);
assert.equal(JSON.stringify(travel), before);
assert.equal(JSON.stringify(fixture), dataBefore);
assert.equal(JSON.stringify(travel.places.slice(0, T.definitions.length)), JSON.stringify(JSON.parse(originalExisting).places));

// Staged payload cannot be tampered into a private publish: validation reconstructs a fresh whitelist.
staged.payload.board.image = 'SECRET-injected-image.png';
assert.equal(A.assertStage(staged, fixture, travel).board.image, 'safe-world.png');
travel.places.find(row => row.id === 'atlas-rumor').status = 'located';
assert.throws(() => A.assertStage(staged, fixture, travel), /changed/);
travel.places.find(row => row.id === 'atlas-rumor').status = 'rumored';
const redbrand = travel.places.find(row => row.id === 'atlas-redbrand');
redbrand.status = 'located'; redbrand.inaccessible = true; redbrand.reason = 'Entrance blocked.';
assert.equal(A.state(fixture.locations[2], travel).status, 'located');
assert.equal(A.state(fixture.locations[2], travel).inaccessible, true);
assert(A.gate(fixture, travel, 'site-redbrand').allowed, 'Inaccessible preserves discovery and permits viewing, not travel');
assert.equal(A.search(fixture, travel, {status: 'inaccessible'})[0].id, 'redbrand');
assert.equal(T.available(redbrand), false);
const interior = A.stage(fixture, travel, 'site-redbrand');
assert.equal(interior.payload.board.image, 'safe-redbrand.png');
redbrand.status = 'hidden';
assert.throws(() => A.assertStage(interior, fixture, travel), /Locate/);
redbrand.status = 'located';
travel.places.find(row => row.id === 'region-phandalin').status = 'hidden';
assert.equal(A.publicProjection(fixture, travel, 'site-redbrand'), null, 'Hidden parent also gates a known interior');

// Both private collections share one adapter; permission review is transient and revalidated.
context.PHANDELVER_MAP_COLLECTION={maps:[{id:'ph-proposal',sceneId:'ph-map',proposalImage:'atlas/tactical/ph.svg'}]};
context.WATERDEEP_MAP_COLLECTION={maps:[{id:'wd-proposal',sceneId:'wd-map',proposalImage:'atlas/tactical/wd.svg',permissionRequired:true}]};
assert.equal(A.proposals().length,2);assert.equal(A.proposal('wd-map').id,'wd-proposal');
assert.equal(A.proposal('atlas/tactical/ph.svg').id,'ph-proposal');assert.equal(A.proposalSceneId('unknown'),'');
assert.match(A.proposalSceneId('wd-proposal'),/^atlas-source-[a-f0-9]+$/);
assert.notEqual(A.proposalSceneId('wd-proposal'),A.proposalSceneId('ph-proposal'));
assert(A.rasterSource('atlas/art/Waterdeep-City-Terrain.png'));assert(A.rasterSource('atlas/settlements/leilon-Overview.svg'));
assert(!A.rasterSource('atlas/settlements/../private.svg'));assert(!A.rasterSource('atlas/art/Sword-Coast-Terrain.png'));
const rooms=plain(fixture);rooms.boards.find(b=>b.id==='site-redbrand').proposalId='wd-proposal';
travel.places.find(row=>row.id==='region-phandalin').status='visited';
const beforePermission=JSON.stringify({travel,rooms});
assert.throws(()=>A.stage(rooms,travel,'site-redbrand'),/permission/);
const reviewed=A.stage(rooms,travel,'site-redbrand',{}, {permissionReviewed:true});
assert(A.assertStage(reviewed,rooms,travel));assert(!Object.hasOwn(reviewed.payload,'permissionReviewed'));
assert.throws(()=>A.assertStage({...reviewed,permissionReviewed:false},rooms,travel),/Confirm/);
assert.equal(JSON.stringify({travel,rooms}),beforePermission);
travel.places.find(row=>row.id==='region-phandalin').status='hidden';
assert.throws(()=>A.stage(rooms,travel,'site-redbrand',{}, {permissionReviewed:true}),/Locate/);

assert.deepEqual(plain(A.view({zoom: 100, panX: -1000, panY: Infinity})), {zoom: 8, panX: -150, panY: 0});
const player = vm.createContext({location: {hash: '#player'}});
vm.runInContext(fs.readFileSync(path.join(base, 'Campaign-Atlas.js'), 'utf8'), player);
vm.runInContext(fs.readFileSync(path.join(base, 'Campaign-Atlas-UI.js'), 'utf8'), player);
assert.equal(player.ECHO_ATLAS, undefined);
assert.equal(player.ECHO_ATLAS_UI, undefined);
console.log('Campaign atlas checks passed: hierarchy, shared discovery, private/public boundary, stage revalidation, state preservation and player guards.');
