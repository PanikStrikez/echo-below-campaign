"""Exercise the phone-only HTTP boundary and one player's table actions."""
import importlib.util
import json
import sys
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / "launchers"))
spec = importlib.util.spec_from_file_location("serve_phones", root / "launchers" / "serve_phones.py")
phone = importlib.util.module_from_spec(spec)
spec.loader.exec_module(phone)
phone.lan_address = lambda: "192.168.1.42"
server = ThreadingHTTPServer(("127.0.0.1", 0), phone.Handler)
thread = threading.Thread(target=server.serve_forever, daemon=True)
thread.start()
base = f"http://127.0.0.1:{server.server_address[1]}"
dm_origin = "http://127.0.0.1:48261"


def call(path, data=None, origin=None, cookie=None, status=200):
    headers = {}
    if origin:
        headers["Origin"] = origin
    if cookie:
        headers["Cookie"] = cookie
    if data is not None:
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(base + path, data=json.dumps(data).encode() if data is not None else None, headers=headers)
    try:
        response = urllib.request.urlopen(request, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    body = response.read()
    assert response.status == status, (path, response.status, body[:200])
    return response, json.loads(body) if response.headers.get_content_type() == "application/json" else body


try:
    call("/sources/private.pdf", status=404)
    assert b"Player companion" in call("/join")[1]
    call("/api/dm/status", status=403)
    _, opened = call("/api/dm/open", {}, dm_origin)
    code = opened["code"]
    assert len(code) == 8 and opened["url"].startswith("http://192.168.1.42:")
    snapshot = {"campaign": "test", "actionProtocol": 1, "characters": {"pc-pebble": {"id": "pc-pebble", "name": "Pebble", "hp": 20,
                    "abilities": {"str": {"score": 18, "modifier": 4}},
                    "skills": [{"name": "Athletics", "bonus": 6, "rank": 1}],
                    "attacks": [{"name": "Warhammer", "attackBonus": 6, "damageDice": "1d8+4"}],
                    "equipment": [{"name": "Shield", "quantity": 1}],
                    "resources": [{"name": "Second Wind", "current": 1, "max": 1}],
                    "notes": "DM ONLY: secret"},
                                                       "pc-trista": {"id": "pc-trista", "name": "Trista", "hp": 11,
                    "publicNotes": "Trista-only detail"}},
                "isMap": True, "fogged": True, "sceneTitle": "Phandalin", "private": "NEVER SEND",
                "privateClues": {"pc-trista": [{"id": "clue-below", "title": "Below token", "text": "Trista's secret",
                                                 "image": "town-maps/phandalin-overhead.svg", "saved": False}],
                                 "pc-pebble": [{"id": "clue-stone", "title": "Stone", "text": "Pebble's secret", "image": "", "saved": False}]},
                "inventory": [{"id": "loot-1", "name": "Healing potion", "quantity": 1, "holder": "pc-pebble", "note": "Shared"}],
                "initiative": {"open": True, "eligible": {"pc-pebble": True, "pc-trista": False},
                               "totals": {"pc-pebble": None, "pc-trista": None}, "bonuses": {"pc-pebble": 2, "pc-trista": 3}},
                "public": {"sessionName": "Test", "scene": "town-phandalin", "fog": ["0,0"],
                           "map": {"playerInput": True, "scenes": {"town-phandalin": {"fineFog": False,
                                     "points": [{"id": "barthen", "title": "Barthen's", "x": 60, "y": 40}]}}},
                           "tokens": [{"id": "pc-pebble", "team": "pc", "placed": True, "x": 20, "y": 30}],
                           "turn": {"round": 1, "activeId": "pc-pebble", "order": []},
                           "sceneMood": {"phase": "dusk", "weather": "rain"}, "rehearsal": False,
                           "presentation": {"sceneImage": "town-maps/phandalin-overhead.svg"}}}
    snapshot["continuity"] = {"journal": [{"id": "known", "title": "Known lead", "text": "Hamun Kost disappeared.", "kind": "completed", "when": "Sessions 2-3", "private": "HIDDEN SOURCE"}], "quests": [{"id": "redbrands", "title": "Redbrands", "state": "active", "goal": "Investigate", "events": [{"detail": "HIDDEN EVENT"}]}], "tracks": [{"kind": "escape", "subject": "Hamun Kost", "holder": "Unknown", "state": "open", "note": "Not fought", "private": "HIDDEN TRACK"}]}
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    _, options = call(f"/api/join-options?code={code}")
    assert len(options["characters"]) == 2
    joined, _ = call("/api/join", {"code": code, "id": "pc-pebble"}, base)
    cookie = joined.headers["Set-Cookie"].split(";", 1)[0]
    call("/api/join", {"code": code, "id": "pc-pebble"}, base, status=409)
    call("/api/join", {"code": code, "id": "pc-trista"}, base, cookie, status=409)
    _, state = call("/api/state", cookie=cookie)
    assert state["character"]["name"] == "Pebble" and "Trista" not in json.dumps(state)
    assert state["campaignJournal"][0]["text"] == "Hamun Kost disappeared."
    assert state["quests"][0]["state"] == "active"
    assert state["campaignTracks"][0]["subject"] == "Hamun Kost"
    assert "HIDDEN" not in json.dumps(state)
    assert state["character"]["abilities"]["str"]["score"] == 18
    assert state["character"]["skills"][0]["bonus"] == 6
    assert state["character"]["attacks"][0]["name"] == "Warhammer"
    assert state["character"]["equipment"][0]["name"] == "Shield"
    assert state["character"]["resources"][0]["current"] == 1
    assert "DM ONLY" not in json.dumps(state)
    assert "NEVER SEND" not in json.dumps(state)
    assert state["privateClues"][0]["title"] == "Stone" and "Trista's secret" not in json.dumps(state)
    assert state["inventory"][0]["holderName"] == "Pebble"
    assert state["sceneMood"]["weather"] == "rain" and state["rehearsal"] is False
    assert state["initiative"] == {"open": True, "total": None, "bonus": 2}
    call("/api/action", {"kind": "initiative", "mode": "roll"}, base, cookie)
    call("/api/action", {"kind": "initiative", "mode": "manual", "total": 15, "characterId": "pc-trista"}, base, cookie)
    call("/api/action", {"kind": "initiative", "mode": "manual", "total": "15"}, base, cookie, status=400)
    call("/api/private-image?id=clue-below", cookie=cookie, status=404)
    call("/api/action", {"kind": "save-clue", "clueId": "clue-below"}, base, cookie, status=403)
    call("/api/action", {"kind": "save-clue", "clueId": "clue-stone"}, base, cookie)
    action_request = {"kind": "action-request", "requestId": "request-test", "actionType": "attack", "actionIndex": 0, "actionName": "Warhammer", "targetIds": ["pc-pebble"], "note": "Practice target", "mode": "advantage"}
    first = call("/api/action", action_request, base, cookie)[1]
    assert call("/api/action", action_request, base, cookie)[1]["sequence"] == first["sequence"]
    call("/api/action", {**action_request, "requestId": "bad-target", "targetIds": ["hidden-enemy"]}, base, cookie, status=400)
    call("/api/action", {**action_request, "requestId": "bad-name", "actionName": "Fireball"}, base, cookie, status=409)
    call("/api/action", {"kind": "action-request", "actionType": "attack", "actionIndex": 100}, base, cookie, status=400)
    image, data = call("/api/map", cookie=cookie)
    assert image.headers.get_content_type() == "image/svg+xml" and b"<svg" in data[:500]
    call("/api/map", status=401)
    call("/api/action", {"kind": "move", "x": 42, "y": 50}, base, cookie)
    call("/api/action", {"kind": "explore", "pointId": "barthen"}, base, cookie)
    call("/api/action", {"kind": "roll", "count": 1, "sides": 20, "modifier": 2, "mode": "advantage", "label": "Perception"}, base, cookie)
    _, events = call("/api/dm/events", origin=dm_origin)
    assert [event["kind"] for event in events["events"]] == ["initiative", "initiative", "save-clue", "action-request", "move", "explore", "roll"]
    assert all(event["characterId"] == "pc-pebble" for event in events["events"])
    assert events["events"][3]["actionName"] == "Warhammer"
    assert events["events"][3]["entry"]["attackBonus"] == 6
    assert events["events"][3]["targetIds"] == ["pc-pebble"]
    snapshot["actionRequests"] = {"pc-pebble": [{"id": "request-test", "label": "Warhammer", "revision": 1, "status": "waiting", "targetIds": ["pc-pebble"], "targetNames": ["Pebble"], "resolution": {"patches": "HIDDEN PATCH"}, "rolls": [{"label": "Your attack", "total": 15, "ac": "HIDDEN AC"}], "history": [{"status": "waiting", "at": "today", "secret": "HIDDEN"}]}], "pc-trista": [{"id": "trista-request", "label": "Trista private request"}]}
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    own_requests = call("/api/state", cookie=cookie)[1]["actionRequests"]
    assert len(own_requests) == 1 and "HIDDEN" not in json.dumps(own_requests) and "Trista" not in json.dumps(own_requests)
    revision_request = {**action_request, "kind": "action-revise", "expectedRevision": 1, "note": "Revised intent"}
    call("/api/action", revision_request, base, cookie)
    call("/api/action", {**revision_request, "expectedRevision": 0}, base, cookie, status=409)
    call("/api/action", {"kind": "action-cancel", "requestId": "trista-request", "expectedRevision": 1}, base, cookie, status=409)
    call("/api/action", {**action_request, "requestId": "trista-request"}, base, cookie, status=409)
    snapshot["actionRequests"]["pc-pebble"][0].update(revision=2, status="needs clarification")
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    call("/api/action", {"kind": "action-cancel", "requestId": "request-test", "expectedRevision": 2}, base, cookie)
    snapshot["actionRequests"]["pc-pebble"][0]["status"] = "resolved"
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    call("/api/action", {"kind": "action-cancel", "requestId": "request-test", "expectedRevision": 2}, base, cookie, status=409)
    events = call("/api/dm/events", origin=dm_origin)[1]
    snapshot["combatProtocol"] = 1
    snapshot["combatPrompts"] = {"pc-pebble": {"saves": [{"id": "save-a", "label": "Burst", "ability": "dex", "mode": "advantage", "bonus": 2, "status": "waiting", "total": None, "revision": 1, "dc": "HIDDEN DC"}], "reactions": [{"id": "pause-a", "label": "Incoming attack", "status": "waiting", "note": "", "private": "HIDDEN"}]}, "pc-trista": {"saves": [{"id": "secret-save", "label": "Trista private save"}], "reactions": []}}
    snapshot["movementViews"] = {"pc-pebble": {"columns": 20, "feet": 5, "metric": "grid", "speed": 30, "used": 5, "areas": [{"kind": "square", "x1": 10, "y1": 10, "x2": 20, "y2": 20, "note": "HIDDEN terrain"}]}}
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    combat_state = call("/api/state", cookie=cookie)[1]
    assert "HIDDEN" not in json.dumps(combat_state) and "Trista private save" not in json.dumps(combat_state)
    assert combat_state["movement"]["speed"] == 30 and combat_state["combatProtocol"] == 1
    save_response = {"kind": "save-response", "batchId": "save-a", "expectedRevision": 1, "method": "digital", "characterId": "pc-trista"}
    first_save = call("/api/action", save_response, base, cookie)[1]
    assert call("/api/action", save_response, base, cookie)[1]["sequence"] == first_save["sequence"]
    call("/api/action", {**save_response, "batchId": "secret-save"}, base, cookie, status=409)
    call("/api/action", {**save_response, "method": "physical", "total": True}, base, cookie, status=400)
    snapshot["combatPrompts"]["pc-pebble"]["saves"][0]["revision"] = 2
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    call("/api/action", save_response, base, cookie, status=409)
    call("/api/action", {**save_response, "expectedRevision": 2, "method": "physical", "total": 18}, base, cookie)
    call("/api/action", {"kind": "reaction-response", "pauseId": "pause-a", "response": "request", "note": "Shield"}, base, cookie)
    call("/api/action", {"kind": "reaction-response", "pauseId": "secret-pause", "response": "pass"}, base, cookie, status=409)
    call("/api/action", {"kind": "move", "x": 25, "y": 30, "path": [{"x": 20, "y": 30}, {"x": 23, "y": 28}, {"x": 25, "y": 30}]}, base, cookie)
    call("/api/action", {"kind": "move", "x": 25, "y": 30, "path": [{"x": 20, "y": 30}, {"x": 999, "y": 28}]}, base, cookie, status=400)
    events = call("/api/dm/events", origin=dm_origin)[1]
    assert all(e["characterId"] == "pc-pebble" for e in events["events"])
    trista, _ = call("/api/join", {"code": code, "id": "pc-trista"}, base)
    trista_cookie = trista.headers["Set-Cookie"].split(";", 1)[0]
    _, trista_state = call("/api/state", cookie=trista_cookie)
    assert "Trista's secret" in json.dumps(trista_state) and "Pebble's secret" not in json.dumps(trista_state)
    assert trista_state["initiative"]["open"] is False
    call("/api/action", {"kind": "initiative", "mode": "roll"}, base, trista_cookie, status=409)
    private_image, private_data = call("/api/private-image?id=clue-below", cookie=trista_cookie)
    assert private_image.headers.get_content_type() == "image/svg+xml" and b"<svg" in private_data[:500]
    assert b"ECHO_CHARACTER_SUMMARY" in call("/character-summary.js")[1]
    snapshot["characters"]["pc-pebble"].update(spells=[{"name": "Test Spell", "level": 2, "prepared": True}],
        resources=[{"id": "slot-1", "name": "First", "slotLevel": 1, "current": 1, "max": 2}, {"id": "slot-2", "name": "Second", "slotLevel": 2, "current": 1, "max": 2}], favorites=["spell:Test Spell"])
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    assert call("/api/state", cookie=cookie)[1]["character"]["favorites"] == ["spell:Test Spell"]
    cast_request = {"kind": "action-request", "requestId": "cast-test", "actionType": "spell", "actionIndex": 0, "actionName": "Test Spell", "targetIds": ["pc-pebble"], "note": "Reviewed", "casting": {"mode": "slot", "resourceId": "slot-2", "notation": "999d100", "concentration": "keep"}}
    call("/api/action", {**cast_request, "casting": {"mode": "slot", "resourceId": "slot-1"}}, base, cookie, status=400)
    call("/api/action", {**cast_request, "casting": {"mode": "slot", "resourceId": "someone-elses-slot"}}, base, cookie, status=400)
    call("/api/action", {**cast_request, "note": "", "casting": {"mode": "ritual"}}, base, cookie, status=400)
    call("/api/action", cast_request, base, cookie)
    events = call("/api/dm/events", origin=dm_origin)[1]
    cast_event = next(e for e in events["events"] if e.get("requestId") == "cast-test")
    assert cast_event["casting"]["notation"] == "" and cast_event["casting"]["concentration"] == "auto"
    assert cast_event["casting"]["resourceId"] == "slot-2"
    snapshot["actionRequests"]["pc-pebble"] = [{"id": "cast-test", "label": "Test Spell", "status": "waiting", "casting": {**cast_event["casting"], "private": "HIDDEN"}}]
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    cast_view = call("/api/state", cookie=cookie)[1]
    assert cast_view["actionRequests"][0]["casting"]["resourceId"] == "slot-2" and "HIDDEN" not in json.dumps(cast_view)
    assert b"ECHO_PHONE_PLAYER_TOOLS" in call("/player-tools.js")[1]
    snapshot["playerToolsProtocol"] = 1
    roster = [{"id": "pc-pebble", "name": "Pebble"}, {"id": "pc-trista", "name": "Trista"}]
    snapshot["playerTools"] = {who: {"notes": [{"id": "note-"+who, "owner": who, "kind": "npc", "ref": "Sildar", "title": "Sildar", "text": "PERSONAL-"+who}], "sharedClues": [], "itemRequests": [], "bank": {"gp": 11}, "objective": {"text": "Find Gundren"}, "roster": roster} for who in ("pc-pebble", "pc-trista")}
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    player_view = call("/api/state", cookie=cookie)[1]
    assert player_view["playerTools"]["notes"][0]["text"] == "PERSONAL-pc-pebble"
    assert "PERSONAL-pc-trista" not in json.dumps(player_view)
    assert player_view["playerTools"]["objective"]["text"] == "Find Gundren"
    note = {"kind": "personal-note", "noteId": "new-note", "noteKind": "npc", "title": "Sildar", "ref": "Sildar", "text": "Personal theory", "characterId": "pc-trista"}
    call("/api/action", note, base, cookie)
    call("/api/action", {**note, "noteId": "note-pc-trista"}, base, cookie, status=403)
    call("/api/action", {**note, "noteKind": "clue", "ref": "clue-below"}, base, cookie, status=403)
    call("/api/action", {"kind": "share-clue", "clueId": "clue-below"}, base, cookie, status=403)
    stone = next(c for c in player_view["privateClues"] if c["id"] == "clue-stone")
    call("/api/action", {"kind": "share-clue", "clueId": "clue-stone", "version": "old"}, base, cookie, status=409)
    call("/api/action", {"kind": "share-clue", "clueId": "clue-stone", "version": stone["version"]}, base, cookie)
    assert call("/api/state", cookie=trista_cookie)[1]["playerTools"]["sharedClues"] == []
    call("/api/shared-image?id=clue-below", cookie=cookie, status=404)
    shared = {"id": "clue-below", "title": "Below token", "text": "Deliberately shared", "image": "town-maps/phandalin-overhead.svg", "sharedBy": "Trista"}
    for h in snapshot["playerTools"].values(): h["sharedClues"] = [shared]
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    assert call("/api/shared-image?id=clue-below", cookie=cookie)[0].headers.get_content_type() == "image/svg+xml"
    use = {"kind": "item-request", "requestId": "potion-request", "verb": "use", "source": "party", "itemId": "loot-1", "itemName": "Healing potion", "quantity": 1, "targetId": "pc-trista", "healing": 999, "characterId": "pc-trista"}
    call("/api/action", use, base, cookie)
    call("/api/action", use, base, cookie)  # retry is deduplicated
    call("/api/action", {**use, "requestId": "bad-quantity", "quantity": True}, base, cookie, status=400)
    call("/api/action", {**use, "requestId": "bad-holder"}, base, trista_cookie, status=403)
    call("/api/action", {**use, "requestId": "bad-target", "targetId": "dm-secret"}, base, cookie, status=400)
    split = {"kind": "item-request", "requestId": "split-request", "verb": "split", "coins": {"gp": 11}, "recipients": ["pc-pebble", "pc-trista"]}
    call("/api/action", split, base, cookie)
    call("/api/action", {**split, "requestId": "negative-split", "coins": {"gp": -1}}, base, cookie, status=400)
    call("/api/action", {"kind": "item-request", "requestId": "next-goal", "verb": "objective", "note": "Go to the hideout"}, base, cookie)
    snapshot["playerTools"]["pc-pebble"]["itemRequests"] = [{"id": "potion-request", "status": "waiting", "name": "Healing potion", "verb": "use"}]
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    call("/api/action", {"kind": "item-cancel", "requestId": "potion-request"}, base, trista_cookie, status=403)
    call("/api/action", {"kind": "item-cancel", "requestId": "potion-request"}, base, cookie)
    events = call("/api/dm/events", origin=dm_origin)[1]
    queued_use = [e for e in events["events"] if e.get("kind") == "item-request" and e.get("requestId") == "potion-request"]
    assert len(queued_use) == 1 and queued_use[0]["characterId"] == "pc-pebble" and "healing" not in queued_use[0]
    queued_share = next(e for e in events["events"] if e.get("kind") == "share-clue")
    assert queued_share["expectedClue"]["text"] == "Pebble's secret"
    # Dungeon requests must name a public searchable object or a described area.
    assert b"ECHO_PHONE_DUNGEON" in call("/dungeon.js")[1]
    snapshot["dungeonProtocol"] = 1
    snapshot["dungeon"] = {"enabled": True, "current": ["1,1"], "explored": ["1,1", "1,2"], "objects": [
        {"id": "chest", "title": "Chest", "kind": "container", "x": 20, "y": 20, "state": "unsearched", "canSearch": True, "note": "HIDDEN DC"},
        {"id": "remembered", "title": "Earlier room", "kind": "room", "canSearch": False},
        {"id": "secret", "title": "HIDDEN", "visible": False, "canSearch": True}], "passages": [{"id": "stairs", "title": "Stairs", "target": "HIDDEN FLOOR"}], "log": "HIDDEN ALERT"}
    snapshot["searchRequests"] = [{"id": "trista-search", "owner": "pc-trista", "status": "waiting", "result": "PRIVATE TRISTA"}]
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    dungeon_view = call("/api/state", cookie=cookie)[1]
    assert "HIDDEN" not in json.dumps(dungeon_view) and "PRIVATE TRISTA" not in json.dumps(dungeon_view)
    assert dungeon_view["dungeon"]["explored"] == ["1,1", "1,2"]
    search = {"kind": "search-request", "requestId": "pebble-search", "objectId": "chest", "approach": "Check the hinges", "characterId": "pc-trista", "result": "I found treasure"}
    call("/api/action", search, base, cookie)
    call("/api/action", {**search, "requestId": "bad-search", "objectId": "secret"}, base, cookie, status=400)
    call("/api/action", {**search, "requestId": "old-search", "objectId": "remembered"}, base, cookie, status=400)
    call("/api/action", {**search, "requestId": "blank-search", "objectId": "", "area": ""}, base, cookie, status=400)
    call("/api/action", {**search, "requestId": "area-search", "objectId": "", "area": "The north wall"}, base, cookie)
    call("/api/action", {"kind": "search-cancel", "requestId": "trista-search"}, base, cookie, status=409)
    snapshot["searchRequests"].append({"id": "pebble-search", "owner": "pc-pebble", "status": "approved", "result": "Roll Investigation"})
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    assert call("/api/state", cookie=cookie)[1]["searchRequests"][0]["result"] == "Roll Investigation"
    call("/api/action", {**search, "approach": "Use a mirror first"}, base, cookie)
    call("/api/action", {"kind": "search-cancel", "requestId": "pebble-search"}, base, cookie)
    search_events = call("/api/dm/events", origin=dm_origin)[1]["events"]
    assert all(e["characterId"] == "pc-pebble" and "result" not in e for e in search_events if e.get("kind") == "search-request")
    snapshot["searchRequests"][-1]["status"] = "resolved"
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    call("/api/action", search, base, cookie, status=409)
    # Travel requests: public places only, cookie ownership, revisions, and no instant travel.
    assert b"ECHO_PHONE_TRAVEL" in call("/travel.js")[1]
    snapshot["travelProtocol"] = 1
    snapshot["journey"] = {"position": {"title": "Phandalin", "dmNote": "HIDDEN"}, "places": [
        {"id": "region-phandalin", "title": "Phandalin", "status": "visited", "note": "HIDDEN"},
        {"id": "region-wyvern-tor", "title": "Wyvern Tor", "status": "cleared"},
        {"id": "rumor", "title": "Rumored ruin", "status": "rumored", "x": 88, "y": 99},
        {"id": "closed", "title": "Closed pass", "status": "located", "inaccessible": True},
        {"id": "secret-place", "title": "HIDDEN", "status": "hidden"}], "events": [{"text": "A merchant passed."}, {"text": "HIDDEN", "public": False}], "arrival": "HIDDEN"}
    snapshot["travelRequests"] = [{"id": "trista-travel", "owner": "pc-trista", "destination": "region-wyvern-tor", "status": "waiting", "note": "PERSONAL TRISTA"}]
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    travel_view = call("/api/state", cookie=cookie)[1]
    assert "HIDDEN" not in json.dumps(travel_view) and "PERSONAL TRISTA" not in json.dumps(travel_view)
    assert "x" not in next(p for p in travel_view["journey"]["places"] if p["id"] == "rumor")
    travel = {"kind": "travel-request", "requestId": "pebble-travel", "destination": "region-wyvern-tor", "note": "Check camp", "characterId": "pc-trista", "status": "approved"}
    call("/api/action", travel, base, cookie)
    for target in ("secret-place", "rumor", "closed"):
        call("/api/action", {**travel, "destination": target}, base, cookie, status=400)
    call("/api/action", {"kind": "travel-cancel", "requestId": "trista-travel"}, base, cookie, status=409)
    snapshot["travelRequests"].append({"id": "pebble-travel", "owner": "pc-pebble", "destination": "region-wyvern-tor", "status": "waiting"})
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    call("/api/action", {**travel, "note": "Revised"}, base, cookie)
    call("/api/action", {"kind": "travel-cancel", "requestId": "pebble-travel"}, base, cookie)
    events = call("/api/dm/events", origin=dm_origin)[1]
    queued_travel = [e for e in events["events"] if e.get("kind") == "travel-request"]
    assert len(queued_travel) == 2 and all(e["characterId"] == "pc-pebble" and "status" not in e for e in queued_travel)
    assert call("/api/state", cookie=cookie)[1]["journey"]["position"]["title"] == "Phandalin"
    snapshot["travelRequests"][-1]["status"] = "approved"
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    call("/api/action", travel, base, cookie, status=409)
    snapshot["public"]["rehearsal"] = True
    snapshot["public"]["publicRoll"] = {"label": "Practice roll", "parts": [14], "total": 14}
    call("/api/dm/state", {"snapshot": snapshot}, dm_origin)
    practice = call("/api/state", cookie=cookie)[1]
    assert practice["rehearsal"] is True and practice["roll"]["total"] == 14
    call("/api/action", {"kind": "roll", "count": 1, "sides": 20, "modifier": 0}, base, cookie, status=409)
    call("/api/dm/ack", {"sequence": events["events"][-1]["sequence"]}, dm_origin)
    assert call("/api/dm/events", origin=dm_origin)[1]["events"] == []
    qr, image = call("/api/dm/qr", origin=dm_origin)
    assert qr.headers.get_content_type() == "image/svg+xml" and b"<path" in image
    # Real last-seen and render acknowledgements; only one phone changes assignment.
    health = call("/api/dm/status", origin=dm_origin)[1]
    assert health["claims"][0]["lastSeen"] > 0
    view = call("/api/state", cookie=cookie)[1]
    call("/api/seen", {"revision": view["revision"], "characterId": "pc-pebble"}, base, cookie)
    assert next(c for c in call("/api/dm/status", origin=dm_origin)[1]["claims"] if c["id"]=="pc-pebble")["status"] == "current"
    call("/api/seen", {"revision": 999999, "characterId":"pc-pebble"}, base, cookie, status=400)
    call("/api/dm/phone", {"id":"pc-pebble","operation":"release"}, base, cookie, status=403)
    call("/api/dm/phone", {"id":"pc-pebble","operation":"resync"}, dm_origin)
    assert next(c for c in call("/api/dm/status", origin=dm_origin)[1]["claims"] if c["id"]=="pc-pebble")["status"] == "stale"
    # Free any other assignment for this test; the original phone cookie is reused.
    for c in call("/api/dm/status", origin=dm_origin)[1]["claims"]:
        if c["id"] != "pc-pebble": call("/api/dm/phone", {"id":c["id"],"operation":"release"}, dm_origin)
    call("/api/dm/phone", {"id":"pc-pebble","operation":"reassign","target":"pc-trista"}, dm_origin)
    assert call("/api/state", cookie=cookie)[1]["character"]["id"] == "pc-trista"
    call("/api/action", {"kind":"roll","expectedCharacterId":"pc-pebble","count":1,"sides":20},base,cookie,status=409)
    call("/api/seen", {"revision":view["revision"],"characterId":"pc-pebble"},base,cookie,status=409)
    other,_=call("/api/join",{"code":code,"id":"pc-pebble"},base)
    other_cookie=other.headers["Set-Cookie"].split(";",1)[0]
    call("/api/dm/phone", {"id":"pc-trista","operation":"release"}, dm_origin)
    call("/api/state",cookie=cookie,status=401)
    assert call("/api/state",cookie=other_cookie)[1]["character"]["id"]=="pc-pebble"
    call("/api/dm/reset", {}, dm_origin)
    call("/api/state", cookie=cookie, status=401)
    print("Phone service passed: QR join, private routes, one-character claim, initiative, map, rolls, target validation, canonical action data, owner-only status, deduplication, revisions, cancellations, stale/final request rejection, owner-only save/reaction prompts, physical/digital save events, bounded movement paths, private notes, explicit clue sharing, item ownership, request cancellation, coin-split validation, and shared images.")
finally:
    server.shutdown()
    server.server_close()
