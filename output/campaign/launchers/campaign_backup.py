"""Whole-campaign recovery, using logical SQLite snapshots and private staging.

Source indexes, provider state and accounts are never exported. Restore builds a
new database and installs only absent verified media; existing campaigns are not
overwritten. Browser activation is a separate, explicit last step.
"""
from pathlib import Path
import copy
import hashlib
import json
import os
import re
import secrets
import shutil
import tempfile
import time
import zipfile
from campaign_store import CampaignStore, validate_record, _json
from campaign_sessions import SessionEngine
from campaign_reconciliation import Reconciler, digest

FORMAT=1
DB_SCHEMA=1
MAX_UPLOAD=4*1024**3
MAX_EXPANDED=8*1024**3
TABLES={
 'campaign_meta':('key','value'),
 'campaign_records':('id','kind','body','created_at','updated_at'),
 'campaign_audit':('id','revision','actor','session_id','created_at','mutations'),
 'campaign_seeded':('record_id','seeded_at'),
 'campaign_sessions':('id','title','status','body_json','created_at'),
 'outcome_head':('singleton','hash','snapshot','receipt'),
 'outcome_mirrors':('id','body_hash'),
 'outcome_history':('sequence','created_at','hash','snapshot','receipt'),
}
META={'revision','schema_version','outcome_origin_campaign_id'}
SECRET_KEYS={'apikey','providerkey','accesstoken','refreshtoken','authorization','password','elevenlabskey','dmtoken','jointoken','joincode'}
SECRET_VALUE=re.compile(r'\b(?:sk_|sk-)[A-Za-z0-9_-]{20,}\b|\bBearer\s+[A-Za-z0-9._-]{20,}')

def browser_ledger(archive):
    fields={'id','title','detail','publicTitle','playerText','session','kind','status','basis','source','approved','approvedAt','share','knows','recipients','replaces','quests','markers','tracks','relationships','serviceLink'}
    identity=archive.get('campaign',{}).get('id')
    return Reconciler.normalize_snapshot({'version':1,'campaignId':identity,'events':[{k:v for k,v in e.items() if k in fields} for e in archive.get('story',{}).get('continuity',{}).get('events',[])]},identity)

def no_credentials(value):
    if isinstance(value,dict):
        for k,v in value.items():
            if re.sub(r'[^a-z]','',str(k).lower()) in SECRET_KEYS:
                raise ValueError('A credential field was found in campaign data. Remove it from the record before backing up; account files are kept separately.')
            no_credentials(v)
    elif isinstance(value,list):
        for v in value:no_credentials(v)
    elif isinstance(value,str):
        if SECRET_VALUE.search(value):raise ValueError('A possible provider credential was found in campaign text. Remove it before creating the backup.')

def export_store(store,campaign_id):
    SessionEngine(store);Reconciler(store,campaign_id)
    tables={}
    with store.connection() as db:
        db.execute('BEGIN') # One SQLite read snapshot, even if another request commits.
        for name,columns in TABLES.items():
            rows=[dict(r) for r in db.execute('SELECT '+','.join(columns)+' FROM '+name+' ORDER BY '+columns[0])]
            if name=='campaign_meta':rows=[r for r in rows if r['key'] in META]
            tables[name]=rows
    result={'format':'echo-structured-state','version':FORMAT,'schemaVersion':DB_SCHEMA,'campaignId':campaign_id,'tables':tables,'referenceIndexes':'excluded; rebuild locally'}
    validate_snapshot(result)
    return result

def validate_snapshot(snapshot):
    if not isinstance(snapshot,dict) or snapshot.get('format')!='echo-structured-state' or type(snapshot.get('version')) is not int or snapshot['version']!=FORMAT or type(snapshot.get('schemaVersion')) is not int or snapshot['schemaVersion']!=DB_SCHEMA:
        raise ValueError('Structured database version is incompatible. Update the app before restoring.')
    if not re.fullmatch(r'[A-Za-z0-9_.:-]{1,120}',str(snapshot.get('campaignId',''))):raise ValueError('Invalid structured campaign identity.')
    tables=snapshot.get('tables')
    if not isinstance(tables,dict) or set(tables)!=set(TABLES):raise ValueError('Structured snapshot has missing or unsupported tables.')
    for name,columns in TABLES.items():
        rows=tables[name]
        if not isinstance(rows,list) or len(rows)>100000:raise ValueError('Invalid structured snapshot table.')
        ids=set()
        for row in rows:
            if not isinstance(row,dict) or set(row)!=set(columns) or any(not isinstance(v,(str,int,type(None))) for v in row.values()):raise ValueError('Invalid structured snapshot row.')
            if row[columns[0]] in ids:raise ValueError('Duplicate structured row ID.')
            ids.add(row[columns[0]])
            for k,v in row.items():
                if k in ('body','body_json','mutations','snapshot','receipt'):
                    parsed=json.loads(v);no_credentials(parsed)
            if name=='campaign_records':validate_record(json.loads(row['body']))
    meta={r['key']:r['value'] for r in tables['campaign_meta']}
    if set(meta)-META or meta.get('schema_version')!='1' or not str(meta.get('revision','')).isdigit():raise ValueError('Invalid structured schema metadata.')
    no_credentials(snapshot)
    return snapshot

