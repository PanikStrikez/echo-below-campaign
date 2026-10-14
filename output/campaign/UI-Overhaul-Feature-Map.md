# Interface feature map

**Stage 1 design inventory — 9 October 2026**

The new shell keeps three DM modes: Prep, Run, and Review. The Run view keeps the map in the center, one detail panel on the right, and a narrow tool rail. Existing domain drawers keep their underlying controls. This table tracks where each capability belongs and guards against hiding a working feature during the redesign.

| Capability | New primary entry | Existing control or system retained |
| --- | --- | --- |
| Campaign and session choice | Header campaign/session switcher; Session rail | `campaign-select`, `session-select`, session packs and duplication |
| Begin evening and table readiness | Run → Guide; Prep → Table check | Session flow and reliability table check |
| Scene choice and staging | Run top bar → Scene; right-panel preview | Scene browser, encounter launch, explicit TV publication |
| Current player view and connection | Run top bar → Player TV; persistent Now showing | Presentation, TV health, resync, open TV window |
| Combat turn order | Run top bar → Next turn; right-panel Turn | Initiative, previous/end turn, action flow, conditions |
| Player requests | Run top bar → Inbox; right-panel Inbox | Phone requests, action review, status and approval |
| Sound emergency | Run top bar → Mute | Audio board and soundscape controls |
| Undo and recovery | Run top bar → Undo; Settings → Recovery | Redo, log, restore points and backups |
| Map interaction | Center canvas toolbar | Move, target, ruler, ping, shapes, fog, grid, calibration |
| Token and creature card | Select token → right-panel Details | HP, AC, attacks, resources, conditions, creature library |
| Scene notes and read-aloud | Right-panel Guide → Scene notes | Runbook beats, next beat, guided scene tools |
| Quick actions | Run → Tools shelf; editable favorites | Music, reveal, potion, damage, clue, notes, search |
| Quests and leads | Quests rail; Prep board | Active/Completed, main/side/owner publication, likely leads |
| Characters and party | Party rail | Sheets, resources, rests, party inventory, phone assignments |
| Journey and locations | World rail | Atlas, travel, settlement maps, destination requests |
| Dungeons and expeditions | World rail | Persistent doors/fog/objects, expedition record, routes |
| Story and outcomes | Review → Outcome review; World → Story | Actual events, NPC knowledge, evidence, spotlights |
| Waterdeep and adventure packages | World rail | Mending Court, Undermountain, chapters, satellites, finale |
| Rules and books | Library rail and global search | Private local shelf, 2014 rules, exceptions and bookmarks |
| TV art, handouts and text | Library rail; Player TV preview | Art, handouts, journal, title card, black screen, overlays |
| Audio, voice and AI | Library rail; contextual NPC card | Ambience, Voice Studio, narration, DM assistant, dialogue |
| Session editing | Prep mode → Session | Scenes, encounters, enemies, beats and media |
| Closing and correction | Review mode | Changes summary, unresolved requests, recap and undo |
| Campaign management | Settings rail | New/duplicate/archive campaign, practice copy, portable backup |
| Display and accessibility | Settings rail | Keyboard shortcuts, reduced motion, TV calibration and layout |

## Screen behavior

- **Run:** map or staged visual is largest. Guide, Turn, Inbox, Details and Tools use the same right panel. Opening one remembers the previous panel so Back returns to the prior task. Scene notes open only when asked for, instead of occupying a permanent column.
- **Prep:** session choice, quest leads, scenes, encounters, media and character changes receive the full editor space. Returning to Run restores the same map position and panel.
- **Review:** outcome review, changed resources, unresolved requests, recap and backup are grouped in one closing path. DM-only details remain off player displays.
- **Player TV:** one current presentation at a time, with overlays and text cards controlled separately. Its payload remains filtered before reaching the window.
- **Phone:** current task and connection state precede navigation. Turn/Explore/Sheet/Journal/Items remain stable tabs; owner-only clues and character quests are filtered by the service.

## Feature parity check

For each row above, verify: entry is visible or searchable; current state is shown; the existing action still works; Back returns to the prior context; keyboard/touch target is usable; no DM-only data reaches TV or phone; save/reload preserves the result. Keep the legacy controls available during migration until every row passes.

The clickable layout study is `UI-Overhaul-Prototype.html`. It contains no campaign save and makes no player-visible changes. A physical table-sized TV and at least one player's phone still need human review of sizing, reach, and labels.


## Current header and launchpad — 12 October 2026

The current control locations supersede earlier header/dock placement notes. Search, Inbox, and Stop sound stay in the header. Scene, the full objective, next action, TV status, and the guide toggle sit in the context strip. The launchpad retains all four tiles and the atlas, with a current-session Resume summary. Mute and the audio board are in Menu; Map Desk keeps tokens, fog, undo, next turn, and map tools. The collapsed guide retains its current-step action. All advanced controls retain their existing menu/navigation paths.

See [current visual/header report](UI-Visual-Language-and-Header-2026-10-12.md) for verified scope and before/after images.
