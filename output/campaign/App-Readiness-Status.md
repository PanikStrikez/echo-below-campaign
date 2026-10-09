# The Echo Below app readiness status

**Stage 0 baseline — 9 October 2026**

This is the current status register for preparing the next table session. It separates checks of the app in an isolated browser from checks that require the actual DM computer, flat TV, speakers, and player phones. The older feature roadmap is historical planning context, not a live readiness checklist.

## Current decision

**The app passed an isolated full-session rehearsal. Table readiness is pending.** The current live browser campaign has not yet been exported and restored, and the physical TV, speakers, and five phones were not connected during this audit. Do those checks before treating the table check as complete. No play outcomes or character records were changed by this baseline pass.

The latest confirmed play checkpoint is Barthen's Provisions. Gundren is asleep at the inn, Trista holds Glasstaff's captured rat, and Glasstaff's route to Cragmaw Castle is DM-only. Pebble and Trista have recorded level 4 updates. Do not assign the other three characters' level 4 choices without their players' sheets or decisions.

## Feature status

| Workflow | Status | Evidence and remaining check |
| --- | --- | --- |
| DM app startup and saved session switching | **Isolated browser verified** | The full-session rehearsal opened the app and reloaded a saved practice session. Opening the current DM browser save remains pending. |
| Table check and guided opening | **Isolated browser verified** | The rehearsal ran table check, reviewed recap/objectives, opened the evening, and preserved the TV view. Audible output and real device connections require table checks. |
| Scene staging and TV privacy | **Isolated browser verified** | A staged map appeared only after approval; private outcome text stayed off the TV. The physical TV needs orientation, scale, and readability checks. |
| Quest audiences | **Isolated browser verified** | Main quest appeared on the TV, shared quest on phones, and an owner-only quest only on Trista's simulated phone. No private notes reached another simulated phone. |
| Combat and movement | **Automated and isolated browser verified** | Initiative, damage review, undo/redo, next turn, and crowded-map rendering passed. Test actual drag and touch behavior on the table display before play. |
| Party and phone sheets | **Automated verified** | Five PCs, Sildar, private owner view, current saved action cards, and Pebble/Trista level 4 migration checks passed. Other level 4 choices are open. |
| Phone join and one-phone management | **Automated and simulated browser verified** | QR join, owner isolation, requests, reconnect, reassignment, initiative, and rolls passed. Real Wi-Fi and all five phones were not exercised. |
| Atlas, maps, and fog | **Automated verified** | Atlas hierarchy, audience boundary, map save shape, visibility, and calibration checks passed. Exact TV sizing and source-map limitations still need attention during play. |
| Session closing and continuity | **Isolated browser verified** | The rehearsal closed with unresolved requests, kept private notes off TV, preserved HP/resources, and reopened after reload. Actual later session outcomes must still be recorded by the DM. |
| Browser save and recovery | **Automated and historical-backup verified** | Save fallback and temporary restore checks passed. An October 1 JSON backup reopened all 10 sessions in a fresh disposable Chrome context. The current live browser save is still unverified. |
| Private command-center database | **Local recovery copy verified** | A SQLite online backup passed `PRAGMA integrity_check`. This store is separate from browser campaign backups and the portable ZIP. |
| Portable package | **Automated verified** | Package integrity and source-book exclusion checks passed on test data. No current live campaign package was built. |
| Source books | **Available as local references; table opening unverified** | Personal PDFs stay separate from the portable ZIP. The shelf should be opened on the actual DM computer before play. |
| Audio and Voice Studio | **Mock/browser verified; physical output pending** | Synthetic narration and local voice workflow have prior checks. No real provider generation or speaker-routing check was made in this baseline pass. Manual reading remains available. |
| AI assistance | **Local and mock verified; provider pending** | Local grounded help and audience-specific context have prior checks. No real text-provider response is claimed. |

## Recovery copies

