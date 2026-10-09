# The Echo Below campaign table: complete-tool roadmap

**Historical build list.** Its checkboxes and character-status notes were written across earlier releases and are not a current readiness assessment. Use `App-Readiness-Status.md` for verified current status and `App-Improvement-Staged-Plan.md` for the next stages.

This is the build list for the local two-screen setup: the Dungeon Master uses a private computer display, and the players see a flat table TV. Section 1 records the rules-library work now present in the live battleboard.

## Starting point

The current app already has a reusable session manager, scene and encounter editor, maps, draggable tokens, fog, initiative, dice and roll history, combat cards, HP, conditions, handouts, read-aloud beats, map measuring and shapes, pings, undo, session log, and backup/restore. Keep those working while expanding the tool.

The supplied Player's Handbook and Dungeon Master's Guide are the **2014 fifth-edition books**. The Player's Handbook PDF is image based and will need OCR before useful full-text search. The current app contains at least one newer-rule note, such as the paladin's Sap weapon mastery, so book-derived mechanics and existing combat cards need an edition audit. The adventure PDFs and custom Echo Below books are separate campaign references. A Monster Manual or other authorized creature source is still needed for a complete bestiary.

## Build order

**P0: Ready to run every session.** Rules profile and source references; complete party sheets; stronger combat and encounter management; reliable saves; one-click session prep.

**P1: Immersive table play.** Better map visibility, scene direction, audio, handouts, exploration, and a persistent player journal.

**P2: Long-campaign depth.** Waterdeep hub, Undermountain and nine-site tracking, faction consequences, advanced encounter design, and optional player devices.

## 1. Rules and books [P0]

- [x] **Choose a campaign rules profile:** 2014 fifth edition is the default, with named character and house exceptions saved in campaign backups.
- [x] **Audit built-in cards and calculations:** goblin, wolf, bugbear, Dracuseth, turn order, dice, HP, conditions, surprise, rests, and spell reminders have source labels and a written audit. Sildar and live character sheets remain explicitly provisional.
- [x] **Add a private book shelf:** local PDFs, contents, bookmarks, page jump, and source links. The player window skips the private book scripts.
- [x] **Make the scanned Player's Handbook searchable:** OCR covers all 293 PDF pages. Exact PDF links work; confirmed printed offsets cover chapter anchors and frequently used rules. Other printed offsets are labeled approximate.
- [x] **Create a fast rules lookup:** the requested table topics and the 2014 condition summaries are linked to source pages.
- [x] **Build spell, item, and class-feature indexes:** 321 spells, 235 items, 112 core class features from SRD 5.1, plus named character exceptions; each entry has tags, source/page, confidence, and private notes.
- [x] **Add a DMG toolbox:** adventure and encounter design, travel and environments, traps, downtime, treasure, magic items, improvisation, and adjudication.
- [x] **Add favorites and table rulings:** pinned entries and dated, sourced rulings save with the campaign.
- [x] **Mark source and confidence:** original references remain visible beside DM corrections; custom Echo Below and house rulings are labeled.
- [x] **Plan distribution separately:** local links for private PDFs and a separately attributed SRD in `books/README.md`.

## 2. Characters and party [P0]

- [x] **Full editable sheets** for Trista, Donavan, Ringgo, Pebble, Aldric, and recurring allies: abilities, saves, skills, proficiency, speed, senses, languages, AC, HP, hit dice, attacks, equipment, features, and notes. Current uploaded sheets supplied the original three PCs' starting combat numbers. Pebble uses his player handout; Aldric uses a recorded DM-rolled build. Donavan's spell preparation and Ringgo's second Expertise choice remain open.
- [x] **Character-specific resources:** spell slots and prepared spells; ki or other class pools where applicable; Inspiration; limited-use features; ammunition; consumables; money; attunement; temporary HP. Pools are editable so later class features can be entered when acquired.
- [x] **Action panels** for recorded ready actions with attack and damage rolls, save DC, effects, and resource use. Unprepared and depleted actions appear separately; verify missing character details on the live sheet before relying on them.
- [x] **Rest and recovery controls** with a review screen before applying a short or long rest, including manual overrides for unusual features and story conditions.
- [x] **Death saves, exhaustion, concentration, and ongoing effects** tracked by character and surfaced in DM turn order.
- [x] **Party overview** with passive scores, key senses, marching order, light sources, and travel pace; private notes stay off the TV.
- [x] **Level-up history** that records choices and preserves prior values. Import/export character data and provide a printable emergency sheet.
- [x] **Player-safe character view** for the table TV with DM control over shown details. Optional phone access remains a later sharing feature.

## 3. Encounters and combat [P0]

