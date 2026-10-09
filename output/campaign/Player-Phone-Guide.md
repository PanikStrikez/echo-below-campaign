# Player phone interactions

Refresh the DM app and the player companion after this update. Open **Player phones** to connect or manage the table. Pending inventory requests also appear in the main **Player requests** list.

## Personal notes and shared clues

- In **Journal & clues**, choose **Add my note** on a private or shared clue.
- Use **Add NPC or location note** to attach a note to a named person or place.
- Notes belong to the selected character and are included in campaign backups. Other players cannot read them; the DM’s campaign record contains them.
- **Share with party** asks for confirmation before publishing the full clue text and image. Personal notes are excluded. Sharing does not automatically put anything on the TV.
- If the clue changed since the phone displayed it, sharing is rejected until the player reviews the updated clue.
- The DM can withdraw a shared copy from **Player phones → Player journal & inventory requests**. This does not erase what players already learned.

## Items, potions and money

**Loot & promises → Manage items** lists shared loot and the character’s own sheet equipment separately.

- Shared, unclaimed items: request a claim.
- Items carried by the character: request use, transfer, equip or unequip.
- A use request names its target. Standard healing potions show their proposed healing range before sending. The DM reviews consumption, effect, healing dice or a physical-roll total, target, and action usage, then applies the reviewed result.
- The DM review holds rolled healing until approval. Range, special effects, attunement and equipment restrictions remain explicit DM decisions. Equipping records the status; the review can also set AC, while other attack/feature changes belong on the character sheet.
- Requests show waiting/resolved/declined/cancelled status. Players can cancel waiting requests.
- The shared purse begins empty; the DM records actual party-held coins. Character money remains on character sheets.
- **Split shared coins** previews a whole-coin split for selected recipients. Each denomination is handled separately, without conversion. Indivisible coins remain in the shared purse. Approval updates the purse and character money together.
- Main **Undo / Redo** restores reviewed inventory, coin, HP and action changes together. A stale DM preview cannot overwrite a newer item or character state.

## Spellbook and next objective

**My sheet → Spellbook** searches spell names and notes. Filters show available spell slots/cantrips and casting times. Preparation uncertainty is labeled; resource-based exceptions still need DM review. **Ask to cast** opens the existing target-and-slot request flow.

The **What are we doing next?** panel shows the DM-published objective on every phone. Players can propose a new objective for review. No objective is invented from unrevealed campaign plans.

## Connection and offline sheets

- The phone shows **Last synced**, switching to **Offline copy** when connection is lost.
- The last received character sheet is saved on that phone. Live rolls, sharing and requests pause while disconnected; changes are never silently queued for later spending.
- **Reconnect** fetches the live authoritative record again. If phone access was restarted, scan the new QR code to rejoin.
- **Download emergency sheet** saves a standalone HTML handout that opens without the table. It includes its snapshot time and a reconnect link. Reconnecting opens the live companion; it does not rewrite the downloaded file.
- A browser reload while the local server is unreachable is not guaranteed to reopen the companion shell. Use the downloaded sheet for offline startup. An open companion tab retains its sheet during an outage.
- **Remove saved sheet from this phone** clears the browser copy. Downloaded files must be removed separately.

## Later: optional home-screen installation

The installed phone-app experience remains a separate setup upgrade: offline app-shell installation, device testing, stable reconnect addressing and update handling. No installation or network configuration change is required for the features above.
