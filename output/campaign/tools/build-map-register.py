"""Regenerate read-only UI data and report from the authoritative location register.
No campaign state, source book, map image or existing ID is changed.
"""
from pathlib import Path
import json, hashlib, collections
APP=Path(__file__).resolve().parents[1]
folder=APP/'map-audit'; source=folder/'Location-Register.json'
raw=source.read_bytes(); data=json.loads(raw)
assert data['schemaVersion']==1 and data['audience']=='dm-only'
ids={r['id'] for r in data['locations']}
assert len(ids)==len(data['locations'])
assert len({m['id'] for m in data['maps']})==len(data['maps'])
for row in data['locations']:
 assert row['sourceRefs'],row['id']
 assert row['parentId'] is None or row['parentId'] in ids,row['id']
 seen={row['id']}; parent=row['parentId']
 while parent:
  assert parent not in seen,('parent cycle',row['id']);seen.add(parent)
  parent=next(r['parentId'] for r in data['locations'] if r['id']==parent)
for m in data['maps']:
 assert all(id in ids for id in m['locationIds']),m['id']
 if m['path']: assert (APP/m['path']).is_file(),m['path']
# This is a generated transport copy, never another authoring source.
js='/* GENERATED from Location-Register.json; edit the JSON and run tools/build-map-register.py. DM ONLY. */\n'
js+="(() => { 'use strict'; if (globalThis.location?.hash === '#player') return;\n"
js+='const data='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n'
js+="const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};\n"
js+='globalThis.ECHO_MAP_REGISTER_DATA=freeze(data); globalThis.ECHO_MAP_REGISTER_SHA256='+json.dumps(hashlib.sha256(raw).hexdigest())+';})();\n'
(folder/'Map-Register-Data.js').write_text(js)
assets={m['path']:m for m in data['maps'] if m['path'] and not m['id'].startswith('coverage-')}
counts=collections.Counter(m['status'] for m in assets.values())
assert len(assets)==data['summary']['existingMapAssets']
report=['THE ECHO BELOW — MAP AUDIT AND BUILD ORDER','Private DM reference · '+data['auditDate'],'',
 'Find the atlas: World → Campaign atlas. Use Expand atlas, board navigation and search.',
 'Find this inventory: World → Map register → Checklist / Locations / Maps.',
 'The standalone Map-Audit.html opens the same read-only register without starting the table.',
 '',f"{len(data['locations'])} location records; {data['summary']['existingMapAssets']} retained map/reference/variant files; {data['summary']['registeredMapScenes']} registered map scenes.",
 'Unique-file classifications: '+', '.join(f'{n} {k}' for k,n in sorted(counts.items()))+'.',
 'Counts include source references, old variants and preview sheets. They are not a count of unique finished player maps.',
 'Current stop: before entering Redbrand Hideout. Later prepared sessions do not establish visits.',
 '', 'DELIVERED AND REMAINING',
 '1. Seven clean terrain rasters and separately editable labels, routes and private proposals are available in Campaign atlas. They use shared source coordinates but remain distinct illustrative plates with documented alignment drift.',
 '2. Twenty source-reconciled SVG variants cover Phandalin, Redbrand, Cragmaw Hideout/Castle, Thundertree and Wave Echo. Prepare a separate battle map for blank fog; original scenes and saved coordinates remain untouched. Manual source geometry is approximate.',
 '3. Original Redbrand paintings still misrepresent the crevasse. Retain their needs-correction finding; the new dry-chasm variants are separate ready options.',
 '4. Presentation blocks flagged Nine/Waterdeep composites. Use Stage player view, inspect it, Show staged view on TV, then Return TV to live scene. Unkeyed dungeon staging shows the entire layout; use the separate battle map for gradual exploration.',
 '5. Undermountain Level 1 still needs a connected clean player floor. The current tactical canvas and private keyed scan do not complete that coverage.',
 '6. Waterdeep now has a source-aligned city painting and fourteen reviewed original neighborhood/interior views. Private room labels, permission notes and custom placement badges remain DM-only. Leilon has an optional painted stop with five proposed services; four other settlements have lighter source-relative overviews.',
 '', 'PRIORITIZED CHECKLIST']
for item in data['checklist']:
 report += ['',item['priority']+' · '+item['title']+' ['+item['status']+']',item['reason']]+['  - '+a for a in item['actions']]
report+=['','THE NINE — PLACEMENTS REMAIN PRIVATE']
for r in sorted((r for r in data['locations'] if r.get('nineNumber')),key=lambda r:r['nineNumber']):
 report += [f"{r['nineNumber']}. {r['name']} [{r['id']}]: {r['placement']['description']}",'   '+r['placement']['confidence']+'; '+r['disclosure']['status']]
report+=['','GEOGRAPHY AND IDENTITY RULES',
 'Location-Register.json is the editable authority for identity, provenance and preparation. Map-Register-Data.js is generated from it. Approved outcome records and campaign saves retain authority over actual play and disclosure.',
 'Existing scene, room, marker, route and site IDs are aliases/links, not renamed or migrated. A location may have several maps. A map may show several locations. Source books and original artwork remain unchanged.',
 'Walking Tower has a roaming region, not a fixed pin. Broken Star has a regional approach and partly planar destination, not a new travel power. Character homes and the threatened district remain unplaced where choices are open.',
 'Book-suggested Tales placements remain adaptations. Tamoachan in Chult and Doomvault in Thay belong in separate geographic views; Bloodgate Keep is a different location.',
 'No location is discovered because its name or art exists. New atlas travel definitions start hidden; existing ledger states are preserved. Reading this register publishes nothing to TV or phones.',
 '', 'SCOPE AND LIMITATIONS']+['- '+t for t in data['limitations']]
report+=['','FILES',
 'Location-Register.json — authoritative private editable data',
 'Map-Register-Data.js — generated read-only browser copy',
 'Map-Audit.html — standalone searchable DM report',
 'Visual-Audit.txt — detailed Redbrand/Waterdeep/Nine visual findings',
 'Book-Source-Notes.txt — book coverage and reference limitations',
 'Verification.txt — original audit workflow and preservation results',
 '../atlas/Map-Delivery-Guide.txt — navigation, staging, separate-map workflow and actual image dimensions',
 '../atlas/Atlas-Data.json — generated atlas transport; direct edits are overwritten by rebuild',
 '../atlas/Settlement-Geography-Register.json — source-aware city and proposed local coordinates',
 '../atlas/Settlement-Verification.txt — selected book map checks and local precision limits',
 '../atlas/Settlement-Template.json — blank unregistered template for future settlements',
 '../atlas/tactical/Waterdeep-Map-Audit.txt — fourteen original Waterdeep play-space proposals',
 '../atlas/tactical/Waterdeep-Validation.json — latest Waterdeep artifact checks',
 '../atlas/Geography-Verification.txt — source checks and painting-alignment limits',
 '../atlas/tactical/Tactical-Map-Audit.txt — Phandelver source check, map index and precision caveats',
 '../atlas/tactical/Validation.json — latest tactical artifact verification result']
(folder/'Map-Audit-and-Checklist.txt').write_text('\n'.join(report)+'\n')
print(json.dumps({'locations':len(data['locations']),'existingAssets':len(assets),'assetReferenceRecords':sum(bool(m['path']) for m in data['maps']),'mapRecords':len(data['maps']),'classifications':dict(counts),'sha256':hashlib.sha256(raw).hexdigest()}))