def import_store(snapshot,path,target_id):
    validate_snapshot(snapshot)
    store=CampaignStore(path);SessionEngine(store);mirror=Reconciler(store,target_id)
    # Internal record IDs remain stable when a restored copy gets a new browser namespace.
    origin=next((r['value'] for r in snapshot['tables']['campaign_meta'] if r['key']=='outcome_origin_campaign_id'),snapshot['campaignId'])
    rebased=None
    with store.connection() as db:
        db.execute('BEGIN IMMEDIATE')
        for name in reversed(list(TABLES)):db.execute('DELETE FROM '+name)
        for name,columns in TABLES.items():
            for raw in snapshot['tables'][name]:
                row=copy.deepcopy(raw)
                if name=='outcome_head':
                    source=json.loads(row['snapshot']);source['campaignId']=target_id
                    rebased=mirror.snapshot(source);row['snapshot']=_json(rebased);row['hash']=digest(rebased)
                    receipt=json.loads(row['receipt']);receipt['restoredFromHash']=receipt.get('hash');receipt['hash']=row['hash'];row['receipt']=_json(receipt)
                db.execute('INSERT INTO '+name+'('+','.join(columns)+') VALUES('+','.join('?' for c in columns)+')',[row[c] for c in columns])
        db.execute('INSERT OR REPLACE INTO campaign_meta VALUES(?,?)',('outcome_origin_campaign_id',origin))
        # Rebuild only campaign fact search. Personal PDF chunks/indexes stay absent.
        db.execute('DELETE FROM campaign_facts');db.execute('DELETE FROM campaign_search')
        for raw in snapshot['tables']['campaign_records']:
            store._write_record(db,validate_record(json.loads(raw['body'])))
            db.execute('UPDATE campaign_records SET created_at=?,updated_at=? WHERE id=?',(raw['created_at'],raw['updated_at'],raw['id']))
        if db.execute('PRAGMA foreign_key_check').fetchall():raise ValueError('Structured records have broken references.')
        if db.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise ValueError('Structured database integrity check failed.')
    # Verify records, session bodies, audit and historical versions round-trip, not just counts.
    restored=export_store(store,target_id)
    for name in ('campaign_records','campaign_audit','campaign_seeded','campaign_sessions','outcome_history','outcome_mirrors'):
        expected=snapshot['tables'][name];actual=restored['tables'][name]
        if name=='campaign_records':
            expected=[{**r,'body':json.loads(r['body'])} for r in expected];actual=[{**r,'body':json.loads(r['body'])} for r in actual]
        if actual!=expected:raise ValueError('Structured restore verification failed: '+name)
    return {'head':mirror.head(),'records':len(restored['tables']['campaign_records']),'originCampaignId':origin}

