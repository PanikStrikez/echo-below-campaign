"""Build and verify a relocatable personal campaign package without touching sources."""
from pathlib import Path
import hashlib
import json
import zipfile
import re
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

def build(root, archive, destination):
    root=Path(root).resolve()
    if archive.get('format') not in ('echo-below-campaign-v1','echo-below-campaign-v2') or not archive.get('sessions'):
        raise ValueError('A campaign backup is required')
    files=[]
    excluded_dirs={'archive','tools','model-reference','__pycache__','voice-audio'}
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
    packaged={name for _,name in files}
    missing=sorted(references-packaged)
    if missing: raise ValueError('Required campaign media is missing: '+', '.join(missing[:15]))
    hashes={}
    with zipfile.ZipFile(destination,'w',compression=zipfile.ZIP_STORED,allowZip64=True) as bundle:
        for path,name in files:
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
        for name,data in extras:
            bundle.writestr(name,data);hashes[name]=hashlib.sha256(data).hexdigest()
        launcher=zipfile.ZipInfo('Start-Campaign.command');launcher.external_attr=0o100755<<16
        command=b'#!/bin/sh\ncd -- "$(dirname -- "$0")" || exit 1\nexec python3 Start-Campaign.py\n'
        bundle.writestr(launcher,command);hashes[launcher.filename]=hashlib.sha256(command).hexdigest()
        bundle.writestr('MANIFEST.json',json.dumps({'version':2,'sourceBooksIncluded':False,'requiredMedia':sorted(references),'sha256':hashes},indent=2))
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
        json.loads(bundle.read('campaign-backup.json'))
    return True
