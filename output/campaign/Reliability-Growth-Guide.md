# Reliability for a growing campaign

## Phone health and individual connections

Open **Connect phones**. Each joined character shows the last authenticated contact and the update revision the phone confirmed after rendering. A join alone no longer counts as a connection.

- **Current:** the phone has contacted the service recently and is acknowledging updates.
- **Stale:** an update has not been confirmed within the grace period, or you requested a resync.
- **Offline:** no contact in 15 seconds. A backgrounded or sleeping phone may appear offline; wake it before play.
- **Resync this phone:** requests fresh live state without removing its join.
- **Release to rejoin:** invalidates only that character’s phone join. Scan the current QR code to reclaim it.
- **Reassign phone:** choose an unclaimed character. That phone reloads under its new assignment. Old-assignment queued events are removed, and stale requests are rejected. Already approved campaign actions are not undone.

Stale/offline warnings also appear in the top bar and table check. The Player TV must acknowledge its actual latest revision; an old acknowledgement cannot hide a stuck update.

## Portable package

In **Reliability → Backup**, choose **Download full app + campaign + artwork package**. Use the desktop HTTP app, not a file:// tab. This exports the current browser’s campaign and uploaded media, copies the app/art/audio into a relocatable ZIP, and verifies SHA-256 hashes before download. Personal source PDFs remain separate and must be copied locally by their owner. Large media makes this substantially larger and slower than the JSON backup.

The ZIP contains private campaign information. It is a personal backup, not a public app distribution. The separate private campaign-command-center SQLite database is also excluded; back it up as described in `CAMPAIGN-ENGINE-SETUP.md`.

Extract it on the destination computer. Python 3.10+ is required. Stop any existing Echo Below servers, run `Start-Campaign.command` on a Mac (or `python3 Start-Campaign.py`), then restore `campaign-backup.json` as a new campaign using Reliability → Backup. Run Table check and confirm TV and audio there. The package does not automatically overwrite browser saves.

## Restore rehearsal

**Rehearse restore in temporary storage** builds a current backup, runs the same restore preparation used by a real import, writes to a uniquely named temporary IndexedDB database, closes/reopens it, normalizes every restored session and compares imported media bytes. The temporary database is then deleted. The live campaign is not changed.

Selecting an existing JSON in **Check a backup file** runs the same rehearsal. This tests the current browser’s storage; it does not claim another computer/browser has been tested. External artwork comes in the full ZIP and should also be checked with Offline files on the destination.

## Performance and maintenance

Health shows current token count and measured DM/TV map-render times. Above 50 ms it suggests reducing effects, active areas or image size. These timings do not measure GPU animation frame rate.

TV health, restore preparation/rehearsal, server phone health and package building now live in separate modules. Targeted tests cover actual phone HTTP acknowledgements, isolated reassignment/release, stale-assignment rejection, portable HTTP downloads, file-integrity failures, recovery readback/cleanup, and TV stale-revision detection.

The stress test uses 500 tokens, 10,000 fog cells, 500 walls and capped animated layers (60 anchors, 100 zones, 50 bursts). CPU projection and simulated DOM construction passed at roughly 1 ms p95 on this machine; this is not a live TV frame-rate benchmark. Recovery automation uses simulated IndexedDB; use the in-app rehearsal for the real browser check.