- [x] **Reusable encounter library** with enemies, allies, terrain, objectives, captured starting positions, waves, reinforcements, and possible non-combat outcomes. Saved templates carry forward to later sessions and campaign backups.
- [x] **Creature library** with complete, source-labeled 2014 SRD blocks for the session's goblins, wolves, and bugbear, including traits, actions, reactions, spells, and editable variants. Adventure-specific placement and behavior link to the encounter plan; later creatures need their own source entry.
- [x] **Combat flow** for initiative ties, surprise, readying, reactions, concentration, ongoing damage/healing reminders, and start/end-of-turn effects. Token cards and Undo provide manual correction.
- [x] **Condition timers and reminders** at a named actor's start/end of turn, repeat saves, and visible status rings on tokens. The DM resolves effects; HP changes are never automatic.
- [x] **Roll shortcuts** from attacks, saves, checks, and spells, with advantage/disadvantage, modifier, dice, and damage type reviewed before rolling. DM rolls stay private until shown on TV.
- [x] **Damage application** with resistance, vulnerability, immunity, temporary HP, and per-target review before applying.
- [x] **Area effect workflow** from map shapes: suggested targets, manual selection, saves, success handling, damage and condition review, then application.
- [x] **Encounter pacing aids** for a rough level 1–4 estimate, party size, terrain, morale, retreat, and negotiation. Higher levels direct the DM to the DMG.
- [x] **After-combat wrap-up** for loot, clues, XP or milestone progress, spent resources, casualties, and NPC consequences.

## 4. Maps and exploration [P1]

Implemented in the campaign table on 2026-09-22. Light and darkvision are visual presets; the DM still decides what a creature actually notices and can hide or reveal any token manually. Fog can use the original 16 × 10 grid or the finer 32 × 20 grid.

- [x] **Map calibration for the flat TV:** physical grid size, TV resolution and safe edges, scale lock, orientation, and fullscreen preset. Save settings per display.
- [x] **Scene layers:** map, grid, fog, tokens, labels, spell templates, annotations, and DM-only markers, each with independent visibility.
- [x] **Doors, walls, secret areas, and line of sight** so reveals are precise; manual reveal must remain fast for theater-of-the-mind play.
- [x] **Lighting and vision presets** for bright light, dim light, darkness, torches, darkvision, and hidden creatures, with a DM preview of exactly what players see.
- [x] **Map navigation** with pan, zoom, fit-to-TV, multiple floors, linked stairs/doors, and a scene history that lets the DM return to a previous position.
- [x] **Token upgrades:** portraits or silhouettes, size categories, facing, elevation, status rings, numbered duplicates, grouped movement, and quick hide/reveal.
- [x] **Exploration clocks** for elapsed time, torch and spell durations, travel, watches, rests, environmental hazards, and wandering encounter prompts.
- [x] **Player exploration mode** with selectable discoverable points, revealable clues, and DM-approved interactions. The DM should be able to disable player input during scenes.
- [x] **Performance checks** for large maps and many tokens so the TV stays responsive during play.

## 5. Story, clues, and campaign continuity [P1/P2]

Implemented in the campaign-wide Story & continuity drawer on 2026-09-22. Music is recorded as a cue rather than played by the app. Published Undermountain room keys and maps remain in the adventure book; this tracker records floor progress and the separate Echo Below overlay.

- [x] **Session prep board** that gathers the next scene, read-aloud text, maps, enemies, music, handouts, likely rules, and a short “if they do something else” note in one place.
- [x] **Branching runbook** with optional scenes, triggers, consequences, and the ability to reorder beats after players change course.
- [x] **Clue and evidence tracker** using the campaign's Observed / Inferred / Claimed / Open labels, plus who knows each fact and what the players have actually seen.
- [x] **Player journal** for clues, quest leads, locations, NPCs, promises, and recaps; publish entries selectively to the TV.
- [x] **NPC relationship cards** with portrait, voice cue, goal, current attitude, last interaction, promised help, and next likely move.
- [x] **Waterdeep hub dashboard** for the Yawning Portal, recurring NPCs, factions, available leads, downtime, and changes after each expedition.
- [x] **Nine-site dashboard** showing each site's state, evidence, affected people, custody of discoveries, and next consequence without revealing DM secrets.
- [x] **Undermountain progress view** by floor, routes, factions, unresolved rooms, and Echo overlays. Keep published dungeon content and custom story additions clearly distinct.
- [x] **Campaign calendar and clocks** for travel, downtime, faction plans, deadlines, and changes at home while the party is away.
- [x] **End-of-session capture:** decisions, NPC changes, treasure, level/milestone progress, unresolved hooks, and a draft recap for the next session.

## 6. Immersion and TV presentation [P1]

