"""Portable release integrity and separation fixtures; no live storage or source edits."""
from pathlib import Path
import json
import tempfile
import sys
import zipfile
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'launchers'))
from portable_package import build, verify
from package_runtime import health, materialize, assert_blank
blank=json.loads((Path(__file__).resolve().parents[2]/'releases/Blank-Campaign-Template.json').read_text())
assert_blank(blank)
for forbidden in ('Trista','Pebble','Aldric','Halaster','Looking Glass','Below token','pc-'):
    assert forbidden not in json.dumps(blank), forbidden
with tempfile.TemporaryDirectory(prefix='echo-stage9-test-') as directory:
    root=Path(directory)/'project';app=root/'output/campaign';app.mkdir(parents=True)
    (app/'Session-01-TV-Display.html').write_text('<title>Practice</title>')
    (app/'Session-01-Commands.js').write_text('/* reusable */')
    (app/'core').mkdir();(app/'core/Party.js').write_text('/* GENERIC_NO_PARTY_SEEDS */')
    (app/'packs/lantern-ferry').mkdir(parents=True);(app/'packs/lantern-ferry/manifest.json').write_text(json.dumps({'id':'lantern-ferry','version':'1.0.0'}))
    (root/'output/releases').mkdir(parents=True,exist_ok=True)
    (app/'Echo-Below-Table-Content.js').write_text('/* private content */')
    (app/'Campaign-Status-Evidence.js').write_text('/* DM_ONLY_REPORT_FILENAMES */')
    (app/'audio').mkdir();(app/'audio/test.wav').write_bytes(b'audio')
    (app/'assets').mkdir();(app/'assets/test.svg').write_bytes(b'<svg/>')
    (app/'books').mkdir();(app/'books/person.pdf').write_bytes(b'PERSONAL_PDF_MUST_BE_EXCLUDED')
    (app/'elevenlabs.key').write_bytes(b'CREDENTIAL_MUST_BE_EXCLUDED')
    (root/'sources').mkdir();(root/'sources/book.pdf').write_bytes(b'SOURCE_BOOK_NOT_INCLUDED')
    (root/'output/releases').mkdir(exist_ok=True);(root/'output/releases/Blank-Campaign-Template.json').write_text(json.dumps(blank))
    group=json.loads(json.dumps(blank));group['campaign']={'id':'fixture-original','name':'Original group'};group['presentation']['media']=[{'id':'practice-art','path':'assets/test.svg','kind':'image','audience':'party'},{'id':'practice-audio','path':'audio/test.wav','kind':'audio','audience':'party'}]
    original=json.dumps(group,sort_keys=True)
    target=Path(directory)/'release.zip';build(root,group,target,layered=True);verify(target)
    dest=Path(directory)/'fresh-machine';dest.mkdir()
    with zipfile.ZipFile(target) as bundle:
        names=bundle.namelist();manifest=json.loads(bundle.read('MANIFEST.json'))
        assert manifest['version']==3 and manifest['migrationVersion']==3
        assert manifest['campaignBoundaryVersion']==1 and manifest['installedPacks']==[]
        assert manifest['runtimeFiles']['output/campaign/core/Party.js'].startswith('platform/')
        assert manifest['runtimeFiles']['output/campaign/packs/lantern-ferry/manifest.json'].startswith('content/lantern-ferry/')
        assert manifest['packManifests']
        assert manifest['runtimeFiles']['output/campaign/Echo-Below-Table-Content.js'].startswith('content/echo-below/')
        assert manifest['runtimeFiles']['output/campaign/Session-01-Commands.js'].startswith('platform/')
        assert manifest['runtimeFiles']['output/campaign/Campaign-Status-Evidence.js'].startswith('content/echo-below/')
        assert all(b'DM_ONLY_REPORT_FILENAMES' not in bundle.read(n) for n in names if n.startswith('platform/'))
        assert manifest['runtimeFiles']['output/campaign/audio/test.wav'].startswith('media/')
        assert not any(n.startswith('sources/') or n.endswith('/person.pdf') for n in names)
        assert json.loads(bundle.read(manifest['groupSave']))==group
        assert json.loads(bundle.read(manifest['practiceSave']))['campaign']['id']=='practice-portable'
        for name in names:
            assert b'CREDENTIAL_MUST_BE_EXCLUDED' not in bundle.read(name)
            assert b'SOURCE_BOOK_NOT_INCLUDED' not in bundle.read(name)
        bundle.extractall(dest)
    assert json.dumps(group,sort_keys=True)==original
    report=health(dest);assert report['ready'];
    # Older manifest-v3 releases remain readable without new optional metadata.
    old=dict(manifest)
    for key in ('campaignBoundaryVersion','installedPacks','packManifests'):old.pop(key,None)
    (dest/'MANIFEST.json').write_text(json.dumps(old));assert health(dest)['ready']
    (dest/'MANIFEST.json').write_text(json.dumps(manifest));
    runtime,_=materialize(dest)
    assert (runtime/'output/campaign/audio/test.wav').read_bytes()==b'audio'
    # Materialization repairs runtime bytes; it cannot rewrite original group data.
    (runtime/'output/campaign/audio/test.wav').write_bytes(b'broken');materialize(dest)
    assert (runtime/'output/campaign/audio/test.wav').read_bytes()==b'audio'
    assert json.loads((dest/'private/group/current-save.json').read_text())==group
    corrupt=dest/manifest['runtimeFiles']['output/campaign/assets/test.svg'];corrupt.write_bytes(b'corrupt')
    try: health(dest);raise AssertionError('Corrupt artwork accepted')
    except ValueError: pass
print('Stage 9 package fixtures passed: separated layers, clean blank, untouched original, relocated art/audio, credential/PDF exclusion, and corrupt asset rejection.')
