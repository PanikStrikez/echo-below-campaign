# Dungeon exploration

Refresh the DM app, Player TV, and connected phones after the update. Open **Dungeon** beside the Journey and Travel controls.

## Expedition record and returning to a dungeon

Refresh the DM app and open **World → Expedition record**. The same workspace is linked from Dungeon, the Waterdeep expedition, and the Wave Echo journal. It stays beside the map and has four tabs:

- **Expedition:** objectives, supplies, return conditions, refuges, departure and retreat controls.
- **Dungeon state:** remembered ground, objects, inhabitants, passages, and linked book rooms.
- **Return report:** changes since departure, discoveries, survivors, promises, and unresolved dangers.
- **Proposed changes:** evidence and exact changes for the DM to review.

### First departure

Open the dungeon's existing saved session, then choose **Start tracking this saved dungeon**. Include the maps that belong to this expedition. Record the objective, supplies, return conditions and any checked refuge. Review the party's real resources through the existing character and inventory tools; the supplies note is a planning note, not an automatic debit.

Start the departure record to capture a comparison point. Continuing play updates the existing dungeon records: fog, explored ground, doors, traps, containers, inhabitants and cleared rooms. The comparison point does not replace those records.

### Retreat, rest, and return

1. End combat and record a retreat point on an included map. This remembers the exact party positions and your explanation. It does not move characters or recover resources.
2. Use the existing group rest review when a rest actually happens. Confirm refuge safety and recovery choices. Record the elapsed time once: use the expedition time control while inside, or **Between expeditions** while away. Recovery and elapsed time remain separate reviewed actions.
3. From town, select the expedition and choose **Preview return to saved expedition**. Check HP, positions, conditions, refuges, blocked routes, pending developments and the destination shown on TV.
4. Choose **Return with current party**. Current character sheets, HP and resources go into the saved dungeon. Its enemies, map geometry, fog, room states and treasure records remain intact. An away party returns to its recorded retreat point; reopening an active expedition keeps its latest positions.

Use this reviewed return after resting or changing resources in another session. An ordinary session switch opens that session's historical character state. Creating a tracked dungeon pack again directs you to its expedition record; explicit session duplication remains available for a separate copy.

Wave Echo's old journal time controls remain available. The expedition workflow also updates its reminder clock for the reviewed interval, so do not record that same interval a second time in the journal.

### Connect rooms and review developments

Where a map room and a keyed Waterdeep or Wave Echo room describe the same place, explicitly link them in **Dungeon state**. Review which record is correct initially. Later changes to either view update the other. Conflicting changes are flagged for a choice instead of silently replacing a cleared room. Known-route controls share the Waterdeep route record, while custom routes remain available. A blocked paired passage cannot be traversed from either end until reviewed and reopened.

The return report compares native records against departure and lets you add observations. Record discoveries, promises, rescues and custody through **Outcome review**, then attach those approved outcomes to the expedition. This preserves their knowledge and publication choices. Expedition notes, evidence and proposals remain private.

Conditional development ideas appear for the relevant dungeon. Specify a reason, concrete evidence and consequence, then stage the exact room, object, route or faction change. Review before applying. Changed targets or corrected evidence require another preview. Cleared rooms, defeated inhabitants and emptied treasure stay that way unless a specific reviewed change affects them. No elapsed-time rule automatically respawns enemies or refills containers.

### Recovery and limits

The normal Undo/Redo controls cover expedition changes. A recovery point is created before a cross-session return; campaign backups retain expedition records and their original dungeon sessions. Restore the complete campaign when those sessions are needed.

The DM still decides whether a refuge permits rest, who survived or escaped, and whether a faction has the people, route and motive to act. Zero HP alone does not establish a narrative fate. Map inclusion and room links are explicit; the app does not infer them from a picture.

## Sight and remembered ground

Live sight is **off by default on each map**. Before enabling it:

1. Choose the dungeon map. In **Dungeon → Sight & memory**, use the current grid/image proportions, then verify the width in five-foot squares and the image’s width-to-height ratio.
2. Open the existing light/wall controls. Draw walls and doors where sight should stop, and choose the ambient light. Painted walls alone do not block sight.
3. Set each character’s maximum sight, darkvision, and carried light. The sheet-darkvision button appears when a numerical range is present in that character’s senses. A torch preset sets 20 feet bright plus 20 feet dim. Lights follow their tokens.
4. Enable live sight. Place visible player tokens on the map. The TV shows the combined sight of the party, not separate private viewpoints for each character.

