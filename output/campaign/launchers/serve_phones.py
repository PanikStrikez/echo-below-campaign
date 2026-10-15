"""Player-only LAN service for The Echo Below. Campaign saves stay in the DM browser."""
from __future__ import annotations
import phone_health

def safe_receipt(raw):
    if not isinstance(raw, dict):
        return None
    status = raw.get('status')
    if status not in ('resolved', 'waiting', 'approved', 'unresolved', 'needs clarification', 'declined', 'cancelled', 'failed', 'undone'):
        return None
    result = {k: str(raw.get(k) or '')[:1600] for k in ('id', 'title')}
    result['status'] = status
    result['undo'] = 'ask-dm' if status == 'resolved' else 'unavailable'
    for key in ('committed', 'pending', 'details'):
        rows = raw.get(key)
        result[key] = [str(v)[:1600] for v in rows[:25] if isinstance(v, str)] if isinstance(rows, list) else []
    if status != 'resolved':
        result['committed'] = []
    return result

import base64
import hashlib
import ipaddress
import json
import math
import re
import secrets
import socket
import subprocess
import threading
import time
import xml.etree.ElementTree as ET
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlsplit
from qrcodegen import QrCode

def safe_dungeon(value):
    value = value if isinstance(value, dict) else {}
    tile_keys = lambda rows: list(dict.fromkeys(k for k in rows if isinstance(k, str) and re.fullmatch(r"[0-9]{1,2},[0-9]{1,2}", k)))[:640]
    return {"enabled": value.get("enabled") is True, "fine": value.get("fine") is True,
            "current": tile_keys(value.get("current", [])), "explored": tile_keys(value.get("explored", [])),
            "objects": [{k: o.get(k) for k in ("id", "title", "kind", "x", "y", "state", "text", "canSearch")} for o in value.get("objects", []) if isinstance(o, dict) and o.get("visible") is not False][:150],
            "passages": [{k: p.get(k) for k in ("id", "title", "x", "y")} for p in value.get("passages", []) if isinstance(p, dict) and p.get("visible") is not False][:60]}


def safe_journey(value):
    """Explicit phone projection; no DM arrival cards, exact rumor coordinates or private events."""
    value = value if isinstance(value, dict) else {}
    position = value.get("position")
    estimate = value.get("estimate")
    return {"position": {k: position.get(k) for k in ("title",)} if isinstance(position, dict) else None,
            "destination": str(value.get("destination") or "")[:160], "weather": str(value.get("weather") or "")[:30],
            "estimate": {k: estimate.get(k) for k in ("known", "miles", "minutes", "days")} if isinstance(estimate, dict) else None,
            "places": [{k: p.get(k) for k in ("id", "title", "status", "inaccessible", "reason")} for p in value.get("places", []) if isinstance(p, dict) and p.get("status") in ("rumored", "located", "visited", "cleared")][:100],
            "events": [{k: e.get(k) for k in ("at", "text")} for e in value.get("events", []) if isinstance(e, dict) and e.get("public") is not False][-20:]}


CAMPAIGN = Path(__file__).resolve().parents[1]
PHONE = CAMPAIGN / "phone"
PORT = 48262
DM_ORIGINS = {"http://127.0.0.1:48261", "http://localhost:48261"}
IMAGE_ROOTS = {"assets", "session-01-visuals", "session-02-visuals", "lmop-visuals", "lmop-battle-maps", "town-maps"}
IMAGE_TYPES = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml"}
PUBLIC_ATLAS_IMAGES = {f"atlas/art/{name}-Terrain.png" for name in
                       ("Sword-Coast", "north", "phandelver", "high-road", "waterdeep", "interior-east", "south")}
PUBLIC_ATLAS_IMAGES.update(f"atlas/tactical/{name}.svg" for name in
                          ("phandalin-town", "redbrand-hideout-full", "redbrand-crevasse", "cragmaw-hideout-full", "cragmaw-castle-full", "cragmaw-castle-east",
                           "thundertree-full", "thundertree-town", "thundertree-brown-horse", "thundertree-store", "thundertree-tower", "thundertree-garrison", "thundertree-cottage",
                           "wave-echo-south", "wave-echo-central", "wave-echo-north", "wave-echo-great-cavern", "wave-echo-smelter", "wave-echo-forge", "wave-echo-temple"))
PUBLIC_ATLAS_IMAGES.update(f"town-maps/professional/{name}-overhead.png" for name in ("phandalin", "conyberry", "thundertree"))
PUBLIC_ATLAS_IMAGES.add("town-maps/waterdeep-overhead.svg")
LOCK = threading.RLock()
TABLE = {"active": False, "code": "", "roster": [], "snapshot": {}, "revision": 0,
         "claims": {}, "events": [], "sequence": 0, "last_dm": 0.0, "qr_url": "", "qr_data": b""}


def atlas_raster(source):
    """Accept raster data only, never SVG, arbitrary URLs or a mislabeled text payload."""
    if not isinstance(source, str) or len(source) > 12_000_000:
        return None
    match = re.fullmatch(r"data:(image/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})", source)
    if not match:
        return None
    try:
        data = base64.b64decode(match.group(2), validate=True)
    except ValueError:
        return None
    kind = match.group(1)
    valid = (kind == "image/png" and data.startswith(b"\x89PNG\r\n\x1a\n") or
             kind == "image/jpeg" and data.startswith(b"\xff\xd8\xff") or
             kind == "image/webp" and data.startswith(b"RIFF") and data[8:12] == b"WEBP")
    return (data, kind) if valid and len(data) <= 8_000_000 else None


