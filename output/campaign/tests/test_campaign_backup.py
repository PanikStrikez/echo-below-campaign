"""Whole-campaign backups and restore faults, all in temporary stores."""
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import zipfile
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'launchers'))
from campaign_service import CampaignService
from campaign_backup import export_store,import_store,validate_snapshot
from campaign_reconciliation import Reconciler
from test_campaign_reconciliation import event


class WholeBackupTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='echo-whole-test-');self.addCleanup(self.tmp.cleanup)
        self.base=Path(self.tmp.name);self.root=self.base/'root';app=self.root/'output/campaign';app.mkdir(parents=True)
        (app/'Session-01-TV-Display.html').write_text('practice fixture')
        (app/'assets').mkdir();(app/'assets/scene.svg').write_text('<svg>Fixture scene</svg>')
        (self.root/'sources').mkdir();(self.root/'sources/personal-book.pdf').write_bytes(b'PERSONAL_SOURCE_BOOK_CONTENT')
        releases=self.root/'output/releases';releases.mkdir()
        template=Path(__file__).resolve().parents[2]/'releases/Blank-Campaign-Template.json'
        (releases/template.name).write_bytes(template.read_bytes())
        self.service=CampaignService(self.base/'private',self.root)
        self.store,self.sessions,_=self.service.engine('practice-source')
        self.sessions.analyze('Private session','The keeper promised help.','We found a clue.')
        self.mirror=Reconciler(self.store,'practice-source')
        self.ledger={'version':1,'campaignId':'practice-source','events':[event()]}
        review=self.mirror.preview(self.ledger);self.mirror.apply({**review,'approved':True,'resolveIds':[]})
        with self.store.connection() as db:
            db.execute("INSERT INTO campaign_sources VALUES('book','personal-book.pdf','abc','dm','pdf',1,'now','{}')")
            db.execute("INSERT INTO campaign_chunks VALUES('book-chunk','book',1,0,'BOOK_INDEX_SECRET','abc','confirmed')")
        self.archive={'format':'echo-below-campaign-v2','schemaVersion':3,'campaign':{'id':'practice-source','name':'Practice Source'},'active':'one',
          'sessions':[{'id':'one','name':'One','state':{'schemaVersion':3,'scene':'town','party':{'pc-trista':{'name':'Practice character','level':4,'hp':29,'maxHp':29}},'tokens':[{'id':'pc-trista','x':42}], 'sceneFog':{'town':[{'x':1}]},'scenes':[{'id':'town','image':'assets/scene.svg'}]}}],
          'story':{'continuity':{'events':[event()],'questGuide':{'records':{'main':{'status':'active','published':None}}}}},'presentation':{'media':[]},'mediaFiles':{}}
        self.zip=self.base/'whole.zip';self.service.backups.create('practice-source',self.archive,self.zip)
        self.addCleanup(lambda:[self.service.backups.cancel(k) for k in list(self.service.backups.tickets)])

    def test_one_package_includes_both_stores_and_matching_versions_without_books_or_credentials(self):
        with zipfile.ZipFile(self.zip) as z:
            m=json.loads(z.read('MANIFEST.json'));w=m['wholeCampaign'];self.assertTrue(w['linkedStores'])
            self.assertEqual(w['browserSchemaVersion'],3);self.assertEqual(w['databaseSchemaVersion'],1)
            structured=json.loads(z.read(w['structuredState']));self.assertTrue(structured['tables']['campaign_sessions'])
            self.assertFalse(any('personal-book.pdf' in n or n.endswith('.sqlite3') for n in z.namelist()))
            data=z.read(w['structuredState']);self.assertNotIn(b'BOOK_INDEX_SECRET',data);self.assertNotIn(b'PERSONAL_SOURCE_BOOK_CONTENT',data)
            self.assertFalse(w['credentialsIncluded']);self.assertFalse(w['referenceIndexesIncluded'])

    def test_preview_has_identity_characters_quests_scene_missing_media_and_database_compatibility(self):
        (self.root/'output/campaign/assets/scene.svg').unlink()
        value=self.service.backups.stage(self.zip);p=value['preview']
        self.assertEqual(p['campaign']['id'],'practice-source');self.assertEqual(p['characters'][0]['hp'],29)
        self.assertEqual(p['quests'][0]['status'],'active');self.assertEqual(p['currentScene'],'town')
        self.assertTrue(p['databaseCompatible']);self.assertEqual(p['missingMedia'],['output/campaign/assets/scene.svg'])

    def test_restore_both_stores_preserves_ids_history_drafts_privacy_and_fact_search(self):
        staged=self.service.backups.stage(self.zip);target='campaign-isolated-restore'
        result=self.service.backups.prepare(staged['ticket'],target);self.service.backups.commit(staged['ticket'],target)
        restored,sessions,_=self.service.engine(target)
        self.assertEqual(restored.list_records(),self.store.list_records());self.assertEqual(sessions.list(),self.sessions.list())
        self.assertEqual(json.dumps(Reconciler(restored,target).history()),json.dumps(self.mirror.history()))
        self.assertEqual(restored.summary()['sources'],0);self.assertEqual(restored.summary()['chunks'],0)
        self.assertIn('PRIVATE_DESTINATION',json.dumps(restored.search('PRIVATE_DESTINATION')))
        self.assertNotIn('PRIVATE_DESTINATION',json.dumps(restored.search('PRIVATE_DESTINATION','player')))
        ledger={**self.ledger,'campaignId':target};review=Reconciler(restored,target).preview(ledger)
        self.assertTrue(review['unchanged']);self.assertEqual(review['changes'],[])
        self.assertEqual(result['originCampaignId'],'practice-source');self.assertEqual(staged['archive'],self.archive)

    def test_absent_artwork_is_installed_with_identical_hash(self):
        path=self.root/'output/campaign/assets/scene.svg';expected=hashlib.sha256(path.read_bytes()).hexdigest();path.unlink()
        value=self.service.backups.stage(self.zip);self.service.backups.prepare(value['ticket'],'campaign-missing-art');self.service.backups.commit(value['ticket'],'campaign-missing-art')
        self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),expected)

    def test_existing_artwork_conflict_blocks_without_overwriting_the_original(self):
        path=self.root/'output/campaign/assets/scene.svg';path.write_text('different original')
        value=self.service.backups.stage(self.zip);self.assertTrue(value['preview']['conflictingMedia'])
        with self.assertRaises(ValueError):self.service.backups.prepare(value['ticket'],'campaign-blocked')
        self.assertEqual(path.read_text(),'different original')

    def test_interrupted_database_prepare_keeps_original_store_usable(self):
        value=self.service.backups.stage(self.zip);before=export_store(self.store,'practice-source')
        with patch('campaign_store.CampaignStore._write_record',side_effect=RuntimeError('Interrupted database restore')):
            with self.assertRaises(RuntimeError):self.service.backups.prepare(value['ticket'],'campaign-interrupted')
        self.assertEqual(export_store(self.store,'practice-source'),before);self.assertTrue(self.store.search('letter'))

    def test_interrupted_media_commit_keeps_original_and_removes_partial_new_artwork(self):
        path=self.root/'output/campaign/assets/scene.svg';path.unlink()
        value=self.service.backups.stage(self.zip);self.service.backups.prepare(value['ticket'],'campaign-failed-art')
        before=export_store(self.store,'practice-source')
        with patch('campaign_backup.shutil.copyfileobj',side_effect=RuntimeError('Interrupted media restore')):
            with self.assertRaises(RuntimeError):self.service.backups.commit(value['ticket'],'campaign-failed-art')
        self.assertFalse(path.exists());self.assertEqual(export_store(self.store,'practice-source'),before)

    def test_replay_is_idempotent_and_existing_campaign_cannot_be_replaced(self):
        value=self.service.backups.stage(self.zip);self.service.backups.prepare(value['ticket'],'campaign-replay')
        first=self.service.backups.commit(value['ticket'],'campaign-replay');second=self.service.backups.commit(value['ticket'],'campaign-replay');self.assertEqual(first,second)
        other=self.service.backups.stage(self.zip)
        with self.assertRaises(ValueError):self.service.backups.prepare(other['ticket'],'campaign-replay')

    def test_future_database_schema_and_provider_keys_are_rejected_safely(self):
        snapshot=export_store(self.store,'practice-source');snapshot['schemaVersion']=2
        with self.assertRaises(ValueError):validate_snapshot(snapshot)
        record=self.store.get_record(next(r['id'] for r in self.store.list_records() if r['data']['scope']=='historical-event'))
        record['data']['apiKey']='DO_NOT_EXPORT'
        with self.store.connection() as db:db.execute('UPDATE campaign_records SET body=? WHERE id=?',(json.dumps(record),record['id']))
        with self.assertRaises(ValueError):self.service.backups.create('practice-source',self.archive,self.base/'blocked.zip')

    def test_corrupt_archive_and_wrong_browser_version_leave_original_usable(self):
        corrupt=self.base/'corrupt.zip';corrupt.write_bytes(b'Interrupted ZIP bytes')
        with self.assertRaises(zipfile.BadZipFile):self.service.backups.stage(corrupt)
        archive=copy.deepcopy(self.archive);archive['schemaVersion']=4
        with self.assertRaises(ValueError):self.service.backups.create('practice-source',archive,self.base/'future.zip')
        self.assertTrue(self.store.list_records())

    def test_unsynced_heads_are_preserved_but_reported_for_review(self):
        archive=copy.deepcopy(self.archive);archive['story']['continuity']['events'][0]['detail']='New browser wording, not yet mirrored'
        path=self.base/'pending.zip';self.service.backups.create('practice-source',archive,path)
        value=self.service.backups.stage(path);self.assertFalse(value['preview']['linkedStores'])
        self.assertEqual(value['archive']['story']['continuity']['events'][0]['detail'],'New browser wording, not yet mirrored')

    def test_cancel_destroys_only_private_staging(self):
        value=self.service.backups.stage(self.zip);folder=self.service.backups.ticket(value['ticket'])['folder']
        self.service.backups.cancel(value['ticket']);self.assertFalse(folder.exists());self.assertTrue(self.store.search('letter'))

    def test_external_artwork_is_not_silently_reported_as_backed_up(self):
        archive=copy.deepcopy(self.archive);archive['sessions'][0]['state']['scenes'][0]['image']='https://example.invalid/live-art.png'
        with self.assertRaisesRegex(ValueError,'Import it into the media library'):
            self.service.backups.create('practice-source',archive,self.base/'external.zip')

    def test_package_health_checks_both_storage_versions(self):
        from package_runtime import health
        folder=self.base/'extracted'
        with zipfile.ZipFile(self.zip) as z:z.extractall(folder)
        checked=health(folder);self.assertTrue(checked['wholeCampaignIncluded']);self.assertEqual(checked['databaseVersion'],1)
        manifest_path=folder/'MANIFEST.json';manifest=json.loads(manifest_path.read_text());manifest['wholeCampaign']['databaseSchemaVersion']=2;manifest_path.write_text(json.dumps(manifest))
        with self.assertRaisesRegex(ValueError,'Unsupported whole-campaign'):
            health(folder)

if __name__=='__main__':unittest.main()
