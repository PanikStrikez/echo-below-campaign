# Session 1 playtest report

**Historical reference:** preserves the level and information at the time. Current five-person level-3 sheets and the latest stopping point are in Current-Party.md and Session-02-03-Actual-Recap.md. Simulated playtests do not establish actual events.

**Historical test, superseded for party balance:** This run used three PCs plus Dracuseth before Pebble and Aldric joined. Its dice outcomes and Dracuseth-specific findings do not predict the five-PC Session 1 party. The current [run sheet](Session-01-DM-Run-Sheet.md) and [encounter balance notes](Opening-Encounter-Balance.md) take precedence.

**Tested:** 23 September 2026. One agent played Trista, Donavan, and Ringgo without reading the DM runbook. I ran the encounters as DM using a recorded, repeatable dice sequence. A second agent inspected the app and campaign data independently. This is one simulated party path, not a live table or TV display test.

## What happened at the table

1. **Departure and roadside ambush.** The party stopped the wagon 50 feet from the dead horses. A low goblin Stealth roll meant nobody was surprised. Four goblins were defeated in two rounds without party damage. The party found the northbound trail and a small `BELOW` token.
2. **Trail and wagon choice.** Dracuseth stayed with the concealed wagon. Ringgo spotted the snare and avoided the concealed pit with a Dexterity save. The three level-one characters reached the cave without him.
3. **Cave approach.** The party used Ringgo's darkvision, kept lights back, and found two lookouts in the briars. One shouted a warning before both fell. Trista took 4 damage. The wolves stayed chained. The party avoided the flood channel after hearing water held behind a barrier.
4. **Sildar and Yeemik.** The higher route led to the goblin den. The party counted six goblins, saw the danger to Sildar, and negotiated with Yeemik instead of charging. He demanded Klarg's morningstar in exchange for Sildar.
5. **First Klarg attempt.** The three PCs tried to talk. Klarg rejected the offer. During their retreat, a goblin hit Trista for 7 damage and dropped her to 0 HP. Her first death save was a natural 20, so she regained 1 HP. They escaped. This near death depended on the chosen dice and on Dracuseth being with the wagon.
6. **Return and rescue.** The party rested at the wagon; Trista spent her sole Hit Die and returned to full HP. They came back with Dracuseth and persuaded Yeemik to lend two archers. In a second fight, they held the narrow approach and defeated Klarg, his wolf, and two goblins. Donavan fell to 1 HP, then Dracuseth healed him. Yeemik tried to demand an extra 50 gp, but the party reminded his goblins of the witnessed deal and he released Sildar.
7. **Session end.** Sildar said Gundren and his map were taken toward Cragmaw Castle on the Black Spider's orders. The party recovered one remaining healing potion, coin, and a jade frog; the stolen merchant crates stayed in the cave. They camped with Sildar and the wagon, planning to reach Phandalin at first light.

## What worked

- The ambush led naturally to the trail, and the trail led to a meaningful wagon decision.
- The visible flood warning changed the route. The party found Sildar before Klarg without being forced through every room.
- Yeemik's motives supported a bargain, a later alliance, and a credible betrayal of the original terms. The players could answer each in their own way.
- Letting the first Klarg plan fail gave the players a reason to retreat and return prepared. The combat stayed dangerous even with the strong companion in the campaign.
- The party agent said the trail, Sildar's danger, and Yeemik's bargain gave clear reasons to act.

## Problems found and changes already made

