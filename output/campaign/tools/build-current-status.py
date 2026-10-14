"""Build a private status index from evidence; prose reports never supply campaign facts."""
from pathlib import Path
import datetime
import hashlib
import json
import re
import os
import sys

APP = Path(__file__).resolve().parents[1]
PROJECT = APP.parents[1]
sys.path.insert(0, str(APP/'launchers'))
from status_evidence import versions


def stamp(path):
    text = path.read_text(errors='replace')
    value = None
    if path.suffix == '.json':
        try:
            d = json.loads(text)
            value = next((d.get(k) for k in ('at','auditDate','date','generatedAt') if isinstance(d.get(k), str)), None)
        except (ValueError, AttributeError):
            pass
    found = re.search(r'20\d{2}-\d{2}-\d{2}(?:T[0-9:.+Z-]+)?', text[:4000])
    if not value and found:
        value = found[0]
    basis='Recorded report date'
    if not value:
        match=re.search(r'20\d{2}-\d{2}-\d{2}',path.name)
        if match:
            value=match[0];basis='Dated report filename; exact check time not recorded'
    if not value:
        for pattern,fmt in [(r'\b\d{1,2} [A-Za-z]+ 20\d{2}\b','%d %B %Y'),(r'\b[A-Za-z]+ \d{1,2}, 20\d{2}\b','%B %d, %Y')]:
            match=re.search(pattern,text[:4000])
            if match:
                try:
                    value=datetime.datetime.strptime(match[0].title(),fmt).date().isoformat();break
                except ValueError:
                    pass
    return {'at': value, 'dateBasis': basis if value else 'Report date not recorded'}


def build():
    release = PROJECT/'output/audits/release-check/latest.json'
    check = json.loads(release.read_text()) if release.exists() else None
    current = versions(APP)
    candidates = []
    for folder in (APP, PROJECT/'output/audits'):
        for p in folder.rglob('*'):
            if not p.is_file() or p.is_symlink() or p.suffix not in ('.md','.txt','.json','.html'):
                continue
            if any(k in p.parts for k in ('sources','tools','tests','ui-concepts','model-reference','__pycache__')):
                continue
            if p.name.startswith(('Campaign-Status-Evidence','Current-Status')) or p == APP/'App-Readiness-Status.md' or p.name in {'latest.json','latest.html'}:
                continue
            if not p.is_relative_to(PROJECT/'output/audits') and not re.search(r'readiness|verification|checklist|roadmap|report|prep|audit|(?:^|-)plans?', p.name, re.I):
                continue
            candidates.append(p)
    reports = []
    for p in sorted(set(candidates)):
        text = p.read_text(errors='replace')
        plan = bool(re.search(r'roadmap|staged-plan|(?:^|-)plans?\.',p.name,re.I))
        concerns=[]
        if 'before entering Redbrand Hideout' in text or 'resume immediately before the Redbrand hideout' in text:
            concerns.append('Earlier stopping point; use the approved outcome ledger for current play.')
        if 'Gundren is asleep at the inn' in text or 'Gundren was left asleep at the inn' in text:
            concerns.append('Current sleep condition was not confirmed; the approved ledger records an unnamed inn and an unreported condition.')
        if 'Pending export' in text or 'no current live campaign package' in text or 'not inside the browser JSON or portable ZIP' in text:
            concerns.append('Recovery implementation and later export/restore evidence supersede this earlier statement.')
        if 'second Expertise choice remain' in text or 'second Expertise choice is not' in text or 'spell preparation and Ringgo' in text:
            concerns.append('Later approved sheet decisions supersede the open-choice note.')
        reports.append({'id':p.relative_to(PROJECT).as_posix(),'path':Path(os.path.relpath(p,APP)).as_posix(),
                        'title':p.stem.replace('-',' '),**stamp(p),'classification':'Future plan' if plan else 'Historical report',
                        'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'concerns':concerns,
                        'use':'Planning/reference only; not a record of play or proof of current readiness.'})
    matched = bool(check and check.get('versions') and all(check['versions'].get(k,{}).get('sha256') == current[k]['sha256'] for k in ('app','assets','tests')))
    release_row = None if not check else {'at':check['at'],'coreGatePassed':check.get('coreGatePassed',False),'profile':check.get('profile'),
        'versions':check.get('versions'), 'passed':sum(c['passed'] for c in check['checks']), 'total':len(check['checks']),
        'checks':[{'name':c['name'],'passed':c['passed'],'category':c['category']} for c in check['checks']],
        'faultsCaught':all(c.get('faultCaught') for c in check.get('faultProofs',[])),
        'physicalDevicesTested':False,'providerRequestsInGate':check.get('realProviderRequests',0),
        'path':'../audits/release-check/latest.html','matchingFilesAtIndexBuild':matched}
    provider_path=APP/'Stage-8-Live-Provider-Verification.json'
    provider=None
    if provider_path.exists():
        raw=json.loads(provider_path.read_text())
        provider={'at':raw.get('finalUsage',{}).get('day'),'provider':raw.get('provider'), 'realRequests':raw.get('realRequests',0),
                  'passed':raw.get('status')=='completed' and raw.get('validation',{}).get('accepted') is True,
                  'scope':'Historical real request with fictional records. Not current connection, credentials, model availability or speaker certification.',
                  'path':provider_path.relative_to(APP).as_posix(),'sha256':hashlib.sha256(provider_path.read_bytes()).hexdigest()}
    data={'schemaVersion':1,'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'versions':current,
          'release':release_row,'reports':reports,'historicalProvider':provider,
          'policy':'Readiness evidence only. No campaign events, quests, NPC knowledge, stats or discoveries are imported from reports.'}
    out=APP/'Campaign-Status-Evidence.json';out.write_text(json.dumps(data,indent=2)+'\n')
    (APP/'Campaign-Status-Evidence.js').write_text("/* Generated private evidence; no current campaign facts. */\n(() => { if(globalThis.location?.hash === '#player')return; globalThis.ECHO_STATUS_EVIDENCE = "+json.dumps(data,separators=(',',':'))+"; })();\n")
    return data


if __name__=='__main__':
    d=build();print(f"Current status indexed {len(d['reports'])} historical reports/plans. Evidence matches files: {bool(d['release'] and d['release']['matchingFilesAtIndexBuild'])}.")
