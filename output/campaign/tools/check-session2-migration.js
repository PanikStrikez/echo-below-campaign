const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
global.location = { hash: '', protocol:'file:' }; // No live BroadcastChannel in an isolated migration test.
global.window = global;
for (const file of ['LMOP-Visual-Catalog.js', 'Session-02-Runbook.js', 'Session-Content-Packs.js', 'Session-01-Party-Data.js', 'Session-01-Combat-Data.js'])
  require(path.join(root, file));
const source = fs.readFileSync(path.join(root, 'Session-01-Battleboard.js'), 'utf8');
const boot = source.lastIndexOf('  if (IS_PLAYER) initPlayer();');
assert(boot > 0);
vm.runInThisContext(source.slice(0, boot) + '  globalThis.__session2Test = { normalize, session2EnemyTokens };\n})();');
const saved = {
  sessionKind: 'custom', session2ContentVersion: 0, scene: 'barthen-art',
  scenes: [{ id: 'barthen-art', title: 'Barthen', kind: 'visual', image: 'session-01-visuals/scene-16-barthens-provisions.png' }],
  encounters: [{ id: 'redbrand-street', name: 'Street' }],
  runbookBeats: [
    { id: 's2-barthen', title: 'Barthen', scene: 'barthen-art' },
    { id: 's2-manor', title: 'Manor', run: ['The next pack can continue from that point'] },
    { id: 's2-close', title: 'Close' }
  ],
  tokens: [
    { id: 'pc-trista', name: 'Trista', label: 'T', type: 'hero-trista', team: 'pc', maxHp: 20, hp: 12 },
    { id: 's2-ruffian-1', name: 'Redbrand 1', label: 'R1', type: 'redbrand-ruffian', team: 'enemy', encounter: 'redbrand-street', maxHp: 16, hp: 7 }
  ],
  combat: { plans: { 'redbrand-street': { outcome: 'Player negotiated earlier' } } }
};
const state = __session2Test.normalize(saved);
assert(state.scenes.some(scene => scene.id === 'redbrand-hideout' && scene.fog));
assert(state.encounters.some(encounter => encounter.id === 'hideout-glasstaff'));
assert(state.runbookBeats.some(beat => beat.id === 's2-glasstaff'));
assert(state.runbookBeats.find(beat => beat.id === 's2-manor').run.some(line => line.includes('private marked map')));
assert.equal(state.tokens.find(token => token.id === 'pc-trista').hp, 13);
assert.equal(state.tokens.find(token => token.id === 's2-ruffian-1').hp, 7);
assert.equal(state.combat.plans['redbrand-street'].outcome, 'Player negotiated earlier');
assert.equal(state.session2ContentVersion, 7);
assert.equal(state.party['pc-trista'].level, 2);
assert.equal(state.tokens.find(token => token.encounter === 'hideout-common').conditions[0], 'Poisoned');
assert.equal(state.tokens.find(token => token.encounter === 'hideout-glasstaff').ac, 16);
assert.equal(state.combat.tokens['s2-hideout-crypt-1'].vulnerabilities, 'bludgeoning');
assert(state.runbookBeats.find(beat => beat.id === 's2-glasstaff').run[3].includes('only if Iarno did not take them'));
assert(state.runbookBeats.find(beat => beat.id === 's2-prep').run[3].includes('not required scenes'));
assert(state.runbookBeats.find(beat => beat.id === 's2-prep').run[4].includes('Yeemik'));
assert(state.runbookBeats.find(beat => beat.id === 's2-prep').private.some(line => line.includes('Redbrands captured Gundren')));
assert(state.runbookBeats.find(beat => beat.id === 's2-town').choices[1].includes('Qelline'));
assert(state.runbookBeats.find(beat => beat.id === 's2-town').choices[2].includes('Yeemik'));
assert(state.runbookBeats.find(beat => beat.id === 's2-redbrands').run[2].includes('Redbrands abducted Gundren'));
assert(state.runbookBeats.find(beat => beat.id === 's2-glasstaff').run[4].includes('transfer record'));
assert(!state.runbookBeats.find(beat => beat.id === 's2-inn').read[0].includes('Sildar'));
assert.deepEqual(__session2Test.session2EnemyTokens().filter(token => token.encounter === 'redbrand-street').map(token => token.id),
  ['s2-ruffian-1', 's2-ruffian-2', 's2-ruffian-3', 's2-ruffian-4']);
