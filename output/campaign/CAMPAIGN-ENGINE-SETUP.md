# The Echo Below campaign command center

Open the existing desktop app, then **Setup & tools → Settings → Campaign command center**. This adds four connected systems to the existing plain JavaScript/Python application. Browser saves and the current table remain intact.

## Start and configure

The updated `launchers/serve_campaign.py` runs the same local DM server on `127.0.0.1:48261`. Restart an already-running server to load the new Python modules. The existing desktop launcher still opens the same app. The player-phone server on port 48262 does not serve these endpoints or databases.

Python 3.10+ with SQLite FTS5 is required. Local state, search, session extraction, and review do not require an API key or a network connection. PDF indexing uses `pypdf`, `pdftotext`, or a verified installed Codex bundled Python. On another computer, install `requirements-campaign.txt` into your launcher Python, or set `ECHO_PDF_PYTHON` to an existing Python with pypdf. Image-only PDFs use local macOS Vision OCR when Swift command-line tools are available, with a private cache keyed by the exact source hash. Initial OCR can take several minutes. Set `ECHO_SOURCE_OCR=0` to disable it. Extraction failures remain explicit; no sourcebook is uploaded to an OCR service.

Optional environment variables are listed in `.env.example`. The server inherits its environment; it does not load `.env` automatically. From the campaign directory, a shell launch can use:

```sh
set -a
source .env
set +a
python3 launchers/serve_campaign.py
```

Keep `.env` local. Do not place credentials in JavaScript, campaign records, a transcript, or a portable package.

## Campaign state

The private SQLite database stores NPCs, quests, clues, locations, items, relationships, choices, active threads, searchable facts, source chunks, session drafts, and a mutation audit. The schema is in `migrations/001_campaign_state.sql`; opening a database applies it idempotently. Session storage is created by `SessionEngine` in the same database. Records use stable IDs; every fact carries provenance and an epistemic label (`confirmed`, `inferred`, or `unresolved`). Missing manual provenance is explicitly labeled a DM entry.

Storage defaults to `~/.echo-below-campaign/<campaign-id-hash>/campaign.sqlite3`. Each browser campaign has its own database, including practice campaigns. Only the original/default Echo Below campaign receives curated initial state from actual campaign records. Other campaigns start empty and can import their own continuity. A sourcebook index is reference material, not proof that an event happened.

Use **Outcome review → Linked campaign service → Review linked updates** (also reachable from **Campaign state → Review linked outcomes**). The first comparison requires approval. Older imports or records that disagree show their before/after values and require individual conflict review. Choosing the browser outcome preserves the service version in private history. No conflict is resolved automatically.

After linking, durable browser outcome saves update the service projection. Corrections, withdrawals, undo and redo use the same path. An offline service leaves the browser ledger usable and pending; retry from the linked review after reconnecting. A restored browser backup whose head differs from the service requires review, rather than overwriting newer service data. Repeated snapshots and lost acknowledgements do not duplicate events or reapply quantities or rewards. The original browser save schema remains readable; optional `story.reconciliation` stores the approved head and service revision, never credentials.

Authority is explicit:

| Information | Authority |
| --- | --- |
| Played events, audiences, linked quest progress, NPC knowledge, discovery reveals, custody/promise records, journal and recap basis | Approved browser outcome ledger |
| HP, resources, inventory quantities, money, tokens, independent fog and exploration objects | Existing browser table systems; the mirror never changes them |
| Searchable outcome facts and current linked state | SQLite projection of the approved browser ledger |
| Source indexes, book references, voice settings and separate service reference/proposal records | Local service; these do not independently establish played events |

Historical events remain separate from current linked states. Current state is derived only from explicit quest, tracker, relationship or reveal links; prose is never used to guess a new fate. Search and assistant context label older events as historical and current links with their outcome IDs. Owner-only wording stays out of generic service player/NPC search; existing owner phone journals remain the authority for those disclosures. NPC speech still requires explicit knowledge and approved player-safe wording.

Managed service records cannot be independently edited or archived: **Correct authoritative outcome** returns to the existing Outcome review. Service-only facts can enter that workflow using **Review these facts as a table outcome**, or **Session engine → Send selected facts to Outcome review**. They arrive as private unapproved drafts with stable IDs, no inferred witnesses, automatic rewards or quest links. Repeating the same selection does not duplicate it. Review its source, audiences and links before approval. **Save service references only** retains the older standalone service workflow without pretending to update the table's linked views.

