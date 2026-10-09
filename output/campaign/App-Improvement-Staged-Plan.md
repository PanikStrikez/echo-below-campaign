# The Echo Below app improvement plan

**Working plan — 9 October 2026**

The goal is a table tool that carries the DM from preparation to the end of a session with few decisions about *where to click*. It should surface the next useful action, keep the map and player displays dependable, and leave story and rules judgments with the DM. The stages below improve the app already in use; they do not require a rewrite or a new campaign save.

## What we have now

| Area | Working foundation | Gap to address |
| --- | --- | --- |
| DM desk | Prep, Run, and Review; a central map; a contextual right panel; table check; guided scene and encounter tools | Some actions still lead through several panels, and similar controls appear in more than one place. The live path needs one consistent sequence. |
| Players | TV staging and audience filtering; QR phones with sheets, rolls, requests, clues, inventory, and quest views | Actual connection, touch, rotation, and readability need recurring checks on the physical table. A disconnected phone retains its last sheet but cannot complete live actions. |
| Combat and exploration | Tokens, fog, initiative, guided attacks, reactions, damage review, persistent dungeon records, and maps | Exceptions and incomplete character data still need DM correction. Movement and turn resolution should stay simple under table pressure. |
| Campaign | Quests, outcomes, journals, NPC records, atlas, expedition records, and scene packages | Planned material and actual play need continued reconciliation. Preparing the next likely session has more value than completing every future site. |
| Reliability | Browser saves, restore points, undo/redo, portable package, practice campaign, and many targeted checks | The main battleboard still coordinates too much. A restore on a second browser/computer and real device rehearsal should be routine release gates. |
| Voices and AI | Voice Studio, exact-text narration, local campaign assistance, audience-specific AI contexts, and secure local configuration | Mock transport and synthetic audio have been tested; a real provider request, physical speaker routing, quality, cost, and failure behavior are separate acceptance checks. |

The current record stops with the party at Barthen's Provisions. Gundren was left asleep at the inn, Trista has Glasstaff's captured rat, and Glasstaff's destination of Cragmaw Castle is DM-only. Pebble and Trista have level 4 updates. Other characters' level 4 selections must come from their players before their app records are changed. This checkpoint governs near-term campaign preparation.

## Rules for every stage

- Preserve campaign saves, original media, map IDs, fog, tokens, character statistics, phone assignments, and existing features. Migrate copies in an isolated practice campaign first; retain a restorable original.
- Keep `sources/` and personal books read-only and local. A portable app package may include owned campaign media, while a shareable version needs a separate content and licensing review.
- Send only approved information to each audience. The main quest can appear on the TV, side quests on shared phones, and character quests only on their owner's phone. DM notes, unrevealed maps, hidden tokens, and private clues must be filtered before transport.
- Mark records as **actual event**, **claim**, **inference**, **plan**, or **suggestion**. No rehearsal, AI output, or generated recap may become an actual event without DM review.
- Keep automation reviewable. HP, resources, inventory, quest state, relationships, and campaign history change through a preview with correction and undo.
- Use the existing 2014 rules profile and recorded character exceptions. Keep source links and uncertainty visible; do not silently replace a sheet value with a calculated one.
- Each stage ends with targeted automated checks, one isolated practice run of the affected workflow, a save/restore check, an audience-leak check where applicable, and a short release note. Physical-device gates are stated separately from simulations.

## Stage 0 — Establish a trustworthy baseline

**Priority:** immediate. **Size:** small. **Depends on:** nothing.

Create one current status register for the app rather than treating older roadmap checkboxes as definitive. Record which features are working, which are prepared but not live tested, which are incomplete, and which guides have stale statements. Keep a compact list of open issues with severity, reproduction steps, owner, and a link to the affected workflow. Capture a known-good campaign backup and a separately named practice copy.

Run the current table check on the actual DM computer, flat TV, speakers, and all five phones. Confirm the current browser save opens; restore a copy in a second browser profile or computer, including media. Note the current LAN address and QR workflow. Recheck phone assignments without changing live character records.

**Done when:** the DM can answer “what works tonight, what needs a manual fallback, and where is my restorable backup?” from one screen. A restore opens in an isolated browser and the real TV and phones each show their intended information. Document any device check that has not happened.

## Stage 1 — Make one clear path through an evening

**Priority:** highest user-facing improvement. **Size:** medium. **Depends on:** Stage 0.

Join the existing table check, quest prep, scene launch, combat, outcome review, and closing review into one visible sequence: **Get ready → Open scene → Resolve action → Record outcome → Close session**. Keep the map central and the right panel contextual. Preserve the advanced editors, but place them behind an explicit edit menu and return the DM to the same run position afterward. The top bar should show only current scene, next turn, player TV, mute, inbox, and undo during play.

