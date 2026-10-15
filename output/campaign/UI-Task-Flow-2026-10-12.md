# Task-focused interface pass — 12 October 2026

## What changed and where

- **DM contextual panels:** Back restores prior content, entity selection, and scroll within the same campaign/session. The header has a predictable title, Back, and Close. Rulebooks, sheets, and story tools open compactly on the right in Run; Expand remains available. Returning from a reference preserves the underlying context. Other clues live under “Choose another clue.”
- **Quest preparation:** Leads use their existing descriptive text instead of “Approach 3.” Fully prepared material awaiting approval says **Awaiting DM review**; absent materials say **Missing preparation**. Stable IDs and approval requirements are preserved.
- **Map Desk:** The active creature, HP/AC, movement/resources, reminders, and End turn stay visible during scrolling and action review. Other actions/resources and encounter controls have labeled collapsed sections. The shared review shows Action → Targets → Rolls → Reactions → Review → Resolve, costs, damage, rulings, and undo. Turn (triangle), selected (dashed square label), and target (double-ring label) indicators differ. Dragging remains unrestricted unless a measurement tool is selected.
- **Phones:** Compact name, HP, and connection strip; all five tabs remain visible. Reaction/save and initiative requests precede the normal turn controls. Sheet, Journal, Items, and Explore show their own content immediately; a small urgent alert remains accessible. Full character overview and connection/saved-sheet details are below the selected task.
- **Phone actions:** Reviewed requests are the prominent route. Rows separate mechanics, timing, effects, costs, support, and availability. Abilities, spells, and resources retain separate variants in labeled groups. Monk cards explain ordinary unarmed strikes versus Flurry. Quick dice are a secondary section that explicitly does not resolve effects or spend resources. Existing status, revise, cancel, target, and DM-response workflows remain.
- **Journal and Items:** Home links directly to quests. Journal separates shared quests, owner-only character quests, private clues, personal notes, and campaign history, with Active/Completed tabs. Items begins with carried equipment, consumables, and money; custody remains visible, with resolved promises, other carriers, and request history in secondary sections. Unknown quantities are labeled rather than guessed.
- **Scene and Session Pilot:** Scene retains parchment narration. Pilot replaces its duplicate large artwork with the current decision prompt, existing choices, and urgent requests. The visual thumbnail remains. “Choose another prepared beat” and “Preview prepared visual” describe their exact actions; nearby alternatives remain available. Read-aloud and private guidance are visually separate.
- **TV staging:** Player-safe, silent previews reuse the real player renderer, including fog, visible tokens, text, and overlays. Staged and current presentations are separate; Show on TV remains explicit. Preview frames do not join the TV channel, count as table clients, or send gameplay actions. Cached media requests are limited to the permitted presentation. Preview dimensions use the TV's reported viewport, falling back to 1920 × 1080 when no TV has reported its size.

## Verified

- **103/103 automated tests passed.** Shared stylesheet and reusable extraction checks passed.
- Quest preparation regression check passed: 40 linked quests, private evidence boundaries, readiness, stale approval, alternatives, undo/redo, and unchanged public payloads.
- **39 isolated Chrome views:** no page errors or document horizontal overflow. Laptop sizes 1512 × 982 and 1280 × 800; phone sizes 390 × 844 and 360 × 780. Every phone tab's useful content starts above 290 CSS pixels; this is a layout measurement, not a claim about human task speed.
- Full combat rehearsals passed at both laptop sizes: free drag/undo, explicit ruler, initiative, equal DM/simulated-phone patches, physical-dice totals entered by automation, reaction checks, resource use, reviewed damage, resolution undo, and turn advance.
- Back restored contextual content and scroll; quest/NPC return restored the prior workspace. Compact supporting sheets left part of the map visible.
- Staging another visual left the live presentation and complete game state unchanged. Preview transport excluded private creature HP/AC and party records.
- Original supplied save remains unchanged: `5fd26c38231c524d4bad822983129cdab0db432158e2f59bfc5d495c4b31e32b`.

## Limits and rollout

Live services and phone assignments were preserved; no service restart, paid generation, or live-campaign rehearsal was performed. Reload the DM and phone pages to load the updated UI. No QR reset is required for this update.

Physical TV readability, viewing angles, touch accuracy, speakers, and all five real phone clients remain untested in this pass. The previews represent the player-safe presentation the app sends, not proof that disconnected hardware has displayed it. No faster-use claim is made.

Changing generic lead labels can invalidate an earlier prep fingerprint. Those leads correctly require renewed DM review; the app does not silently approve them. Unknown action timings and special effects remain DM rulings; no character statistics or choices were invented.

## Before and after

[Open comparison gallery](/Users/Ethan/.codex/.chatgpt-projects/g-p-6ab08c2f0cac8191a5e352860ad3b7b6/output/audits/task-panels-2026-10-12/Before-and-After.html)

[Browser observations](/Users/Ethan/.codex/.chatgpt-projects/g-p-6ab08c2f0cac8191a5e352860ad3b7b6/output/audits/task-panels-2026-10-12/Observations.json) · [Verification and file hashes](/Users/Ethan/.codex/.chatgpt-projects/g-p-6ab08c2f0cac8191a5e352860ad3b7b6/output/audits/task-panels-2026-10-12/Verification.json)