def inert_atlas_svg(data, labels=False):
    """Approved local floor plans may contain geometry only, without active or referenced content."""
    if b"<!" in data or len(data) > 2_000_000:
        return False
    try:
        tree = ET.fromstring(data)
    except ET.ParseError:
        return False
    tags = {"svg", "defs", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon", "pattern", "linearGradient", "radialGradient", "stop"}
    if labels:
        tags.update(("text", "clipPath", "filter", "feColorMatrix", "feComponentTransfer", "feDropShadow", "feFuncA", "feTurbulence"))
    tags = {"{http://www.w3.org/2000/svg}" + tag for tag in tags}
    for element in tree.iter():
        if element.tag not in tags or ((element.text or "").strip() and not (labels and element.tag == "{http://www.w3.org/2000/svg}text")) or (element.tail or "").strip():
            return False
        for key, value in element.attrib.items():
            if key.lower().startswith("on") or key in ("style", "href") or "}" in key:
                return False
            if re.search(r"url\(", value, re.I) and not re.fullmatch(r"url\(#[A-Za-z0-9_-]+\)", value):
                return False
    return tree.tag == "{http://www.w3.org/2000/svg}svg"


def safe_atlas(value):
    """Whitelist an already projected view. Never forward definitions, sources or private metadata."""
    if not isinstance(value, dict) or type(value.get("schemaVersion")) is not int or value.get("schemaVersion") != 1 or not isinstance(value.get("board"), dict):
        return None
    board = value["board"]
    source = board.get("image")
    if not isinstance(source, str) or source not in PUBLIC_ATLAS_IMAGES and not atlas_raster(source):
        return None
    rows = lambda v: v if isinstance(v, list) else []
    txt = lambda v, n=1200: v[:n] if isinstance(v, str) else ""

    def number(v, fallback=0, minimum=-1_000_000, maximum=1_000_000):
        return max(minimum, min(maximum, v)) if type(v) in (int, float) and math.isfinite(v) else fallback

    def point(v):
        if not isinstance(v, dict) or any(type(v.get(k)) not in (int, float) or not math.isfinite(v[k]) for k in ("x", "y")):
            return None
        return {"x": number(v["x"]), "y": number(v["y"])}

    box = board.get("viewBox")
    if not isinstance(box, list) or len(box) != 4 or any(type(v) not in (int, float) or not math.isfinite(v) for v in box) or box[2] <= 0 or box[3] <= 0:
        box = [0, 0, 100, 100]
    else:
        box = [number(box[0]), number(box[1]), number(box[2], 100, .01), number(box[3], 100, .01)]
    places, rumors, seen, rumor_titles = [], [], set(), set()

    def rumor(title):
        title = txt(title, 200)
        if title and title not in rumor_titles:
            rumor_titles.add(title)
            rumors.append({"title": title, "status": "rumored"})

    for row in rows(value.get("places"))[:1000]:
        if not isinstance(row, dict):
            continue
        if row.get("status") == "rumored":
            rumor(row.get("title"))
            continue
        id_ = txt(row.get("id"), 160)
        if row.get("status") not in ("located", "visited", "cleared") or not id_ or id_ in seen:
            continue
        seen.add(id_)
        p = {"id": id_, "travelId": txt(row.get("travelId"), 160), "title": txt(row.get("title"), 200),
             "status": row["status"], "inaccessible": row.get("inaccessible") is True, "reason": txt(row.get("reason"), 240)}
        position = point(row)
        if position:
            p.update(position)
        label = point({"x": row.get("labelX"), "y": row.get("labelY")})
        if label:
            p.update(labelX=label["x"], labelY=label["y"])
        if type(row.get("fontSize")) in (int, float) and math.isfinite(row["fontSize"]):
            p["fontSize"] = number(row["fontSize"], box[2] * .0065, box[2] * .003, box[2] * .04)
        if row.get("description"):
            p["description"] = txt(row["description"], 4000)
        places.append(p)
    for row in rows(value.get("rumors"))[:1000]:
        if isinstance(row, dict) and row.get("status") == "rumored":
            rumor(row.get("title"))
    pinned = {p["id"] for p in places if point(p)}
    routes = []
    for row in rows(value.get("routes"))[:1000]:
        if not isinstance(row, dict) or not isinstance(row.get("from"), str) or not isinstance(row.get("to"), str) or row.get("from") not in pinned or row.get("to") not in pinned or row.get("public") is False or row.get("hidden") is True:
            continue
        points = [p for p in (point(p) for p in rows(row.get("points"))[:200]) if p]
        if len(points) > 1:
            routes.append({"id": txt(row.get("id"), 160), "from": txt(row.get("from"), 160), "to": txt(row.get("to"), 160),
                           "kind": row["kind"] if row.get("kind") in ("planned", "traveled") else "route", "points": points})
    position = None
    raw_position = value.get("position")
    if isinstance(raw_position, dict) and any(raw_position.get(key) is not None for key in ("from", "to", "fraction")):
        from_, to, fraction = raw_position.get("from"), raw_position.get("to"), raw_position.get("fraction")
        start = next((p for p in places if p["id"] == from_ and point(p)), None)
        end = next((p for p in places if p["id"] == to and point(p)), None)
        linked = any(r["from"] == from_ and r["to"] == to or r["from"] == to and r["to"] == from_ for r in routes)
        if start and end and from_ != to and linked and type(fraction) in (int, float) and math.isfinite(fraction) and 0 <= fraction <= 1:
            position = {"from": from_, "to": to, "fraction": fraction, "x": start["x"] + (end["x"] - start["x"]) * fraction,
                        "y": start["y"] + (end["y"] - start["y"]) * fraction, "title": "On the road"}
    else:
        point_position = point(raw_position)
        located = next((p for p in places if point_position and p.get("x") == point_position["x"] and p.get("y") == point_position["y"]), None)
        if located:
            position = {**point_position, "title": located["title"]}
    features = []
    for row in rows(value.get("features"))[:200]:
        if not isinstance(row, dict) or row.get("public") is not True or row.get("sourceApproved") is not True or row.get("kind") not in ("terrain", "road", "water"):
            continue
        points = [p for p in (point(p) for p in rows(row.get("points"))[:200]) if p]
        if not points:
            continue
        feature = {"id": txt(row.get("id"), 160), "kind": row["kind"], "title": txt(row.get("title"), 200), "points": points,
                   "closed": row.get("closed") is True, "public": True, "sourceApproved": True}
        label = point({"x": row.get("labelX"), "y": row.get("labelY")})
        if label:
            feature.update(labelX=label["x"], labelY=label["y"])
        if type(row.get("fontSize")) in (int, float) and math.isfinite(row["fontSize"]):
            feature["fontSize"] = number(row["fontSize"], box[2] * .0058, box[2] * .003, box[2] * .04)
        features.append(feature)
    view = value.get("view") if isinstance(value.get("view"), dict) else {}
    return {"schemaVersion": 1, "board": {"id": txt(board.get("id"), 160), "title": txt(board.get("title"), 200),
            "kind": txt(board.get("kind"), 80), "image": source, "viewBox": box},
            "view": {"zoom": number(view.get("zoom"), 1, .75, 8), "panX": number(view.get("panX"), 0, -150, 150), "panY": number(view.get("panY"), 0, -150, 150)},
            "places": places, "rumors": rumors, "routes": routes, "features": features,
            "position": position}


def snapshot_atlas(snapshot):
    # An explicit null withdraws the old view; it must not fall back to a stale duplicate.
    raw = snapshot.get("atlas") if "atlas" in snapshot else (snapshot.get("public") or {}).get("atlas")
    return safe_atlas(raw)


def atlas_bytes(snapshot):
    atlas = snapshot_atlas(snapshot)
    if not atlas:
        return None
    source = atlas["board"]["image"]
    raster = atlas_raster(source)
    if raster:
        return raster
    return atlas_file_bytes(source) or atlas_raster(snapshot.get("atlasImage"))


def atlas_file_bytes(source):
    if source not in PUBLIC_ATLAS_IMAGES:
        return None
    allowed_root = CAMPAIGN.resolve() / Path(source).parent
    target = (CAMPAIGN / source).resolve()
    # Exact approved filename plus resolved-root check prevents private paths and symlink escapes.
    try:
        if target.is_relative_to(allowed_root) and target.is_file() and target.stat().st_size <= 16_000_000:
            data = target.read_bytes()
            if data.startswith(b"\x89PNG\r\n\x1a\n"):
                return data, "image/png"
            if target.suffix == ".svg" and inert_atlas_svg(data, labels=source == "town-maps/waterdeep-overhead.svg"):
                return data, "image/svg+xml"
    except OSError:
        pass
    return None


def lan_address() -> str:
    candidates = []
    for interface in ("en0", "en1"):
        try:
            result = subprocess.run(["/usr/sbin/ipconfig", "getifaddr", interface], capture_output=True,
                                    text=True, timeout=2, check=False)
            candidates.append(result.stdout.strip())
        except (OSError, subprocess.TimeoutExpired):
            pass
    try:
        result = subprocess.run(["/sbin/ifconfig"], capture_output=True, text=True, timeout=2, check=False)
        candidates += re.findall(r"\binet (\d+\.\d+\.\d+\.\d+)\b", result.stdout)
    except (OSError, subprocess.TimeoutExpired):
        pass
    try:
        candidates += [item[4][0] for item in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)]
    except OSError:
        pass
    for value in candidates:
        try:
            address = ipaddress.ip_address(value)
        except ValueError:
            continue
        if address.is_private and not address.is_loopback and not address.is_link_local:
            return value
    return ""