- [x] **Scene director presets** that change the image, map, ambient sound, handout, and player banner together with one DM action.
- [x] **Audio board** for looping ambience, music, and short sound effects. Include volume groups, crossfades, ducking during read-aloud, and a large immediate mute button.
- [x] **Cue timeline** attached to runbook beats: play a sound, show art, darken the screen, then reveal the map when ready. Every cue remains optional and manually controllable.
- [x] **Media library** for art, maps, portraits, item cards, audio, and videos, with tags, source notes, and thumbnails. Avoid duplicated files between sessions.
- [x] **Handout staging** with a DM preview, zoom, pan, crop, multiple pages, and a clear “Show on TV” action so spoilers never appear accidentally.
- [x] **Player display modes:** battle map, scene illustration, handout, journal, dramatic title card, and black screen. Support smooth transitions that do not interrupt combat state.
- [x] **Readable TV overlays** for turn order, round, a major roll, an objective, or a timed event; all overlays can be hidden instantly.
- [x] **Portrait and location cards** for introductions, especially Waterdeep's recurring cast and the nine sites.
- [x] **Atmosphere controls** for optional subtle Echo visuals and sounds, used sparingly so clues stay meaningful.

## 7. DM speed and ergonomics [P0/P1]

- [x] **Prep / Run / Review layouts** so the live DM screen emphasizes the next action instead of every editor control.
- [x] **Global search and command palette** for a rule, character, monster, NPC, scene, or handout.
- [x] **Keyboard shortcuts** for next turn, reveal, black screen, audio mute, scene change, and undo; show a shortcut cheat sheet in the app.
- [x] **Quick notes and improv tools:** scratchpad, names, shop prices, random prompts, and immediate conversion of a note into a permanent campaign entry.
- [x] **One-screen encounter card** with read-aloud, terrain, enemy tactics, checks, treasure, likely outcomes, and linked sources.
- [x] **Large controls and clear state** for use while standing or moving around the table; high-contrast focus, readable text, and reduced-motion option.

## 8. Data, privacy, and reliability [P0]

- [x] **Versioned campaign data** so future app upgrades do not corrupt old saves. Migrate existing sessions automatically and preserve an original backup.
- [x] **Automatic snapshots and recovery** before a session and at key events. Add redo and an explicit restore point beyond the current short undo stack.
- [ ] **Portable backup** that includes campaign state and uploaded media; verify restore on a second browser before relying on it at the table. Export, validation, and restore are implemented; a real second-browser restore still needs to be performed.
- [x] **Offline readiness check** for maps, portraits, audio files, and documents linked by the session. Local PDFs may show “unverified” when the browser blocks file checks.
- [x] **DM/player display safety:** private notes, hidden tokens, monster stats, and unrevealed handouts are filtered from the player display data.
- [x] **Connection health** with a clear warning if the TV window disconnects or stops updating, plus a one-click resync.
- [x] **Multiple campaign support** and archive/duplicate tools for running another group without mixing characters or notes.
- [ ] **Modularize the current single large JavaScript file** before adding a rules library, sheet system, and audio. Reliability UI and validation are now a separate module, and targeted tests cover backup/media, player-safe data, combat calculations, and book references. The remaining battleboard core still needs to be split.

## 9. Content preparation for this campaign [P0/P1]

- [ ] **Finish the party's live statistics** from current sheets and confirm any homebrew or newer-rule exceptions with the players. Current sheets and Donavan's later-source spells are confirmed; Donavan's prepared 1st-level spells and Ringgo's second Expertise choice still need player choices.
- [x] **Index the 2014 PHB and DMG** with printed-page links after OCR and check the scan's completeness and page offsets. Both scans are indexed; the PHB scan ends at printed p. 316 and PDF-to-printed links across gaps are marked approximate.
- [x] **Add an authorized creature source** for full stat blocks, then verify the existing goblin, wolf, bugbear, and allied cards. The local SRD is the creature source; Sildar's captive card now follows the adventure's stripped-equipment state.
- [x] **Prepare Lost Mine of Phandelver scenes** as reusable encounter packages, starting with the party's next likely session rather than filling the entire adventure at once. A Cragmaw continuation pack is available in Prepare mode.
- [ ] **Prepare Waterdeep and Undermountain chapter packs** close to play, preserving room keys and local conflicts from the books and the custom Echo Below additions. Await the party's route and chapter choice.
- [x] **Curate audio and art cues** for the opening, Phandalin, the Yawning Portal, the Nine, and the Echo; label anything that contains a spoiler. Six original offline loops and a reveal guide are in the app and content prep reference.

## The first release to build

1. Lock the 2014 rules profile and correct mixed-edition combat cards.
2. Add the two supplied books to a private source shelf with working page links, then OCR and index the Player's Handbook.
3. Build complete sheets for the five player characters and a compact party dashboard.
4. Improve encounter cards and turn reminders so combat can be run without opening another document.
5. Add prep/run layouts, a TV safety preview, automatic snapshots, and a restore test.

That release would make the existing battleboard dependable for normal sessions. Map vision, audio, journals, and the long-campaign dashboards can then deepen immersion without delaying the core table workflow.
