"""A one-phone resync must leave the other four phone assignments current."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "launchers"))
import phone_health

ids = [f"pc-{name}" for name in ("trista", "pebble", "donavan", "ringgo", "aldric")]
table = {
    "revision": 41,
    "claims": {f"cookie-{index}": character for index, character in enumerate(ids)},
    "roster": [{"id": character, "name": character} for character in ids],
    "events": [{"characterId": ids[0]}, {"characterId": ids[1]}],
    "phone_health": {},
}
for character in ids:
    phone_health.acknowledge(table, character, 41)
assert all(row["status"] == "current" for row in phone_health.claims(table))
phone_health.manage(table, ids[0], "resync")
assert table["revision"] == 41
assert table["phone_health"][ids[0]]["resync"] == 1
assert {row["id"] for row in phone_health.claims(table) if row["status"] == "current"} == set(ids[1:])
phone_health.acknowledge(table, ids[0], 41)
assert all(row["status"] == "current" for row in phone_health.claims(table))
phone_health.manage(table, ids[0], "release")
assert len(table["claims"]) == 4 and len(table["events"]) == 1
assert all(row["status"] == "current" for row in phone_health.claims(table) if row["id"] in ids[1:])
print("Stage 4 phone health passed: one-phone resync and release left four other connections current.")
