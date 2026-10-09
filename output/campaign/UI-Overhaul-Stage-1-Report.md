# Stage 1 interface overhaul — usable slice

**9 October 2026.** This is a redesign of the existing app shell. Campaign records, character values, media, map IDs, and saved state were not migrated or rewritten. The classic DM controls remain available under **Settings → Use classic layout** while the new navigation is checked at the table.

## What changed

- **DM Run:** the map or staged visual occupies the center. Session, Quests, Party, World, Library, Settings, and Search live in a narrow left rail. A single right panel handles guide, turn, selected details, requests, and tools. Back returns to the panel or tool list that opened the current detail. Scene notes are opened when needed.
- **DM Prep:** the session tools use the right work area. Table check, session desk, editor, and guided evening are visible; advanced combat, session creation, backups, notes, dice, and logs are grouped. The live action row is hidden in Prep and Review.
- **DM Review:** the existing closing dashboard remains one workspace, with outcomes, party state, recent actions, and recap controls.
- **Player TV:** the existing single-presentation system and public overlays remain. The DM top row keeps the current presentation and TV connection visible. Scene previews require an explicit Show on TV action.
- **Phones:** the current task appears above stable Home/My turn, Explore, Sheet, Journal, and Items tabs. Navigation stays at the bottom of the phone screen. Touch targets, focus visibility, and reduced motion have been improved. The existing phone service serves the styling through its current stylesheet, so phone assignments were not reset.

## Findings from the isolated practice session

| Finding | Change or result |
| --- | --- |
| Session guide disappeared when the live top bar was shortened. | Kept the actual guide button in the compact strip below the top bar. |
| Back returned to an older scene after Prep, and nested tools could lose their parent. | Tracked the opening context; Run now starts on Guide and nested tools return to their list. |
| Next-action wording duplicated a guided action label. | Prefixed the strip action with “Next:” to make the two controls distinct. |
| The new phone stylesheet was absent from the running phone service. | Folded the styling into the existing served file; confirmed the live service returns it without a restart. |
| Prep showed too many unrelated buttons, and Review kept live combat controls. | Grouped secondary Prep actions and hid the live row in Prep and Review. |
| TV art appeared dark in a screenshot taken during its transition. | Rechecked after the transition; the settled image and main quest card were readable in the simulated display. |

## Verification

The isolated browser rehearsal passed table check, exploration, conversation, reviewed outcome, encounter staging, explicit TV update, phone initiative, damage and undo/redo, a complete turn, and editable closing review. Two simulated phones joined, navigated every main tab, received only allowed quest information, reconnected, and sent an initiative and a roll. The player TV did not receive a private DM note or an owner-only quest. Save/reload preserved the rehearsal review and combat state. A separate interface check passed Prep/Run/Review switches, map persistence, rail navigation, contextual Back, favorites, classic/redesigned switching, an 820-pixel layout, and browser error checks. A 390-pixel phone view had no horizontal overflow.

**Still to validate with people and hardware:** the DM should stage a prepared scene and handle an urgent request without guidance; one player should locate their turn, sheet, and quest on a real phone; and the table TV should be checked for readable labels from every seat and for flat-screen orientation. The proposed three-action, one-action, and 15-second usability targets have not been measured with people. The current session should be backed up and restored in a second browser before retiring the classic layout. Physical speakers, Wi-Fi, and display connection were not tested by the browser rehearsal.

## Feature parity ledger

The detailed control-to-screen map is in `UI-Overhaul-Feature-Map.md`. The classic layout remains the recovery path for any control that proves difficult to find. The next release slice should bring quest and NPC detail navigation into the same right panel, validate the remaining ledger rows one by one, and then retire duplicate old controls only after the DM and a player approve the real-device flow.
