# Read-aloud update — 12 October 2026

## Delivered

The Echo Below catalog contains 341 authored narration entries. Every entry now has at least two nonempty paragraphs: 335 were expanded and six already met the requirement. The independent Lantern Ferry example also has two paragraphs. Empty setup, closing, and administration beats remain checklists rather than fictional scenes.

Coverage includes Phandelver Sessions 1–5, Thundertree, all 41 Undermountain Level 1 room cards, Waterdeep arrivals, the three introductory expeditions and return scenes, transition branches, Mending Court, the Silent Library, character spotlights and chapters, expedition narration, and the prepared finale branches. This expands existing preparation; it does not prepare unpublished rooms on later floors or record future events as played.

The prose uses established visible features, sounds, light, obstacles, and available approaches. It preserves hidden information and unresolved outcomes. Broad chapter introductions that formerly mentioned hidden inhabitants or agendas now use observable descriptions. Conditional branch text still requires the relevant outcome to be established before reading it.

## Where to find it

- **Scene → Say aloud** and **Explore / Session Pilot**.
- Existing runbook, room, character opportunity, transition, and expedition cards.
- Voice Studio's selected scene source uses the same paragraphs.

A private authored catalog upgrades canonical preparation and exact matching default text in older session copies. DM-edited descriptions remain untouched. This is a display/content update, not a save migration. Catalog changes do not apply HP, resources, discoveries, quests, fog, or token movements.

## Verified

- 103 automated tests passed, including five narration tests for coverage, safe upgrades, audience loaders, recording fingerprints, and reproducible generation.
- 10 checks passed in real Chrome using a fresh profile, disposable local services, and an isolated import of the supplied backup.
- Separate paragraphs appeared on the scene screen and Undermountain room card. The exploration view remained usable.
- Reading and browsing did not alter character records, tokens, fog, or outcome events. The original backup file remained byte-for-byte unchanged.
- The TV did not load the private narration catalog or disclose Glasstaff's destination.
- Selected narration alone reached the speech source; its changed fingerprint invalidates the former text fingerprint.
- Existing Waterdeep, Undermountain arc, character chapter, and quest preparation checks passed. Reusable module extraction matched its recorded hashes.

These results are automated and isolated browser evidence. They are not physical table, phone, or speaker results and are not a fresh full portable-release gate.

## Remaining limits

No provider calls were made and no recordings were generated. Earlier recordings may require a new take to match changed wording. No live service was restarted. Actual TV viewing distance, phone usability, and speaker playback were not retested. A custom edited description can still be shorter than two paragraphs because it is preserved deliberately.

## Visual evidence

- [Before: opening scene](../audits/narration-2026-10-12/dm-scene-before.png)
- [After: opening scene](../audits/narration-2026-10-12/dm-scene-after.png)
- [After: inn lead](../audits/narration-2026-10-12/dm-inn-after.png)
- [After: exploration](../audits/narration-2026-10-12/dm-exploration-after.png)
- [After: room card](../audits/narration-2026-10-12/dm-room-after.png)
- [Isolated browser verification](../audits/narration-2026-10-12/Verification.json)

Authoring: `narration/Additional-Paragraphs.tsv`. Rebuild/check: `tools/build-narration.cjs`. This tool reads app preparation only and never writes source books or campaign saves.