class WholeBackup:
    def __init__(self,service):
        self.service=service;self.tickets={}

    def create(self,campaign_id,archive,destination):
        if archive.get('campaign',{}).get('id')!=campaign_id:raise ValueError('Backup must match the selected campaign.')
        if type(archive.get('schemaVersion')) is not int or not 1<=archive['schemaVersion']<=3:raise ValueError('Unsupported browser save version.')
        no_credentials(archive)
        def external_media(value):
            if isinstance(value,dict):
                for field,item in value.items():
                    if field in ('image','portrait','sceneImage','path') and isinstance(item,str) and item.startswith(('http://','https://','file:','blob:')) and not item.lower().split('#')[0].split('?')[0].endswith('.pdf'):
                        raise ValueError('External media is not embedded in this backup. Import it into the media library first: '+item[:120])
                    external_media(item)
            elif isinstance(value,list):
                for item in value:external_media(item)
        external_media(archive)
        store,_,_=self.service.engine(campaign_id);snapshot=export_store(store,campaign_id)
        snapshot['browserLedgerHash']=digest(browser_ledger(archive))
        from portable_package import build
        practice_path=self.service.root/'output/releases/Portable-Practice-Campaign.json'
        practice=json.loads(practice_path.read_text()) if practice_path.exists() else None
        build(self.service.root,archive,destination,layered=True,practice_archive=practice,structured_snapshot=snapshot)

    def inspect(self,path):
        from portable_package import verify
        from package_runtime import safe_name
        with zipfile.ZipFile(path) as z:
            info=z.infolist()
            if len(info)>60000 or sum(i.file_size for i in info)>MAX_EXPANDED or any(i.flag_bits&1 or (i.external_attr>>16)&0o170000==0o120000 for i in info):raise ValueError('Backup is too large, encrypted, or contains unsafe links.')
            for i in info:safe_name(i.filename)
        verify(path)
        with zipfile.ZipFile(path) as z:
            manifest=json.loads(z.read('MANIFEST.json'));whole=manifest.get('wholeCampaign')
            if not isinstance(whole,dict) or whole.get('version')!=FORMAT:raise ValueError('Choose a whole-campaign ZIP. Older JSON backups cover browser data only.')
            archive=json.loads(z.read(manifest['groupSave']));snapshot=json.loads(z.read(whole['structuredState']))
            validate_snapshot(snapshot);no_credentials(archive)
            if archive.get('campaign',{}).get('id')!=snapshot['campaignId'] or whole['browserSHA256']!=hashlib.sha256(z.read(manifest['groupSave'])).hexdigest() or whole['structuredSHA256']!=hashlib.sha256(z.read(whole['structuredState'])).hexdigest():raise ValueError('Campaign stores do not match the package manifest.')
            meta={r['key']:r['value'] for r in snapshot['tables']['campaign_meta']};head=snapshot['tables']['outcome_head'];head_hash=head[0]['hash'] if head else '';ledger_hash=digest(browser_ledger(archive))
            if whole.get('databaseSchemaVersion')!=snapshot['schemaVersion'] or whole.get('browserSchemaVersion')!=archive.get('schemaVersion') or whole.get('structuredRevision')!=meta['revision'] or whole.get('referenceIndexesIncluded') is not False or whole.get('credentialsIncluded') is not False or whole.get('serviceHeadHash')!=head_hash or whole.get('browserLedgerHash')!=ledger_hash or whole.get('linkedStores') is not bool(head_hash and head_hash==ledger_hash):
                raise ValueError('Backup versions, revisions or outcome linkage do not match. Keep the original package; it was not restored.')
            if type(archive.get('schemaVersion')) is not int or not 1<=archive['schemaVersion']<=3:raise ValueError('Browser save version is newer than this app supports.')
            media=[];conflicts=[]
            for logical in manifest['requiredMedia']:
                if not logical.startswith('output/campaign/'):raise ValueError('Invalid media path.')
                target=self.service.root/logical
                if not target.resolve().is_relative_to(self.service.root/'output/campaign') or any(p.is_symlink() for p in (target,*target.parents) if p.is_relative_to(self.service.root)):raise ValueError('Unsafe media destination.')
                member=manifest['runtimeFiles'][logical];expected=manifest['sha256'][member]
                if target.exists():
                    h=hashlib.sha256(target.read_bytes()).hexdigest()
                    if h!=expected:conflicts.append(logical)
                else:media.append(logical)
        current=next((s for s in archive['sessions'] if s['id']==archive.get('active')),archive['sessions'][0])
        quests=archive.get('story',{}).get('continuity',{}).get('questGuide',{}).get('records',{})
        summary={'campaign':archive['campaign'],'sessions':len(archive['sessions']),'characters':[{'id':k,'name':v.get('name',k),'level':v.get('level'),'hp':v.get('hp'),'maxHp':v.get('maxHp')} for k,v in current['state'].get('party',{}).items()],
            'quests':[{'id':k,'status':v.get('status'),'published':bool(v.get('published'))} for k,v in quests.items()], 'currentScene':current['state'].get('scene'),
            'browserVersion':archive['schemaVersion'],'databaseVersion':snapshot['schemaVersion'],'databaseCompatible':True,'structuredRecords':len(snapshot['tables']['campaign_records']),
            'missingMedia':media,'conflictingMedia':conflicts,'requiredMedia':len(manifest['requiredMedia']),'linkedStores':whole.get('linkedStores',False),'sourceIndexes':'Excluded; rebuild locally','credentials':'Excluded'}
        return manifest,archive,snapshot,summary

    def stage(self,path):
        manifest,archive,snapshot,summary=self.inspect(path)
        identifier=secrets.token_urlsafe(32);folder=Path(tempfile.mkdtemp(prefix='echo-whole-restore-'))
        folder.chmod(0o700);stored=folder/'backup.zip'
        try:shutil.copyfile(path,stored)
        except Exception:shutil.rmtree(folder,ignore_errors=True);raise
        self._prune()
        if len(self.tickets)>=8:shutil.rmtree(folder);raise ValueError('Finish or cancel another restore preview before opening a new one.')
        self.tickets[identifier]={'folder':folder,'zip':stored,'manifest':manifest,'archive':archive,'snapshot':snapshot,'at':time.monotonic(),'campaignId':None,'committed':False}
        return {'ticket':identifier,'archive':archive,'preview':summary}

    def _prune(self):
        for identifier,t in list(self.tickets.items()):
            if time.monotonic()-t['at']>3600:shutil.rmtree(t['folder'],ignore_errors=True);del self.tickets[identifier]

    def ticket(self,identifier):
        self._prune()
        if identifier not in self.tickets:raise ValueError('Restore preview expired. Open the backup again.')
        return self.tickets[identifier]

    def prepare(self,identifier,target_id):
        t=self.ticket(identifier)
        if not isinstance(target_id,str) or not re.fullmatch(r'campaign-[A-Za-z0-9-]{1,70}',target_id):raise ValueError('Restore into a new campaign identity.')
        destination=self.service.state_dir/hashlib.sha256(target_id.encode()).hexdigest()[:24]
        if t['campaignId']:
            if t['campaignId']!=target_id:raise ValueError('Restore identity changed after preparation.')
            return t['prepared']
        if destination.exists() or target_id in self.service.engines:raise ValueError('That campaign already exists. It will not be overwritten.')
        _,_,_,summary=self.inspect(t['zip'])
        if summary['conflictingMedia']:raise ValueError('Existing artwork differs from this backup. Extract the portable release into a separate folder; existing artwork was not replaced.')
        candidate=t['folder']/'database';candidate.mkdir()
        try:result=import_store(t['snapshot'],candidate/'campaign.sqlite3',target_id)
        except Exception:shutil.rmtree(candidate,ignore_errors=True);raise
        t.update(campaignId=target_id,destination=destination,candidate=candidate,prepared=result)
        return result

    def commit(self,identifier,target_id):
        t=self.ticket(identifier)
        if t['campaignId']!=target_id:raise ValueError('Prepare the matching campaign before completing restore.')
        if t['committed']:return t['prepared']
        if t['destination'].exists():raise ValueError('Restore destination appeared. Existing campaign was left intact.')
        created=[]
        try:
            with zipfile.ZipFile(t['zip']) as z:
                for logical in t['manifest']['requiredMedia']:
                    target=self.service.root/logical;member=t['manifest']['runtimeFiles'][logical];expected=t['manifest']['sha256'][member]
                    if target.exists():
                        if hashlib.sha256(target.read_bytes()).hexdigest()!=expected:raise ValueError('Artwork changed since preview. Review restore again.')
                        continue
                    if not target.resolve().is_relative_to(self.service.root/'output/campaign') or any(p.is_symlink() for p in (target,*target.parents) if p.is_relative_to(self.service.root)):raise ValueError('Unsafe restore media path.')
                    target.parent.mkdir(parents=True,exist_ok=True)
                    fd=os.open(target,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600);created.append(target)
                    with os.fdopen(fd,'wb') as dst,z.open(member) as src:shutil.copyfileobj(src,dst)
                    if hashlib.sha256(target.read_bytes()).hexdigest()!=expected:raise ValueError('Restored artwork hash mismatch.')
            self.service.state_dir.mkdir(parents=True,exist_ok=True,mode=0o700)
            os.rename(t['candidate'],t['destination']) # The prepared DB becomes visible as one directory.
            t['committed']=True
            return t['prepared']
        except Exception:
            for target in created:target.unlink(missing_ok=True)
            raise

    def cancel(self,identifier):
        t=self.tickets.pop(identifier,None)
        if t:shutil.rmtree(t['folder'],ignore_errors=True)
        return {'cancelled':True}
