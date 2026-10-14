"""Build and verify a relocatable personal campaign package without touching sources."""
from pathlib import Path
import hashlib
import json
import zipfile
import re
import base64
from urllib.parse import unquote

START = '''from pathlib import Path
import subprocess, sys, webbrowser, time, socket
for port in (48261,48262):
 with socket.socket() as probe:
  try: probe.bind(('127.0.0.1',port))
  except OSError:
   input('Close the other Echo Below servers first, then try again. Press Enter to exit.')
   sys.exit(1)
root=Path(__file__).resolve().parent
servers=[]
try:
 for name in ('serve_campaign.py','serve_phones.py'):
  servers.append(subprocess.Popen([sys.executable,str(root/'output'/'campaign'/'launchers'/name)]))
 time.sleep(1)
 webbrowser.open('http://127.0.0.1:48261/output/campaign/Session-01-TV-Display.html')
 input('Keep this window open during play. Press Enter to stop. ')
finally:
 for server in servers: server.terminate()
'''

def build(root, archive, destination, *, layered=False, practice_archive=None, structured_snapshot=None):
    root=Path(root).resolve()
    if archive.get('format') not in ('echo-below-campaign-v1','echo-below-campaign-v2') or not archive.get('sessions'):
        raise ValueError('A campaign backup is required')
    files=[]
    # Art refresh work includes private source-page checks and superseded takes.
    # Only the reviewed images installed at their existing media paths ship.
    excluded_dirs={'archive','tools','tests','model-reference','__pycache__','voice-audio','scene-art-refresh'}
    # AI state normally lives outside this tree. Also reject accidental copies,
    # including case variants from case-insensitive desktop filesystems.
    private_ai_files={'chatgpt-connection.json','service.json','elevenlabs.key','voices.json'}
    # Source books remain a separate, opt-in local shelf. No synced sources are copied.
    app=root/'output'/'campaign'
    for path in sorted(app.rglob('*')):
        relative=path.relative_to(root)
        parts=path.relative_to(app).parts
        if not path.is_file() or path.is_symlink() or any(x.lower() in excluded_dirs or x.startswith('.') or x.lower().endswith('.app') for x in parts): continue
        if path.name.lower() in private_ai_files: continue
        if path.suffix.lower() in ('.zip','.pyc','.log','.jsonl','.sqlite','.sqlite3','.db','.key') or path.name.endswith(('-wal','-shm')): continue
        if path.suffix.lower()=='.pdf' and ('books' in parts and path.name!='srd-5.1-cc.pdf' or path.name.startswith('pdfcoffee')): continue
        if not path.resolve().is_relative_to(root): continue
        files.append((path,relative.as_posix()))
    books=[{'file':path.name,'destination':'sources/'+path.name,'included':False} for path in sorted((root/'sources').glob('*.pdf'))]
    # A shelf path is documentation, never permission to include the source.
    media_roots={'assets','audio','session-01-visuals','session-02-visuals','lmop-visuals','lmop-battle-maps','town-maps','private-maps','atlas'}
    references=set()
    def walk(value):
        if isinstance(value,dict):
            for item in value.values(): walk(item)
        elif isinstance(value,list):
            for item in value: walk(item)
        elif isinstance(value,str):
            path=unquote(value.split('#')[0].split('?')[0])
            if path.split('/')[0] in media_roots and re.fullmatch(r'[A-Za-z0-9_ ./()-]+',path) and Path(path).suffix.lower() in {'.png','.jpg','.jpeg','.webp','.svg','.mp3','.ogg','.wav','.mp4'}: references.add('output/campaign/'+path)
    walk(archive)
    if practice_archive is not None: walk(practice_archive)
    packaged={name for _,name in files}
    missing=sorted(references-packaged)
    if missing: raise ValueError('Required campaign media is missing: '+', '.join(missing[:15]))
    hashes={}
    runtime_files={}
    layers={}
    content_pattern=re.compile(r'^(Echo-Below-Table-Content|AI-Voice-Cast|LMOP-|Waterdeep-|Undermountain-|Phandelver-|Travel-Map-Collection|Campaign-(Status-Evidence|Atlas-Data|Floor-Maps|Transition|Courtyard|Mystery|Research|Character-Stories|Character-Chapters|Satellites|Finale|Quests-Data|Quest-Prep-Data)|Session-0[2345]-|Session-Content-Packs|Session-01-(Town-Maps|Runbook|Party-Data|Handout-Data|Story-Data|Combat-Data|Rules-Data|Rules-Index|Rules-Library))')
    media_types={'.png','.jpg','.jpeg','.webp','.svg','.mp3','.ogg','.wav','.mp4','.m4a'}
    def layer(name):
        parts=Path(name).parts
        filename=Path(name).name
        if 'core' in parts:return 'platform'
        if 'packs' in parts:return 'content/'+parts[parts.index('packs')+1]
        if Path(name).suffix.lower() in media_types: return 'media'
        if 'books' in parts and filename!='srd-5.1-cc.pdf' or 'player-handouts' in parts or filename.startswith(('Current-','Voice-Audition','Stage-8-Live')): return 'private/group-documents'
        if content_pattern.match(filename) or any(part in ('atlas','map-audit','private-maps') for part in parts): return 'content/echo-below'
        if Path(name).suffix.lower() in ('.js','.css','.html','.py') or filename=='srd-5.1-cc.pdf': return 'platform'
        return 'content/echo-below'
    with zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_STORED,allowZip64=True) as bundle:
        for path,name in files:
            logical=name
            if layered:
                category=layer(logical)
                name=category+'/'+logical
                runtime_files[logical]=name
                layers[name]=category
            digest=hashlib.sha256()
            with path.open('rb') as src,bundle.open(name,'w',force_zip64=True) as dst:
                while chunk:=src.read(1024*1024): digest.update(chunk);dst.write(chunk)
            hashes[name]=digest.hexdigest()
        readme = ('PRIVATE DM PACKAGE — contains campaign secrets and character records.\n'
                  'Personal source books are NOT included. See PERSONAL-BOOKS.json.\n'
                  'Requires Python 3.10+ and a desktop browser. Stop other table servers first.\n'
                  'Extract the entire ZIP. Run python3 Start-Campaign.py (Mac: Start-Campaign.command).\n'
                  'Settings > Recovery & campaigns > Backup > Restore a backup as a new campaign.\n'
                  'Choose campaign-backup.json. This adds a separate campaign; it does not replace another.\n'
                  'Phone assignments are intentionally not copied. Open phone access and scan a new QR.\n'
                  'AI accounts, settings, and usage are not copied. AI starts off on a new computer; connect your own account in Settings > AI assistance.\n'
                  'Structured campaign databases and session drafts are private local state, separate from browser campaign backups. Back them up using CAMPAIGN-ENGINE-SETUP.md. They are not included in this package.\n'
                  'Run Table check, enable audio with a click, and open Player TV on the second display.\n'
                  'Blank-Campaign-Template.json can be restored for an empty campaign.\n'
                  'Optional books: copy your own local PDFs separately to the listed sources paths.\n'
                  'Never share this archive or its desktop server with players. Use the phone-only service.\n'
                  'MANIFEST.json verifies bytes; it does not guarantee Wi-Fi, speakers or TV calibration.\n')
        extras=[('campaign-backup.json',json.dumps(archive).encode()),('Start-Campaign.py',START.encode()),('READ-ME.txt',readme.encode()),('PERSONAL-BOOKS.json',json.dumps({'included':False,'books':books},indent=2).encode())]
        template=root/'output'/'releases'/'Blank-Campaign-Template.json'
        if template.exists(): extras.append(('Blank-Campaign-Template.json',template.read_bytes()))
        if layered:
            # Exact group save is never merged into reusable content. Practice uses a new identity.
            if practice_archive is None:
                practice_archive=json.loads(json.dumps(archive))
                practice_archive['campaign']={'id':'practice-portable','name':'PRACTICE · Portable rehearsal'}
            blank=json.loads(template.read_text()) if template.exists() else None
            if blank is None: raise ValueError('Generate the blank template before packaging a layered release')
            from package_runtime import assert_blank
            assert_blank(blank)
            runtime_source=Path(__file__).with_name('package_runtime.py').read_bytes()
            start_source=b"from pathlib import Path\nimport subprocess, sys, time, webbrowser, socket\nfrom package_runtime import materialize\nroot=Path(__file__).resolve().parent\ntry:\n runtime, report=materialize(root)\nexcept Exception as error:\n print('Package needs repair:',error);input('Press Enter to exit.');sys.exit(1)\nservers=[]\ntry:\n for port in (48261,48262):\n  with socket.socket() as probe: probe.bind(('127.0.0.1',port))\n for name in ('serve_campaign.py','serve_phones.py'):\n  servers.append(subprocess.Popen([sys.executable,str(runtime/'output/campaign/launchers'/name)]))\n time.sleep(1)\n webbrowser.open('http://127.0.0.1:48261/output/campaign/Session-01-TV-Display.html?start=blank')\n print('Restore practice/campaign-backup.json as a new campaign, or templates/Blank-Campaign-Template.json for a new group.')\n input('Keep this window open during play. Press Enter to stop. ')\nfinally:\n for server in servers: server.terminate()\n"
            instructions=("PRIVATE PERSONAL RELEASE — keep this package with the DM.\n"
             "1. Extract the entire ZIP. Double-click Check-Package.command (or run python3 package_runtime.py).\n"
             "2. Double-click Start-Campaign.command (or run python3 Start-Campaign.py). Requires Python 3.10+ and a desktop browser.\n"
             "3. In Settings → Recovery & campaigns → Backup, restore practice/campaign-backup.json AS A NEW CAMPAIGN for rehearsal.\n"
             "4. For another group, restore templates/Blank-Campaign-Template.json or choose New group in Campaigns.\n"
             "5. private/group/current-save.json is the untouched exported group record; restore separately when desired.\n"
             "6. Run the app's one-click table check. Confirm sound, TV safe edges, and phone joining physically.\n"
             "platform/ holds app tools; content/echo-below/ holds installed private content and adapters; media/ holds artwork/audio; private/ holds group data/docs.\n"
             "Start materializes compatible runtime paths under .runtime/; map IDs and references stay stable.\n"
             "Legacy coordinator and character/rules adapters retain some campaign-specific behavior. The installed Echo pack is still required; this is not a public plugin-free app release.\n"
             "Personal source PDFs are excluded. Supply your own PDFs under local-books/ using PERSONAL-BOOKS.json; on systems without symlinks use .runtime/sources/.\n"
             "Upgrade: stop servers, export your live campaign, keep the old release, extract the new release separately, run its health check, restore as a NEW campaign. Never overwrite a live save.\n"
             "Browser saves, AI keys/accounts, phone assignments, and structured campaign-service databases are not embedded in app code. AI starts off on a new machine. See CAMPAIGN-ENGINE-SETUP.md for the separate database backup.\n"
             "No remote play, cloud sync, or installed-phone upgrade is enabled. Each needs a separate design and isolated rehearsal.\n")
            extras=[('private/group/current-save.json',json.dumps(archive).encode()),('practice/campaign-backup.json',json.dumps(practice_archive).encode()),('templates/Blank-Campaign-Template.json',json.dumps(blank).encode()),('Start-Campaign.py',start_source),('package_runtime.py',runtime_source),('READ-ME.txt',instructions.encode()),('PERSONAL-BOOKS.json',json.dumps({'included':False,'localDirectory':'local-books','books':books},indent=2).encode())]
            asset_rows=[]
            supplied={m.get('path'):m for m in archive.get('presentation',{}).get('media',[]) if isinstance(m,dict) and m.get('path')}
            for logical,member in runtime_files.items():
                if Path(logical).suffix.lower() not in media_types: continue
                m=supplied.get(logical.removeprefix('output/campaign/'),{})
                asset_rows.append({'runtimePath':logical,'file':member,'sha256':hashes[member],'audience':m.get('audience','dm'),'source':m.get('source','Existing local asset'),'license':m.get('license','Not recorded; review rights before redistribution')})
            imported=[]
            for number,(identifier,encoded) in enumerate((archive.get('mediaFiles') or {}).items()):
                if not isinstance(encoded,str): raise ValueError('Invalid imported media record')
                match=re.fullmatch(r'data:((?:image|audio|video)/[A-Za-z0-9.+-]+);base64,([A-Za-z0-9+/]*={0,2})',encoded)
                if not match: raise ValueError('Imported media must be a local image, audio or video')
                data=base64.b64decode(match.group(2),validate=True)
                suffix={'image/png':'.png','image/jpeg':'.jpg','image/webp':'.webp','image/svg+xml':'.svg','audio/mpeg':'.mp3','audio/wav':'.wav','audio/x-wav':'.wav','audio/ogg':'.ogg','video/mp4':'.mp4'}.get(match.group(1),'.bin')
                name='media/imported/media-'+str(number)+suffix
                extras.append((name,data))
                media=next((m for m in archive.get('presentation',{}).get('media',[]) if m.get('id')==identifier),{})
                imported.append({'id':identifier,'file':name,'mime':match.group(1),'sha256':hashlib.sha256(data).hexdigest()})
                asset_rows.append({'mediaId':identifier,'file':name,'sha256':hashlib.sha256(data).hexdigest(),'audience':media.get('audience','dm'),'source':media.get('source','Uploaded local media'),'license':media.get('license','DM-supplied; review rights before redistribution')})
            extras.append(('IMPORTED-MEDIA.json',json.dumps(imported,indent=2).encode()))
            extras.append(('ASSETS.json',json.dumps(asset_rows,indent=2).encode()))
        whole=None
        if structured_snapshot is not None:
            if not layered:raise ValueError('Whole-campaign backup requires a layered package')
            from campaign_backup import validate_snapshot
            validate_snapshot(structured_snapshot)
            if structured_snapshot['campaignId']!=archive.get('campaign',{}).get('id'):raise ValueError('Structured snapshot belongs to another campaign')
            state_name='private/group/structured-state.json';state_bytes=json.dumps(structured_snapshot,ensure_ascii=False).encode()
            extras.append((state_name,state_bytes))
            browser_bytes=next(data for name,data in extras if name=='private/group/current-save.json')
            head=structured_snapshot['tables']['outcome_head']
            whole={'version':1,'structuredState':state_name,'databaseSchemaVersion':structured_snapshot['schemaVersion'],'browserSchemaVersion':archive['schemaVersion'],
                   'browserSHA256':hashlib.sha256(browser_bytes).hexdigest(),'structuredSHA256':hashlib.sha256(state_bytes).hexdigest(),
                   'structuredRevision':next(r['value'] for r in structured_snapshot['tables']['campaign_meta'] if r['key']=='revision'),
                   'browserLedgerHash':structured_snapshot.get('browserLedgerHash',''),'serviceHeadHash':head[0]['hash'] if head else '',
                   'linkedStores':bool(head and head[0]['hash']==structured_snapshot.get('browserLedgerHash')),'referenceIndexesIncluded':False,'credentialsIncluded':False}
            extras.append(('RESTORE-WHOLE-CAMPAIGN.txt',b'PRIVATE WHOLE-CAMPAIGN BACKUP\nOpen the desktop app. Recovery & campaigns > Backup > Restore whole campaign. Select this ZIP, inspect the preview, then restore as a separate campaign. The current campaign remains open until you choose Open restored campaign.\nBoth campaign stores and required media are verified. Personal books, rebuildable book indexes and provider accounts are excluded.\n'))
            instructions=('PRIVATE WHOLE-CAMPAIGN BACKUP\nExtract the ZIP and run Check-Package.command, then Start-Campaign.command (or python3 Start-Campaign.py).\nIn Recovery & campaigns > Backup, select Restore whole campaign and choose the original ZIP. Inspect the preview before restoring as a separate campaign. Open it only after both stores have been verified.\nThe current table and phones remain unchanged until you explicitly open the restored campaign. Phone assignments and provider accounts are not transferred.\nThe package contains app tools, installed content, required artwork/audio, browser state, structured records, drafts, audit and outcome history. Reference indexes are rebuildable and excluded; personal source books stay separately controlled under local-books/.\nKeep this package private: it contains DM secrets and personal character records. Legacy JSON and practice/template files cover browser data only; use the original ZIP to recover both stores.\nRun the table check and confirm Wi-Fi, TV and speakers physically before play.\n')
            extras=[(name,instructions.encode() if name=='READ-ME.txt' else data) for name,data in extras]
        for name,data in extras:
            bundle.writestr(name,data);hashes[name]=hashlib.sha256(data).hexdigest()
        launcher=zipfile.ZipInfo('Start-Campaign.command');launcher.external_attr=0o100755<<16
        command=b'#!/bin/sh\ncd -- "$(dirname -- "$0")" || exit 1\nexec python3 Start-Campaign.py\n'
        bundle.writestr(launcher,command);hashes[launcher.filename]=hashlib.sha256(command).hexdigest()
        if layered:
            health_launcher=zipfile.ZipInfo('Check-Package.command');health_launcher.external_attr=0o100755<<16
            health_command=b'#!/bin/sh\ncd -- "$(dirname -- "$0")" || exit 1\npython3 package_runtime.py\nresult=$?\nprintf "Press Enter to close. "\nread answer\nexit "$result"\n'
            bundle.writestr(health_launcher,health_command);hashes[health_launcher.filename]=hashlib.sha256(health_command).hexdigest()
        manifest={'version':3 if layered else 2,'sourceBooksIncluded':False,'requiredMedia':sorted(references),'sha256':hashes}
        if layered: manifest.update(releaseId='echo-table-2026-10-11',migrationVersion=3,appEntry='output/campaign/Session-01-TV-Display.html',runtimeFiles=runtime_files,layers=layers,groupSave='private/group/current-save.json',practiceSave='practice/campaign-backup.json',blankTemplate='templates/Blank-Campaign-Template.json')
        if layered:
            manifest['campaignBoundaryVersion']=1
            manifest['installedPacks']=archive.get('installedPacks',[] if archive.get('story',{}).get('contentProfile')=='blank' else [{'id':'echo-below','version':'1.0.0'},{'id':'echo-below-party','version':'1.0.0'}])
            manifest['packManifests']={name:member for name,member in runtime_files.items() if '/packs/' in name and name.endswith('manifest.json')}
            example=root/'output/releases/Fictional-Example-Campaign.json'
            if example.exists():
                name='templates/Fictional-Example-Campaign.json';data=example.read_bytes();bundle.writestr(name,data);hashes[name]=hashlib.sha256(data).hexdigest();manifest['exampleTemplate']=name
        if whole:manifest['wholeCampaign']=whole
        bundle.writestr('MANIFEST.json',json.dumps(manifest,indent=2))
    verify(destination)
    return len(hashes)


