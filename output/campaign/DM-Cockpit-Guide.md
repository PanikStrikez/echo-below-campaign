# The Echo Below — DM cockpit

Reload the DM page to use the redesigned layout. Existing campaign saves and the TV/phone protocol remain compatible.

## During play

- **Left: Scene notes.** Choose the current runbook beat, read its narration, and review the objective and consequences.
- **Center: Map.** The live map remains in view. **Preview visual** opens search and map/art filters. Choosing an image changes only the private preview; **Show this on TV** publishes it. **Return to live map** cancels the preview.
- **Right: Guide, Turn, Details, Inbox.** Guide suggests the next step and walks through scene choices or combat setup in place. Turn shows the active combatant. Clicking a token opens its card. Inbox collects requests and reminders.
- **Top:** Player TV, Inbox, Mute and Undo remain readily available. Combat's turn bar retains Next turn. The Now showing label describes the live presentation.

## Focus mode

Click **Focus mode** in the top action bar to hide the scene notes and expand the map. The right panel keeps a sticky next-action button and an inbox count; urgent current-scene reminders are highlighted. This summary stays visible while using other right-panel tabs. **Exit focus** restores the notes. Choosing **Session → Current scene notes** also exits Focus mode. The preference is remembered in this browser and does not change campaign or TV state.

Verified on a 1100-pixel desktop layout: the map panel expanded from 590 to 790 pixels; notes returned on exit, the preference survived reload, and the live TV label stayed unchanged. Targeted guide tests cover urgency filtering and reviewing the current request rather than stale data.

## Finding every tool

| Section | Contents |
| --- | --- |
| Session | Campaign/session selection, table check, pacing, notes, dice, session editor, logs and save files. Combat controls, creating sessions, backups and workspace modes expand when needed. |
| Party | Full sheets, phone connections, damage/healing, party tokens, enemies and allies. |
| World | Travel, dungeon exploration, towns, Waterdeep expeditions, journey-map preview, map tools, story/continuity, fog and clocks. |
| Library | Rules/books, audio and presentation, effects, handouts, TV text, source documents, visual selector and display controls. |
| Settings | Recovery, campaigns, quick tools, session restart, opening the TV window, redo, guidance preference and saved workspace selection. |

Detailed editors still open their existing workspaces. Existing controls are moved rather than copied, so their handlers and state remain attached. Returning from Review through any main navigation section returns to the cockpit. At smaller widths, the scene notes move beneath the map.

## Verification

- All 50 existing JavaScript checks passed after the overhaul.
- Expanded the guide test to verify live initiative updates while its contents are mounted in the right panel.
- Browser checks: all five sections, token-card navigation, inline combat setup and return, Review exit, text-card controls, private visual search/filter/preview, and the unchanged Now showing label during preview.
- Checked desktop and laptop layouts, unique element IDs and page width. No browser console errors were observed.
- These checks did not run a new real combat or publish a new scene to the connected TV.
