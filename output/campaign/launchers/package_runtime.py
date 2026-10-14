"""Relocatable layered release checks. Uses only Python's standard library."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import shutil
import sys


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as src:
        while chunk := src.read(1024 * 1024):
            h.update(chunk)
    return h.hexdigest()


def safe_name(name):
    if not isinstance(name, str) or not name or '\\' in name:
        raise ValueError('Unsafe release path')
    p = PurePosixPath(name)
    if p.is_absolute() or any(part in ('..', '.') for part in p.parts) or p.as_posix() != name:
        raise ValueError('Unsafe release path')
    return name


def health(root):
    root = Path(root).resolve()
    manifest = json.loads((root / 'MANIFEST.json').read_text())
    if manifest.get('version') != 3 or manifest.get('migrationVersion') != 3:
        raise ValueError('Unsupported release manifest')
    if manifest.get('sourceBooksIncluded') is not False:
        raise ValueError('Personal books must stay separate')
    if manifest.get('campaignBoundaryVersion',1)!=1:raise ValueError('Unsupported campaign boundary')
    for pack in manifest.get('installedPacks',[]):
        if pack.get('id') not in ('echo-below','echo-below-party','lantern-ferry') or pack.get('version')!='1.0.0':raise ValueError('Unsupported campaign pack version')
    hashes = manifest.get('sha256', {})
    failures = []
    for name, expected in hashes.items():
        safe_name(name)
        path = root / name
        if path.is_symlink() or not path.is_file() or not path.resolve().is_relative_to(root):
            failures.append(name + ': missing or unsafe')
        elif digest(path) != expected:
            failures.append(name + ': changed bytes')
    runtime = manifest.get('runtimeFiles', {})
    for name, member in runtime.items():
        safe_name(name); safe_name(member)
        if not name.startswith('output/campaign/') or member not in hashes:
            raise ValueError('Invalid runtime mapping')
    for reference in manifest.get('requiredMedia', []):
        if reference not in runtime:
            failures.append(reference + ': required media absent')
    for name in ('templates/Blank-Campaign-Template.json', 'practice/campaign-backup.json'):
        if name not in hashes:
            failures.append(name + ': startup record absent')
    template = json.loads((root / 'templates/Blank-Campaign-Template.json').read_text())
    assert_blank(template)
    for name,member in manifest.get('packManifests',{}).items():
        if runtime.get(name)!=member or member not in hashes:raise ValueError('Invalid content pack manifest mapping')
    if manifest.get('exampleTemplate') and manifest['exampleTemplate'] not in hashes:raise ValueError('Example template missing')
    whole=manifest.get('wholeCampaign')
    if whole is not None:
        if whole.get('version')!=1 or whole.get('databaseSchemaVersion')!=1 or whole.get('referenceIndexesIncluded') is not False or whole.get('credentialsIncluded') is not False:
            raise ValueError('Unsupported whole-campaign backup or private reference policy')
        for member in (whole.get('structuredState'),manifest.get('groupSave')):
            safe_name(member)
            if member not in hashes:raise ValueError('Whole-campaign store missing from manifest')
        database=json.loads((root/whole['structuredState']).read_text());browser=json.loads((root/manifest['groupSave']).read_text())
        if database.get('format')!='echo-structured-state' or database.get('version')!=1 or database.get('schemaVersion')!=1 or browser.get('schemaVersion')!=whole.get('browserSchemaVersion') or not 1<=browser.get('schemaVersion',0)<=3 or database.get('campaignId')!=browser.get('campaign',{}).get('id'):
            raise ValueError('Campaign identities or storage versions disagree')
        if digest(root/whole['structuredState'])!=whole.get('structuredSHA256') or digest(root/manifest['groupSave'])!=whole.get('browserSHA256'):
            raise ValueError('Whole-campaign stores failed matching hash verification')
    if failures:
        raise ValueError('Release needs repair: ' + '; '.join(failures[:12]))
    return {'ready': True, 'filesChecked': len(hashes), 'requiredMediaChecked': len(manifest.get('requiredMedia', [])),
            'migrationVersion': 3, 'personalBooks': 'optional and excluded',
            'wholeCampaignIncluded':whole is not None,'databaseVersion':whole.get('databaseSchemaVersion') if whole else None,
            'physicalChecks': ['Wi-Fi joining', 'TV calibration', 'speaker output']}


def assert_blank(template):
    if template.get('installedPacks',[]):raise ValueError('Blank template contains installed story packs')
    if template.get('story', {}).get('contentProfile') != 'blank':
        raise ValueError('Blank template has a campaign content profile')
    if len(template.get('sessions', [])) != 1:
        raise ValueError('Blank template must have one empty session')
    state = template['sessions'][0]['state']
    if state.get('contentProfile') != 'blank' or state.get('tokens') or state.get('party'):
        raise ValueError('Blank template contains player records')
    if state.get('runbookBeats') or state.get('encounters') or state.get('assets') or state.get('fog') or state.get('sceneFog'):
        raise ValueError('Blank template contains play history')
    for key in ('npcs', 'sites', 'floors', 'routes', 'evidence', 'journal', 'wrapUps'):
        if template['story'].get(key):
            raise ValueError('Blank template contains story records')
    continuity = template['story'].get('continuity', {})
    if continuity.get('events') or continuity.get('quests') or continuity.get('questGuide', {}).get('records'):
        raise ValueError('Blank template contains outcomes or quests')
    if template.get('mediaFiles') or template.get('presentation', {}).get('media'):
        raise ValueError('Blank template contains inherited media')


def materialize(root):
    root = Path(root).resolve()
    report = health(root)
    manifest = json.loads((root / 'MANIFEST.json').read_text())
    # Existing saves live in the browser/private service stores, outside this directory.
    runtime = root / '.runtime'
    if runtime.is_symlink(): raise ValueError('Unsafe runtime directory')
    for name, member in manifest['runtimeFiles'].items():
        destination = runtime / name
        if not destination.resolve().is_relative_to(runtime.resolve()): raise ValueError('Unsafe runtime destination')
        destination.parent.mkdir(parents=True, exist_ok=True)
        if destination.is_symlink():
            raise ValueError('Unsafe runtime link')
        if not destination.exists() or digest(destination) != manifest['sha256'][member]:
            shutil.copyfile(root / member, destination)
    # Keep future in-app packaging available on the relocated installation too.
    for member, filename in [('templates/Blank-Campaign-Template.json','Blank-Campaign-Template.json'),
                             ('practice/campaign-backup.json','Portable-Practice-Campaign.json')]:
        destination = runtime / 'output/releases' / filename
        destination.parent.mkdir(parents=True, exist_ok=True)
        if not destination.resolve().is_relative_to(runtime.resolve()) or destination.is_symlink():
            raise ValueError('Unsafe release template destination')
        shutil.copyfile(root / member, destination)
    if manifest.get('exampleTemplate'):
        destination=runtime/'output/releases/Fictional-Example-Campaign.json';destination.parent.mkdir(parents=True,exist_ok=True)
        if destination.is_symlink():raise ValueError('Unsafe example destination')
        shutil.copyfile(root/safe_name(manifest['exampleTemplate']),destination)
    # Personal PDFs are supplied separately; never copy them into releases or backups.
    books = root / 'local-books'
    books.mkdir(exist_ok=True)
    source_mount = runtime / 'sources'
    if not source_mount.exists():
        try:
            source_mount.symlink_to(books, target_is_directory=True)
        except OSError:
            source_mount.mkdir(exist_ok=True)
    return runtime, report


if __name__ == '__main__':
    root = Path(__file__).resolve().parent
    try:
        print(json.dumps(health(root), indent=2))
    except (ValueError, KeyError, OSError, AssertionError) as error:
        print('NOT READY: ' + str(error)); sys.exit(1)