def verify(path):
    with zipfile.ZipFile(path) as bundle:
        names=bundle.namelist()
        if len(names)!=len(set(names)): raise ValueError('Duplicate entries in package')
        if any(name.startswith('/') or '..' in Path(name).parts for name in names): raise ValueError('Unsafe package path')
        manifest=json.loads(bundle.read('MANIFEST.json'))
        if set(names)!=set(manifest['sha256'])|{'MANIFEST.json'}: raise ValueError('Unlisted or missing package files')
        for name,digest in manifest['sha256'].items():
            h=hashlib.sha256()
            with bundle.open(name) as src:
                while chunk:=src.read(1024*1024):h.update(chunk)
            if h.hexdigest()!=digest:raise ValueError('Package verification failed: '+name)
        if manifest.get('version')==3:
            from package_runtime import safe_name,assert_blank
            for name,member in manifest.get('runtimeFiles',{}).items():
                safe_name(name);safe_name(member)
                if not name.startswith('output/campaign/') or member not in manifest['sha256']: raise ValueError('Invalid runtime mapping')
            if any(ref not in manifest['runtimeFiles'] for ref in manifest['requiredMedia']):raise ValueError('Required media is not mapped')
            assert_blank(json.loads(bundle.read(manifest['blankTemplate'])))
            json.loads(bundle.read(manifest['groupSave']));json.loads(bundle.read(manifest['practiceSave']))
        else: json.loads(bundle.read('campaign-backup.json'))
    return True