assert.equal(__session2Test.normalize(state).tokens.filter(token => token.id === 's2-hideout-barracks-1').length, 1);
const oldNarration = structuredClone(state);
oldNarration.session2ContentVersion = 3;
const oldBeat = oldNarration.runbookBeats.find(beat => beat.id === 's2-glasstaff');
oldBeat.read = ['A better-appointed room sits beyond the rougher hideout. Papers lie beside a travel chest, and a slender staff catches the lamplight. Someone has been planning from here.'];
oldBeat.run[3] = 'A search finds the Black Spider letter and an unlocked chest: 180 sp, 130 gp, five carnelians (10 gp each), two peridots (15 gp each), one pearl (100 gp), scrolls of charm person and fireball. Iarno also carries the staff of defense.';
oldBeat.private = ['Lost Mine of Phandelver pp. 25–26; Evil Mage appendix p. 57; staff of defense appendix A p. 53.'];
const revised = __session2Test.normalize(oldNarration);
assert(!revised.runbookBeats.find(beat => beat.id === 's2-glasstaff').read[0].includes('slender staff'));
assert(revised.runbookBeats.find(beat => beat.id === 's2-glasstaff').run[3].includes('only if Iarno did not take them'));
const oldStory = structuredClone(state);
oldStory.session2ContentVersion = 4;
const oldBarthen = oldStory.runbookBeats.find(beat => beat.id === 's2-barthen');
oldBarthen.read = ['Warm lamplight falls over rope, trail food, tools, and stacks of ledgers. Behind the counter, a thin shopkeeper looks up. His welcoming smile falters when he sees Sildar and counts the faces coming through the door. “Where is Gundren?”'];
const oldInn = oldStory.runbookBeats.find(beat => beat.id === 's2-inn');
oldInn.read = ['The inn is warmer and louder than the street. Supper, wet cloaks, and low conversation crowd the common room. Several people glance toward Sildar, then toward your travel-worn gear. A child at one table stops talking mid-sentence.'];
const story = __session2Test.normalize(oldStory);
assert(!story.runbookBeats.find(beat => beat.id === 's2-barthen').read[0].includes('sees Sildar'));
assert(!story.runbookBeats.find(beat => beat.id === 's2-inn').read[0].includes('Sildar'));
const oldAbduction = structuredClone(state);
oldAbduction.session2ContentVersion = 5;
const oldPrep = oldAbduction.runbookBeats.find(beat => beat.id === 's2-prep');
oldPrep.private[2] = 'The humanoid figures who took Gundren were not identified as goblins. Their identity, employer, and any handoff to Cragmaw Castle remain DM-side decisions; do not tell players a destination without evidence.';
const oldRedbrands = oldAbduction.runbookBeats.find(beat => beat.id === 's2-redbrands');
oldRedbrands.run[2] = 'If three are defeated, the last tries to escape toward Tresendar Manor. A captured ruffian can supply a lead. Protect bystanders from automatic splash damage.';
const oldGlasstaff = oldAbduction.runbookBeats.find(beat => beat.id === 's2-glasstaff');
oldGlasstaff.run = oldGlasstaff.run.filter(line => !line.includes('transfer record'));
oldGlasstaff.run[4] = 'Iarno knows the Spider seeks the Forge, but not the cave’s location. Sildar can arrange custody in the townmaster’s hall; the book doubles the 200 XP award if Iarno is delivered alive. Let the players decide what to do with him.';
const restoredAbduction = __session2Test.normalize(oldAbduction);
assert(restoredAbduction.runbookBeats.find(beat => beat.id === 's2-prep').private[2].includes('Redbrands captured Gundren'));
assert(restoredAbduction.runbookBeats.find(beat => beat.id === 's2-redbrands').run[2].includes('Redbrands abducted Gundren'));
assert(restoredAbduction.runbookBeats.find(beat => beat.id === 's2-glasstaff').run[4].includes('transfer record'));
const olderSheets = structuredClone(state);
for (const [id, sourceStatus, oldMax, oldCurrent] of [
  ['pc-aldric', 'Playable DM-built sheet; replace choices with Bowman’s sheet if supplied', 8, 8],
  ['pc-donavan', 'Current uploaded sheet; prepared spells and newer spell sources need confirmation', 9, 7],
  ['pc-ringgo', 'Current uploaded sheet; second Expertise choice remains open', 10, 10]
]) {
  olderSheets.party[id].sourceStatus = sourceStatus;
  olderSheets.party[id].level = 2;
  let hero = olderSheets.tokens.find(item => item.id === id);
  if (!hero) {
    hero = { id, name: id.slice(3), label: id.slice(3, 4).toUpperCase(), type: `hero-${id.slice(3)}`,
      team: 'pc', maxHp: oldMax, hp: oldCurrent };
    olderSheets.tokens.push(hero);
  }
  hero.maxHp = oldMax; hero.hp = oldCurrent;
}
olderSheets.party['pc-aldric'].resources.find(item => item.id === 'aldric-slots-1').max = 2;
olderSheets.party['pc-aldric'].resources.find(item => item.id === 'aldric-slots-1').current = 1;
olderSheets.party['pc-ringgo'].skills.Investigation = { rank: 0, override: 0 };
const refreshed = __session2Test.normalize(olderSheets);
assert.equal(refreshed.tokens.find(item => item.id === 'pc-aldric').hp, 16);
assert.equal(refreshed.tokens.find(item => item.id === 'pc-donavan').hp, 22);
assert.equal(refreshed.tokens.find(item => item.id === 'pc-ringgo').maxHp, 24);
assert.equal(refreshed.party['pc-aldric'].resources.find(item => item.id === 'aldric-slots-1').current, 3);
assert.equal(refreshed.party['pc-donavan'].spells.find(item => item.name === 'Catapult').prepared, true);
assert.equal(refreshed.party['pc-ringgo'].skills.Investigation.override, 4);
assert.equal(refreshed.tokens.find(item => item.id === 'pc-trista').hp, 13);
delete global.__session2Test;
console.log('Session 2 save migration preserved HP and notes, added hideout content once, and kept wave IDs.');
