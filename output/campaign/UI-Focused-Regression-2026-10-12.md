# Focused usability and visual regression — 12 October 2026

## What changed

- Removed duplicate scene names from the DM status strip and Map Desk heading; source titles remain unchanged.
- Put the first-time phone walkthrough directly below navigation. Updated its instructions and action links to My turn, Sheet, Journal, and Connection & saved sheet. It disappears when skipped or finished.
- Opening an inventory request scrolls its editor into view below phone navigation.
- Collecting initiative now keeps the guided setup panel open. The rehearsal reproduced this lost-context problem and verified the fix.
- Renamed the manual-damage handoff to **Review damage & reactions** and closed the obsolete damage editor when the shared review opens. It previously said Apply even though it only staged a review. HP still changes only at final approval.
- Added stable accessible names to inventory fields on DM and phone forms.

## Consistent evidence

- 35 matching before/after views; 37 final views. Launchpad, Scene, Session Pilot, combat, quest review, TV, all five sheets and action panels at both 360 and 390 pixels, onboarding, item use, and outcome correction.
- DM screenshots: 1512 × 982. TV: 1920 × 1080. Phone screenshots: 390/360 × 844. The separate combat regression also verifies 1280 × 800.
- Walkthrough top moved from 1,702–2,464 pixels below the page top to 194 pixels for all five clients: the whole first step is visible in the 844-pixel viewport.
- Selected item editor top moved from 1,544 pixels to 90 pixels after its opening scroll settles.
- No horizontal page overflow or browser errors in the final focused capture.
- The screenshot gallery includes unchanged views; they demonstrate preservation rather than implying every screen improved.

## Workflow observations

Counts below are automated button/summary activations. Changes include fields/selects/checks. Scrolls are DOM scroll events, including browser automatic and smooth scrolling; they are not human gestures. Durations are retained in the raw results but do not establish faster use or human comprehension.

| Task | Button/summary activations | Field changes | Scroll events | Result |
| --- | ---: | ---: | ---: | --- |
| Find a quest lead | 2 | 2 | 2 | Passed |
| Stage a prepared scene without publishing while browsing | 2 | 0 | 0 | Passed |
| Find a phone quest | 4 | 0 | 0 | Passed |
| Request an item use from a phone | 3 | 1 | 2 | Passed |
| Request and resolve an attack from a phone | 3 | 1 | 36 | Passed |
| Respond to the phone attack and review effects | 5 | 6 | 4 | Passed |
| Review and use the requested item | 5 | 4 | 3 | Passed |
| Correct a reviewed outcome and retain history | 7 | 1 | 5 | Passed |

The quest-lead task used Menu → Quests, search, and a quest selection. Prepared scene staging took two button activations in this fixture and did not publish during browsing. Quest testing includes both Active and Completed. The phone attack uses an actual disposable LAN service and a separately joined browser client; the additional combat comparison simulates the phone ingress without a physical phone. The DM attack review count includes undo after resolution. Item use includes an explicit DM preview, action-cost ruling, and application. Outcome correction includes apply, correction, undo, and redo without erasing history.

A separate full-evening rehearsal passed table checks with a recorded device exception, exploration, conversation, staged combat, initiative, shared damage approval, pending-request carryover, closing, and reload persistence. Its old test selectors were updated to the current visible menu and scoped panel controls; state and privacy assertions were retained.

## Save, map, privacy, and feature access

- All 52 registered control IDs exist and the five advanced tool categories open in the contextual panel. Quests opens its retained workspace. All 10 registered advanced panels still have a DOM home. The inventory is in after/Results.json. This is entry-point coverage, not an execution of every possible deep editor operation.
- Navigation through those categories left party, tokens, turn order, fog, per-scene fog, and scene unchanged. Private preview staging and drag/undo assertions passed in the companion regressions.
- The original campaign export opened in an isolated profile. A session save restored into a second fresh profile with zero field differences for party, tokens, turn, fog, per-scene fog, and current scene. Future-version rejection remains covered by the unit tests.
- Private outcome sentinel text was absent from all five authenticated phone state responses and the TV. Owner identity in each response matched its assigned character. Existing audience-projection tests also passed.
- 106/106 unit tests; map controls, save shape, calibration, and privacy checks; shared stylesheet synchronization; reusable-core extraction checks; 39 contextual/phone regression views passed.
- The original live backup hash remains 5fd26c38231c524d4bad822983129cdab0db432158e2f59bfc5d495c4b31e32b. No live service was restarted and no live save or phone assignment was changed.

## Important limitations and next checks

- An all-media campaign JSON export reached approximately 1 GiB in this rehearsal; its fresh-browser import failed. The disposable artifact was removed. The successful check above is a session-state restore, not proof of a full all-media portable restore. A streamed/chunked or archive-based media restore should get a separate reliability pass.
- Human hesitation, label comprehension, and time-to-find have not been measured. No claim that the interface is faster for people is made.
- Check the actual flat TV from every seat, safe edges/overscan, rotation and physical grid sizing; test all five actual phone browsers and OS text scaling; check keyboard/VoiceOver and speakers/private headphones.
- Scroll-event counts are useful regression traces, not a usability score. The long phone attack auto-scroll is visible in the trace and remains a useful physical-phone check.
- Only cached/local content and disposable services were used; no AI or voice-provider request occurred.

## Evidence

- [Matching screenshot gallery](../audits/focused-usability-2026-10-12/Before-and-After.html)
- [Verification summary](../audits/focused-usability-2026-10-12/Verification.json)
- [Final click and scroll traces](../audits/focused-usability-2026-10-12/after/Results.json)
- [Session restore comparison](../audits/focused-usability-2026-10-12/after/Restore-Comparison.json)
- [Closing review screenshot](../audits/focused-usability-2026-10-12/Closing-Review.png)
