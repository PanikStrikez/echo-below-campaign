"""Five HTTP phone clients: resync and rejoin one without disrupting four others."""
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
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f"http://127.0.0.1:{server.server_address[1]}"
dm_origin = "http://127.0.0.1:48261"


def call(route, data=None, origin=None, cookie=None, expected=200):
    headers = {"Content-Type": "application/json"} if data is not None else {}
    if origin:
        headers["Origin"] = origin
    if cookie:
        headers["Cookie"] = cookie
    request = urllib.request.Request(base + route, data=json.dumps(data).encode() if data is not None else None, headers=headers)
    try:
        response = urllib.request.urlopen(request, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    body = response.read()
    assert response.status == expected, (route, response.status, body[:200])
    return response, json.loads(body) if response.headers.get_content_type() == "application/json" else body


try:
    ids = [f"pc-{name}" for name in ("trista", "pebble", "donavan", "ringgo", "aldric")]
    _, opened = call("/api/dm/open", {}, dm_origin)
    snapshot = {"campaign":"stage4-practice", "characters":{id_:{"id":id_,"name":id_} for id_ in ids},
                "privateClues":{ids[0]:[{"id":"owner-only","title":"PRIVATE_TRISTA","text":"Owner only"}]},
                "public":{"sessionName":"Practice","scene":"road","map":{"scenes":{}},"tokens":[],"turn":{}}}
    call("/api/dm/state", {"snapshot":snapshot}, dm_origin)
    cookies = {}
    for id_ in ids:
        response, _ = call("/api/join", {"code":opened["code"],"id":id_}, base)
        cookies[id_] = response.headers["Set-Cookie"].split(";", 1)[0]
        _, view = call("/api/state", cookie=cookies[id_])
        assert view["character"]["id"] == id_
        if id_ != ids[0]:
            assert "PRIVATE_TRISTA" not in json.dumps(view)
        call("/api/seen", {"revision":view["revision"],"characterId":id_}, base, cookies[id_])
    _, before = call("/api/dm/status", origin=dm_origin)
    assert len(before["claims"]) == 5 and all(row["status"] == "current" for row in before["claims"])
    call("/api/dm/phone", {"id":ids[0],"operation":"resync"}, dm_origin)
    _, after = call("/api/dm/status", origin=dm_origin)
    assert after["revision"] == before["revision"]
    assert {row["id"] for row in after["claims"] if row["status"] == "current"} == set(ids[1:])
    _, refreshed = call("/api/state", cookie=cookies[ids[0]])
    assert refreshed["resyncRequest"] == 1
    call("/api/seen", {"revision":refreshed["revision"],"characterId":ids[0]}, base, cookies[ids[0]])
    call("/api/dm/phone", {"id":ids[0],"operation":"release"}, dm_origin)
    call("/api/state", cookie=cookies[ids[0]], expected=401)
    for id_ in ids[1:]:
        assert call("/api/state", cookie=cookies[id_])[1]["character"]["id"] == id_
    response, _ = call("/api/join", {"code":opened["code"],"id":ids[0]}, base)
    replacement = response.headers["Set-Cookie"].split(";", 1)[0]
    assert call("/api/state", cookie=replacement)[1]["character"]["id"] == ids[0]
    assert len(call("/api/dm/status", origin=dm_origin)[1]["claims"]) == 5
    print("Stage 4 five-phone service passed: owner-only data, isolated resync, release/rejoin, and four uninterrupted peers.")
finally:
    server.shutdown()
    server.server_close()