For each scene, show the current objective, one next action, urgent player requests, read-aloud text, and a private “if they go elsewhere” route. Make the player-visible change a deliberate **Preview → Show on TV** action, with a persistent “Now showing” label. Make empty, loading, stale, and disconnected states unambiguous. Add a small, searchable command palette for experienced use without requiring it for normal play.

**Proposed usability targets:** start the prepared session in at most five minutes after devices are connected; show a prepared scene in at most three deliberate DM actions; reach an urgent phone request from the live view in one action. Measure these in a rehearsal; revise targets if they cause unsafe shortcuts.

**Done when:** a new DM can run a short exploration, conversation, fight, and closeout without opening a setup editor. Every existing feature remains reachable, and TV publication is unmistakable.

## Stage 2 — Make state changes and recovery dependable

**Priority:** high. **Size:** large, delivered in small migrations. **Depends on:** Stage 0; can overlap Stage 1.

Incrementally remove state-changing responsibilities from the large `Session-01-Battleboard.js` coordinator. Reuse the existing modules; add a narrow command layer for actions such as apply damage, spend a resource, publish a clue, move a token, and confirm an outcome. Each command should validate the current revision, present its effects, commit all related changes together, and create an undoable event. Keep the existing saved schema readable while introducing versioned migrations and a migration report.

Make backup verification a release step: export, inspect package contents, restore into a fresh profile, compare campaign identity, character totals, media hashes, quest visibility, and current scene. Warn about browser storage pressure before a session and make a recoverable restore point before large imports or migrations. A failed migration must leave the original usable.

**Done when:** a deliberately interrupted save and a failed import recover without partial HP, inventory, or quest changes; an old campaign save opens after the update; a fresh browser restores the same playable state. The main coordinator becomes smaller through measured extractions rather than a single rewrite.

## Stage 3 — Make the TV and phones feel like one table

**Priority:** high. **Size:** medium. **Depends on:** Stages 1 and 2 for consistent actions.

Give each connected screen a visible last-seen time, last-applied revision, and one-device resync. Keep a DM-only “what players can see” preview. Let the DM release or reassign one phone without restarting everyone. On phones, put **My turn** first in combat, show request status clearly, preserve the last synced sheet, and explain when a request cannot be sent. On the flat TV, verify safe edges, rotation, token size, ruler readability, and contrast at the real viewing distance.

