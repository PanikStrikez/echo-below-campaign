# Guided play and usability review

## Start here

Refresh the DM app. **Guided play** is on by default and saved per campaign. Turn it off to return to the existing workspace. No phone-service restart is required.

The left panel recommends the next useful action from the live state:

1. Review urgent reactions, saves, damage and reminders.
2. Review waiting player requests.
3. Finish initiative, or open the active creature’s turn.
4. Review a fight’s ending when placed enemies are down.
5. Prepare the current scene or read its opening.

Suggestions never approve a roll, reveal information, finish a quest or record an outcome by themselves.

### A normal session

- **Help me run this → Before play:** table check and phone connections.
- **Scene & choices:** narration, questions, running notes, alternate routes and DM secrets together. Preview its map/encounter, then explicitly show it on TV. Opening the next beat changes notes only.
- **Combat setup:** place combatants; use **Collect phone initiative + roll missing NPC initiatives**; enter any physical-dice totals; begin round 1. Existing initiatives are preserved when collection is clicked again. The app never rolls a player’s initiative automatically.
- **During combat:** use the right sidebar and phone requests. Simple phone attacks have a compact cost/target/dice summary, with expandable editing controls. Spell and unusual-effect reviews remain detailed.
- **Next turn:** unresolved saves, damage or timed effects prompt a review. A deliberate override keeps those reminders outstanding. Open reaction windows must be resolved first.
- **After the fight:** review reinforcements, survivors and loot before ending initiative. HP and resources remain as played.
- **Finish session:** gather the closing review and make a recovery snapshot.

## System-by-system findings

| System | What was checked / improved | Remaining table judgment |
|---|---|---|
| Session setup | Readiness, restored state, content packs, guided entry point | Confirm speakers and the actual TV are working |
| Story/runbook | Full scene instructions and branching next beat available together; historical Session 2 instructions corrected | Choose the branch players actually take |
| TV/maps | DM preview and explicit publishing retained; current scene recommendations | Reveal secrets, choose player-facing art |
| Combat/initiative | One action collects phone initiative and rolls missing NPC totals; active-turn guidance and reminders | Initiative ties, morale, reactions, ambiguous effects |
| Phone actions | Existing atomic review/resolve preserved; compact standard-attack summaries | Check targets, costs, full effect and exceptions |
| Characters | Sheets, casting, level-up differences and rest reviews reachable by task | Level choices and exceptional recovery rules |
| Inventory/clues | Shared inventory and private-clue tools grouped together | Custody, spending, publication and sharing |
| Travel/dungeons | Travel, arrival, doors, light, search and persistent-room tools reachable by task | Route choice, searches and consequences |
| NPCs/settlements | Towns, services and downtime grouped together | Approve developments rather than treating plans as facts |
| Sound/effects | Presentation controls remain grouped; mute remains visible | Actual audio audibility and atmosphere choices |
| Continuity/character arcs | Existing clues, journals, spotlight and ending evidence checks | Approve facts and consequences without fixing endings |
| Closing/recovery | Closing review, snapshots, restore rehearsal and portable backup grouped | Review the recap and keep an external backup |

## What “almost runs itself” means here

The app now chooses the relevant next tool, gathers the scene instructions, collects initiative, rolls missing NPC initiative, highlights unresolved work and prepares a closing review. Existing approved-action handling applies supported rolls, resources and effects together.

It is not an autonomous Dungeon Master. It does not invent missing rules, spend resources without review, pick a player’s action, reveal secrets, or turn a prepared story event into a confirmed fact. Complex spells and rulings still require the DM’s review.

## Verification and limits

The app’s JavaScript checks cover campaign content/migrations, sheets, rules indexes, map privacy, phone actions, combat, journeys, dungeons, presentation, continuity, settlements, Waterdeep, data recovery and performance. New guided-view checks cover recommendation priority, narration, branch navigation, initiative collection, stale-map edits, reaction gates, reminder overrides and opt-out.

Several old test assumptions were corrected: migration checks had left a live BroadcastChannel open; story restoration now lives in the recovery module; optional campaign modules add normalized fields; Waterdeep does not require every Phandelver town map. Privacy assertions remain in place.

This was a code and workflow review with simulated UI tests. No claim is made that actual players have tested this layout or that the live TV/phone interface was visually rehearsed during this update.