def join_url() -> str:
    address = lan_address()
    return f"http://{address}:{PORT}/join?code={TABLE['code']}" if address else ""


def qr_svg(value: str) -> bytes:
    symbol = QrCode.encode_text(value, QrCode.Ecc.MEDIUM)
    border = 4
    size = symbol.get_size() + border * 2
    squares = "".join(f'<path d="M{x + border},{y + border}h1v1h-1z"/>'
                      for y in range(symbol.get_size()) for x in range(symbol.get_size()) if symbol.get_module(x, y))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" shape-rendering="crispEdges">'
            f'<rect width="{size}" height="{size}" fill="white"/><g fill="black">{squares}</g></svg>').encode("ascii")


def phone_cookie(header: str) -> str:
    try:
        cookie = SimpleCookie(); cookie.load(header or "")
        return cookie["echo_phone"].value if "echo_phone" in cookie else ""
    except Exception:
        return ""


def map_bytes(snapshot: dict) -> tuple[bytes, str] | None:
    public = snapshot.get("public") or {}
    if not snapshot.get("isMap"):
        return None
    source = ((public.get("presentation") or {}).get("sceneImage") or "")
    if not isinstance(source, str):
        return None
    if source.startswith("data:"):
        return atlas_raster(source)
    return private_image_bytes(source)


def private_image_bytes(source: str) -> tuple[bytes, str] | None:
    if not isinstance(source, str) or not re.fullmatch(r"[A-Za-z0-9/_-]+\.(?:png|jpg|jpeg|webp|svg)", source):
        return None
    path = Path(source)
    if path.parts[0] not in IMAGE_ROOTS or path.suffix.lower() not in IMAGE_TYPES:
        return None
    try:
        target = (CAMPAIGN / path).resolve()
        allowed_root = CAMPAIGN.resolve() / path.parts[0]
        # A public image alias must not resolve to a private map or another root.
        if not target.is_relative_to(allowed_root) or not target.is_file() or target.stat().st_size > 16_000_000:
            return None
        return target.read_bytes(), IMAGE_TYPES[path.suffix.lower()]
    except OSError:
        return None


