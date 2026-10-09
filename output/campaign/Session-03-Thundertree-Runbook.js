(() => {
  'use strict';
  // Optional Session 3 branch. Narration is original; room facts refer to the local 2014 adventure.
  const map = 'lmop-map-thundertree-overview';
  const beat = (id, title, scene, read, run, encounter = '') => ({
    id, title, scene, ...(encounter ? { encounter } : {}),
    tv: 'Show only this location and creatures the characters have discovered. Keep other buildings fogged.',
    read: [read], ask: ['How do you approach, and where is each character?'], run,
    private: ['Lost Mine of Phandelver (2014), printed pp. 30–35; use its private marked map for exact building positions.']
  });
  const beats = [
    beat('s3-tt-1', 'Thundertree 1 · Western cottage', map,
      'A roofless cottage crouches beneath a broad tree. Its doorway has almost vanished into weeds.',
      ['Two twig blights hide beside the entrance. Compare their Stealth to passive Perception; if fighting breaks out, they can aid area 2.', 'Twig blight: AC 13, HP 4, claws +3 for 1d4+1 piercing; vulnerable to fire.'], 'tt-blights-1'),
    beat('s3-tt-2', 'Thundertree 2 · Blighted cottages', map,
      'Two collapsed homes stand side by side, their old rooms given over to brush and young trees.',
      ['Six twig blights wait in the growth; the two from area 1 join after one round if still alive and nearby.', 'A careful search and DC 10 Perception finds a chest with 700 cp, 160 sp, and 90 gp.'], 'tt-blights-2'),
    beat('s3-tt-3', 'Thundertree 3 · The Brown Horse', 'lmop-map-thundertree-brown-horse',
      'A faded horse sign hangs above the door of an old tavern. Inside, forms slump against the walls and beneath the bar.',
      ['Four ash zombies rise when living creatures enter. They start prone; standing uses half their speed.', 'Ash Puff: the first time each zombie takes damage, creatures within 5 feet make DC 10 Constitution saves or suffer disadvantage on attacks, saves, and checks for one minute; repeat the save at turn end. Track each zombie separately.', 'Zombie: AC 8, HP 22, slam +3 for 1d6+1; check Undead Fortitude at 0 HP.'], 'tt-zombies-3'),
    beat('s3-tt-4', 'Thundertree 4 · Reidoth’s watch', map,
      'One cottage seems to have resisted the years. Its shutters are stout, and someone has cleared the growth near the door.',
      ['Reidoth is direct but reasonably hospitable. He tells the party how to reach Cragmaw Castle if asked; no dragon bargain is required for those directions.', 'He warns of ash zombies, plant creatures, spiders, cultists, and a young green dragon. He knows where Wave Echo Cave is but offers that location only if the party drives the dragon off; he will not accompany them inside.', 'If attacked, he uses his druid shape to flee and waits for the aggressors to leave. Record whether the party earns his trust.']),
    beat('s3-tt-5', 'Thundertree 5 · Blighted farmhouse', map,
      'The farmhouse walls have collapsed into a knot of gorse. Something small shifts in the leaves when you disturb the stones.',
      ['Eight twig blights lurk in the thicket. If disturbed, two head for each of two doorways every round for three rounds. This is not one instant visible swarm.'], 'tt-blights-5'),
    beat('s3-tt-6', 'Thundertree 6 · Ruined store and webs', 'lmop-map-thundertree-spider-store',
      'White strands cross the lane to a broken store. The building looks empty from outside, though its walls offer plenty of shadows.',
      ['Two giant spiders hide inside. Webbed squares are difficult terrain; DC 10 Athletics crosses, failure restrains. A restrained creature may use an action for DC 12 Strength; a light slashing weapon can cut a web (AC 10, HP 5, vulnerable to fire).', 'Spider: AC 14, HP 26; bite +5 for 1d8+3 piercing plus DC 11 Constitution save against 2d8 poison (half on success); web +5 can restrain and recharges on 5–6.', 'A cocooned adventurer holds a healing potion, 23 gp, and 35 sp.'], 'tt-spiders-6'),
    beat('s3-tt-7', 'Thundertree 7 · Venomfang’s tower', 'lmop-map-thundertree-dragon-tower',
      'A broken tower rises above two spider corpses. The air around it smells sharp and wrong; the upper roof is open to the sky.',
      ['Venomfang is a young green dragon: AC 18, HP 136, fly 60, poison breath DC 16 Constitution for 12d6 poison in a 30-foot cone, half on success. It is far beyond a routine level-2 fight.', 'Give players visible signs of danger and time to retreat or parley. Venomfang values its lair; if reduced to half HP it flies away. It may hear loud cottage activity and ambush.', 'Tower chest: 800 sp, 150 gp, four 60-gp silver goblets, misty step and lightning bolt scrolls. Hew, a +1 battleaxe with extra damage against plants and wood objects, lies under the coin. Reveal only when found.'], 'tt-dragon-7'),
    beat('s3-tt-8', 'Thundertree 8 · Old smithy', map,
      'Rotten wood and a wide chimney mark the old forge. Two ash-covered shapes slump where the anvils once stood.',
      ['Two ash zombies rise when the party enters and pursue after they see a target. Use the same Ash Puff timing and saves as area 3.'], 'tt-zombies-8'),
    beat('s3-tt-9', 'Thundertree 9 · Herbalist’s shop', map,
      'Broken bottles and unreadable books fill an old shop. Mirna’s description points you toward the storage shelves.',
      ['If Mirna Dendrar sent them, the heirloom case is found automatically. Otherwise DC 15 Perception finds it behind the shelves.', 'Inside is her emerald necklace worth 200 gp. Record whether the party returns it; doing so earns the printed reward if using XP.']),
    beat('s3-tt-10', 'Thundertree 10 · Town square', map,
      'A leaning warrior statue watches over a square almost swallowed by brush. Paths leave in several directions.',
      ['DC 15 History identifies the old hero as Palien. DC 20 Strength can topple the statue if someone tries.', 'Let the party choose the next building by what they see on the player map; do not push them toward the dragon.']),
    beat('s3-tt-11', 'Thundertree 11 · Old garrison', 'lmop-map-thundertree-garrison',
      'An old stone barracks still has a roof and narrow windows. Rusted armor lies among the beds.',
      ['Five ash zombies wake when disturbed. Their scraps of armor do not improve AC 8. Use Ash Puff and Undead Fortitude as in area 3.'], 'tt-zombies-11'),
    beat('s3-tt-12', 'Thundertree 12 · Weaver’s cottage', map,
      'A broken loom sits in a cottage open to the weather. Thick growth hides the ground beyond its southern wall.',
      ['Six twig blights wait in the southern thicket. Compare Stealth to Perception before initiative.', 'Loud combat here draws cautious investigation by the cultists in area 13.'], 'tt-blights-12'),
    beat('s3-tt-13', 'Thundertree 13 · Dragon cultists', 'lmop-map-thundertree-cultists',
      'The shutters of this apparently empty house are barred from within. You hear low voices behind them.',
      ['Six cultists live here. Their leader Favric wants to make an alliance with the dragon; the others prefer to survive. They are willing to talk and need not fight.', 'If the party seems interested in the dragon, Favric may offer to introduce them as a tribute. Do not hide his intention if the players probe his story.', 'Cultist: AC 12, HP 9, scimitar +3 for 1d6+1. Favric has the same combat block. Favric carries a potion of flying; a coffer holds three diamonds worth 100 gp each.', 'The door is barred from within (DC 20 Strength); shutters DC 15 Strength.'], 'tt-cultists-13')
  ];
  const insert = globalThis.ECHO_SESSION3_RUNBOOK.findIndex(item => item.id === 's3-castle-sight');
  if (insert >= 0) globalThis.ECHO_SESSION3_RUNBOOK.splice(insert, 0, ...beats);
  Object.assign(globalThis.ECHO_SESSION3_ART, {
    's3-tt-1':['T01'], 's3-tt-2':['T02'], 's3-tt-3':['T03'], 's3-tt-4':['T04'],
    's3-tt-5':['T05'], 's3-tt-6':['T06','T06B'], 's3-tt-7':['T07','T07B'],
    's3-tt-8':['T08'], 's3-tt-9':['T09'], 's3-tt-10':['T10'], 's3-tt-11':['T11'],
    's3-tt-12':['T12'], 's3-tt-13':['T13']
  });
})();