Revising a previously adopted service record stages a correction of the same outcome ID. The approved version remains active until review. A different pending draft is never overwritten automatically; finish or discard it first. The structured origin and content signature remain in the DM record and its backup.

**View linked revision history → Inspect preserved version** opens earlier mirror snapshots and the records replaced in each transaction. History is DM-only and is not included in player responses. Mirror tables are added idempotently inside the existing private database; no source file or existing record is removed during setup.

Facts may be DM-only, player-known, or known to explicitly named NPCs. An NPC spoken reply requires both a grant to that NPC and player-safe disclosure. Knowing a secret does not mean an NPC may say it. No NPC inherits everything the party knows. A public fact under a private parent may be searched without revealing that parent's name, private fields, or source excerpts. Whole player guide files are public only on an exact allowlist; personal character handouts and all sourcebooks default to DM-only.

## Campaign AI and canonical sources

In **Sources & setup**, select **Reindex canonical sources**. Indexing runs locally in the background; refresh status to see completion and per-file failures. It reads the synced PDFs in `sources/` and an explicit set of campaign continuity, questbook, player-guide, and Waterdeep reference files. It never modifies those files. Citations retain the filename, physical PDF page, and SHA-256 hash. Markdown is treated as a single document page, with source locators where supplied; printed sourcebook page numbers may differ from physical PDF pages. Session-note citations use the original line number.

Reindexing replaces changed source chunks, revokes missing or unreadable changed sources, and preserves DM-edited state records. Existing actual-play records and adopted campaign continuity take precedence over earlier compiled books and published adventures. Inferences and unresolved material remain labeled; the AI must not fill gaps with remembered D&D lore. OCR extracts are uncertain reference evidence: verify exact rules, numbers, and column ordering in the cited PDF before relying on them.

**Search sources** works offline and returns cited extracts filtered on the server before ranking. **Ask configured AI** sends only that audience's retrieved evidence through the app's existing AI gateway, provider choice, consent, cancellation/usage accounting, and spending limits. Configure that gateway under **Settings → AI assistance**. Mock mode is a service test, not a model answer. Model answers remain drafts for DM review. NPC dialogue uses the stricter grounded-reply path rather than unconstrained model output.

## NPC voices

Profiles exist for Durnan, Gundren Rockseeker, Selise Ardent, and Halaster. Each has a tone/persona prompt and conservative initial knowledge. Type a question to obtain a local cited reply. Unknown answers remain unknown; Halaster does not receive the complete DM bible or automatic omniscience.

For ElevenLabs playback, choose approved stock voice IDs using the existing voice catalog and save each one under **NPC voices → Persona & voice configuration**. These IDs are not credentials; saving one is local and produces no audio request. Optional server overrides are `ELEVENLABS_VOICE_DURNAN`, `ELEVENLABS_VOICE_GUNDREN`, `ELEVENLABS_VOICE_SELISE`, and `ELEVENLABS_VOICE_HALASTER`; a nonempty environment value takes precedence over the saved choice. Use the existing private ElevenLabs key setup or the `ELEVENLABS_API_KEY` environment variable. Enable and confirm the provider and its included-credit limits in the existing Voice auditions settings. NPC playback shares that service's durable credit reservations, stock-voice validation, account checks, and no-overage policy. It does not retry a failed paid request.

The speech endpoint accepts an opaque server-generated reply ID, never arbitrary browser text. Replies expire, are bound to a campaign and revision, and can be dispatched only once. After a knowledge change, generate a new reply. The implemented voice experience is typed conversation with ElevenLabs audio playback. Always-on microphone conversations and hosted ElevenLabs agents are not provisioned. A disabled per-NPC agent configuration blueprint is available from the API for future authenticated gateway deployment; it must not be mistaken for a deployed agent.

## One-button session processing

Open **Session engine**, enter a title, and paste or upload UTF-8 notes/transcript text. **Use current session notes** copies the app's existing private notes. **Analyze session** creates all of the following locally: a player recap, a DM recap, proposed state changes, unresolved threads, NPC and relationship observations, clues learned/missed, and next-session prep.

