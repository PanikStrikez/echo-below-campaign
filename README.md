# The Echo Below

Private D&D campaign workspace with the DM screen, player TV display, phone views, maps, audio, and session material.

## Open the app

From this folder, run:

```sh
python3 output/campaign/launchers/serve_campaign.py
```

Then open [the local campaign app](http://127.0.0.1:48261/output/campaign/Session-01-TV-Display.html) on the same computer. The app's phone access controls are on the DM screen.

## What is included

The `output/` folder contains the playable app and campaign material, including artwork, maps, audio, and generated player handouts. The `output/campaign/books/` folder contains app-created reference material and an SRD copy.

Personal source-book PDFs under `sources/` are intentionally **not** in this repository. Add your own local copies to that folder if you want the in-app bookshelf links to open after a fresh download. Do not commit the books.

The live campaign save is local to the computer and browser; GitHub does not replace the app's backup/export feature. Export a campaign backup from the app before moving to another computer, and keep that backup private. Local AI and voice credentials are also excluded.

This repository is intended to remain private because it contains DM-only story details and player character information.
