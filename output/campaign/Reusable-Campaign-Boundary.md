# Reusable campaigns

## At the table

Open **Menu → Settings → Recovery & campaigns → Campaigns**.

- **Create empty campaign:** no installed story pack, characters, quests, places, or history. Add scenes, sheets, NPCs, quests, maps, and uploaded media using the existing Prep tools.
- **Create fictional example:** Lantern Ferry, with Mira and Oswin, a river-crossing map, Lysa's NPC card, an opening beat, and main/shared/owner-only quests. These are fictional demonstration records, separate from Echo Below.
- **Start a copy / new group:** choose blank, the fictional example, an exact private continuation, or a practice copy. Only an exact continuation or practice copy intentionally includes the source group's private records.
- **Open:** returns to the selected campaign's stored scenes and state. Changing installed packs reloads the interface to clear the previous pack's catalogs. Changing campaigns closes that campaign's phone joins, as before; ordinary app reloads and same-campaign updates do not request a live service restart.

The Campaigns panel lists installed packs and versions. Main quests remain on the TV; shared side quests remain on phones; character quests remain owner-only. Active and Completed views are retained.

Blank and fictional-example JSON templates are in `output/releases`. The fictional map is original SVG artwork with a native 1200 × 800 viewBox, not a verified real-world travel scale.

## Content boundary

`Campaign-Boundary.js` reads the active saved index before content scripts are requested. The module manifest selects reusable dependencies or the explicitly installed Echo Below dependencies. The player TV loads shared renderers and receives an audience-filtered presentation, rather than the DM's pack catalogs.

Pack schema version 1 is distinct from campaign save schema version 3. Available pack descriptors:

| Pack | Version | Role |
| --- | --- | --- |
| echo-below | 1.0.0 | Campaign content and source-reference adapters |
| echo-below-party | 1.0.0 | Approved party seeds and legacy migrations; depends on Echo Below |
| lantern-ferry | 1.0.0 | Original fictional example; independently loaded template and atlas |

The two Echo Below descriptors currently form one compatible installed pair. Their versions are tracked separately; removing one alone is rejected instead of silently loading the other. Unknown versions, duplicates, missing dependencies, and incompatible pack combinations fail safely.

Legacy saves infer their installed pack set from their existing content profile. An original restore point and migration note are retained when the inferred set is first made explicit. No character choice or campaign outcome is invented by this migration. Incoming cross-pack JSON is validated and stored as a new campaign; its own normalizers run only after its pack is selected. Original saves remain available.

Fresh blank/example campaigns get distinct service identities. An older blank campaign with the reserved `default` identity can still open and export browser data, but must be duplicated as a new group before linking the structured service or making a whole-campaign backup. This avoids opening the reserved Echo Below service store.

## Reusable extractions and releases

`core/` contains seed-free versions of character, combat, story, continuity, quest, presentation, travel, rule-settings, voice-cast, settlement, expedition, and downtime tools. They retain the existing UI/state contracts. `tools/build-reusable-core.py --check` verifies generated functions and source/output hashes before release. Change the extraction recipe when changing a mixed legacy module; do not hand-edit generated files.

This is an incremental boundary, not a complete rewrite of the large coordinator. Legacy Echo-specific branches remain behind campaign gates. The independently loaded core does not import their party seeds or story catalogs. Empty campaigns have no personal reference bookshelf; Echo Below's existing local bookshelf remains available with its pack.

Portable manifest version 3 remains supported. New releases add optional campaign-boundary and installed-pack metadata, separate content-pack manifest mappings, and the fictional template. Older version-3 releases without those additions still verify. Personal PDFs and provider credentials remain excluded. A release must contain the matching installed pack files to reopen that pack; an older app does not gain a new pack by receiving its save alone.

## Verification

The release gate includes isolated Chrome/IndexedDB rehearsals for blank, fictional example, and the supplied ten-session Echo Below export; actual pointer dragging/undo; fictional NPC cards; reviewed damage/rest; template restoration; cross-pack reloads; and real temporary HTTP phone filtering. No live table service, live browser save, or provider account is used.

Physical TV calibration, phone Wi-Fi behavior, and speaker/headphone routing remain separate checks. The requested physical rehearsal was skipped; automated results do not mark it complete.
