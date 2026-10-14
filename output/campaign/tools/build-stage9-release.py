"""Build a private release from an explicit exported save; never reads browser state."""
from pathlib import Path
import argparse
import hashlib
import json
import sys

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'output/campaign/launchers'))
from portable_package import build

parser = argparse.ArgumentParser()
parser.add_argument('--backup', type=Path, required=True)
parser.add_argument('--destination', type=Path, required=True)
args = parser.parse_args()
raw = args.backup.read_bytes()
archive = json.loads(raw)
practice = json.loads((ROOT / 'output/releases/Portable-Practice-Campaign.json').read_text())
args.destination.parent.mkdir(parents=True, exist_ok=True)
count = build(ROOT, archive, args.destination, layered=True, practice_archive=practice)
assert args.backup.read_bytes() == raw, 'Original export was altered'
report = {'archive': str(args.destination.resolve()), 'filesVerified': count,
          'bytes': args.destination.stat().st_size,
          'originalBackupSha256': hashlib.sha256(raw).hexdigest(),
          'migrationVersion': 3, 'sourceBooksIncluded': False}
args.destination.with_suffix('.build.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report))