class Handler(BaseHTTPRequestHandler):
    server_version = "EchoPhones/1"

    def log_message(self, format_string, *args):
        # Join codes and phone cookies never go into the local log.
        return

    def headers_common(self, content_type: str, length: int, status: int = 200, extra: dict | None = None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(length))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'")
        if self.is_dm():
            self.send_header("Access-Control-Allow-Origin", self.headers.get("Origin"))
            self.send_header("Vary", "Origin")
        for key, value in (extra or {}).items():
            self.send_header(key, value)
        self.end_headers()

    def json(self, value: dict, status: int = 200, extra: dict | None = None):
        data = json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        self.headers_common("application/json; charset=utf-8", len(data), status, extra)
        self.wfile.write(data)

    def error(self, message: str, status: int = 400):
        self.json({"error": message}, status)

    def is_dm(self) -> bool:
        try:
            return ipaddress.ip_address(self.client_address[0]).is_loopback and self.headers.get("Origin") in DM_ORIGINS
        except ValueError:
            return False

    def is_phone_origin(self) -> bool:
        origin = self.headers.get("Origin", "")
        return origin == f"http://{self.headers.get('Host', '')}" and not origin.endswith(":48261")

    def phone_id(self) -> str:
        token = phone_cookie(self.headers.get("Cookie", ""))
        with LOCK:
            return TABLE["claims"].get(token, "") if TABLE["active"] else ""

    def body(self) -> dict | None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 12_000_000 or self.headers.get("Content-Type", "").split(";")[0] != "application/json":
                return None
            value = json.loads(self.rfile.read(length))
            return value if isinstance(value, dict) else None
        except (ValueError, json.JSONDecodeError):
            return None

    def do_OPTIONS(self):
        if not self.path.startswith("/api/dm/") or not self.is_dm():
            return self.error("Unavailable", 403)
        self.headers_common("text/plain", 0, 204, {"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                                                     "Access-Control-Allow-Headers": "Content-Type"})

    def do_GET(self):
        route = urlsplit(self.path)
        if route.path == "/__echo_phone_health":
            return self.json({"service": "echo-phones"})
        if route.path == "/atlas-view.js":
            data = (CAMPAIGN / "Campaign-Atlas-View.js").read_bytes()
            self.headers_common("application/javascript; charset=utf-8", len(data))
            self.wfile.write(data)
            return
        if route.path in ("/join", "/phone.js", "/phone.css", "/character-summary.js", "/player-tools.js", "/travel.js", "/dungeon.js"):
            name = {"/join": "index.html", "/phone.js": "phone.js", "/phone.css": "phone.css", "/character-summary.js": "character-summary.js", "/player-tools.js": "player-tools.js", "/travel.js": "travel.js", "/dungeon.js": "dungeon.js"}[route.path]
            content_type = {"index.html": "text/html; charset=utf-8", "phone.js": "application/javascript; charset=utf-8", "phone.css": "text/css; charset=utf-8", "character-summary.js": "application/javascript; charset=utf-8", "player-tools.js": "application/javascript; charset=utf-8", "travel.js": "application/javascript; charset=utf-8", "dungeon.js": "application/javascript; charset=utf-8"}[name]
            data = (PHONE / name).read_bytes()
            self.headers_common(content_type, len(data)); self.wfile.write(data); return
        if route.path.startswith("/api/dm/"):
            if not self.is_dm():
                return self.error("DM screen only", 403)
            with LOCK:
                if route.path == "/api/dm/status":
                    return self.json({"active": TABLE["active"], "url": join_url() if TABLE["active"] else "",
                                      "code": TABLE["code"] if TABLE["active"] else "",
                                      "claims": phone_health.claims(TABLE), "roster": TABLE["roster"], "revision": TABLE["revision"]})
                if route.path == "/api/dm/events":
                    return self.json({"events": TABLE["events"][:50]})
                if route.path == "/api/dm/qr":
                    if not TABLE["active"] or not join_url():
                        return self.error("No join link", 404)
                    url = join_url()
                    if TABLE["qr_url"] != url:
                        TABLE["qr_data"] = qr_svg(url)
                        TABLE["qr_url"] = url
                    data = TABLE["qr_data"]
                    self.headers_common("image/svg+xml", len(data)); self.wfile.write(data); return
            return self.error("Unknown DM action", 404)
        if route.path == "/api/join-options":
            code = parse_qs(route.query).get("code", [""])[0]
            with LOCK:
                if not TABLE["active"] or time.time() - TABLE["last_dm"] > 30 or not secrets.compare_digest(code, TABLE["code"]):
                    return self.error("This join link has expired. Ask the DM for a new one.", 403)
                claimed = set(TABLE["claims"].values())
                return self.json({"characters": [{**p, "claimed": p["id"] in claimed} for p in TABLE["roster"]]})
        if route.path in ("/api/state", "/api/map", "/api/atlas-map", "/api/private-image", "/api/shared-image"):
            id_ = self.phone_id()
            if not id_:
                return self.error("Join the table again.", 401)
            with LOCK:
                phone_health.seen(TABLE, id_)
                snapshot = TABLE["snapshot"]
                if time.time() - TABLE["last_dm"] > 30:
                    return self.error("Waiting for the DM screen to reconnect.", 503)
                public = snapshot.get("public") or {}
                if route.path == "/api/atlas-map":
                    result = atlas_bytes(snapshot)
                    if not result:
                        return self.error("No approved atlas map is shared.", 404)
                    data, content_type = result
                    self.headers_common(content_type, len(data)); self.wfile.write(data); return
                if route.path == "/api/map":
                    result = map_bytes(snapshot)
                    if not result:
                        return self.error("No map is showing.", 404)
                    data, content_type = result
                    self.headers_common(content_type, len(data)); self.wfile.write(data); return
                if route.path in ("/api/private-image", "/api/shared-image"):
                    clue_id = parse_qs(route.query).get("id", [""])[0]
                    available = ((snapshot.get("playerTools") or {}).get(id_, {}).get("sharedClues") or []) if route.path == "/api/shared-image" else (snapshot.get("privateClues") or {}).get(id_, [])
                    clue = next((item for item in available
                                 if isinstance(item, dict) and item.get("id") == clue_id), None)
                    result = private_image_bytes(clue.get("image", "")) if clue else None
                    if not result:
                        return self.error("Private image unavailable", 404)
                    data, content_type = result
                    self.headers_common(content_type, len(data)); self.wfile.write(data); return
                character = (snapshot.get("characters") or {}).get(id_)
                if not character:
                    return self.error("Character unavailable. Ask the DM to reconnect phones.", 409)
                character = {key: character.get(key) for key in (
                    "id", "name", "player", "className", "ancestry", "background", "level", "rules",
                    "proficiency", "speed", "senses", "languages", "hp", "maxHp", "ac", "tempHp", "hitDice",
                    "abilities", "saves", "skills", "passives", "attacks", "actions", "spells", "resources",
                    "equipment", "money", "features", "inspiration", "death", "exhaustion", "conditions",
                    "concentration", "effects", "publicNotes", "favorites")}
                scene = public.get("scene", "")
                map_data = ((public.get("map") or {}).get("scenes") or {}).get(scene) or {}
                image_source = ((public.get("presentation") or {}).get("sceneImage") or "")
                image_version = hashlib.sha256(image_source.encode("utf-8")).hexdigest()[:12] if isinstance(image_source, str) else ""
                atlas = snapshot_atlas(snapshot)
                atlas_source = atlas["board"]["image"] if atlas else ""
                atlas_version = hashlib.sha256(atlas_source.encode("utf-8")).hexdigest()[:12] if atlas else ""
                hub = (snapshot.get("playerTools") or {}).get(id_, {})
                safe_hub = {
                    "notes": [{key: n.get(key) for key in ("id", "kind", "ref", "title", "text", "at")} for n in hub.get("notes", []) if isinstance(n, dict) and n.get("owner") == id_],
                    "sharedClues": [{key: c.get(key) for key in ("id", "title", "text", "at", "sharedBy")} | {"image": f"/api/shared-image?id={quote(str(c.get('id') or ''), safe='')}" if c.get("image") else ""} for c in hub.get("sharedClues", []) if isinstance(c, dict)],
                    "itemRequests": [{key: r.get(key) for key in ("id", "verb", "name", "status", "message", "note")} | {"receipt": safe_receipt(r.get("receipt"))} for r in hub.get("itemRequests", []) if isinstance(r, dict)],
                    "bank": {k: (hub.get("bank") or {}).get(k, 0) for k in ("cp", "sp", "ep", "gp", "pp")},
                    "objective": {k: (hub.get("objective") or {}).get(k, "") for k in ("text", "at")},
                    "roster": [{"id": r.get("id"), "name": r.get("name")} for r in hub.get("roster", []) if isinstance(r, dict)]}
                result = {"revision": TABLE["revision"], "resyncRequest": TABLE.get("phone_health", {}).get(id_, {}).get("resync", 0), "session": public.get("sessionName", ""),
                          "character": character, "dungeonProtocol": snapshot.get("dungeonProtocol", 0), "dungeon": safe_dungeon(snapshot.get("dungeon")),
                          "searchRequests": [{k: req.get(k) for k in ("id", "scene", "objectId", "title", "area", "approach", "status", "result")} for req in snapshot.get("searchRequests", []) if isinstance(req, dict) and req.get("owner") == id_][-40:], "travelProtocol": snapshot.get("travelProtocol", 0),
                          "journey": safe_journey(snapshot.get("journey")),
                          "atlas": atlas, "atlasImage": f"/api/atlas-map?v={atlas_version}" if atlas else "",
                          "travelRequests": [{k: req.get(k) for k in ("id", "destination", "note", "status", "message")} for req in snapshot.get("travelRequests", []) if isinstance(req, dict) and req.get("owner") == id_][-30:], "playerToolsProtocol": snapshot.get("playerToolsProtocol", 0), "playerTools": safe_hub, "actionProtocol": snapshot.get("actionProtocol", 0), "combatProtocol": snapshot.get("combatProtocol", 0),
                          "combatPrompts": {"saves": [{key: item.get(key) for key in ("id", "label", "ability", "mode", "bonus", "status", "total", "parts", "revision")} for item in ((snapshot.get("combatPrompts") or {}).get(id_, {}).get("saves") or [])[:60]],
                                            "reactions": [{key: item.get(key) for key in ("id", "label", "status", "note")} for item in ((snapshot.get("combatPrompts") or {}).get(id_, {}).get("reactions") or [])[:60]]},
                          "movement": {key: (snapshot.get("movementViews") or {}).get(id_, {}).get(key) for key in ("columns", "feet", "metric", "speed", "used", "crawling")} | {"areas": [{key: item.get(key) for key in ("kind", "x1", "y1", "x2", "y2")} for item in ((snapshot.get("movementViews") or {}).get(id_, {}).get("areas") or [])[:100]]}, "scene": scene, "sceneTitle": snapshot.get("sceneTitle", ""),
                          "isMap": snapshot.get("isMap") is True, "mapImage": f"/api/map?v={image_version}" if snapshot.get("isMap") else "",
                          "playerInput": (public.get("map") or {}).get("playerInput") is not False,
                          "fog": public.get("fog") or [], "fogged": snapshot.get("fogged") is True,
                          "fineFog": map_data.get("fineFog") is True,
                          "points": [{key: point.get(key) for key in ("id", "x", "y", "title")}
                                     for point in (map_data.get("points") or [])[:100]],
                          "tokens": [{key: token.get(key) for key in ("id", "name", "label", "team", "x", "y")}
                                     for token in (public.get("tokens") or [])[:250]],
                          "turn": {key: (public.get("turn") or {}).get(key) for key in ("round", "activeId")},
                          "roll": ({"id": "practice-roll", **(public.get("publicRoll") or {})} if public.get("rehearsal") is True
                                   else (snapshot.get("rollResults") or {}).get(id_)),
                          "requests": snapshot.get("requestStatus", {}).get(id_, ""),
                          "receipts": [r for item in (snapshot.get("receipts") or {}).get(id_, [])[-60:] if (r := safe_receipt(item))],
                          "actionRequests": [{**{key: item.get(key) for key in ("id", "label", "status", "message", "revision", "actionType", "actionIndex", "targetIds", "targetNames", "note", "mode", "result")},
                                              "receipt": safe_receipt(item.get("receipt")),
                                              "casting": ({key: item["casting"].get(key) for key in ("mode", "resourceId", "effect", "notation", "concentration")} if isinstance(item.get("casting"), dict) else None),
                                              "history": [{key: h.get(key) for key in ("status", "at")} for h in (item.get("history") or [])[-25:] if isinstance(h, dict)],
                                              "rolls": [{key: r.get(key) for key in ("id", "label", "notation", "parts", "total")} for r in (item.get("rolls") or [])[:100] if isinstance(r, dict)]}
                                             for item in (snapshot.get("actionRequests") or {}).get(id_, [])[-40:] if isinstance(item, dict)],
                          "privateClues": [{key: item.get(key) for key in ("id", "title", "text", "saved", "at")}
                                           | {"image": f"/api/private-image?id={quote(str(item.get('id') or ''), safe='')}" if item.get("image") else "",
                                              "version": hashlib.sha256(json.dumps({k: item.get(k, "") for k in ("title", "text", "image")}, sort_keys=True).encode()).hexdigest()}
                                           for item in (snapshot.get("privateClues") or {}).get(id_, [])[:150]
                                           if isinstance(item, dict)],
                          "inventory": [{**item, "holderName": next((person["name"] for person in TABLE["roster"]
                                                                      if person["id"] == item.get("holder")), "Party")}
                                        for item in (snapshot.get("inventory") or [])[:150] if isinstance(item, dict)],
                          "sceneMood": public.get("sceneMood") or {},
                          "campaignJournal": [{key: item.get(key) for key in ("id", "title", "text", "kind", "when")}
                                              for item in ((snapshot.get("continuity") or {}).get("journal") or [])[-200:] if isinstance(item, dict)],
                          "quests": [{key: item.get(key) for key in ("id", "title", "state", "goal")}
                                     for item in ((snapshot.get("continuity") or {}).get("quests") or [])[:100] if isinstance(item, dict)],
                          "campaignTracks": [{key: item.get(key) for key in ("kind", "subject", "holder", "owedTo", "state", "note")}
                                             for item in ((snapshot.get("continuity") or {}).get("tracks") or [])[:150] if isinstance(item, dict)],
                          "initiative": {"open": (snapshot.get("initiative") or {}).get("open") is True and
                                         (snapshot.get("initiative") or {}).get("eligible", {}).get(id_) is True,
                                         "total": (snapshot.get("initiative") or {}).get("totals", {}).get(id_),
                                         "bonus": (snapshot.get("initiative") or {}).get("bonuses", {}).get(id_)},
                          "rehearsal": public.get("rehearsal") is True}
                return self.json(result)
        return self.error("Not found", 404)

    def do_POST(self):
        route = urlsplit(self.path).path
        data = self.body()
        if data is None:
            return self.error("Invalid request", 400)
        if route.startswith("/api/dm/"):
            if not self.is_dm():
                return self.error("DM screen only", 403)
            with LOCK:
                if route == "/api/dm/open":
                    if not TABLE["active"]:
                        TABLE.update(active=True, code=f"{secrets.randbelow(100_000_000):08d}", claims={}, phone_health={}, events=[], sequence=0,
                                     qr_url="", qr_data=b"", snapshot={}, revision=0)
                    TABLE["last_dm"] = time.time()
                    return self.json({"active": True, "url": join_url(), "code": TABLE["code"]})
                if route == "/api/dm/close":
                    TABLE.update(active=False, code="", claims={}, phone_health={}, events=[], snapshot={}, qr_url="", qr_data=b"")
                    return self.json({"active": False})
                if route == "/api/dm/reset":
                    TABLE.update(active=True, code=f"{secrets.randbelow(100_000_000):08d}", claims={}, phone_health={}, events=[], sequence=0,
                                 qr_url="", qr_data=b"", snapshot={}, revision=0)
                    return self.json({"active": True, "url": join_url(), "code": TABLE["code"]})
                if route == "/api/dm/state":
                    if not TABLE["active"] or not isinstance(data.get("snapshot"), dict):
                        return self.error("Phone table is closed", 409)
                    snapshot = data["snapshot"]
                    if not isinstance(snapshot.get("characters"), dict) or not isinstance(snapshot.get("public"), dict):
                        return self.error("Invalid player state", 400)
                    if TABLE["snapshot"] and snapshot.get("campaign") != TABLE["snapshot"].get("campaign"):
                        TABLE.update(code=f"{secrets.randbelow(100_000_000):08d}", claims={}, phone_health={}, events=[], sequence=0,
                                     qr_url="", qr_data=b"")
                    TABLE["snapshot"] = snapshot
                    TABLE["roster"] = [{"id": id_, "name": str(card.get("name") or id_)[:80]}
                                       for id_, card in snapshot["characters"].items()
                                       if re.fullmatch(r"pc-[A-Za-z0-9_-]{1,75}", id_) and isinstance(card, dict)][:12]
                    allowed = {p["id"] for p in TABLE["roster"]}
                    TABLE["claims"] = {token: id_ for token, id_ in TABLE["claims"].items() if id_ in allowed}
                    TABLE["revision"] += 1
                    TABLE["last_dm"] = time.time()
                    return self.json({"revision": TABLE["revision"]})
                if route == "/api/dm/phone":
                    try:
                        phone_health.manage(TABLE, data.get("id"), data.get("operation"), data.get("target"))
                    except ValueError as error:
                        return self.error(str(error), 409)
                    return self.json({"ok": True})
                if route == "/api/dm/ack":
                    sequence = data.get("sequence")
                    if not isinstance(sequence, int):
                        return self.error("Invalid event", 400)
                    TABLE["events"] = [event for event in TABLE["events"] if event["sequence"] > sequence]
                    return self.json({"ok": True})
            return self.error("Unknown DM action", 404)
        if route == "/api/join":
            if not self.is_phone_origin():
                return self.error("Open the join page first", 403)
            code, id_ = str(data.get("code") or ""), str(data.get("id") or "")
            with LOCK:
                if not TABLE["active"] or time.time() - TABLE["last_dm"] > 30 or not secrets.compare_digest(code, TABLE["code"]):
                    return self.error("Join code expired", 403)
                if id_ not in {p["id"] for p in TABLE["roster"]}:
                    return self.error("Choose a listed character", 400)
                existing = self.phone_id()
                if existing and existing != id_:
                    return self.error("This phone already has a character. Ask the DM to release or reassign this phone.", 409)
                if id_ in TABLE["claims"].values() and existing != id_:
                    return self.error("That character is already on a phone. Ask the DM to release or reassign this phone.", 409)
                if existing == id_:
                    return self.json({"joined": id_})
                token = secrets.token_urlsafe(32)
                TABLE["claims"][token] = id_
                return self.json({"joined": id_}, extra={"Set-Cookie": f"echo_phone={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200"})
        if route == "/api/seen":
            if not self.is_phone_origin():
                return self.error("Open the player app first", 403)
            with LOCK:
                id_ = self.phone_id()
                if not id_:
                    return self.error("Join the table again", 401)
                try:
                    if data.get("characterId") != id_:
                        return self.error("Character assignment changed; refreshing", 409)
                    phone_health.acknowledge(TABLE, id_, data.get("revision"))
                except ValueError as error:
                    return self.error(str(error), 400)
                return self.json({"ok": True})
        if route == "/api/action":
            if not self.is_phone_origin():
                return self.error("Open the player app first", 403)
            id_ = self.phone_id()
            if not id_:
                return self.error("Join the table again", 401)
            with LOCK:
                if (data.get("expectedCharacterId") is not None or TABLE.get("phone_health", {}).get(id_, {}).get("reassigned")) and data.get("expectedCharacterId") != id_:
                    return self.error("Character assignment changed; refresh before acting", 409)
                public = (TABLE["snapshot"].get("public") or {})
                if time.time() - TABLE["last_dm"] > 30:
                    return self.error("Waiting for the DM screen to reconnect.", 503)
                if public.get("rehearsal") is True:
                    return self.error("Practice display is active. Ask your DM to end rehearsal before sending actions.", 409)
                kind = data.get("kind")
                action = {"kind": kind, "characterId": id_, "scene": public.get("scene", "")}
                if kind in ("search-request", "search-cancel"):
                    if TABLE["snapshot"].get("dungeonProtocol") != 1:
                        return self.error("Refresh the DM screen to enable dungeon searches", 409)
                    request_id = str(data.get("requestId") or "")
                    if not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", request_id):
                        return self.error("Invalid request ID", 400)
                    previous = next((r for r in TABLE["snapshot"].get("searchRequests", []) if r.get("id") == request_id), None)
                    if previous and (previous.get("owner") != id_ or previous.get("status") not in ("waiting", "approved")):
                        return self.error("Only your pending search can be changed", 409)
                    action["requestId"] = request_id
                    if kind == "search-cancel":
                        if not previous: return self.error("Search not found", 404)
                    else:
                        if not TABLE["snapshot"].get("isMap") or (public.get("map") or {}).get("playerInput") is False:
                            return self.error("The DM has paused map exploration", 409)
                        object_id, area, approach = str(data.get("objectId") or "")[:100], str(data.get("area") or "")[:300], str(data.get("approach") or "")[:800]
                        objects = safe_dungeon(TABLE["snapshot"].get("dungeon"))["objects"]
                        if object_id and not any(o.get("id") == object_id and o.get("canSearch") is True for o in objects):
                            return self.error("Choose a currently available object", 400)
                        if not approach.strip() or (not object_id and not area.strip()):
                            return self.error("Name an area or object and describe your approach", 400)
                        action.update(objectId=object_id, area=area, approach=approach)
                elif kind in ("travel-request", "travel-cancel"):
                    if TABLE["snapshot"].get("travelProtocol") != 1:
                        return self.error("Refresh the DM screen to enable travel", 409)
                    request_id = str(data.get("requestId") or "")
                    if not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", request_id):
                        return self.error("Invalid request ID", 400)
                    existing = next((r for r in TABLE["snapshot"].get("travelRequests", []) if r.get("id") == request_id), None)
                    if existing and (existing.get("owner") != id_ or existing.get("status") != "waiting"):
                        return self.error("Only your waiting requests can be changed", 409)
                    if kind == "travel-cancel" and not existing:
                        return self.error("Request not found", 404)
                    action["requestId"] = request_id
                    if kind == "travel-request":
                        destination = str(data.get("destination") or "")
                        places = (TABLE["snapshot"].get("journey") or {}).get("places", [])
                        target = next((p for p in places if p.get("id") == destination and p.get("status") in ("located", "visited", "cleared") and not p.get("inaccessible")), None)
                        if not target:
                            return self.error("Choose a located, accessible destination", 400)
                        action.update(destination=destination, note=str(data.get("note") or "")[:600])
                elif kind in ("personal-note", "share-clue", "item-request", "item-cancel"):
                    if TABLE["snapshot"].get("playerToolsProtocol") != 1:
                        return self.error("Refresh the DM app to enable player tools", 409)
                    hub = (TABLE["snapshot"].get("playerTools") or {}).get(id_, {})
                    character = (TABLE["snapshot"].get("characters") or {}).get(id_, {})
                    if kind == "personal-note":
                        note_id, note_kind = data.get("noteId"), data.get("noteKind")
                        if not isinstance(note_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", note_id) or note_kind not in ("clue", "npc", "location") or not str(data.get("title") or "").strip():
                            return self.error("Give the note a type and title", 400)
                        if any(n.get("id") == note_id for who, view in (TABLE["snapshot"].get("playerTools") or {}).items() if who != id_ for n in view.get("notes", [])):
                            return self.error("That note is unavailable", 403)
                        ref = str(data.get("ref") or "")[:100]
                        if note_kind == "clue" and not any(c.get("id") == ref for c in (TABLE["snapshot"].get("privateClues") or {}).get(id_, []) + hub.get("sharedClues", [])):
                            return self.error("Choose an available clue", 403)
                        action.update(noteId=note_id, noteKind=note_kind, ref=ref, title=str(data["title"])[:120], text=str(data.get("text") or "")[:3000])
                    elif kind == "share-clue":
                        clue_id = str(data.get("clueId") or "")[:100]
                        clue = next((c for c in (TABLE["snapshot"].get("privateClues") or {}).get(id_, []) if c.get("id") == clue_id), None)
                        if not clue:
                            return self.error("Only the clue recipient may share it", 403)
                        expected = {k: clue.get(k, "") for k in ("title", "text", "image")}
                        version = hashlib.sha256(json.dumps(expected, sort_keys=True).encode()).hexdigest()
                        if data.get("version") != version:
                            return self.error("The clue changed. Read it again before sharing", 409)
                        action.update(clueId=clue_id, expectedClue=expected)
                    else:
                        request_id = data.get("requestId")
                        if not isinstance(request_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", request_id):
                            return self.error("Start a new item request", 400)
                        if any(r.get("id") == request_id for who, view in (TABLE["snapshot"].get("playerTools") or {}).items() if who != id_ for r in view.get("itemRequests", [])):
                            return self.error("Request unavailable", 403)
                        previous = next((r for r in hub.get("itemRequests", []) if r.get("id") == request_id), None)
                        action["requestId"] = request_id
                        if kind == "item-cancel":
                            if not previous or previous.get("status") != "waiting":
                                return self.error("This request is no longer waiting", 409)
                        elif previous:
                            return self.json({"queued": False, "status": previous.get("status")})
                        else:
                            verb = data.get("verb")
                            if verb not in ("claim", "transfer", "equip", "unequip", "use", "split", "objective"):
                                return self.error("Choose a supported item action", 400)
                            action.update(verb=verb, note=str(data.get("note") or "")[:600])
                            people = {r.get("id") for r in hub.get("roster", [])}
                            if verb == "objective":
                                if not action["note"].strip(): return self.error("Describe the next objective", 400)
                            elif verb == "split":
                                amounts, recipients = data.get("coins"), data.get("recipients")
                                if not isinstance(amounts, dict) or any(not isinstance(amounts.get(k, 0), int) or isinstance(amounts.get(k, 0), bool) or not 0 <= amounts.get(k, 0) <= 999999999 for k in ("cp", "sp", "ep", "gp", "pp")):
                                    return self.error("Enter whole coin amounts", 400)
                                if not isinstance(recipients, list) or not recipients or any(not isinstance(r, str) or r not in people for r in recipients):
                                    return self.error("Choose party members for the split", 400)
                                action.update(coins={k: amounts.get(k, 0) for k in ("cp", "sp", "ep", "gp", "pp")}, recipients=list(dict.fromkeys(recipients)))
                            else:
                                source, item_id = data.get("source"), str(data.get("itemId") or "")[:80]
                                if source == "party":
                                    entry = next((i for i in TABLE["snapshot"].get("inventory", []) if i.get("id") == item_id), None)
                                elif source == "sheet" and re.fullmatch(r"\d{1,3}", item_id):
                                    gear = character.get("equipment") or []
                                    entry = gear[int(item_id)] if int(item_id) < len(gear) else None
                                else: entry = None
                                if not entry or data.get("itemName") != entry.get("name"):
                                    return self.error("Choose a current item", 409)
                                holder = entry.get("holder") if source == "party" else id_
                                if (verb == "claim" and holder != "party") or (verb != "claim" and holder != id_):
                                    return self.error("Ask the holder to transfer this item", 403)
                                quantity, target = data.get("quantity", 1), data.get("targetId", id_)
                                if not isinstance(quantity, int) or isinstance(quantity, bool) or not 1 <= quantity <= 999 or not isinstance(entry.get("quantity"), (int, float)) or entry["quantity"] < quantity:
                                    return self.error("Choose an available item quantity", 400)
                                if target not in people: return self.error("Choose a party member", 400)
                                action.update(source=source, itemId=item_id, itemName=entry["name"], quantity=quantity, targetId=target)
                        if any(q.get("kind") == kind and q.get("characterId") == id_ and q.get("requestId") == request_id for q in TABLE["events"]):
                            return self.json({"queued": True})
                elif kind == "initiative":
                    initiative = TABLE["snapshot"].get("initiative") or {}
                    if initiative.get("open") is not True or initiative.get("eligible", {}).get(id_) is not True:
                        return self.error("Initiative is not open for your character", 409)
                    mode = data.get("mode")
                    if mode == "manual":
                        total = data.get("total")
                        if not isinstance(total, int) or isinstance(total, bool) or not -99 <= total <= 999:
                            return self.error("Enter the total from your physical die", 400)
                        action.update(mode="manual", total=total)
                    elif mode == "roll":
                        if not isinstance(initiative.get("bonuses", {}).get(id_), int):
                            return self.error("Ask your DM to set your initiative bonus", 409)
                        action.update(mode="roll")
                    else:
                        return self.error("Choose a roll method", 400)
                elif kind == "move":
                    own = next((t for t in public.get("tokens", []) if t.get("id") == id_ and t.get("team") == "pc"), None)
                    if not TABLE["snapshot"].get("isMap") or (public.get("map") or {}).get("playerInput") is False or not own:
                        return self.error("Movement is unavailable now", 409)
                    x, y = data.get("x"), data.get("y")
                    if not all(isinstance(v, (int, float)) and not isinstance(v, bool) and 0 <= v <= 100 for v in (x, y)):
                        return self.error("Choose a point on the map", 400)
                    path = data.get("path")
                    if path is not None:
                        if TABLE["snapshot"].get("combatProtocol") != 1:
                            return self.error("Ask your DM to refresh the app for movement previews", 409)
                        if not isinstance(path, list) or not 2 <= len(path) <= 80 or any(not isinstance(p, dict) or any(not isinstance(p.get(k), (int, float)) or isinstance(p.get(k), bool) or not 0 <= p[k] <= 100 for k in ("x", "y")) for p in path):
                            return self.error("Choose a valid movement path", 400)
                        path = [{"x": p["x"], "y": p["y"]} for p in path]
                        action["path"] = path
                    action.update(x=x, y=y)
                elif kind == "roll":
                    count, sides, modifier = data.get("count"), data.get("sides"), data.get("modifier")
                    if not isinstance(count, int) or not 1 <= count <= 20 or sides not in (4, 6, 8, 10, 12, 20, 100) or not isinstance(modifier, int) or not -99 <= modifier <= 99:
                        return self.error("Choose valid dice", 400)
                    mode = data.get("mode", "normal")
                    if mode not in ("normal", "advantage", "disadvantage") or (mode != "normal" and (count != 1 or sides != 20)):
                        return self.error("Advantage uses one d20", 400)
                    action.update(count=count, sides=sides, modifier=modifier, mode=mode, label=str(data.get("label") or "Roll")[:50])
                elif kind == "explore":
                    scene = public.get("scene", "")
                    map_data = ((public.get("map") or {}).get("scenes") or {}).get(scene) or {}
                    if not TABLE["snapshot"].get("isMap") or (public.get("map") or {}).get("playerInput") is False:
                        return self.error("Exploration is paused", 409)
                    point_id = str(data.get("pointId") or "")
                    key = str(data.get("key") or "")
                    if point_id and any(p.get("id") == point_id for p in map_data.get("points", [])):
                        action.update(pointId=point_id)
                    elif TABLE["snapshot"].get("fogged") and re.fullmatch(r"\d{1,2},\d{1,2}", key) and key not in public.get("fog", []):
                        row, col = map(int, key.split(","))
                        if row >= (20 if map_data.get("fineFog") else 10) or col >= (32 if map_data.get("fineFog") else 16):
                            return self.error("Choose a shaded area", 400)
                        action.update(key=key)
                    else:
                        return self.error("Choose an available area", 400)
                elif kind == "save-clue":
                    clue_id = str(data.get("clueId") or "")[:80]
                    if not any(isinstance(item, dict) and item.get("id") == clue_id
                               for item in (TABLE["snapshot"].get("privateClues") or {}).get(id_, [])):
                        return self.error("This clue is unavailable", 403)
                    action.update(clueId=clue_id)
                elif kind in ("save-response", "reaction-response"):
                    if TABLE["snapshot"].get("combatProtocol") != 1:
                        return self.error("Ask your DM to refresh the app for combat requests", 409)
                    prompts = (TABLE["snapshot"].get("combatPrompts") or {}).get(id_, {})
                    if kind == "save-response":
                        batch_id, revision = data.get("batchId"), data.get("expectedRevision")
                        row = next((r for r in prompts.get("saves", []) if r.get("id") == batch_id), None)
                        if not row or row.get("status") != "waiting" or not isinstance(revision, int) or isinstance(revision, bool) or row.get("revision") != revision:
                            return self.error("That saving throw is no longer waiting", 409)
                        method = data.get("method")
                        if method == "digital":
                            if not isinstance(row.get("bonus"), (int, float)):
                                return self.error("Ask the DM to set your save bonus", 409)
                        elif method == "physical":
                            total = data.get("total")
                            if not isinstance(total, int) or isinstance(total, bool) or not -99 <= total <= 999:
                                return self.error("Enter the final saving throw total", 400)
                            action["total"] = total
                        else:
                            return self.error("Choose digital or physical dice", 400)
                        action.update(batchId=batch_id, expectedRevision=revision, method=method)
                    else:
                        pause_id = data.get("pauseId")
                        row = next((r for r in prompts.get("reactions", []) if r.get("id") == pause_id), None)
                        if not row or row.get("status") != "waiting":
                            return self.error("This reaction window has changed", 409)
                        response, note = data.get("response"), str(data.get("note") or "")[:600]
                        if response not in ("pass", "request") or response == "request" and not note.strip():
                            return self.error("Pass or describe your reaction", 400)
                        action.update(pauseId=pause_id, response=response, note=note)
                    for queued in TABLE["events"]:
                        if queued.get("kind") == kind and queued.get("characterId") == id_ and queued.get("batchId") == action.get("batchId") and queued.get("pauseId") == action.get("pauseId") and queued.get("expectedRevision") == action.get("expectedRevision"):
                            return self.json({"queued": True, "sequence": queued["sequence"]})
                elif kind in ("action-request", "action-revise", "action-cancel"):
                    if TABLE["snapshot"].get("actionProtocol") != 1:
                        return self.error("Ask your DM to refresh the campaign app to enable action reviews", 409)
                    request_id = data.get("requestId")
                    if not isinstance(request_id, str) or not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", request_id):
                        return self.error("Refresh the phone app and send a new request", 400)
                    mine = (TABLE["snapshot"].get("actionRequests") or {}).get(id_, [])
                    previous = next((r for r in mine if r.get("id") == request_id), None)
                    if kind != "action-request":
                        revision = data.get("expectedRevision")
                        if not isinstance(revision, int) or isinstance(revision, bool) or not previous or previous.get("status") not in ("waiting", "needs clarification") or previous.get("revision") != revision:
                            return self.error("This request changed. Refresh its status before revising or cancelling", 409)
                        action["expectedRevision"] = revision
                    elif previous:
                        return self.json({"queued": False, "status": previous.get("status"), "requestId": request_id})
                    if any(r.get("id") == request_id for person, rows in (TABLE["snapshot"].get("actionRequests") or {}).items() if person != id_ for r in rows):
                        return self.error("Request unavailable", 409)
                    action["requestId"] = request_id
                    if kind != "action-cancel":
                        action_type, index = data.get("actionType"), data.get("actionIndex")
                        field = {"attack": "attacks", "action": "actions", "spell": "spells", "resource": "resources"}.get(action_type)
                        character = (TABLE["snapshot"].get("characters") or {}).get(id_) or {}
                        entries = character.get(field) if field else None
                        if not isinstance(index, int) or isinstance(index, bool) or not isinstance(entries, list) or not 0 <= index < len(entries):
                            return self.error("Choose one of your current actions", 400)
                        entry = entries[index]
                        if not isinstance(entry, dict) or entry.get("prepared") is False or data.get("actionName") != entry.get("name"):
                            return self.error("Your sheet changed. Choose the action again", 409)
                        if "draftEntry" in data:
                            draft_entry = data.get("draftEntry")
                            mechanics = lambda value: {key: val for key, val in value.items() if key not in ("support", "derived")}
                            if data.get("draftScene") != public.get("scene", "") or not isinstance(draft_entry, dict) or mechanics(draft_entry) != mechanics(entry):
                                return self.error("The prepared action or scene changed. Review your private draft again", 409)
                            resource_id = entry.get("resourceId")
                            if resource_id:
                                pool = next((r for r in character.get("resources", []) if r.get("id") == resource_id), None)
                                cost = entry.get("cost", 1)
                                if not pool or not isinstance(pool.get("current"), (int, float)) or pool["current"] < cost:
                                    return self.error("The prepared action's resource is no longer available", 409)
                        targets = data.get("targetIds", [])
                        visible = {t.get("id") for t in public.get("tokens", [])} | {id_}
                        if not isinstance(targets, list) or len(targets) > 20 or any(not isinstance(t, str) or t not in visible for t in targets):
                            return self.error("Choose currently visible targets", 400)
                        note = str(data.get("note") or "")[:600]
                        if not targets and not note.strip():
                            return self.error("Choose a target or describe the effect", 400)
                        mode = data.get("mode", "normal")
                        if mode not in ("normal", "advantage", "disadvantage"):
                            return self.error("Choose a roll mode", 400)
                        casting = data.get("casting")
                        if casting is not None:
                            if action_type != "spell" or not isinstance(casting, dict) or casting.get("mode") not in ("slot", "ritual"):
                                return self.error("Choose a supported casting method", 400)
                            resource_id = str(casting.get("resourceId") or "")[:80]
                            if casting["mode"] == "slot":
                                pool = next((r for r in character.get("resources", []) if r.get("id") == resource_id), None)
                                if not pool or not isinstance(pool.get("slotLevel"), int) or pool["slotLevel"] < max(1, entry.get("level") or 0):
                                    return self.error("Choose an appropriate spell slot from your sheet", 400)
                                if not isinstance(pool.get("current"), (int, float)) or pool["current"] < 1:
                                    return self.error("That spell slot is spent", 409)
                            elif not note.strip():
                                return self.error("Explain the ritual or free casting request", 400)
                            action["casting"] = {"mode": casting["mode"], "resourceId": resource_id, "effect": note, "notation": "", "concentration": "auto"}
                        action.update(actionType=action_type, actionIndex=index, actionName=entry["name"], entry=entry,
                                      targetIds=list(dict.fromkeys(targets)), note=note, mode=mode)
                    for queued in TABLE["events"]:
                        if queued.get("characterId") == id_ and queued.get("requestId") == request_id and queued.get("kind") == kind and queued.get("expectedRevision") == action.get("expectedRevision"):
                            return self.json({"queued": True, "sequence": queued["sequence"]})
                else:
                    return self.error("Unknown action", 400)
                if len(TABLE["events"]) >= 100:
                    return self.error("The DM has too many pending requests", 429)
                TABLE["sequence"] += 1
                action["sequence"] = TABLE["sequence"]
                TABLE["events"].append(action)
                return self.json({"queued": True, "sequence": action["sequence"]})
        return self.error("Not found", 404)


if __name__ == "__main__":
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