| Copy | Location and state |
| --- | --- |
| Historical browser JSON | `/Users/Ethan/Downloads/echo-below-default-backup.json`, modified 1 October 2026, 14,241,870 bytes, SHA-256 `df12ccdb1037e581fd0caa6b067c7d6f62ba418129d53a50e69d2ef127c23ff3`. It reopened 10 sessions in a disposable Chrome context. **It predates the latest play and level-ups.** |
| Private command-center state | `/Users/Ethan/Downloads/Echo Below Backups/campaign-state-2026-10-09-105841.sqlite3`, 38,174,720 bytes, SHA-256 `ff7233fe41e5e82459268dc18688faff647fac702a00313bfa2f6e4535a074aa`. SQLite integrity check returned `ok`. The original database was unchanged. |
| Current browser campaign | **Pending export.** Download a new campaign JSON from the current DM browser and rehearse it in a fresh browser context. Then create a named practice campaign from that current save. |

These copies contain private campaign information. Keep them off player devices and outside public repositories. A browser JSON and the private SQLite database cover different records; retain both.

## Open issues and checks

| ID | Priority | Issue or check | Next action |
| --- | --- | --- | --- |
| R01 | Before play | The only accessible browser JSON is from October 1. Recent live changes are not protected by a verified current export. | Export the current DM browser campaign, check it with the in-app backup check, and restore it in an isolated second browser/profile. |
| R02 | Before play | The DM server and phone server were not running during this audit. TV, speakers, and real phones were unavailable. | Launch the desktop app, run Table check, hear the sound sample, confirm TV revision, join/reconnect all five phones, and test a roll and one token drag. |
| R03 | High | The private command-center SQLite database is not inside the browser JSON or portable ZIP. | Keep the verified private SQLite copy with each release and document its restore location beside the browser backup. |
| R04 | Medium | Two automated checks still expected modules directly in the old loader. | Updated them to inspect the current module manifest; both now pass. Retain these fixes. |
| R05 | Medium | Browser rehearsal scripts need the bundled Playwright library; plain `node` cannot find it on this Mac. | Use the bundled `NODE_PATH` when running browser checks, or document a stable local test command. |
| R06 | Low | The historical feature roadmap states Donavan's spell availability and Ringgo's second Expertise are unresolved, though later decisions settled them. | Treat this status register and current character data as authoritative; mark that roadmap historical rather than using its checkboxes for readiness. |
| R07 | Low | The reliability guide previously said source PDFs were included in the portable ZIP, while current packaging explicitly excludes them. | Guide corrected in this baseline pass. Keep personal books separate from any exported package. |

## Checks completed in this baseline pass

- Passed: table workflow, recovery, save fallback, phone service, portable package, party, combat, quests, atlas, maps, and 92 campaign-state tests.
- Passed: an isolated browser session across DM, TV, and two simulated phones, covering table opening, exploration, conversation, approved outcome, quest audiences, combat, reconnect/reassignment, closing, and reload. A crowded scene with over 200 tokens rendered in that browser rehearsal; this is not a physical TV frame-rate measurement.
- Passed: the historical October 1 backup's temporary restore and actual new-campaign restore in a disposable Chrome context. It included 10 sessions and no imported media blobs; its referenced local artwork was not transferred to another computer in this check.
- Pending: current live browser save export and second-profile restore; actual flat TV, speakers, all five phones, local book opening, and current-session offline asset check.

## Table-side checklist

1. Open **The Echo Below** desktop app. Confirm the campaign and active session shown at the top are the intended live ones.
2. Use **Settings → Recovery & campaigns → Backup** to download a current JSON backup and run **Check a backup file**. Keep the existing October 1 file untouched.
3. Run **Table check**. Open the Player TV on the flat display; verify the latest revision, orientation, safe edges, labels, map scale, and one deliberate scene change.
4. Hear the sound sample through the table speakers and test immediate mute. Keep manual narration ready if the voice provider is unavailable.
5. Join or reconnect each phone to its correct character. Verify one roll/request reaches the DM and an owner-only clue remains private.
6. In a practice campaign, drag a token, reveal fog, apply and undo damage, then return to the live campaign. Use a new QR code if practice mode restarts phone access.
7. Restore the new JSON in a separate browser profile or computer, verify character values, current scene, quests, and media, then retain that verified file with the private SQLite copy.

The table check expires after 15 minutes. Run it near the start of play; a successful automated rehearsal cannot substitute for hearing the speakers or seeing the actual display.
