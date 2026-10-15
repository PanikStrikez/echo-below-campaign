# TV and controls review — 12 October 2026

## Changes and where to find them

- **Map tools → Display → Player TV presentation:** Quiet table preset, optional objective and narration subtitles. Decorated preset remains available. Calibration and map sizing use the existing calculations.
- **Player TV → Controls & interaction:** explicit opt-in for TV controls; Escape returns to viewing mode. Existing exploration permissions still apply. DM private preview cannot join, acknowledge, or send player actions.
- **DM Menu → DM text size:** Standard, 150%, or 200%. This local interface preference is separate from campaign saves.
- **Phone connection details → Phone text size:** the same choices. Tabs wrap when needed and narrow mechanical rows stack.
- **Notices:** temporary messages occupy reserved space above the working area. Failed DM messages remain in a local history; phones retain failed requests in their Notices history. Repeated messages are grouped. Histories are bounded and last only for the current page; reload clears them.
- Strong keyboard focus, clearer control borders, 44-pixel minimum common phone targets, text labels for statuses, and reduced-motion handling.

## Verified results

- 106/106 unit tests passed. Map checks, shared-style synchronization, and reusable-core extraction checks passed.
- Accessibility browser audit: 22 views, 1,874 sampled control/status observations across DM, TV, and phones. Zero measured text-contrast failures, control-boundary failures, undersized common phone targets, horizontal document overflow, or page errors.
- 139 observations with image/gradient backgrounds were excluded from automatic contrast conclusions. Their appearance was reviewed visually; this does not establish a contrast ratio for every possible map background.
- Keyboard focus was visible; local 200% text settings worked; narrow effective viewports reflowed; reduced motion disabled tested animation/transition rules.
- A mocked phone request failure remained readable after its temporary notice cleared. DM notices did not overlap Show on TV or End turn. UI preferences and feedback left party, tokens, combat, fog, and scene state unchanged.
- Regression rehearsal: 39 views passed, including context Back/scroll restoration, phone tabs, private TV staging, and combat controls.
- Quiet-TV rehearsal: nine views passed at 1920 × 1080, 3840 × 2160, and 1080 × 1920, including portrait orientation, stale connection warning, interaction gating, and objective/subtitle separation. Decorated/quiet switching preserved calibrated stage bounds and game state.

All browser rehearsals used isolated campaign profiles and disposable services. Subtitle content was an original visual fixture; phone failure used a mocked response. No paid generation, live service restart, or changes to the live campaign occurred. Native screenshot dimensions are stated in the gallery; no image enlargement is represented as new detail.

## Remaining physical checks and limits

- Flat-TV viewing distance, legibility from every seat, overscan/safe edges, full-screen behavior, physical grid size, and label orientation need actual table testing.
- Actual phone operating-system text settings, VoiceOver/screen-reader behavior, and keyboard traversal of every advanced editor remain untested.
- The audit covers sampled workflows, not a whole-app WCAG certification. Dense advanced editors remain available and should be checked as they are used.
- Reserved notification histories are page-local. They preserve failures beyond the toast lifetime, not across a reload; durable action/outcome history remains in the existing campaign systems.

## Evidence

- [Before/after screenshots](../audits/accessibility-2026-10-12/Before-and-After.html)
- [Computed audit](../audits/accessibility-2026-10-12/Computed-Audit.json)
- [Quiet TV verification](../audits/quiet-tv-2026-10-12/Verification.json)
- [Panel and phone regression](../audits/task-panels-2026-10-12/Verification.json)

Contrast thresholds follow [WCAG contrast minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum): 4.5:1 for ordinary text and 3:1 for large text. The 44-pixel common-phone target is the requested design target. [Text resizing guidance](https://www.w3.org/WAI/WCAG21/Understanding/resize-text) informed the 200% checks.