Explored ground remains dimly visible after the party leaves it. Enemies and other non-player tokens outside current sight are omitted from the player display. Blinded, unconscious, hidden, and 0-HP characters do not contribute sight; a lit source carried by an unconscious character can still illuminate for others.

Sight is calculated over the fog grid with wall checks. Use the fine grid for smaller reveal cells. It is a configurable table aid: magical darkness, special senses, obscurement exceptions, range rulings and unusual features remain the DM’s responsibility. Dim light is visible in this system; skill penalties are not applied automatically.

Manual fog painting still works. Re-covering a tile deliberately hides it even from live sight until manually revealed again. **Forget remembered exploration** clears old memory and manual blackout tiles, then current sight repopulates. Undo restores the previous state.

## Rooms, objects, doors and notes

Add a room, door, trap, container, area, or note in **Rooms, objects & notes**, then choose **Place on map** and click its location. Escape cancels placement.

- Rooms: unexplored / visited / cleared.
- Containers: unsearched / searched / empty.
- Traps: unknown / noticed / triggered / disarmed.
- Doors: closed / open / locked / broken. Link the record to a drawn door barrier to affect sight. **Track doors already drawn** imports existing door lines.
- Areas: unsearched / searched.

States are deliberate DM choices; discovering a trap never automatically disarms it, and searching never automatically clears a room. Campaign backups retain records by map ID, including when changing sessions and returning to that map.

Each record has a separate player marker switch, revealable text, and private DM notes. Text may be **DM only**, **prepared for later**, or **shared**. **Reveal marker & text now** is the deliberate publication action. Shared text appears on phones; its map marker also carries the text. In live sight mode, a player marker appears only on explored ground.

## Search requests

Phones: **Table → Dungeon searches & map notes**. Players can tap a public object marker or choose it in the form, or describe a specific area. They must describe how they investigate it.

The **Dungeon** button shows pending searches. The DM may approve with roll instructions, resolve with a result, or decline. A separate resolution button can mark a container or area searched. Rolls, DCs, time costs, trap triggers and discoveries are adjudicated by the DM rather than silently applied. Results are sent only to the requesting character; share a map note separately when the whole party should know.

Requests can be revised or cancelled while waiting or approved. Remembered objects outside current sight cannot be directly selected for search; players can describe their intended approach for the DM instead. Requests pause when exploration input is disabled, during rehearsal or while offline.

## Linked passages

In **Passages & return**, select another map and create a paired passage. Set the departure and arrival/return coordinates. Each map retains its own passage marker and discovery switch.

**Move placed party & show connected map** moves placed player tokens from the current map to the destination and records a return route. Enemies and off-map characters remain where they were. The return button names the previous map. Combat must end before a map transition. Target maps must be available in the current session.

Existing scene links remain available; use paired dungeon passages when you want a saved arrival point and return route.

## Noise and alertness

Create room records, connect them in **Noise & alertness**, and optionally associate a door with each connection. Trigger quiet noise, loud noise, or an alarm in a room. The prompt becomes one level quieter through an open connection, two through a closed door; a blocked connection stops it. Room alertness retains its highest heard level until you change it. Quieting a room clears its current noise without erasing alertness.

These are editable DM planning aids, not automatic hearing rules or combat triggers. Noise, alertness, private notes and connection details stay off player displays.

## Checks

Automated checks cover character light and vision, closed/open doors, remembered exploration, manual blackout, hidden enemies and staged notes, persistent object states, sound propagation, paired return routes, search ownership and outcomes, save/restore, Undo/Redo, and phone controls. Physical-device appearance and playback still need a table check.

The connected expedition was also rehearsed in a fresh browser with an isolated Practice campaign: departure, retreat, a different home session, reviewed group rest, time away, previewed return, an evidence-based passage change, and reload. Current party recovery survived the return while the defeated enemy, cleared room, disarmed trap, empty container, fog and map geometry stayed intact. Separate checks cover archive restoration, stale-review rejection, room-link conflicts and private data exclusion from TV and phone payloads. This does not substitute for checking physical devices at the table.
