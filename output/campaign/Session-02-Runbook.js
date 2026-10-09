(() => {
  'use strict';
  // Original table narration. Published town facts remain linked in the DM run sheet.
  globalThis.ECHO_SESSION2_RUNBOOK = [
    {
      id: 's2-prep', title: 'Before play · Session 1 handoff', scene: 'lmop-barthen-exterior',
      tv: 'Show Barthen’s exterior. Keep the marked town map, token notes, and all DM clues private.',
      ask: [
        'Confirm Trista and Pebble’s level-2 HP choices. The other three players manage their own level-2 sheets; ask for combat totals only when needed.',
        'Is the supply wagon present and intact? Who approaches Barthen? Does Sildar enter with the group?',
        'Confirm what gear Sildar currently has. He rested, but his armor and weapons were taken in the hideout.'
      ],
      run: [
        'Create a restore point and backup before play. Keep the Session 1 actual recap open.',
        'Known: Gundren was taken by humanoid figures; his destination is unknown. Trista privately has the BELOW token; Donavan only noticed her hide something.',
        'No delivery, payment, conversation, or inn stay has happened yet.',
        'After the opening, Sildar, the inn, town contacts, and Redbrand pressure are options, not required scenes in a fixed order.',
        'Klarg is dead and Yeemik remains in charge of Cragmaw Hideout after honoring his bargain; do not reset that location if the party returns.'
      ],
      private: ['Do not put Trista’s token or any unrevealed Echo explanation on the player TV.', 'The cave’s BELOW token has not been established as Gundren’s black medallion. Keep their connection and any powers unconfirmed until play establishes them.', 'This is the earlier Session 2 setup. Later actual play left Gundren at an unnamed inn, Trista holding Glasstaff’s rat, and the party at Barthen’s Provisions. Glasstaff escaped to Cragmaw Castle; the destination remains DM-only.']
    },
    {
      id: 's2-arrival', title: '1 · Outside Barthen’s Provisions', scene: 'lmop-barthen-exterior',
      tv: 'Keep the shop exterior on the TV. No battle map is needed for the opening conversation.',
      read: [
        'The road ends in a street of packed earth and old stone. A trading house stands ahead, its doorway busy with local customers. Sildar slows beside you and studies the town as if trying to remember the face of an old friend. Gundren should have been here before you. He is not. What do you do?'
      ],
      ask: ['Who approaches the door? Where is the wagon? Does Sildar go in with you?'],
      run: ['Pause for player decisions. Do not resolve the delivery until the party actually presents the supplies to Barthen.'],
      choices: ['They may speak to Barthen, seek the inn, split up, or ask Sildar for his plan. Follow the choice.']
    },
    {
      id: 's2-barthen', title: '2 · Barthen’s Provisions', scene: 'barthen-art',
      tv: 'Show Barthen’s art and optionally the player-safe banner “Phandalin.” No private book map.',
      read: [
        'Warm lamplight falls over rope, trail food, tools, and stacks of ledgers. Behind the counter, a thin shopkeeper looks up. His welcoming smile falters as he counts the faces coming through the door. “Where is Gundren?”'
      ],
      ask: ['What do you tell Elmar Barthen about Gundren?', 'Do you present the supplies, ask about the Rockseeker brothers, or ask about town?'],
      run: [
        'Elmar Barthen expected Gundren but has not seen him. He mentions Nundro and Tharden Rockseeker, who have also been away. He knows no confirmed location for Gundren.',
        'If the supplies are actually delivered, pay the published 10 gp per character and record it. If the wagon is absent or damaged, talk through what arrived before deciding payment.',
        'Barthen can point to Stonehill Inn for lodgings. If asked about danger, he says Redbrands harass local merchants and frequent the Sleeping Giant. He does not stock armor or weapons.'
      ],
      choices: ['Let Pebble ask about rare stone; Barthen knows prospectors and ore, not the Echo’s secret.', 'Let Trista decide whether to mention the token. Donavan does not know what she hid.'],
      private: ['Lost Mine of Phandelver p. 16. Barthen should not magically know where Gundren was taken.', 'Gundren is Trista’s benefactor. Give her room to respond without announcing that relationship or her hidden token for her.']
    },
    {
      id: 's2-sildar', title: '3 · Sildar’s next step', scene: 'phandalin-art',
      tv: 'Show town arrival art or keep Barthen’s exterior; keep Sildar’s private goals on the DM screen.',
      read: ['Sildar scans the main street. “I will ask after Iarno and find us a place to gather our thoughts. We need something firmer than a rumor before we choose a road.”'],
      ask: ['Do you go with Sildar to Stonehill Inn, ask him about Iarno, or make your own inquiries?'],
      run: [
        'Sildar is looking for Iarno Albrek, a missing Lords’ Alliance member. He can help ask questions without taking the decision away from the party.',
        'At this table, no confirmed Gundren destination was established in Session 1. If asked, describe only what Sildar actually witnessed or learned, then let the party investigate.',
        'After lodging at Stonehill, Sildar wants to restore order and investigate both Iarno and the missing mine. He offers 500 gp if the party can locate Cragmaw Castle; this is a future reward, not a clue to its location.',
        'Confirm his current armor and weapons before using his equipped combat statistics.'
      ],
      private: ['Play Sildar’s spoken beat only if the party talks with him. If they split up, he can seek lodging and Iarno independently; reveal what he learns when they meet again.', 'Published Iarno material is on pp. 14 and 18-19. His eventual identity is DM-only until discovered.']
    },
    {
      id: 's2-inn', title: '4 · Stonehill Inn and rumors', scene: 'lmop-stonehill-common-room',
      tv: 'Use Phandalin art and town ambience. Publish only the clue a player actually hears.',
      read: ['The inn is warmer and louder than the street. Supper, wet cloaks, and low conversation crowd the common room. Several people glance toward your travel-worn gear. A child at one table stops talking mid-sentence.'],
      ask: ['Who do you speak with? What do you ask, and what do you keep to yourselves?'],
      run: [
        'Toblen keeps the inn; Trilena knows families worried by the Redbrands. Pip knows his friend Carp found a tunnel near Tresendar Manor.',
        'Give one relevant rumor per conversation. The Redbrands harass townsfolk, use the Sleeping Giant, and have a connection to Tresendar Manor.',
        'The Dendrar family’s disappearance is a serious consequence of the gang’s actions. Let it become a player-chosen motive, not a forced quest.'
      ],
      choices: ['A conversation can point to Qelline Alderleaf and Carp, Daran Edermath, Sister Garaele, Harbin Wester, Linene Graywind, or Halia Thornton.', 'If the players pursue Gundren alone, let them gather evidence rather than fabricating a known destination.'],
      private: ['Lost Mine of Phandelver pp. 15-18. Keep each NPC’s motive distinct.']
    },
    {
      id: 's2-town', title: '5 · Follow the party’s town lead', scene: 'phandalin-art',
      tv: 'Use town art for conversation. Change to black screen for private or tense exchanges if helpful.',
      ask: ['Which lead matters most now: Gundren, Redbrands, the stolen goods, Iarno, or an out-of-town rumor?'],
      run: [
        'Lionshield Coster · Linene Graywind is brisk and wary of the gang. Say: “If you have something with a blue lion mark, bring it where I can see it.” She offers 50 gp for the stolen goods from Cragmaw Hideout once returned or located.',
        'Alderleaf Farm · Qelline is a welcoming halfling farmer. Her son Carp found a tunnel near the manor; he can guide the party to area 8. Say: “Carp came back white as a sheet, but he remembers exactly where he went.” If asked how to find Cragmaw Castle, Qelline suggests Reidoth the druid in Thundertree, who knows the surrounding land; she cannot locate the castle herself.',
        'Edermath Orchard · Daran is a retired adventurer who wants someone to teach the Redbrands a lesson. Say: “Bullies grow bold when decent folk look away.” He can also ask the party to investigate Old Owl Well; the Order of the Gauntlet is a later opportunity.',
        'Townmaster’s Hall · Harbin Wester is fearful and downplays the Redbrands. His posted orc task offers 100 gp for a group that deals with the threat at Wyvern Tor. Say: “The notice is there. I would rather you looked east than stirred up trouble here.”',
        'Miner’s Exchange · Halia Thornton offers 100 gp to remove Glasstaff and bring her his correspondence. She knows the Redbrands have a goblin who may know the castle’s location; she does not know it herself. DC 15 Insight can reveal that she wants control of the gang, not merely its end.',
        'Shrine of Luck · Sister Garaele seeks news of Bowgentle’s spellbook through the banshee Agatha. She can offer three healing potions as payment if the party takes the errand. Say: “I need someone who can ask a delicate question and return with the answer.”',
        'Sleeping Giant · Grista runs the rough tap house where Redbrands gather. Entering can trigger the street confrontation; the party may scout, talk, or leave. Do not start initiative merely because they approach.'
      ],
      choices: ['Do not require every location in one session. Follow only the lead the players choose.', 'If they focus on Gundren, a questioned Redbrand or Iarno’s papers can establish the gang’s role and Cragmaw Castle destination. Qelline can independently point toward Reidoth; Halia can point toward the gang’s goblin. Droop knows only a broad direction, while a captured bugbear can give a more precise castle lead. Reveal only what the party actually uncovers.', 'If they return to Cragmaw Hideout, Yeemik is still in charge after keeping his bargain. Play the visit as a new consequence of that deal.'],
      private: ['Published locations and rewards: Lost Mine of Phandelver pp. 16-18. Award no quest reward until its condition occurs.']
    },
    {
      id: 's2-redbrands', title: '6 · Redbrand confrontation · optional', scene: 'phandalin-street', encounter: 'redbrand-street',
      tv: 'Only when positions matter, show the gridless, player-safe street map. Place the four ruffians when the players see them; keep the printed DM map private.',
      read: ['Four people in dirty red cloaks drift into your path. One plants a boot on the boardwalk. Another watches the townsfolk make room without being asked. The first says, “Visitors usually learn how things work here before asking questions.” What do you do?'],
      ask: ['Do you answer, leave, seek help, bargain, or fight? Where is everyone standing?'],
      run: [
        'Trigger after the party has engaged with town trouble, visits the Sleeping Giant, or investigates the manor. Do not force it immediately outside Barthen’s.',
        'Four Redbrand Ruffians. Each has AC 14, HP 16, initiative +2, speed 30 ft.; Multiattack makes two shortsword attacks, +4 to hit for 1d6+2 piercing each. No automatic surprise.',
        'If three are defeated, the last tries to escape toward Tresendar Manor. A captured ruffian can confirm Redbrands abducted Gundren, but rank-and-file members do not know his destination. Protect bystanders from automatic splash damage.'
      ],
      choices: ['The party can de-escalate, retreat, capture, or fight. If they avoid the gang, let consequences develop later.'],
      private: ['Published trigger and flight behavior: p. 19; stat block: appendix B p. 61. Four ruffians can make eight attacks per round.', 'Their knowledge that Redbrands abducted Gundren is custom campaign continuity. Do not announce it unless a ruffian is questioned or other evidence emerges.']
    },
    {
      id: 's2-manor', title: '7 · If they reach Tresendar Manor', scene: 'lmop-tresendar-manor',
      tv: 'Keep the marked hideout map on the DM display. Switch to the unmarked hideout map with fog when the party enters; reveal only explored space.',
      ask: ['Do you approach the ruins openly, seek Carp’s tunnel, scout, or wait?'],
      run: [
        'The printed Redbrand Hideout starts on p. 20. Use the private marked map for exact room positions. The TV map is an unmarked tactical aid, not a copy of the keyed plan.',
        'Manor cellar reaches area 1. Carp’s tunnel reaches area 8. Oil lamps light most rooms; see the book for each exception. Most doors are unlocked: DC 10 thieves’ tools to pick a lock, DC 20 Strength to break a locked door.',
        'A secret door is noticed with passive Perception 15 within 10 feet, or with an active DC 10 Perception check. Ask how the characters search rather than revealing hidden routes automatically.'
      ],
      private: ['No marked Phandalin or hideout map goes on the player TV.']
    },
    {
      id: 's2-cellar', title: '8 · Cellar and cistern · area 1', scene: 'redbrand-hideout', encounter: 'hideout-cellar',
      tv: 'Reveal just the entry and cellar. Place enemies only if they enter from the barracks.',
      read: ['Old stone steps lead below the manor. The air is cool, and dark water rests in a deep cistern. Barrels and worn flagstones crowd the cellar. A narrow door leads farther in.'],
      ask: ['How do you search the cistern and barrels? Are you quiet, and who watches the doors?'],
      run: ['Cistern is 10 feet deep. A waterproof satchel hidden on its south wall is found by DC 15 Perception or probing. It contains a healing potion, invisibility potion, 50 gp, and ordinary travel clothes.', 'Loud searching can alert the three ruffians in area 2. The southwest secret door reaches the crevasse; use the secret-door checks in the manor entry beat.'],
      private: ['Lost Mine of Phandelver p. 20. Do not show the secret door or satchel on TV before discovery.']
    },
    {
      id: 's2-barracks', title: '9 · Redbrand barracks · area 2', scene: 'redbrand-hideout', encounter: 'hideout-barracks',
      tv: 'Reveal the barracks as the door opens. Deploy three ruffians if they are present.',
      read: ['A lamp warms this rough sleeping room. Red cloaks hang from pegs above bedrolls and discarded boots.'],
      ask: ['Do you speak, close the door, rush in, or withdraw?'],
      run: ['Three Redbrand ruffians. If area 1 was noisy, they prepare an ambush; check whether the party notices them before deciding surprise. Each has AC 14, HP 16, +2 initiative; two shortsword attacks at +4 for 1d6+2 piercing each.', 'Their belt pouches hold 16 sp and 7 gp; 12 sp and 5 gp; and 15 ep plus two garnets worth 10 gp each. Three scarlet cloaks hang here. Award only what the party actually takes.'],
      private: ['Lost Mine of Phandelver p. 21; ruffian stat p. 61.']
    },
    {
      id: 's2-trap', title: '10 · Hall and hidden pit · area 3', scene: 'redbrand-hideout', encounter: 'hideout-trap',
      tv: 'Reveal the corridor; show the pit only after it is detected or triggered.',
      read: ['A dusty stone hall runs toward copper-covered double doors. Old decorative columns break up the walls.'],
      ask: ['Who leads, and how do you cross or inspect the floor?'],
      run: ['The covered floor collapses beneath 100 pounds or more. DC 15 Wisdom (Perception) spots the pit and narrow side ledges. DC 10 Dexterity (Acrobatics) skirts it. A triggering creature or one that fails to skirt can catch the edge with DC 15 Dexterity save; otherwise it falls 20 feet, takes 2d6 bludgeoning, and lands prone.', 'Mark the hazard only when found or triggered. The book awards 100 XP for surviving or bypassing it if you use XP rather than milestones.'],
      private: ['Lost Mine of Phandelver p. 21.']
    },
    {
      id: 's2-crypt', title: '11 · Crypt · area 4', scene: 'redbrand-hideout', encounter: 'hideout-crypt',
      tv: 'Reveal the crypt; deploy skeletons only when they animate.',
      read: ['Three old stone coffins stand in a dusty crypt. Human skeletons in rusted armor are propped against them, and copper-covered double doors wait at the far end.'],
      ask: ['Do you examine the coffins, pass through, or approach the side doors?'],
      run: ['Three skeletons animate when a creature comes within 10 feet of the doors to areas 5 or 6, unless that creature wears a scarlet cloak or gives the password “Illefarn.” Fighting here alerts the two guards in area 5.', 'Each sarcophagus contains a platinum signet ring worth 50 gp. Track which are opened; this is not automatic loot.'],
      private: ['Lost Mine of Phandelver p. 22; skeleton stat: Monster Manual (2014) p. 272.']
    },
    {
      id: 's2-pens', title: '12 · Slave pens · area 5', scene: 'redbrand-hideout', encounter: 'hideout-pens',
      tv: 'Reveal guards and captives only when seen. Keep their later story private until conversation.',
      read: ['Iron bars divide the chamber into cells. Two armed Redbrands stand guard. A woman and a young woman are confined to one side; a boy is held apart from them.'],
      ask: ['How do you protect the captives? Do you fight, negotiate, or create a distraction?'],
      run: ['Two ruffians guard Mirna Dendrar, her thirteen-year-old son Nars, and her eighteen-year-old daughter Nilsa. If they heard fighting in area 4, they prepare at the wall by the door. The family needs rescue and a safe escort.', 'The cell locks require DC 10 Dexterity with thieves’ tools or DC 22 Strength to force; Iarno’s or Mosk’s key opens them. Mirna knows her husband Thel was killed; his body is in area 8. Once safe, she can tell the party about the emerald necklace hidden in the ruined alchemy shop in Thundertree. Do not place captives in splash damage automatically.'],
      private: ['Lost Mine of Phandelver p. 22.']
    },
    {
      id: 's2-armory', title: '13 · Armory and storeroom · areas 6–7', scene: 'redbrand-hideout',
      tv: 'Reveal only the opened room; keep the secret route out of the player view.',
      read: ['Weapon racks line one chamber; the next smells of leather, fur, and dust. Old storage here still serves someone.'],
      ask: ['What do you take, and do you search for another way through?'],
      run: ['Area 6 is locked from the outside. Its racks hold 12 spears, 6 shortswords, 4 longswords, 6 light crossbows, eight quivers of 20 bolts each, and 12 red cloaks.', 'Area 7 stores 30 beaver pelts worth 2 gp each. Its secret routes connect to the armory and Glasstaff’s quarters; use the private map for exact doors.'],
      private: ['Lost Mine of Phandelver pp. 22–23.']
    },
    {
      id: 's2-crevasse', title: '14 · Crevasse and nothic · area 8', scene: 'redbrand-hideout', encounter: 'hideout-crevasse',
      tv: 'Reveal the fissure, bridges, and currently visible path. Keep the hidden chest and secret routes unrevealed.',
      read: ['The worked stone gives way to a raw split in the earth. Two narrow bridges cross the dark gap, and the space below is difficult to make out.'],
      ask: ['Do you cross, speak, search, or back away? What do you offer the creature?'],
      run: ['Carp’s hillside tunnel enters here. The nothic hides near the west ends of the bridges. It communicates telepathically and prefers food or another useful bargain to combat; it knows the same hideout information the Redbrands do.', 'The south bridge collapses under more than 50 pounds. DC 15 Intelligence (Investigation) notices the weak construction. The fissure is 20 feet deep; a fall deals 2d6 bludgeoning and leaves the victim prone in difficult terrain.', 'The nothic’s chest is in a cubbyhole at the bottom of the fissure beneath the north bridge, invisible from the edge. It contains 160 sp, 120 gp, five 15 gp malachites, two healing potions, an augury scroll, and Talon, a +1 longsword. Thel Dendrar’s body lies below.'],
      private: ['Lost Mine of Phandelver p. 23. Nothic: AC 15, HP 45, two +4 claws (1d6+3 each), Rotting Gaze DC 12 Con or 3d6 necrotic.']
    },
    {
      id: 's2-bugbears', title: '15 · Bugbears and Droop · area 9', scene: 'redbrand-hideout', encounter: 'hideout-bugbears',
      tv: 'Reveal the room and three bugbears when seen. Keep Droop’s allegiance ambiguous until he reacts.',
      read: ['Three large figures occupy the room as though it belongs to them. A goblin nearby flinches at your arrival and looks ready to disappear into the floor.'],
      ask: ['Do you speak, fight, retreat, or try to separate the goblin from them?'],
      run: ['Three bugbears sent by the Black Spider. Droop faints when he sees the party; he remains unconscious for 1d10 minutes unless awakened. He hides if fighting starts and is not an automatic attacker.', 'Each bugbear has AC 16, HP 27, +4 morningstar for 2d8+2 piercing; Surprise Attack adds 2d6 on a hit against a creature it surprised in the first round. Use the five current level-3 sheets and live HP/resources when assessing risk; make retreat and bluffing possible.', 'Scarlet cloaks can persuade the bugbears that the characters serve Iarno; a plausible deception can use DC 15 Charisma (Deception). Droop can describe the hideout and broad northern forest direction of Cragmaw Castle, but not the route. A captured bugbear can disclose the castle’s location on a DC 15 Charisma (Intimidation) check.', 'Mosk carries 33 sp, a jeweled eye patch worth 50 gp, and a key that opens every locked door in the hideout.'],
      private: ['Lost Mine of Phandelver p. 24; bugbear stat p. 56. Do not invent a precise castle route.']
    },
    {
      id: 's2-common', title: '16 · Common room · area 10', scene: 'redbrand-hideout', encounter: 'hideout-common',
      tv: 'Reveal the common room and four ruffians only when the party opens the way.',
      read: ['Dice clatter across a scarred table. Four red-cloaked figures sit around a game, cups and coins at their elbows.'],
      ask: ['Do you bluff your way in, observe, attack, or leave?'],
      run: ['Four ruffians are drinking and gambling. All four have the poisoned condition from drink: disadvantage on attack rolls and ability checks. They are automatically surprised if the party bursts into the room; if the approach is slower, adjudicate what they notice.', 'Characters in red cloaks may bluff as new recruits with a DC 10 Charisma (Deception) check, especially if they join the game. The table holds 75 cp, 55 sp, 22 ep, 15 gp, and a ruby-set gold earring worth 30 gp.'],
      private: ['Lost Mine of Phandelver p. 24.']
    },
    {
      id: 's2-workshop', title: '17 · Wizard’s workshop · area 11', scene: 'redbrand-hideout',
      tv: 'Reveal the workshop when entered. Do not announce the rat’s link to Glasstaff.',
      read: ['Glassware, notes, and pungent powders cover the benches.'],
      ask: ['What do you examine? Does Trista do anything with the rat she captured?'],
      run: ['Latest actual play overrides the first-entry setup: the party captured the rat. Keep its current custody; do not put a second rat in this room. Its familiar nature remains DM-only unless the party learned it.', 'In the printed first-entry setup, the rat is Iarno’s familiar and warns him telepathically as soon as it detects intruders. It has AC 10, 1 HP, speed 20 feet, and no effective attack.', 'The apparatus appears intended to brew invisibility potions, but Iarno has not succeeded. A Dwarvish tome describes the lost mine and Lightbringer. Three reagents—mercury, dragon bile, and powdered nightshade—are worth 25 gp each. Track what is read and taken.'],
      private: ['Lost Mine of Phandelver p. 25.']
    },
    {
      id: 's2-glasstaff', title: '18 · Glasstaff’s quarters · area 12', scene: 'redbrand-hideout', encounter: 'hideout-glasstaff',
      tv: 'Reveal the quarters on entry. Place Iarno only if he remains; keep the Black Spider letter private until found.',
      read: ['A better-appointed room sits beyond the rougher hideout. Papers lie beside a travel chest. Someone has been planning from here.'],
      ask: ['Where did the party last see Glasstaff? What remains to search, and how is Gundren doing at the inn?'],
      run: ['Latest actual play overrides this prepared confrontation: Glasstaff put Gundren to sleep and escaped to Cragmaw Castle; the party left Gundren at an unnamed inn and Trista holds Glasstaff’s rat. Play stopped at Barthen’s Provisions. Do not redeploy Glasstaff here, restart the fight, or present Gundren as a castle hostage. The castle destination is DM-only until discovered.', 'For unresolved room contents, inspect the saved scene and what the party actually took before using the printed first-entry setup below.', 'Iarno Albrek is Glasstaff. In the printed first-entry setup, a warning from the rat lets him flee by the secret route through areas 7, 8, and 1. Those steps are reference behavior, not a replay of the completed escape.', 'Evil Mage base: AC 12, HP 22, speed 30, spell save DC 13, spell attack +5. Slots: 1st level 4, 2nd level 3. Magic missile, charm person, hold person, misty step, shocking grasp, light, mage hand.', 'Staff of defense: +1 AC while held; 10 charges. Its printed entry spends 1 charge to cast mage armor or 2 to cast shield, using an action. Mage armor plus Dexterity and held staff makes Iarno AC 16. Track charges. Check the item entry before a shield ruling.', 'A search may find the Black Spider letter and an unlocked chest: 180 sp, 130 gp, five carnelians (10 gp each), two peridots (15 gp each), and one pearl (100 gp). Check what Glasstaff took and what the party found before awarding any of it.', 'A custom Redbrand transfer record in Iarno’s desk names Gundren Rockseeker and Cragmaw Castle. If found, it documents an earlier transfer, not Gundren’s current location. Do not treat it as discovered unless the party actually searched the desk.', 'Iarno knows the Spider seeks the Forge but not the cave’s location. Confirm other knowledge against actual play before giving an answer.'],
      private: ['Describe Iarno and his staff only if he is still present. If he escaped, remove the scrolls from the chest and keep the staff with him.', 'Lost Mine of Phandelver pp. 25–26; Evil Mage appendix p. 57; staff of defense appendix A p. 53.']
    },
    {
      id: 's2-close', title: 'Close · What changed in Phandalin', scene: 'phandalin-art',
      tv: 'End with a town image, journal item, or black screen. Keep private clues off the TV.',
      ask: ['What did each character decide to pursue next?'],
      run: [
        'Record wagon delivery and payment only if completed; NPCs met, clues heard, Sildar’s lodging and gear, Redbrand outcome, captives, and the party’s next destination.',
        'If they entered the hideout, record the exact room and route, fog revealed, alarms, remaining enemy groups, Droop’s status, Dendrar family safety, Iarno’s location, treasure taken, and any map secrets the players actually found.',
        'Keep Trista’s token private unless she revealed it. Record what Donavan actually learned rather than what he suspects.',
        'If the entire Redbrand hideout was resolved, review advancement and record the actual decision before Session 3. A partial town visit does not require a new milestone.'
      ]
    }
  ];
  // Catalog keys are resolved at display time so existing campaign saves gain the art cues.
  globalThis.ECHO_SESSION2_ART = {
    's2-arrival': ['P01'],
    's2-inn': ['P02', 'P03'],
    's2-town': ['P04', 'P05', 'P06', 'P07', 'P08', 'P09', 'P09B', 'P09C'],
    's2-redbrands': ['P10'],
    's2-manor': ['P11', 'P12'],
    's2-cellar': ['R01'],
    's2-barracks': ['R02'],
    's2-trap': ['R03', 'R03B'],
    's2-crypt': ['R04'],
    's2-pens': ['R05'],
    's2-armory': ['R06', 'R07'],
    's2-crevasse': ['R08', 'R08B'],
    's2-bugbears': ['R09'],
    's2-common': ['R10'],
    's2-workshop': ['R11'],
    's2-glasstaff': ['R12']
  };
})();
