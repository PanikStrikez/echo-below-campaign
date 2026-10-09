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

Use **Campaign state → Review existing campaign import** to stage the app's approved continuity events. Private details, public wording, and actual witnesses are separate. Review and commit the import in Session engine. Already imported event IDs are skipped on later imports. The browser's original records are preserved; this is a reviewed import, not continuous bidirectional synchronization. New command-center state drives its search, NPC replies, and session prep; it does not automatically alter legacy combat tokens, inventories, maps, or phone journals.

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

Review the editable recaps, categories, record fields, citations, and knowledge grants. Each mutation starts unselected. Select only the changes to adopt, then tick the DM review checkbox and commit. Save draft only saves review work. Commit validates the entire selected batch and writes it with its receipt in one SQLite transaction. Stale campaign revisions or stale draft versions are rejected; reanalyze against current state. Duplicate commits return the original receipt. Committed sessions are immutable; corrections use a new reviewed session. A recap-only commit is allowed with no selected mutations.

Player recaps are prepared for review and copying; they are not automatically published to phones or players.

## Backup and portability

The existing portable package excludes credentials, private SQLite databases and journals. Its browser backup does not include the new structured store. Stop the campaign server before copying the entire private campaign-state directory to private backup storage, or use SQLite's online backup API for a consistent live backup. To restore, stop the server and restore the directory to the same `ECHO_CAMPAIGN_STATE_DIR` location. Keep browser campaign backups too, because combat and table UI state remain there. Google Drive sync is not enabled; local storage is the authority.

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
