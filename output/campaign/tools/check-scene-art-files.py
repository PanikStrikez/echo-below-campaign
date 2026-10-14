from pathlib import Path
import json, hashlib, sys
from PIL import Image
root=Path(__file__).resolve().parents[1];work=root/'scene-art-refresh'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
rows=json.loads((work/'Generation-Progress.json').read_text());reasons=json.loads((work/'Image-by-Image-Reasons.json').read_text());maps=json.loads((work/'Map-Invariants.json').read_text())
assert len(rows)==len(reasons)==120
assert {r['id'] for r in rows}=={r['id'] for r in reasons}
for r in rows:
 assert r['status']=='installed' and r['review']=='passed'
 assert sha(root/r['image'])==r['installedHash']==r['candidateHash']==r['reviewedHash']
 assert sha(root/r['originalBackup'])==r['originalHash']
 with Image.open(root/r['image']) as image:
  assert image.size==(1536,1024);image.verify()
for m in maps:assert sha(root/m['image'])==m['sha256'],m['id']
sys.path.insert(0,str(root/'launchers'))
import serve_phones
assert serve_phones.private_image_bytes('scene-art-refresh/Before-and-After.html') is None
assert serve_phones.private_image_bytes('scene-art-refresh/candidates/lmop-nezznar-confrontation.png') is None
source=(root/'launchers/portable_package.py').read_text()
assert "'scene-art-refresh'" in source
report={'installedImages':120,'individualReasons':120,'nativeResolution':[1536,1024],'originalBackupsVerified':120,'unchangedMaps':len(maps),'reviewGalleryAndCandidatesBlockedOnPhones':True,'reviewWorkExcludedFromPortableCampaign':True,'physicalDevicesTested':False}
(work/'File-Verification.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
