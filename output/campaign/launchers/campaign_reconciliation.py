"""Reviewed browser outcomes are authoritative; SQLite is their searchable projection.

History is retained privately, never re-indexed as current evidence. This module
does not touch character, inventory, money, token or exploration quantities.
"""
import hashlib
import json
from campaign_store import RevisionConflict, validate_record, _json, _now


def digest(value):
    return hashlib.sha256(_json(value).encode()).hexdigest()


def key(prefix, value):
    return prefix + hashlib.sha256(value.encode()).hexdigest()[:24]


class Reconciler:
    def __init__(self, store, campaign_id):
        self.store, self.campaign_id = store, campaign_id
        with store.connection() as db:
            db.executescript('''
                CREATE TABLE IF NOT EXISTS outcome_head(singleton INTEGER PRIMARY KEY CHECK(singleton=1), hash TEXT, snapshot TEXT, receipt TEXT);
                CREATE TABLE IF NOT EXISTS outcome_mirrors(id TEXT PRIMARY KEY, body_hash TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS outcome_history(sequence INTEGER PRIMARY KEY, created_at TEXT, hash TEXT, snapshot TEXT, receipt TEXT);
            ''')

    def snapshot(self, raw):
        return self.normalize_snapshot(raw,self.campaign_id)

    @staticmethod
    def normalize_snapshot(raw,campaign_id):
        if not isinstance(raw, dict) or set(raw) != {'version', 'campaignId', 'events'} or type(raw.get('version')) is not int or raw.get('version') != 1 or raw.get('campaignId') != campaign_id:
            raise ValueError('Choose the matching campaign and a supported outcome snapshot.')
        events = raw['events']
        if not isinstance(events, list) or len(events) > 5000:
            raise ValueError('Outcome snapshot supports up to 5,000 events.')
        seen = set()
        fields = {'id','title','detail','publicTitle','playerText','session','kind','status','basis','source','approved','approvedAt','share','knows','recipients','replaces','quests','markers','tracks','relationships','serviceLink'}
        result = []
        for event in events:
            if not isinstance(event, dict) or set(event) - fields:
                raise ValueError('Outcome snapshot contains unsupported fields.')
            e = dict(event)
            for field, maximum in {'id':80,'title':120,'detail':2500,'publicTitle':120,'playerText':1800,'session':80,'source':250,'approvedAt':40}.items():
                if not isinstance(e.get(field, ''), str) or len(e.get(field, '')) > maximum:
                    raise ValueError('Invalid outcome ' + field)
                e.setdefault(field, '')
            if not e['id'] or e['id'] in seen:
                raise ValueError('Outcome IDs must be present and unique.')
            seen.add(e['id'])
            if 'serviceLink' in e:
                link=e['serviceLink']
                if not isinstance(link,dict) or set(link)!={'origin','recordId','signature'} or any(not isinstance(v,str) or len(v)>160 for v in link.values()) or len(link['signature'])!=64:
                    raise ValueError('Invalid structured service origin.')
            if e.get('kind') not in ('discovery','rescue','escape','promise','debt','custody','quest','other') or e.get('status') not in ('confirmed','completed','rumor','planned') or e.get('basis') not in ('Observed','Inferred','Claimed','Open') or type(e.get('approved')) is not bool or e.get('share') not in ('party','private'):
                raise ValueError('Outcome status and audience must be explicit.')
            for field in ('knows','recipients','replaces'):
                values = e.get(field, [])
                if not isinstance(values, list) or len(values) > 40 or any(not isinstance(v, str) or len(v)>80 for v in values):
                    raise ValueError('Invalid outcome audience or replacement IDs.')
                e[field] = list(dict.fromkeys(values))
            specs = {'quests':({'id','state','stepId'},15), 'markers':({'scene','point','reveal'},15),
                     'tracks':({'kind','key','subject','holder','owedTo','state','note','public'},20),
                     'relationships':({'npcId','changes','promiseKeys'},20)}
            for field, (allowed, maximum) in specs.items():
                values = e.get(field, [])
                if not isinstance(values, list) or len(values)>maximum or any(not isinstance(v,dict) or set(v)-allowed for v in values):
                    raise ValueError('Invalid linked outcome fields: '+field)
                # Reject objects masquerading as IDs/text and non-boolean disclosure flags.
                for v in values:
                    required={'quests':('id',),'markers':('scene','point'),'tracks':('kind','key','subject'),'relationships':('npcId',)}[field]
                    if any(not isinstance(v.get(name),str) or not v[name].strip() for name in required): raise ValueError('Linked records need stable identifiers.')
                    if field=='quests' and v.get('state') not in ('reference','planned','active','paused','completed','failed','abandoned','open','bypassed'): raise ValueError('Invalid quest state.')
                    if field=='tracks' and (v.get('kind') not in ('promise','debt','rescue','escape','custody') or v.get('state') not in ('open','resolved','unknown')): raise ValueError('Invalid tracker state.')
                    for name, value in v.items():
                        if name in ('public','reveal'):
                            if type(value) is not bool: raise ValueError('Disclosure flag must be boolean.')
                        elif name == 'changes':
                            if not isinstance(value,dict) or set(value)-{'wants','last','attitude','next','whereabouts'} or any(not isinstance(t,str) or len(t)>1500 for t in value.values()): raise ValueError('Invalid relationship fields.')
                        elif name == 'promiseKeys':
                            if not isinstance(value,list) or any(not isinstance(t,str) or len(t)>100 for t in value): raise ValueError('Invalid promise keys.')
                        elif not isinstance(value,str) or len(value)>600:
                            raise ValueError('Invalid linked value.')
                e[field] = values
            result.append(e)
        return {'version':1,'campaignId':campaign_id,'events':result}

    def head(self):
        with self.store.connection() as db:
            row = db.execute('SELECT * FROM outcome_head WHERE singleton=1').fetchone()
            count = db.execute('SELECT COUNT(*) FROM outcome_history').fetchone()[0]
        return {'hash':row['hash'] if row else '', 'receipt':json.loads(row['receipt']) if row else None,
                'historyCount':count, 'revision':self.store.revision()}

    def project(self, snapshot):
        with self.store.connection() as db:
            origin=db.execute("SELECT value FROM campaign_meta WHERE key='outcome_origin_campaign_id'").fetchone()
        identity=origin['value'] if origin else self.campaign_id
        events = snapshot['events']
        hidden = {v for e in events if e['approved'] and e['status']!='planned' for v in e['replaces']}
        active = [e for e in events if e['approved'] and e['status']!='planned' and e['id'] not in hidden]
        records, current = {}, {}
        for e in active:
            rid = key('import-', identity+':'+e['id'])  # Preserve internal IDs in a restored namespace.
            shared = e['share']=='party' and 'party' in e['knows'] and bool(e['publicTitle'].strip() and e['playerText'].strip())
            npc_ids = [v if v.startswith('npc-') else 'npc-'+v for v in e['knows'] if v!='party' and not v.startswith('pc-')]
            epistemic = 'inferred' if e['basis']=='Inferred' else 'unresolved' if e['status']=='rumor' or e['basis'] in ('Claimed','Open') else 'confirmed'
            proof = [{'source_id':'outcome:'+e['id'], 'filename':'Approved browser outcome ledger', 'excerpt':e['source']}]
            facts = [{'id':rid+'-dm','text':e['detail'] or e['title'],'visibility':'dm','epistemic':epistemic,'provenance':proof}]
            if shared:
                facts.append({'id':rid+'-shared','text':e['playerText'],'visibility':'player','player_safe':True,'npc_ids':npc_ids,'epistemic':epistemic,'provenance':proof})
            # Owner-only wording never becomes a generic player/service fact.
            records[rid] = validate_record({'id':rid,'kind':{'discovery':'clue','promise':'relationship','debt':'relationship','custody':'item','quest':'quest'}.get(e.get('kind'),'choice'),
                'name':e['publicTitle'] if shared else e['title'], 'visibility':'player' if shared else 'dm','player_safe':shared,'npc_ids':npc_ids,
                'epistemic':epistemic,'status':e['status'],'data':{'authority':'browser-outcome','scope':'historical-event','outcome_id':e['id'],'session':e['session'],
                    'knows':e['knows'],'recipients':e['recipients'],'quests':e['quests'],'markers':e['markers'],'tracks':e['tracks'],
                    **({'service_origin':e['serviceLink']} if 'serviceLink' in e else {})},'provenance':proof,'facts':facts})
            if e['status']=='rumor': continue
            for q in e['quests']:
                if q.get('state')!='reference': current[('quest',q.get('id',''),q.get('stepId',''))] = (e,q,False)
            for t in e['tracks']: current[('track',t.get('kind',''),t.get('key',''))] = (e,t,shared and t.get('public') is True)
            for m in e['markers']:
                # Browser reveals are a union of effective approved reveals. A
                # later false flag does not hide an independently revealed area.
                if shared and m.get('reveal') is True: current[('marker',m.get('scene',''),m.get('point',''))] = (e,m,False)
            for r in e['relationships']:
                for field, value in r.get('changes',{}).items(): current[('relationship',r.get('npcId',''),field)] = (e,{'value':value},False)
        for identity,(e,value,public) in current.items():
            rid=key('current-', json.dumps(identity,separators=(',',':')))
            proof=[{'source_id':'outcome:'+e['id'],'filename':'Current linked state from approved outcomes','excerpt':e['source']}]
            text=' / '.join(identity)+': '+json.dumps(value,ensure_ascii=False,sort_keys=True)
            # Linked status is DM-only by default. Existing browser quest publication remains authoritative.
            records[rid]=validate_record({'id':rid,'kind':{'quest':'quest','track':'relationship','marker':'location','relationship':'relationship'}[identity[0]],
                'name':'Current '+identity[0], 'visibility':'dm','epistemic':'inferred' if e['basis']=='Inferred' else 'unresolved' if e['basis'] in ('Claimed','Open') else 'confirmed',
                'data':{'authority':'browser-outcome','scope':'current-linked-state','key':list(identity),'outcome_id':e['id'],'value':value},'provenance':proof,
                'facts':[{'id':rid+'-dm','text':text,'visibility':'dm','epistemic':'confirmed' if e['basis']=='Observed' else 'unresolved','provenance':proof}]})
        return records

    def preview(self, raw):
        snapshot=self.snapshot(raw); records=self.project(snapshot); head=self.head()
        with self.store.connection() as db:
            managed={r['id']:r['body_hash'] for r in db.execute('SELECT * FROM outcome_mirrors')}
            existing={r['id']:json.loads(r['body']) for r in db.execute('SELECT id,body FROM campaign_records')}
        changes=[]; conflicts=[]
        for rid in sorted(set(managed)|set(records)):
            before=existing.get(rid); after=records.get(rid)
            if before==after: continue
            changes.append({'id':rid,'op':'upsert' if after else 'delete','before':before,'after':after})
            # An old reviewed import is also preserved and explicitly reviewed, never silently overwritten.
            if (rid in managed and (not before or digest(before)!=managed[rid])) or (rid not in managed and before is not None):
                conflicts.append({'id':rid,'before':before,'proposed':after,'reason':'Service record differs from the last linked outcome or predates the mirror.'})
        value={'snapshot':snapshot,'hash':digest(snapshot),'baseHash':head['hash'],'expectedRevision':head['revision'],'changes':changes,'conflicts':conflicts,
               'unchanged':head['hash']==digest(snapshot) and not changes}
        value['reviewToken']=digest({k:value[k] for k in ('hash','baseHash','expectedRevision','changes','conflicts')})
        return value

    def apply(self, payload):
        if payload.get('approved') is not True: raise ValueError('Review and approve the linked outcome changes first.')
        review=self.preview(payload.get('snapshot'))
        if review['unchanged']:
            return {**self.head(), 'unchanged':True}  # Lost acknowledgement replay; no new revision or reward.
        if payload.get('baseHash')!=review['baseHash'] or payload.get('expectedRevision')!=review['expectedRevision'] or payload.get('reviewToken')!=review['reviewToken']:
            raise RevisionConflict('Campaign changed after review. Review linked outcomes again.')
        if review['conflicts'] and set(payload.get('resolveIds',[]))!={r['id'] for r in review['conflicts']}:
            raise RevisionConflict('Review every conflicting record before using the authoritative browser outcome.')
        # A stale replay cannot restore an older head: its baseHash and service revision were checked above.
        mutations=[{'op':'upsert','record':c['after']} if c['after'] else {'op':'delete','id':c['id']} for c in review['changes'] if c['after'] or c['before']]
        def commit(db,result):
            receipt={'hash':review['hash'],'revision':result['revision'],'events':len(review['snapshot']['events']),'changes':len(mutations),'at':_now()}
            db.execute('INSERT INTO outcome_history(created_at,hash,snapshot,receipt) VALUES(?,?,?,?)',(_now(),review['hash'],_json(review['snapshot']),_json({'receipt':receipt,'changes':review['changes']})))
            db.execute('INSERT OR REPLACE INTO outcome_head VALUES(1,?,?,?)',(review['hash'],_json(review['snapshot']),_json(receipt)))
            db.execute('DELETE FROM outcome_mirrors')
            for rid,record in self.project(review['snapshot']).items(): db.execute('INSERT INTO outcome_mirrors VALUES(?,?)',(rid,digest(record)))
        self.store.apply_mutations(mutations,review['expectedRevision'],commit_hook=commit,managed=True)
        return self.head()

    def history(self):
        with self.store.connection() as db:
            rows=[dict(r) for r in db.execute('SELECT sequence,created_at,hash,receipt FROM outcome_history ORDER BY sequence DESC LIMIT 100')]
        return [{**r,'receipt':json.loads(r['receipt'])['receipt']} for r in rows]

    def history_detail(self, sequence):
        if type(sequence) is not int or sequence<1: raise ValueError('Choose a linked history revision.')
        with self.store.connection() as db:
            row=db.execute('SELECT * FROM outcome_history WHERE sequence=?',(sequence,)).fetchone()
        if not row: raise ValueError('That linked revision does not exist.')
        return {**dict(row),'snapshot':json.loads(row['snapshot']),'receipt':json.loads(row['receipt'])}