Treat a home-screen phone app as a separate later upgrade. The current phone companion is reached over a local IP address. A service worker for reliable offline startup needs a secure origin; localhost exceptions do not automatically cover another device's LAN HTTP address. A future installation plan therefore needs HTTPS or another secure-origin approach, plus cache updates and device testing. The existing downloaded emergency sheet remains the offline fallback until then. [MDN's service worker guide](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) and [web.dev's offline data guide](https://web.dev/learn/pwa/offline-data) describe these constraints.

**Done when:** disconnecting and reconnecting one phone does not interrupt the other four; a stale TV displays a clear warning and resyncs; an offline phone cannot silently spend a resource; private DM information never reaches a phone or TV response.

## Stage 4 — Finish the fast combat and exploration loop

**Priority:** high for upcoming sessions. **Size:** medium to large. **Depends on:** Stages 1–3.

Use the active-turn card as the single place for movement, action, target, roll, reaction, damage, conditions, and end turn. Dragging a token should always move it unless the DM explicitly selected a measurement tool. Keep target selection from either a token or a phone request. Show the math and source for attack, AC, cover, resistance, concentration, save timing, and resource use before applying it. Unusual spells and ambiguous effects should ask for a DM ruling instead of guessing.

Complete the current party's action cards from confirmed sheets and chosen level-ups. Keep unknown level 4 choices open rather than assigning them. Add a small encounter simulator that tests ordinary attack, area effect, reaction, retreat, rest, and return. For dungeons, maintain doors, discovered areas, objects, occupants, and the return route across map switches. Keep exact tactical grids distinct from illustrative maps.

**Done when:** a representative fight can be run from the map and one panel, all action costs and damage components are reviewable, an accidental drag is reversible, and retreat/rest/return preserves the explored state.

## Stage 5 — Make the campaign respond to what happened

**Priority:** continuous, starting with the next session. **Size:** ongoing packages. **Depends on:** Stages 0 and 1; uses Stage 2's transactions when ready.

Prepare content one or two likely sessions ahead. Start from Barthen's Provisions, Gundren at the inn, Trista's rat, and the unresolved Glasstaff situation. Keep Cragmaw Castle as a private lead until the players establish it. Bring quests, NPC knowledge, map markers, handouts, and recaps from one reviewed outcome record. A discovery can propose several updates, but the DM approves each audience and consequence together.

Keep two content tracks: **next playable package** (read-aloud, NPC intentions, likely choices, map, enemies, media, rules references, retreat and fallback) and **future outline** (branches without fixed outcomes). Advance the Phandelver aftermath, Waterdeep arrival, Mending Court, the first Undermountain expeditions, the Nine, and the Halaster mystery as they become likely. Use the existing atlas and source geometry; do not turn a proposed location or prepared room into an actual visit.

**Done when:** after the session, one reviewed account of what occurred updates the relevant quest, journal, NPC, map, and recap views without revealing the DM-only branch or completing unrelated objectives. The next prep board shows two or three credible leads and a playable alternative if the party declines them.

## Stage 6 — Improve presentation without slowing play

**Priority:** after the live flow is stable. **Size:** medium. **Depends on:** Stages 1 and 3.

Create scene presets that stage art, lighting, weather, ambience, a handout, and optional narration together, with a private preview and one deliberate publish action. Use subtle effects by default; keep off, subtle, and full options and a large immediate mute/stop control. Tie effects to the actual target token where appropriate, while leaving fog, geometry, and token positions unchanged. Keep subtitles and manual reading available.

For Voice Studio, verify one real provider request only after the account, approved free-credit or spending limit, and credential setup are confirmed. Compare audible output, generation time, and usage with the mock rehearsal. Store approved files locally and in the backup. Test preview through private headphones and playback through table speakers; a private preview must never hit the public output. Track license and source for each added asset.

**Done when:** a scene can move from private preview to TV and speakers without changing combat state; stopping audio is immediate; losing network or provider access leaves visuals, subtitles, and manual narration usable.

## Stage 7 — Add grounded assistance with a human decision point

**Priority:** optional enhancement. **Size:** medium to large. **Depends on:** Stages 2 and 5; live provider use also depends on approved account limits.

Build on the current local assistant and audience-specific context builders. The useful actions are: run this scene, what this NPC knows, clues here, relevant rule, and next useful action. Require supporting record IDs, show whether a statement is actual, claimed, inferred, planned, or suggested, and say when the record cannot answer. NPC drafts receive only that NPC's permitted knowledge for the people present. Player help receives only that player's allowed context. Keep books local by default and send only selected, reviewed text to any external provider.

AI can draft narration, dialogue, recap wording, improv options, and proposed consequences. A draft must be edited or approved before it appears publicly or changes state. Track usage and stop at the chosen cap. Test a real provider response separately from the existing mock tests, including timeouts, cancellation, bad citations, and secret-leak attempts. Keep the app fully functional with AI disabled.

**Done when:** every answer shows its basis or its uncertainty; a forged citation is rejected; no audience receives another audience's private record; no suggestion changes campaign state without review.

## Stage 8 — Package a reusable platform for the long campaign

**Priority:** after the core table experience is dependable. **Size:** large. **Depends on:** Stages 2, 3, and 5.

Separate the reusable app, the Echo Below campaign content, the current group's private save, local source books, and generated media. Build a blank campaign template and a guided duplicate/archive flow so another group cannot inherit this party's discoveries or private clues. Produce a portable release with a manifest, asset checks, migration version, restore instructions, and a one-click health check. Keep personal PDFs under separate local control.

Only then consider optional remote play, cloud sync, or installed phone apps. Each changes the security, connection, and data model substantially and should get its own proposal and test campaign. Continue preparing future Undermountain floors and satellite maps as destinations become likely rather than building all 23 floors in advance.

**Done when:** a fresh machine or browser can open a portable practice campaign with its required art and audio; a blank template contains no Echo Below secrets or player records; an upgrade preserves the original live campaign.

## Release sequence and decision gates

| Release | Stages included | What the DM should notice |
| --- | --- | --- |
| **R1 — Ready table** | 0, first part of 1 | Accurate readiness, backup, current objective, and fewer competing controls. |
| **R2 — Dependable play** | rest of 1, 2, 3 | One run path; reliable saves; clear TV/phone status and individual reconnect. |
| **R3 — Faster adventures** | 4 and rolling 5 packages | Combat and exploration need fewer clicks; outcomes drive the next session. |
| **R4 — Immersive table** | 6 | Staged visuals and audio work predictably; optional narration can be trusted. |
| **R5 — Assisted campaign** | 7 and 8 | Grounded optional AI and a portable, reusable campaign platform. |

The first work batch should be **Stage 0 plus the smallest Stage 1 changes**: record the live baseline, restore a backup in a second browser, rehearse the current table hardware, map the clicks from opening the app to showing a scene, and remove the worst duplicate controls. That yields an immediate usability gain and exposes any reliability problem before deeper refactoring.

## Verification standard

For every release, compare a known-good save before and after migration; check the same five characters, quest audiences, fog, token positions, media counts, and phone assignments. Run the affected targeted checks and a representative session in the isolated practice campaign. Test a real second browser for restore and the physical TV/phones/speakers for display and sound. Record **automated**, **simulated browser**, **second-browser**, and **physical table** results separately so a mock success is never presented as a live-device success.
