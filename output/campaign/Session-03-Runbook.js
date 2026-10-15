(() => {
  'use strict';
  // Original table narration. Room facts and page links refer to the local 2014 adventure.
  globalThis.ECHO_SESSION3_RUNBOOK = [
    {
      id: 's3-prep', title: 'Before play · carry forward what actually happened', scene: 'town-phandalin',
      tv: 'Keep the town map or a neutral title on the TV while you reconcile the last session.',
      ask: ['The party stopped at Barthen’s Provisions. Did they enter or speak to Barthen? Is Gundren still asleep at the inn, or has he recovered? What did the party actually learn about Glasstaff’s escape?',
        'Were the wagon and Lionshield goods delivered? Which rewards were actually paid?',
        'Glasstaff escaped and Trista holds his rat. Are Mirna, Nars, Nilsa, and Droop safe?',
        'What are the five current levels, HP, spell slots, supplies, and Sildar’s equipment?'],
      run: ['If play stopped mid-hideout or mid-combat, continue the existing saved session. Do not reset fog, enemies, or token positions.',
        'Session 1 remains fixed: Klarg died, Yeemik kept the hideout, Sildar was rescued, and Trista privately took the BELOW token. Donavan noticed concealment, not the object.',
        'Latest actual play: Glasstaff put Gundren to sleep; the party recovered him and left him at an unnamed inn. Glasstaff escaped to Cragmaw Castle, but the party does not know his destination. Trista holds his captured rat. Play stopped at Barthen’s Provisions. Do not place Gundren or the rat at the castle.',
        'Current confirmed levels: Trista, Pebble, and Ringgo are level 4; Donavan and Aldric are level 3. Check the saved HP, resources, and any newer sheet before combat. Scouting, retreat, and negotiation remain meaningful.'],
      private: ['Sources: Lost Mine of Phandelver pp. 27 and 35–41; Session 1 actual recap and the recorded Session 2 outcome.']
    },
    {
      id: 's3-choice', title: '1 · Choose the lead, not the destination', scene: 'town-phandalin',
      tv: 'Show the player-safe Phandalin map. Publish only leads the characters heard.',
      read: ['You have stopped at Barthen’s Provisions. Gundren is at an inn, and Trista has the rat you captured. Glasstaff escaped. What do you do next?'],
      ask: ['What evidence do you trust? Who comes with you? What do you buy, borrow, or leave behind?'],
      run: ['The party stopped at Barthen’s Provisions; do not assume they entered or completed a delivery. If they return to the inn, confirm whether Gundren can speak and what they ask him; do not invent what he knows. If Iarno’s transfer record was actually found, it documents an earlier castle transfer, not Gundren’s present location. A captured Redbrand may establish the gang’s role without knowing Glasstaff’s route.',
        'Qelline can suggest Reidoth near Thundertree; Halia knows the gang has a goblin with a castle lead; a captured bugbear can give a more precise lead. Agatha can answer one carefully chosen question.',
        'If no castle lead was earned, offer a real inquiry, tracks, or an NPC the party already trusts. Never narrate the hidden destination as common knowledge.'],
      choices: ['If the castle route is earned, let the party plan travel and scouting.', 'If the castle route is unknown, play a chosen inquiry without revealing Glasstaff’s destination.',
        'Another quest chosen: use the linked location scene and return to this decision when they have new evidence.'],
      private: ['The transfer record is an Echo Below campaign addition, not printed treasure. Source: adventure pp. 14–18, 27–29.']
    },
    {
      id: 's3-travel', title: '2 · Triboar Trail and Neverwinter Wood', scene: 'lmop-triboar-trail',
      tv: 'Show trail art; switch to the woodland or night-camp battle map only if a specific encounter occurs.',
      read: ['The last chimney smoke falls behind you. The trail runs between long grasses and dark stands of trees, then narrows until every snapped twig sounds close.'],
      ask: ['What is the marching order, travel pace, light plan, and watch schedule? Is anyone tracking a specific sign?'],
      run: ['The adventure uses roughly 24 miles in a ten-hour travel day, with eight hours of rest. Mark actual time and supplies rather than teleporting between sites.',
        'If using the published wandering table, check once by day and once by night: d20 result 17–20 brings a random encounter. Roll its creature only after the check succeeds; do not deploy all possible groups.',
        'A captured goblin or hobgoblin can provide castle directions according to the adventure. Let the party use stealth, avoidance, parley, or retreat.'],
      choices: ['If the group heads to a town lead, jump to that scene.', 'If the castle route is known, move to the approach beat.'],
      private: ['Adventure pp. 27–28. Do not reveal a castle marker on the TV map before the party knows its location.']
    },
    {
      id: 's3-agatha', title: 'Optional lead · Conyberry and Agatha', scene: 'lmop-agathas-lair',
      tv: 'Show Conyberry ruins, then the woven shelter. Reveal Agatha’s portrait only when she appears.',
      read: ['Beyond the ruined village, branches bend together into a low shelter. The air stills. A voice from within sounds older than the trees: “You came this far to ask me something?”'],
      ask: ['What single question matters most, and who speaks for the group? Do you offer Sister Garaele’s comb?'],
      run: ['Agatha is a social encounter. Respectful conversation and DC 15 Charisma (Persuasion) can win one answer; the silver comb from Sister Garaele secures her cooperation. A player who roleplays the exchange well has advantage.',
        'She answers one question. She can address the castle’s location if asked, but the party may instead ask about Bowgentle’s book or something else. Record the precise answer.',
        'If insulted or threatened, she withdraws rather than starting a mandatory fight. The prepared reward is 200 XP for successfully obtaining an answer if using XP.'],
      choices: ['If Agatha provides the route, go to the castle approach.', 'If she answers a different question, follow that consequence.'],
      private: ['Adventure pp. 28–29. Agatha’s information is not a general reveal of the Echo mystery.']
    },
    {
      id: 's3-old-owl', title: 'Optional lead · Old Owl Well', scene: 'lmop-old-owl-well',
      tv: 'Show the ruined well. Do not show the undead reveal until the zombies emerge.',
      read: ['The broken watchtower stands where you last saw Hamun Kost. What remains here depends on what the party left behind.'],
      ask: ['What are you looking for on your return, and how do you approach the ruins?'],
      run: ['The party has already encountered Hamun Kost, who disappeared without fighting. If they return, preserve what happened and investigate what remains; do not replay the first meeting as if he were still present.',
        'The printed first-contact setup has twelve zombies concealed in the tower. Use it only for inhabitants still present in the saved dungeon state.',
        'Kost is willing to trade information for a favor: remove the Wyvern Tor orcs or ask Agatha who built the tower. He is not an automatic combat encounter.',
        'If the party reports a parley to Daran, track that quest. If violence starts, use the printed room and monster cards; twelve zombies plus a mage are a serious threat.'],
      choices: ['Follow a fresh trace only if the party finds one.', 'Leave Kost’s disappearance unresolved and pursue another lead.'],
      private: ['Adventure p. 29. Keep Kost’s tent treasure private until found; do not put twelve hidden zombies on the TV.']
    },
    {
      id: 's3-old-owl-fight', title: 'If violence starts · Old Owl Well', scene: 'lmop-map-old-owl-well', encounter: 'old-owl-well',
      tv: 'Switch to the well battle map only when position matters. Reveal zombies as they emerge, not at scene start.',
      ask: ['Where are the PCs relative to the tower, well, and tent? Did Kost call a halt before spells were cast?'],
      run: ['This is the printed first-contact fight, not the current default. Kost disappeared in actual play. Deploy him or any zombies only if the saved state and a new encounter justify their presence.',
        'In the printed first-contact fight, twelve zombies can emerge from the tower. Hamun Kost uses the Evil Mage base spells without Iarno’s staff; AC 12, HP 22, spell save DC 13, +5 spell attacks.',
        'Zombie: AC 8, HP 22, slam +3 for 1d6+1. At 0 HP, Undead Fortitude may leave it at 1 HP unless radiant damage or a critical hit caused the drop.',
        'Do not deploy every zombie at once unless they are actually visible and participating. This whole camp is a severe fight for low-level PCs; give routes to retreat.'],
      private: ['Adventure p. 29; Evil Mage p. 57; SRD 5.1 Zombie pp. 356–357.']
    },
    {
      id: 's3-wyvern', title: 'Optional lead · Wyvern Tor', scene: 'lmop-wyvern-tor-approach',
      tv: 'Keep the known ravine view. The camp was cleared; do not place the sentry or cave group by default.',
      read: ['The ravine and cave mouth are familiar from the camp the party cleared. What signs remain depends on what they left behind.'],
      ask: ['What brings you back to the cleared camp, and what are you checking?'],
      run: ['The party already cleared the orc camp. Do not redeploy its printed occupants; use this card only to review an actual return, survivors, or unpaid reward.',
        'For an unplayed approach in another campaign, finding the hidden camp calls for DC 15 Wisdom (Perception) or DC 10 Wisdom (Survival) per hour by the lead character.',
        'Inside are Brughor Axe-Biter, six ordinary orcs, and Gog the ogre; one additional orc watches outside. The sentry runs to warn them if it spots the party and survives.',
        'This group is extremely dangerous for five level-2 characters. Show numbers and an exit; stealth, withdrawal, negotiation, and completing another lead first are valid.',
        'The cave chest contains 750 cp, 180 sp, 62 ep, 30 gp, and three perfume vials worth 10 gp each; award only if found and taken.'],
      choices: ['Inspect the cleared camp and record only what is found.', 'Ask Harbin about a reward if the party has not already collected it.'],
      private: ['Adventure p. 35. Count one outside sentry, six ordinary orcs inside, Brughor at 30 HP, and Gog the ogre. Do not accidentally omit the sentry.']
    },
    {
      id: 's3-wyvern-fight', title: 'If the camp fights · Wyvern Tor', scene: 'lmop-map-wyvern-tor', encounter: 'wyvern-tor',
      tv: 'Show the ravine battle map. Start with the sentry, then reveal the cave force if it arrives.',
      ask: ['Was the sentry silenced? Which defenders heard a warning, and what cover does each side have?'],
      run: ['The party already cleared this camp. Do not launch this encounter in the current campaign unless actual play establishes new occupants.',
        'Printed first-contact reference: one ordinary orc outside; six ordinary orcs, Brughor at 30 HP, and Gog the ogre inside.',
        'Orc: AC 13, HP 15, greataxe +5 for 1d12+3, javelin +5 for 1d6+3, and Aggressive bonus-action movement toward a visible hostile creature.',
        'Ogre: AC 11, HP 59, greatclub +6 for 2d8+4 or javelin +6 for 2d6+4. After Brughor falls, surviving orcs flee according to the adventure.',
        'This is a major threat. Do not add wandering enemies on top of it without an actual cause.'],
      private: ['Adventure p. 35; 2014 SRD 5.1 Orc p. 339 and Ogre p. 336.']
    },
    {
      id: 's3-thundertree', title: 'Optional lead · Reidoth at Thundertree', scene: 'town-thundertree',
      tv: 'Use the unmarked town map with fog; keep dragon, cultists, and building contents hidden.',
      read: ['A weathered warning faces the road into an overgrown village. Roofs are broken, walls lean into vines, and the hilltop tower still stands above them all.'],
      ask: ['Are you seeking Reidoth, scouting ruins, or following another reason to enter?'],
      run: ['Reidoth can identify the castle’s location, but the village is a separate, larger adventure site. Do not imply the party must clear it to earn his help.',
        'If the players explore buildings, continue to the Thundertree area beats in this runbook. All thirteen areas, local maps, optional fights, and Reidoth’s information are prepared; reveal only locations reached in play.',
        'Warn in-world about plant monsters, undead, and the dragon; do not reveal those tokens or portraits before the characters encounter them.'],
      private: ['Adventure pp. 30–35. This beat opens the optional village route; the area beats follow before the castle approach.']
    },
    {
      id: 's3-castle-sight', title: '3 · Cragmaw Castle comes into view', scene: 'lmop-castle-approach',
      tv: 'Show the castle approach illustration. Stage the unmarked castle map privately; keep fog fully closed.',
      read: ['The trees give way to a low rise. Seven broken towers crowd around a ruined stronghold. The place looks abandoned until you catch a small movement behind a narrow slit in the stone.'],
      ask: ['How long do you watch? Do you seek another entry, wear a disguise, or approach the gate?'],
      run: ['The main gate is ruined. Arrow slits give three-quarters cover to defenders firing through them. Interior doors are reinforced but unlocked; DC 15 Strength forces one.',
        'The book explicitly supports bluffing with Redbrand cloaks and a claim to be Glasstaff’s envoys. Resolve a group deception against defenders’ Insight; do not decide the route for the party.',
        'At night the interior is dark. During day only limited light enters through arrow slits. Ask for torches and darkvision.'],
      choices: ['Main gate leads to areas 1–2.', 'South postern leads to area 10.', 'A concealed north entrance can be discovered near area 11.'],
      private: ['Adventure pp. 35–37. The marked map at p. 37 is DM-only. The TV map is an unmarked interpretation.']
    },
    {
      id: 's3-castle-enter', title: '4 · Begin castle exploration', scene: 'lmop-map-cragmaw-castle',
      tv: 'Show the unmarked castle map with fog. Reveal one entered space at a time. Do not deploy the entire garrison.',
      ask: ['Which entrance do you use? Who is first? What light is visible to the defenders?'],
      run: ['Keep an alarm note: quiet, suspicious, or raised. Once raised, nearby room groups can respond according to their keyed descriptions.',
        'The party can retreat through any route it actually opened. Resting inside a guarded castle has consequences; make the situation clear before a rest.',
        'Use the printed room map for distances and door placement. The TV map is a player-safe tactical interpretation.'],
      private: ['Adventure map p. 37; keyed rooms pp. 36–41.']
    },
    {
      id: 's3-area1', title: 'Area 1 · Entrance and sentries', scene: 'lmop-map-cragmaw-castle', encounter: 'castle-archers',
      tv: 'Reveal the gate and two arrow-slit posts. Keep the goblins hidden until noticed or until they fire.',
      read: ['Shattered gate timbers lie across an old entrance. Above the wreckage, narrow slots stare out from two small chambers.'],
      ask: ['Do you move quietly, call out, or look for another way in?'],
      run: ['There are two goblins in each area-3 archer post, four total. They glance out only intermittently. Compare the party’s Stealth to their passive Perception rather than granting automatic detection.',
        'If they see intruders, they shoot from behind arrow-slit cover and shout. They cannot fire directly at enemies who have passed the broken gate.',
        'Their alarm can bring goblins from area 4 and hobgoblins from area 6 into area 2.'],
      private: ['Adventure p. 36. Each pair is a separate 100-XP group if using XP.']
    },
    {
      id: 's3-area2', title: 'Area 2 · Falling rubble', scene: 'lmop-map-cragmaw-castle', encounter: 'castle-trap',
      tv: 'Reveal the hall. Show the collapse only after it is detected or triggered.',
      read: ['A wide hall disappears into half-light. Dust lies thick around a pile of fallen plaster, and closed doors lead away on either side.'],
      ask: ['Where does each character step? Is anyone actively searching the damaged ceiling or floor?'],
      run: ['The hidden tripwire is spotted by passive Perception 20 or active DC 10 Wisdom (Perception) while searching this area. Once found, it is easy to avoid or disable without a check.',
        'A creature that crosses the rubble without avoiding it triggers a ceiling collapse. Creatures in the marked area make DC 10 Dexterity saves: 3d6 bludgeoning on failure, half on success.',
        'The noise alerts areas 3, 7, 8, and 9. Record the alarm before moving to another room.'],
      private: ['Adventure p. 36. The TV map must not pre-mark the tripwire or exact fall zone.']
    },
    {
      id: 's3-area4', title: 'Area 4 · Ruined barracks', scene: 'lmop-map-cragmaw-castle', encounter: 'castle-barracks',
      tv: 'Reveal the southwest room when entered; place three goblins only when visible.',
      read: ['Broken stone has swallowed much of the tower, but bedrolls and a narrow cleared path show that someone still sleeps here.'],
      ask: ['Do you pass, search, disguise yourselves, or speak to the occupants?'],
      run: ['Three goblins bunk here. A loud fight draws one goblin from area 7 to investigate; if that scout does not return or raises alarm, the others respond.',
        'The eastern passage through rubble is safe despite its appearance.'],
      private: ['Adventure p. 37.']
    },
    {
      id: 's3-area5', title: 'Area 5 · Storeroom and Sildar’s gear', scene: 'lmop-map-cragmaw-castle',
      tv: 'Reveal the storeroom; do not show the significance of its gear until the characters inspect it.',
      read: ['Spoiled provisions and old casks crowd the room. Among them lie a bloodied coat of mail, a crossbow, and a sword bearing a familiar crest.'],
      ask: ['What do you search or take? Do you recognize the equipment?'],
      run: ['The chain mail, heavy crossbow, and longsword belong to Sildar. Record whether the party returns them; his equipped combat card is appropriate only after he regains gear.',
        'A small cask contains dwarven brandy. A second glass within one hour poisons the drinker for one hour, per the book.'],
      private: ['Adventure p. 37.']
    },
    {
      id: 's3-area6', title: 'Area 6 · Hobgoblin barracks', scene: 'lmop-map-cragmaw-castle', encounter: 'castle-hobgoblins',
      tv: 'Reveal this room at entry; deploy four hobgoblins if still present.',
      read: ['This room is surprisingly orderly. Weapons hang on brackets above four pallets, and the floor has been swept clear of rubble.'],
      ask: ['Do you parley, withdraw, or fight? Who can see the door?'],
      run: ['Four hobgoblins defend this room and respond quickly to the sentries’ alarm. They usually ignore noise elsewhere unless their own room is threatened.',
        'Hobgoblin: AC 18, HP 11, speed 30, longsword +3 for 1d8+1; longbow +3 for 1d8+1. Once per turn, Martial Advantage adds 2d6 when an ally is within 5 feet of the target.',
        'A light, carved quarterstaff on the wall is worth 10 gp. Other mounted arms are ordinary.'],
      private: ['Adventure pp. 37–38; SRD 5.1 hobgoblin p. 322.']
    },
    {
      id: 's3-area7', title: 'Area 7 · Banquet hall', scene: 'lmop-map-cragmaw-castle', encounter: 'castle-banquet',
      tv: 'Reveal tables and benches; only place goblins that remain here after alarm movement.',
      read: ['Once a grand hall, this chamber now smells of stale food and a neglected brazier. Goblin voices rise around two scarred tables.'],
      ask: ['Do you enter openly, use the noise as cover, or try another route?'],
      run: ['Seven ordinary goblins and Yegg, their 12-HP cook, are here initially. Reconcile any scout sent to area 4 before deploying this wave.',
        'If Yegg falls, surviving goblins flee east or west, avoiding the trapped north route. They need not fight to the last.'],
      private: ['Adventure p. 38. Yegg plus seven goblins is eight creatures total.']
    },
    {
      id: 's3-area8', title: 'Area 8 · Dark hall and grick', scene: 'lmop-map-cragmaw-castle', encounter: 'castle-grick',
      tv: 'Reveal the hall first. Show the grick token or reveal art only after it drops from its hiding place.',
      read: ['A narrow, lightless hall bears carvings that do not match its current occupants. Heavy curtains hang to the north, and a stone brazier stands between them.'],
      ask: ['What light do you carry? Do you examine the carvings or move beneath the ledges?'],
      run: ['A grick watches from an upper rocky ledge. Compare its Stealth to the party’s Perception to determine who notices it; do not give automatic surprise.',
        'Grick: AC 14, HP 27, climb 30; tentacles +4 for 2d6+2 slashing. If they hit, it can make a beak +4 for 1d6+2 piercing against the same target. Its resistance to nonmagical weapon damage needs manual review in the damage panel.',
        'DC 10 Intelligence (Religion) identifies the old human gods in the carvings. A gold sun-elf statuette worth 100 gp is hidden under coal in the brazier. It can answer one augury-like question for a non-evil creature, then loses that power.'],
      private: ['Adventure pp. 38–39; SRD 5.1 grick p. 318. Do not reveal the hidden statuette before discovery.']
    },
    {
      id: 's3-area9', title: 'Area 9 · Goblin shrine', scene: 'lmop-map-cragmaw-castle', encounter: 'castle-shrine',
      tv: 'Reveal the shrine beyond the curtains; place its occupants when they are seen.',
      read: ['A stone altar lies beneath a blood-dark cloth. A goblin in ritual scraps fusses over gold-colored implements while two acolytes watch the curtains.'],
      ask: ['Do you interrupt, negotiate, or pass without drawing attention?'],
      run: ['Lhupo, a goblin with 12 HP, and two ordinary goblins occupy the shrine. If they heard the grick fight, they hide behind the altar and cannot be surprised.',
        'The human-made chalice, knife, and censer are worth 150 gp, 60 gp, and 120 gp respectively if taken.'],
      private: ['Adventure p. 39. The objects are art treasure, not spellcasting tools.']
    },
    {
      id: 's3-area10', title: 'Area 10 · South postern gate', scene: 'lmop-map-cragmaw-castle',
      tv: 'Reveal only the gate and path from the direction of approach.',
      read: ['An overgrown path climbs toward an iron door protected by the wall above it. Narrow slits overlook the approach.'],
      ask: ['Do you test the lock, watch the slits, or search for another entrance?'],
      run: ['The door is locked: DC 15 Dexterity with thieves’ tools or DC 25 Strength to break it. The goblins in area 7 can be heard from the arrow slits if the party pauses.',
        'The goblins do not actively watch this path, but loud noise draws their attention and can raise the alarm.'],
      private: ['Adventure p. 39.']
    },
    {
      id: 's3-area11', title: 'Area 11 · Concealed north entrance', scene: 'lmop-map-cragmaw-castle',
      tv: 'Do not show the concealed canvas entrance before the party finds it.',
      read: ['A fallen tower lies under dusty canvas and brush. A few old crates remain where a storeroom once stood.'],
      ask: ['Where do you search? Does anyone inspect the outer wall?'],
      run: ['From outside, DC 15 Wisdom (Perception) spots signs of a path to the concealed entrance. If actively searching the castle’s exterior for a hidden way in, DC 10 Wisdom (Perception) spots the canvas door.',
        'This entrance can allow a quieter route toward the king’s side of the castle. Record whether the party leaves the canvas disturbed.'],
      private: ['Adventure p. 39.']
    },
    {
      id: 's3-area12', title: 'Area 12 · Guard barracks', scene: 'lmop-map-cragmaw-castle', encounter: 'castle-guards',
      tv: 'Reveal the east barracks; place its two guards when seen.',
      read: ['Four pallets line a cramped guardroom. A coal brazier glows, and a curtain conceals an arch to the north.'],
      ask: ['Can the guards see you? Do you block the north route or let one run?'],
      run: ['Two loyal hobgoblins guard this room. At the start of combat, one runs to warn Grol in area 14 and returns two rounds later if able.',
        'Track that warning explicitly; it changes Vyerith’s position in the final room.'],
      private: ['Adventure p. 40.']
    },
    {
      id: 's3-area13', title: 'Area 13 · Owlbear tower', scene: 'lmop-map-cragmaw-castle', encounter: 'castle-owlbear',
      tv: 'Reveal the tower but hide the owlbear until the barred door opens and it is visible.',
      read: ['Something heavy shifts beyond the barred door. The wood shudders once, then a low animal breath fills the silence.'],
      ask: ['Do you open the bar, leave it closed, or prepare a way out?'],
      run: ['The owlbear has AC 13, HP 59, speed 40; one beak +7 for 1d10+5 and one claws +7 for 2d8+5 on its turn. It is dangerous for a level-2 party.',
        'Fresh meat distracts it. If freed and not blocked, it flees the castle, attacking creatures that get in its way. Releasing it can earn the same printed XP as defeating it.',
        'A chest on a high ledge requires DC 15 Wisdom (Perception) to notice; it holds 90 ep, 120 gp, a healing potion, silence scroll, and revivify scroll.'],
      private: ['Adventure p. 40; SRD 5.1 owlbear pp. 339–340. The ledge chest is not visible from the floor.']
    },
    {
      id: 's3-area14', title: 'Area 14 · Grol and Vyerith', scene: 'lmop-map-cragmaw-castle', encounter: 'castle-king',
      tv: 'Reveal the room when the door opens. Gundren was left at an inn and must not be staged here. Keep Vyerith’s true form private until revealed.',
      read: ['Voices cut through the door: a harsh demand, then a smooth reply. Inside, furs cover the floor while a towering bugbear argues with a dark-clad visitor.'],
      ask: ['Do you listen longer, speak through the door, strike first, or look for another way in?'],
      run: ['King Grol is a 45-HP bugbear. Snarl is an 18-HP wolf. Vyerith is a 52-HP doppelganger disguised as a drow emissary of the Black Spider; its true nature is secret.',
        'The printed encounter makes Gundren a hostage, but actual play left him at an inn. Grol and Vyerith may still bargain over information or possessions they actually hold. Do not invent a new hostage or assume they have Gundren’s map.',
        'If warned, Vyerith may hide near the northeast exit. If Grol falls, Vyerith may try to escape through area 11; track any item it actually carries.',
        'The printed room has 220 sp, 160 ep, and three healing potions in a sack. Confirm the map’s current custody from actual play before placing it there.',
        'Allow conversation, retreat, and pursuit. Record what the party finds and learns; Gundren’s safety is resolved separately at the inn.'],
      private: ['Adventure pp. 40–41 supplies the original keyed room. This campaign’s actual Gundren outcome overrides its printed hostage setup. Glasstaff’s arrival at the castle is DM-only until discovered.']
    },
    {
      id: 's3-warband', title: 'Optional consequence · Returning war band', scene: 'lmop-map-triboar-trail', encounter: 'castle-warband',
      tv: 'Show a woodland or castle approach map only if the returning patrol meets the party. Do not spawn it by default.',
      read: ['Boots and low voices approach through the trees. A returning patrol has found the castle less quiet than it expected.'],
      ask: ['Do you hide, negotiate, retreat, or stand your ground?'],
      run: ['Optional printed complication: Targor Bloodsword, a hobgoblin with 20 HP, leads two ordinary hobgoblins and two wolves.',
        'Targor has ambitions of succeeding Grol. A credible offer and DC 15 Charisma (Persuasion) can convince him to let the party pass rather than avenge the king.',
        'Use this only if it improves pacing and follows actual travel. A depleted party needs a visible escape route.'],
      private: ['Adventure p. 41.']
    },
    {
      id: 's3-close', title: 'Close · Record the trail to the mine', scene: 'town-phandalin',
      tv: 'Return to the town map or a calm scene. Publish only facts the party witnessed.',
      ask: ['What do you do with Gundren, the map, Sildar’s gear, prisoners, and any bargains?',
        'Which route or promise matters next? What did each character actually learn?'],
      run: ['Gundren was left at an inn and Trista holds the rat. Record his condition and safety, Glasstaff’s next observed move, and whether the party actually learned the castle route. Record the mine map’s custody separately and keep each room left unresolved.',
        'If Gundren later chooses to make the printed offer, it is 25 gp each and a 10-percent share of a working mine. Treat it as his offer, not immediate cash or a guaranteed future.',
        'Record XP or milestone only for accomplished events. Track healing potions, scrolls, Sildar’s gear, alarms, allies, and any Castle survivors.',
        'Keep Trista’s BELOW token private unless she reveals it. Do not make the mine map explain the Echo mystery by itself.'],
      choices: ['If the castle remains active, keep this session save for next play.', 'If the map is secured, the next pack is Wave Echo Cave after rest and player choice.'],
      private: ['Adventure p. 41. Session 3 outcomes must be entered after actual play, not prewritten as history.']
    }
  ];
  globalThis.ECHO_SESSION3_ART = {
    's3-travel': ['W01'], 's3-agatha': ['W02', 'W03', 'W04'],
    's3-old-owl': ['W05', 'W06'], 's3-wyvern': ['W07', 'W08'],
    's3-castle-sight': ['C00'], 's3-area1': ['C01', 'C03'],
    's3-area2': ['C02', 'C02B'], 's3-area4': ['C04'], 's3-area5': ['C05'],
    's3-area6': ['C06'], 's3-area7': ['C07'], 's3-area8': ['C08', 'C08B'],
    's3-area9': ['C09'], 's3-area10': ['C10'], 's3-area11': ['C11'],
    's3-area12': ['C12'], 's3-area13': ['C13'], 's3-area14': ['C14']
  };
})();