| Finding | Effect in play | Change made |
| --- | --- | --- |
| Dracuseth was not introduced in the opening narration. | The party had to ask who appeared in initiative. | Added him to the departure read-aloud. |
| Trista carried a spear but her quick action card omitted it. | The party chose a weapon the card could not roll. | Added the spear action and migration for saved sheets. |
| The runbook made the goblin trail sound dependent on a Survival check. | A failed check could hide the adventure's essential lead. | The trail is automatic on inspection; DC 10 now adds track details. |
| The offline readiness check used an old painted-map filename. | It could falsely warn that a ready map was missing. | Fixed the filename resolution and added a regression check. |
| The wagon and Dracuseth choice came after the trail narration. | Their availability at the cave was easy to overlook. | Moved the question into the ambush aftermath. |
| Cave routes and the kennel chimney were hard to picture. | The party had to ask whether wolves blocked the shortcut and how the bridge connected to the den. | Added a route summary and chimney access note to the DM runbook. |
| Starting temporary HP, prepared spells, weapons, and light sources were not confirmed up front. | These details surfaced only when they affected a turn. | Expanded the pre-session checklist. |

## What to improve next

### Before another live session

1. **Make a compact live party strip.** Keep HP, temporary HP, light source, active concentration, spell slots, Lay on Hands, each character's main attack, and chosen prepared spells visible without opening a full sheet. Show Dracuseth from departure. Donavan's prepared spells and Ringgo's second Expertise choice must be confirmed with their players.
2. **Put an elevation and route diagram beside the DM cave map.** Clearly connect entrance → stream/bridge → den → pools → Klarg, and mark the kennel chimney and flood direction. Keep undiscovered details off the player TV.
3. **Warn at the roll point about attack conditions.** The DM initially rolled a bow attack without disadvantage while Trista was adjacent; the corrected second die still hit. A small reminder for adjacent ranged attacks, cover, Sneak Attack, Bless, and touch range would reduce these corrections.
4. **Show durations and travel time.** Donavan's Dancing Lights expired during negotiation, but the app did not surface its one-minute timer. The round trip to the wagon, short rest, second hike, and fading daylight also need a visible clock.

### Later improvements

- Add a one-click encounter branch for negotiation, retreat, and return, so the map, enemy status, promises, and Sildar's condition remain in the same place after a pause.
- Add a visible rescue objective and ally control: Yeemik's two archers, Sildar at 1 HP, and the condition of his release should be easy to track without filling initiative with irrelevant notes.
- Add a post-combat review for loot custody, remaining supplies, wagon location, enemy survivors, and who knows the new clues.

## Rules and test limits

- **Inspiring Leader was not applied in this simulation.** The runbook allows Dracuseth to grant 7 temporary HP after a shared rest, but whether that speech happened before departure was not established. If active, the first Klarg attempt would likely have been less dangerous. Confirm and record this before play.
- Donavan's sheet did not mark his prepared first-level spells. The party agent selected Magic Missile for the simulation after that gap surfaced. Confirm the actual preparation with the player.
- One repeatable dice sequence and one party strategy cannot establish encounter balance. The natural 20 death save materially changed the outcome.
- The independent source audit found the offline map issue and no other confirmed show-stopper. All seven local checks passed after the fixes: content, party, combat, maps, run UI, story, and rules library. The local-file browser was unavailable to this test, so the real player TV, drag behavior, audio, and two-display connection were **not** exercised. Run a short physical table preflight before guests arrive.

## Implementation update · 23 September 2026

The recommendations above are now built into the session tool:

- The DM run view has compact party cards for HP, AC, key attacks, resources, light, concentration, and confirmed prepared spells. Unknown preparation is flagged.
- A private cave diagram shows the route between the den, bridge, pools, Klarg, kennel chimney, and flood direction.
- The roll drawer asks for target, attack range, cover, nearby threats, Bless, and Sneak Attack before an attack roll. It shows effective AC from cover and blocks direct attacks against full cover.
- The run view has quick time controls, a one-minute Dancing Lights timer, and combat rounds add six seconds toward exploration time.
- Encounter cards now save a negotiation/retreat/return/resolved state, objective, captive condition, promise, and next move. Temporary allies can be marked on token cards without immediately showing them on the TV.
- After-combat review now records loot custody, wagon location, and unresolved promises alongside clues, resources, casualties, and consequences.

These changes passed the local checks. The physical TV and two-window behavior still need a table preflight.