Ordinary transcript text is DM-only. Put explicitly player-safe statements in the separate Player-safe notes field, or start individual private-notes lines with `[PLAYER]`. Use separate lines for different audiences. Without explicit public input, the player recap stays empty. The engine extracts and categorizes notes; it does not invent unrecorded outcomes, award treasure, resolve uncertainty, or infer witnesses. Large transcripts should be divided into at most 160 event lines, each at most 4,000 characters.

Review the editable recaps, categories, record fields, citations, and knowledge grants. Each mutation starts unselected. For actual play, send selected facts to Outcome review and approve their audience and linked consequences there. Save draft only saves review work. The separate service-reference commit validates the entire selected batch and writes it with its receipt in one SQLite transaction. Stale campaign revisions or stale draft versions are rejected; reanalyze against current state. Duplicate service commits return the original receipt. Committed service sessions are immutable; corrections use a new reviewed session. A recap-only service commit is allowed with no selected mutations.

Player recaps are prepared for review and copying; they are not automatically published to phones or players.

## Backup and portability

Use **Recovery & campaigns → Backup → Back up whole campaign**. This downloads one private ZIP containing app tools/content, browser sessions and settings, imported media, required local artwork/audio, and a logical snapshot of the structured campaign database. The manifest binds both store hashes, browser/schema versions, service revision and outcome heads. A consistent SQLite read transaction captures records, session drafts, audit, seeded IDs and outcome history together. Browser capture is detached from later play and rejects a change during capture. Earlier JSON files remain browser-only and are available under **Other recovery tools**.

Provider/account state, keys, phone assignments and personal source PDFs remain outside the ZIP. Rebuildable source/chunk indexes and their search caches are omitted; campaign fact search is rebuilt from the restored records. Source citations stay with their campaign records. Use **Sources & setup → Reindex canonical sources** after separately supplying your books. Required external media must be imported locally before a complete backup; it is never silently marked as included.

Use **Restore whole campaign**, select the original ZIP, and inspect campaign identity, current characters/HP, quest publication, current scene, missing local media and database compatibility. The ZIP's hashes, paired revisions and linked-outcome hashes are checked before preparation. Missing local assets that are present in the package can be installed. Conflicting artwork is blocked without overwriting it; extract the release into a separate directory in that case. Unknown database or browser versions fail before changing a campaign.

Restore creates a new database and a separate browser campaign. Original internal record/map/event IDs and historical/session records survive; the new browser namespace retains the source identity as `originId`, and the mirror is rebased without reimporting or repeating events. Browser sessions, index and new imported blobs are stored in one transaction and read back. The separate service database becomes visible only after its verification and required-media installation. Registration happens last; **Open restored campaign** is an explicit final action. Phones and the current table remain untouched before that action.

Failed preparation or a failed browser transaction leaves the original usable. A lost response after a service commit may leave an unlisted separate database copy; it does not replace the original. Staged browser records are discarded on a reported failure. Retry from the original ZIP. If the outcome stores were pending synchronization at capture, both versions are preserved and the preview asks for linked-outcome review; it does not claim they agreed.

For an independent raw database backup, stop the campaign server before copying its private directory, or use SQLite's online backup API. Those copies also preserve rebuildable reference indexes if desired. Google Drive/cloud sync is not enabled.

Do not expose the DM server to a LAN or tunnel. Player devices use the existing separate phone service. API routes enforce loopback, exact Host/Origin, and an in-memory bootstrap token; state paths inside the served tree are rejected.

## Validation

From the project root:

```sh
python3 -m unittest discover -s output/campaign/tests -p 'test_campaign*.py' -v
python3 -m unittest discover -s output/campaign/tests -p 'test_ai*.py'
node --test output/campaign/tests/ai-context.test.cjs
node output/campaign/tools/check-run-ui.js
```

The campaign suite covers audience filtering before ranking, source ingestion and hashes, individual NPC disclosure, provider budget guards with mocked requests, campaign isolation, session review/version conflicts, atomic rollback, import boundaries, and receipt replay. It makes no paid API calls. The optional browser rehearsal is `tools/check-campaign-engine-browser.js` and requires a compatible local Playwright/Chrome setup.
