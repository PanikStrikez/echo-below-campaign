window.ECHO_RUNBOOK = [
  {
    id: 'prep', title: 'Before play', scene: 'cover',
    tv: 'Start with the campaign cover. Keep the hideout map and route schematic private.',
    ask: [
      'Who drives the wagon? Who watches ahead? Who guards the rear? Ask Byron to introduce Pebble and Bowman to introduce Aldric Vane before setting marching order.',
      'Pebble’s handout lists Fighter 1, AC 18, HP 12, and a shield; confirm his current HP and Second Wind use. Aldric’s DM-built level-1 sheet is ready: HP 8, AC 11 before Mage Armor, spell attack +5, save DC 13, two 1st-level slots. Ask Bowman if he wants any spell choices changed before play.',
      'Ask Donavan which 1st-level spells are prepared and Ringgo which second skill has Expertise; record only their actual choices.',
      'Before departure, check every traveler’s light source. Pebble’s token is ready; Aldric’s token is ready; ask both new players for any corrections to the DM-built sheets.'
    ],
    run: [
      'Open the player screen on the table TV, check it shows the cover with no DM information, then make a pre-session restore point and confirm the backup is available.',
      'Party: Trista, Donavan, Ringgo, and Pebble are level 1. Aldric joins in Session 1 as a level-1 wizard with a DM-built sheet. Confirm his prepared spells and current resources with Bowman. Check everyone’s current HP and resources before play.',
      'Start with the printed enemy counts, then judge pacing for five actual PCs once the new sheets are known. Do not increase enemy damage to compensate for party size.',
      'Immediate objective: locate Gundren and Sildar. No party member begins with secret knowledge of the Echo.'
    ],
    private: ['Use milestone advancement. The PCs can reach level 2 after the hideout is resolved; do not require a full cave clear if rescue or negotiation resolves its stakes.']
  },
  {
    id: 'departure', title: '1 · Gundren rides ahead', scene: 'gundren',
    tv: 'Show Gundren’s departure scene. After he leaves, ask for marching order.',
    read: [
      'The wagon is loaded with mining supplies and road provisions. Gundren Rockseeker checks the straps one last time while Sildar waits beside their horses. The dwarf grins, but he seems impatient to get to Phandalin. “Take this to Barthen’s Provisions. I’ll meet you there.”',
      'Gundren turns to Donavan. “If the mine holds anything unusual, write down what you actually see before anyone decides what it is worth.” To Trista, he adds, “Make sure I come back to read his account.” To Ringgo: “Choose the safe camp over the fast one. I hired you to bring people through.”'
    ],
    ask: [
      'Ask each of the five players what their character says back to Gundren. Pebble has heard from the dwarves who made his hammer about delicious shiny rocks near mountains; let Byron decide how he says it. Let Bowman decide what Aldric says about taking the escort job; do not reveal his hidden history for him.',
      'Who drives, scouts, and watches the rear? Let their answers decide positions at the ambush.'
    ],
    run: [
      'Gundren and Sildar ride ahead; the party escorts the wagon from Neverwinter toward Phandalin. The published wagon-delivery payment is 10 gp per character.',
      'Pebble joined the escort to reach Phandalin’s mines without getting lost. Aldric also joins from the start; ask Bowman why he chose this job rather than assigning a reason.'
    ],
    private: [
      'Gundren once paid a dangerous debt for Trista and gave her another chance. He trusts her. He hired Donavan for careful field records and Ringgo for legitimate escort work.',
      'Do not reveal or hand over Echo’s Whisper here. Its future custody follows play.'
    ]
  },
  {
    id: 'ambush', title: '2 · Dead horses and ambush', scene: 'horses', encounter: 'road',
    tv: 'Show The empty horses first. After goblins are seen or attack, use Road ambush · revealed; switch to the gridded road map when positions matter.',
    read: [
      'The trail bends between close woods. Two horses lie across the road ahead, dead and pierced by black-feathered arrows. Their saddlebags hang open. Neither rider is in sight.'
    ],
    ask: [
      '“What do you do?” Wait for their approach before announcing combat.',
      'On close inspection, identify the horses as Gundren’s and Sildar’s; the saddlebags were looted.'
    ],
    run: [
      'Four goblins hide in the woods, two on each side. Roll one goblin Stealth check at +6 and compare it with each traveler’s passive Perception for surprise.',
      'On their first turn, two goblins rush forward while two shoot from cover. Goblins can Hide or Disengage as a bonus action. If three fall, the last tries to flee toward the hideout.',
      'Goblin: AC 15, HP 7, speed 30 ft.; scimitar or shortbow +4 to hit, 1d6+2 damage. Passive Perception 9.',
      'All five player characters choose their own opening actions. Track initiative, cover, and who is actually visible to the goblins.'
    ],
    choices: [
      'Let them pick targets, use cover, capture a goblin, pursue a runner, or secure the wagon.',
      'If combat is easy, let it be a clean win. The real problem is finding the missing travelers.'
    ],
    private: ['Do not show goblin positions on the TV until spotted or until they attack. Stage them on your map with “On TV” unchecked if useful.']
  },
  {
    id: 'aftermath', title: '3 · Clues after the road fight', scene: 'road',
    tv: 'Leave the road map up while they search, or use a black screen for a quiet conversation.',
    read: [
      'The woods settle. The two horses still block the road. Broken brush and small tracks lead north, away from the wagon and into thicker trees.',
      'Among the goblins’ castoffs is a rough dark stone token. One side bears a single worn word: BELOW. The other carries part of a circle rubbed almost smooth.'
    ],
    ask: [
      '“Do you follow the trail now, rest, or take the wagon toward Phandalin?”',
      'If they follow the trail, ask who secures the wagon and whether the whole party travels together.',
      'If they examine the token, ask what they do with it; do not require a check to notice its basic features.'
    ],
    run: [
      'Any inspection of the ambush area reveals the goblin trail north of the road. A DC 10 Survival check adds that about a dozen goblins used it and two human-sized captives were dragged away. Following a fleeing goblin or questioning a captive also establishes the lead.',
      'A captive goblin knows that the dwarf and his map were sent toward Cragmaw Castle; it can lead or direct the party toward the hideout.',
      'If they miss the BELOW token, move it to the hideout. It is optional and never required to continue.'
    ],
    choices: [
      'If they take the wagon to Phandalin, Barthen says Gundren has not arrived and urges investigation. Bring the trail lead back through local concern rather than ending the rescue plot.'
    ],
    private: [
      'The token is not Echo’s Whisper. It has no power or key function. Donavan may think its mark resembles damaged research notation but cannot solve it.',
      'After a distant boom, anyone studying it notices it feels cooler. No roll is needed.'
    ]
  },
  {
    id: 'trail', title: '4 · Goblin trail and traps', scene: 'black',
    tv: 'Show Goblin trail. Use Snare · discovered and Pit · discovered only after each trap is noticed or triggered. Do not show the cave image until they reach it.',
    read: [
      'The goblin trail narrows under the trees. Broken twigs and churned earth show several small creatures passed this way, with heavier marks among them. The road disappears behind you.'
    ],
    ask: [
      '“Who leads? Are you moving quickly or watching for traps?”',
      'Ask what happens to the wagon and supplies while the party pursues the trail.'
    ],
    run: [
      'The hideout is about five miles from the ambush. Roughly ten minutes along the trail is a snare: the lead character notices automatically with passive Perception 12 or higher; otherwise DC 12 Perception. If triggered, DC 10 Dexterity save to avoid being hoisted 10 feet and restrained. A character cut down carelessly takes 1d6 bludgeoning.',
      'Another ten minutes along is a concealed 10-foot-deep pit: the lead notices automatically with passive Perception 15 or higher; otherwise DC 15 Perception. If triggered, DC 10 Dexterity save to avoid the fall; falling deals 1d6 bludgeoning damage.',
      'A careful physical plan, tool, familiar, or probing pole can avoid a trap without a roll. Trista and Ringgo can scout; Donavan can document tracks; invite Pebble and Aldric to add their own methods. Pebble may remember mountain terrain but is uneasy about losing the route.',
      'A short rest is possible if the party secures a defensible place. It costs time, and enemies may respond to noise.'
    ],
    choices: ['If the party chooses a different route, keep their rescue lead available through tracks, captives, or Phandalin.']
  },
  {
    id: 'cave', title: '5 · Cave mouth and approach', scene: 'cave-mouth',
    tv: 'Show the cave-mouth art. Use the cave approach battle map only if exact positions outside matter.',
    read: [
      'The trail ends below a wooded hill. A shallow stream runs from a dark cave mouth, with a narrow path beside it. Briars crowd the bank. Cold water murmurs over stone.'
    ],
    ask: [
      '“How do you approach? Who scouts the entrance? Are you carrying a light?”',
      '“Where are the wagon and extra supplies?”'
    ],
    run: [
      'Area 1 is the cave mouth, 2-foot-deep stream, and briars. A noisy arrival can alert the bored goblin lookouts in area 2. The streamside thickets give half cover; cave chambers beyond areas 1–2 are dark.',
      'Switch to the interior map once they enter. Reveal only what their position and light allow. One interior map square equals 5 feet.'
    ],
    private: ['The cave opening is ordinary stone. Do not show a portal, visible Echo effect, or secret room layout.']
  },
  {
    id: 'blind', title: 'Area 2 · Goblin blind', scene: 'interior', encounter: 'blind',
    tv: 'Show Area 2 · Goblin blind beside the fogged map. Reveal the streamside briars first; place the two goblins only when seen or when they attack.',
    read: [
      'Across the stream, the briars are thick enough to swallow the path. A board creaks faintly behind them, then goes still.'
    ],
    ask: ['“Do you cross, watch, call out, or try another path?”'],
    run: [
      'Two goblins wait in a hollowed-out blind on the east side of the stream. The surrounding thickets give half cover. They can fire from cover and may surprise careless intruders.',
      'If the party made loud noise at the entrance, the lookouts notice and shoot through the briars. Do not automatically alert every cave room.',
      'Goblin: AC 15, HP 7, attack +4 for 1d6+2, bonus-action Hide or Disengage.'
    ],
    choices: ['Stealth, scouting, a rush across the stream, a distraction, or retreat can all change the position of this fight.']
  },
  {
    id: 'kennel', title: 'Area 3 · Kennel and wolves', scene: 'interior', encounter: 'kennel',
    tv: 'Show Area 3 · Kennel as the characters enter or illuminate it, beside the fogged map. Place three wolf icons.',
    read: [
      'A sharp animal smell cuts through the damp cave air. Chains scrape against stone. Three pairs of eyes turn toward you from the dark, and low growls fill the cramped chamber.'
    ],
    ask: ['“Do you approach, offer food, try to calm them, or keep your distance?”'],
    run: [
      'Three wolves are chained here. They cannot initially reach someone who stays back on the entrance steps, but barking can carry.',
      'DC 15 Animal Handling calms them; food can distract them with a DC 10 check. No fight is required.',
      'The narrow chimney to area 8 is at the back of the kennel, beyond the wolves’ normal chain reach from the entrance. Reaching it requires a plan for the wolves. Climbing calls for DC 10 Athletics; a poor fall can deal 1d6 bludgeoning damage.',
      'Wolf: AC 13, HP 11, speed 40 ft.; bite +4 for 2d4+2 piercing, DC 11 Strength save or prone. Pack Tactics gives advantage when an ally is beside the target.'
    ],
    private: ['Do not release all three wolves just because a character steps inside. Their chains and the goblins’ reactions matter.']
  },
  {
    id: 'passage', title: 'Area 4 · Steep passage', scene: 'interior',
    tv: 'Show Area 4 · Steep passage beside the fogged map. Reveal the rising passage and stream gradually; the bridge should appear only when it comes into view.',
    read: [
      'The main passage climbs steeply beside the stream. Spray darkens the stone, and loose rubble shifts underfoot. Above the noise, you can make out another passage crossing high overhead.'
    ],
    ask: ['“Do you take the stream passage, test the rubble, or look for another route?”'],
    run: [
      'Rubble is difficult terrain. The fragile ledge collapses under more than 100 pounds; DC 10 Dexterity save, taking 2d6 bludgeoning on a failure or half on a success. Failure also knocks the creature prone.',
      'Route at a glance: the stream climbs toward the overpass (area 5); a higher side passage west reaches Yeemik’s den (area 6); the den connects east across the bridge to the twin pools (area 7), then south to Klarg (area 8). The kennel chimney is a separate shortcut to area 8.',
      'Noise from nearby goblins may be heard by careful listeners. Show the hazard through crumbling stone and spray before asking for a risky crossing.'
    ]
  },
  {
    id: 'bridge', title: 'Area 5 · Overpass and flood', scene: 'interior', encounter: 'overpass',
    tv: 'Show Area 5 · Overpass when the party can see the bridge, beside the fogged map. Keep the guard hidden until spotted or until it signals the pools.',
    read: [
      'A rickety bridge crosses the passage high above the water. A small figure shifts against the shadowed ceiling. Farther upstream, the sound of pooled water presses through the cave.'
    ],
    ask: ['“Do you move under the bridge, try to reach it, or deal with the watcher first?”'],
    run: [
      'One goblin guards the bridge about 20 feet above the stream. If it spots the party, it signals area 7; the first flood arrives on the following round on the pool goblins’ initiative count.',
      'Telegraph a flood with a physical roar and rising water. In the surge’s path, DC 10 Dexterity save to avoid being swept away; a caught creature can try DC 15 Strength to hold on. Failure washes it toward area 1 and deals 1d6 bludgeoning damage.',
      'The goblins at the pools can release a second surge if still able. The bridge can also break; a fall from it is dangerous.',
      'Goblin: AC 15, HP 7, attack +4 for 1d6+2, bonus-action Hide or Disengage.'
    ],
    readAfter: [
      'A heartbeat after the water’s crashing boom, a quieter pressure passes behind your eyes. Then it is gone.'
    ],
    private: ['That second sensation is the campaign’s Echo beat. It causes no save, damage, or immediate explanation.']
  },
  {
    id: 'den', title: 'Area 6 · Yeemik and Sildar', scene: 'interior', encounter: 'den',
    tv: 'Show Area 6 · Goblin den only when the den comes into view. Reveal the higher ledge and place Yeemik, five other goblins, and Sildar once visible.',
    read: [
      'A cooking fire lights an uneven cavern. Goblins look up from their meal. On a higher ledge, a battered human man is held upright by one of them. He can barely stand.',
      'One goblin raises a hand for the others to hold. “You want the human? Then we have something to discuss.”'
    ],
    ask: ['“Do you negotiate, create a distraction, try a rescue, or fight?”'],
    run: [
      'Six goblins occupy the den: Yeemik has 12 HP, and the five ordinary goblins have 7 HP each. Sildar is alive at 1 HP, unarmed, and without armor.',
      'Yeemik wants Klarg removed. He may promise Sildar in exchange, then press for ransom rather than honoring his word. Do not force the party to accept.',
      'If openly threatened, Yeemik can shove Sildar from the ledge; the fall deals 1d6 damage unless the party intervenes or heals him. Make his position and danger legible before the decision.',
      'All six use goblin attacks: AC 15, +4 to hit for 1d6+2, bonus-action Hide or Disengage. Yeemik has 12 HP; each other goblin has 7 HP. Yeemik carries three gold teeth worth 1 gp each and 15 sp.'
    ],
    choices: [
      'Talking, trickery, sneaking, rescue, retreat, and combat are all valid. The five players lead the negotiation and decide how to protect Sildar.'
    ]
  },
  {
    id: 'pools', title: 'Area 7 · Twin pools', scene: 'interior', encounter: 'pools',
    tv: 'Show Area 7 · Twin pools when seen, beside the fogged map. Place the three goblins according to how they respond to alarms.',
    read: [
      'Two dark pools fill much of the cavern. Water presses against rough stone-and-timber dams. The waterfall’s echo makes quieter movement hard to place.'
    ],
    ask: ['“Do you approach the guards, examine the dams, or try a different route?”'],
    run: [
      'Three goblins guard the water controls. If warned by the bridge goblin, they can release a pool into the main passage. The water must actually be present to release.',
      'Noise here can warn Klarg in area 8; one goblin may run to him if a fight breaks out.',
      'Goblin: AC 15, HP 7, attack +4 for 1d6+2, bonus-action Hide or Disengage.'
    ],
    private: ['Keep the physical water hazard separate from the fleeting magical pressure. The pressure is atmosphere, not a second attack.']
  },
  {
    id: 'klarg', title: 'Area 8 · Klarg’s cave', scene: 'interior', encounter: 'klarg',
    tv: 'Show Area 8 · Klarg’s cave only when the supply cave is entered. Place Klarg, Ripper the wolf, and two goblins as they become visible.',
    read: [
      'Sacks and crates fill the far side of the cave. Smoke from a low fire climbs toward an opening above. Behind the stolen supplies, a hulking figure rises, morningstar in hand, while a wolf bares its teeth.'
    ],
    ask: ['“Do you rush in, take cover, talk, withdraw, or try to split them up?”'],
    run: [
      'Klarg the bugbear has AC 16 and 27 HP. Morningstar +4 to hit, 2d8+2 piercing. Ranged javelin +4, 1d6+2. If he surprises someone and hits in round one, add 2d6.',
      'Ripper is a wolf: AC 13, HP 11, bite +4 for 2d4+2 and DC 11 Strength save or prone. Two goblins also fight here.',
      'The fire pit deals 1 fire damage when entered, or 1d6 to a creature that falls prone in it. Supply piles give half cover.',
      'If warned, Klarg and his group use the supply piles as cover. If Ripper dies, Klarg may flee down the chimney toward area 3.',
      'Treasure: 600 cp, 110 sp, two potions of healing, and a jade frog statuette with golden eyes worth 40 gp. Returning the stolen Lionshield Coster goods in Phandalin earns 50 gp.'
    ],
    choices: ['Klarg is the sharpest damage spike for a level-1 PC. Give tracks, noise, or frightened goblins as warning. Reassess only after seeing the five actual character sheets.']
  },
  {
    id: 'sildar', title: 'After rescue · What Sildar knows', scene: 'interior',
    tv: 'Use the current map or a black screen for a conversation. Do not put future locations on the TV.',
    read: [
      'Once he can sit and breathe, Sildar looks toward the cave passage. “Gundren was taken away from here. They wanted him—and the map he carried.”'
    ],
    ask: ['Let the players ask questions. Sildar answers what he knows and says clearly when he does not know.'],
    run: [
      'Gundren and his map were sent toward Cragmaw Castle. Sildar does not know where the castle is.',
      'The goblins said someone called the Black Spider wanted Gundren captured. Sildar does not know the Spider’s identity.',
      'Sildar also came toward Phandalin to investigate missing wizard Iarno Albrek. He wants to reach town and offers 50 gp if escorted there safely.',
      'At 1 HP and without his equipment, Sildar is not ready to lead a fight. If he receives healing and gear, he may help briefly while retaining his own goals.'
    ],
    private: ['Do not have Sildar interpret the BELOW token or name the Echo. His information advances Gundren’s rescue, not the later cosmology.']
  },
  {
    id: 'close', title: 'Close the session', scene: 'black',
    tv: 'Use a black screen or the cover art as the table winds down.',
    read: ['The road to Phandalin is still ahead. Gundren is still out there. For a moment, you have room to decide what matters next.'],
    ask: [
      'Ask each player: “What does your character want to do about Gundren now?”',
      'Ask the party where they intend to go next. Do not force a full hideout clear to fit the clock.'
    ],
    run: [
      'Record Sildar rescued or missing; Gundren leads; Yeemik, Klarg, and goblins alive or escaped; wagon and stolen supplies; token found; water-pressure beat heard; promises made.',
      'Record each of the five PCs’ current and temporary HP, spent resources, and ongoing conditions.',
      'Consider the level-2 milestone after the hideout’s rescue stakes are resolved, before further Phandalin threats.'
    ]
  },
  {
    id: 'rules', title: 'Quick rules and DM safety dial', scene: null,
    tv: 'This reference stays on the DM screen only.',
    run: [
      'Goblin: AC 15, HP 7, speed 30 ft., darkvision 60 ft., Stealth +6, passive Perception 9; scimitar +4 to hit for 1d6+2 slashing or shortbow +4 for 1d6+2 piercing (80/320 ft.); bonus-action Hide or Disengage.',
      'Wolf: AC 13, HP 11, speed 40 ft., passive Perception 13; bite +4 for 2d4+2 piercing, DC 11 Strength save or prone; Pack Tactics advantage with an ally adjacent to the target; advantage on Perception using hearing or smell.',
      'Klarg: AC 16, HP 27, speed 30 ft., darkvision 60 ft., Stealth +6; morningstar +4 for 2d8+2 piercing; ranged javelin +4 for 1d6+2 piercing (30/120 ft.); first-round surprise hit adds 2d6. Yeemik: goblin AC 15 and attacks, but 12 HP.',
      'Sildar starts captive at 1 HP without armor or weapons (adventure pp. 10–11). He can use a weapon recovered from a goblin if rescued. Set his AC and attacks from actual gear before involving him in combat; do not use the old equipped card while he is captive.',
      'The Session 1 party has five player characters and no Dracuseth combatant. Pebble’s provisional attacks and saves come from his player handout; Aldric’s attacks, spells, and saves are seeded from the recorded dice rolls; replace them if Bowman supplies a different current sheet.',
      'Use each character’s actual spell list and rules profile. Track concentration and remind players when a new concentration spell ends the prior one.',
      'If a PC drops to 0 HP, track death saves and make healing, stabilization, cover, retreat, or surrender options visible according to the scene.',
      'A secured short rest can restore Hit Dice and class resources as each live sheet allows. Temporary HP does not stack.',
      'If two PCs fall or healing runs dry, make a credible retreat, surrender, or capture route visible. Play enemy motives honestly and keep the dice meaningful.'
    ],
    private: [
      'Ringgo’s current sheet mixes rules editions. His Nick and Vex weapon labels do not grant mastery unless you explicitly add that feature. Use each live sheet as the mechanical source of truth.',
      'Dracuseth is based in Waterdeep and does not appear in Session 1. The five PCs own the opening choices.',
      'For exact published room wording and map placement, consult Lost Mine of Phandelver Part 1, printed pages 6–12. This runbook supplies a playable table summary and original read-aloud text.'
    ]
  }
];
