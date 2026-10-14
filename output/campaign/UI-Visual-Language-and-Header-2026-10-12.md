# Shared visual language and DM header — 12 October 2026

## What changed

DM, TV, and phones share one palette, type system, control styling, focus treatment, spacing tokens, and written status badges. Green navigation and gold accents remain, with parchment retained for reading scenes. Headings use serif type; controls and mechanical information use plain type. Ordinary borders are softer. Explicit primary actions use the same gold background and dark foreground.

Phone attack math and action-support labels are separate blocks. Damage type is shown alongside dice. Decorative small lettering is restricted to section labels; ordinary supporting text is readable and normally spaced. Request statuses keep their existing wording and gain the shared badges.

The phone theme is compiled into its existing served stylesheet from `Visual-Language.css`. This preserves the current service and join assignments; no restart is required. Open pages need a refresh to load changed styles.

## DM control homes

| Information or action | Primary home |
| --- | --- |
| Current workspace | Header Scene / Explore / Map Desk; four launchpad tiles remain |
| Search, urgent inbox, immediate audio stop | Header |
| Scene and complete objective | Context strip below the header |
| Next useful action | Context strip; session summary repeats its label without a second action button |
| TV connection, now showing, resync/open controls | Context strip |
| Resume current session | Launchpad session summary; restores the previous Scene / Explore / Map Desk workspace |
| Evening workflow | Expandable guide; current step remains accessible when collapsed |
| Tokens, fog, undo, next turn, map tools | Map Desk dock |
| Mute, audio board, undo, advanced tools | Menu; keyboard shortcuts remain available |
| Interactive atlas | Launchpad and existing World tools |

The guide collapse preference and last workspace are UI preferences. Resume and collapse do not publish a visual, advance a turn, apply an outcome, or change HP, tokens, or fog. Prepared scene headings are distinguished from the live map scene; the TV status is shown separately.

## Verification

- 103 automated tests passed.
- Real Chrome checked 20 DM, TV, and phone views in fresh profiles using disposable services. No browser errors or page-level horizontal overflow in the checked sizes.
- Checked 1512px and 1280px DM layouts, 1920px TV, and 390px / 360px phones. Existing UI rehearsal also passed 820px and 640px layouts.
- Attack math and support badges had separate lines and space between them. Phone math was at least 13px with normal lettering.
- DM Show on TV and phone Send for DM review had identical computed colors, with 8.77:1 text contrast.
- Resume returned to the previous workspace. Guide collapse and expansion worked. A long objective wrapped completely instead of using an ellipsis.
- Navigating, resuming, and collapsing preserved the checked party, token, turn, fog, scene, and TV presentation state.
- Existing evening workflow, advanced tool access, Prep/Run/Review, and classic fallback checks passed.
- The updated mute menu was exercised with mock audition playback; private preview stopped correctly. Zero real provider requests.

These are automated and isolated browser results. No live campaign or phone service was restarted. Physical TV viewing distance, actual phones, speakers, and human task times were not retested. No claim of faster human use is made. This is not a new full portable-release gate.

## Before and after

| View | Before | After |
| --- | --- | --- |
| Launchpad | [Before](../audits/visual-language-2026-10-12/dm-home-before.png) | [After, guide collapsed](../audits/visual-language-2026-10-12/dm-home-guide-collapsed.png) |
| Scene | [Before](../audits/visual-language-2026-10-12/dm-scene-before.png) | [After](../audits/visual-language-2026-10-12/dm-scene.png) |
| Combat | [Before](../audits/visual-language-2026-10-12/dm-combat-before.png) | [After](../audits/visual-language-2026-10-12/dm-combat-guide-collapsed.png) |
| TV | [Before](../audits/visual-language-2026-10-12/tv-combat-before.png) | [After](../audits/visual-language-2026-10-12/tv-combat.png) |
| Phone actions | [Before](../audits/visual-language-2026-10-12/phone-turn-content-before.png) | [After](../audits/visual-language-2026-10-12/phone-turn-content.png) |
| Phone sheet | [Before](../audits/visual-language-2026-10-12/phone-sheet-content-before.png) | [After](../audits/visual-language-2026-10-12/phone-sheet-content.png) |

[Verification and source hashes](../audits/visual-language-2026-10-12/Verification.json) · [Full objective example](../audits/visual-language-2026-10-12/dm-complete-objective.png)

Rebuild phone styles with `node tools/build-visual-language.cjs`; verify with `--check`. Screenshots are isolated fixtures, not evidence of new campaign events.
