"""Real isolated SQLite reconciliation; no live campaigns, network, or providers."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'launchers'))
from campaign_store import CampaignStore, RevisionConflict
from campaign_reconciliation import Reconciler, key
from campaign_service import CampaignService


def event(identifier='found', **values):
    return {'id':identifier,'title':'Discovery','detail':'PRIVATE_DESTINATION','publicTitle':'A clue','playerText':'The party found a letter.',
            'session':'Practice','kind':'discovery','status':'confirmed','basis':'Observed','source':'DM reviewed play','approved':True,
            'approvedAt':'2026-10-11','share':'party','knows':['party','sildar'],'recipients':[],'replaces':[],
            'quests':[{'id':'main','stepId':'letter','state':'completed'}],'markers':[{'scene':'town','point':'letter','reveal':True}],
            'tracks':[{'kind':'custody','key':'letter','subject':'Letter','holder':'Trista','state':'open','note':'Exact quantities unchanged','public':True}],
            **values}


class ReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(prefix='echo-reconcile-');self.addCleanup(self.tmp.cleanup)
        self.store=CampaignStore(Path(self.tmp.name)/'private.sqlite3');self.mirror=Reconciler(self.store,'practice')
        self.snapshot={'version':1,'campaignId':'practice','events':[event()]}

    def reviewed(self,snapshot=None):
        r=self.mirror.preview(snapshot or self.snapshot)
        return {'snapshot':r['snapshot'],'baseHash':r['baseHash'],'expectedRevision':r['expectedRevision'],'reviewToken':r['reviewToken'],
                'approved':True,'resolveIds':[c['id'] for c in r['conflicts']]}

    def test_discovery_has_stable_linked_views_and_safe_audiences(self):
        self.mirror.apply(self.reviewed());records=self.store.list_records()
        self.assertEqual(len(records),4)
        self.assertEqual({r['data']['scope'] for r in records},{'historical-event','current-linked-state'})
        self.assertTrue(all(r['data']['outcome_id']=='found' for r in records))
        player=json.dumps(self.store.list_records('player'));self.assertIn('party found a letter',player);self.assertNotIn('PRIVATE_DESTINATION',player)
        npc=json.dumps(self.store.search('letter',audience='npc',npc_id='npc-sildar'));self.assertIn('party found a letter',npc);self.assertNotIn('PRIVATE_DESTINATION',npc)
        self.assertEqual(self.store.search('letter',audience='npc',npc_id='npc-durnan'),[])

    def test_owner_only_and_private_destination_never_enter_generic_player_search(self):
        self.snapshot['events']=[event(share='private',knows=['pc-trista','sildar'],recipients=['pc-trista'],playerText='TRISTA_ONLY')]
        self.mirror.apply(self.reviewed())
        for audience,who in [('player',None),('npc','npc-sildar')]:
            self.assertEqual(self.store.search('TRISTA_ONLY PRIVATE_DESTINATION',audience=audience,npc_id=who),[])
        self.assertNotIn('TRISTA_ONLY',json.dumps(self.store.list_records()))
        self.assertEqual(len(self.store.list_records()),3) # private markers are never projected

    def test_repeated_import_and_lost_ack_do_not_repeat_events_or_rewards(self):
        request=self.reviewed();first=self.mirror.apply(request);second=self.mirror.apply(request)
        self.assertEqual(first['revision'],second['revision']);self.assertEqual(second['historyCount'],1)
        self.assertEqual(len(self.store.list_records()),4)
        self.assertFalse(any('quantity' in r['data'] or 'money' in r['data'] for r in self.store.list_records()))

    def test_correction_replaces_search_but_preserves_original_history(self):
        old=self.reviewed();self.mirror.apply(old)
        self.snapshot['events'][0].update(detail='CORRECTED_FACT',playerText='Corrected wording.',tracks=[])
        self.mirror.apply(self.reviewed());self.assertEqual(self.store.search('PRIVATE_DESTINATION'),[])
        self.assertTrue(self.store.search('CORRECTED_FACT'))
        history=json.dumps([self.mirror.history_detail(r['sequence']) for r in self.mirror.history()]);self.assertIn('PRIVATE_DESTINATION',history);self.assertIn('CORRECTED_FACT',history)
        with self.assertRaises(RevisionConflict):self.mirror.apply(old) # stale replay cannot rewind

    def test_withdrawal_and_undo_restore_without_erasing_versions(self):
        original=copy.deepcopy(self.snapshot);self.mirror.apply(self.reviewed())
        self.snapshot['events'][0]['approved']=False;self.mirror.apply(self.reviewed());self.assertEqual(self.store.list_records(),[])
        self.mirror.apply(self.reviewed(original));self.assertEqual(len(self.store.list_records()),4);self.assertEqual(self.mirror.head()['historyCount'],3)

    def test_current_state_does_not_erase_historical_event(self):
        self.snapshot['events']=[event('captured',detail='Gundren was captured.',tracks=[{'kind':'rescue','key':'gundren','subject':'Gundren','holder':'Captor','state':'open'}]),
            event('rescued',detail='Gundren is now at the inn.',tracks=[{'kind':'rescue','key':'gundren','subject':'Gundren','holder':'Inn','state':'resolved'}])]
        self.mirror.apply(self.reviewed());results=self.store.search('Gundren')
        self.assertIn('Inn',results[0]['text']);self.assertIn('Current state',results[0]['source_warning'])
        self.assertTrue(any('captured' in r['text'] and 'Historical event' in r['source_warning'] for r in results))

    def test_stale_review_and_service_conflict_require_explicit_resolution(self):
        rid=key('import-','practice:found');record={'id':rid,'kind':'clue','name':'Old import','facts':[{'id':'old-fact','text':'OLD_IMPORT','visibility':'dm'}]}
        self.store.upsert_record(record,0)
        r=self.mirror.preview(self.snapshot);self.assertEqual(len(r['conflicts']),1)
        request=self.reviewed();request['resolveIds']=[]
        with self.assertRaises(RevisionConflict):self.mirror.apply(request)
        self.assertIn('OLD_IMPORT',json.dumps(self.store.get_record(rid)))
        request=self.reviewed();self.store.upsert_record({'id':'unrelated','kind':'npc','name':'NPC'},self.store.revision())
        with self.assertRaises(RevisionConflict):self.mirror.apply(request)
        self.mirror.apply(self.reviewed());self.assertIn('OLD_IMPORT',json.dumps(self.mirror.history_detail(1)))

    def test_managed_outcomes_cannot_be_edited_independently(self):
        self.mirror.apply(self.reviewed());record=self.store.list_records()[0];record['name']='Drift'
        with self.assertRaises(RevisionConflict):self.store.upsert_record(record,self.store.revision())
        with self.assertRaises(RevisionConflict):self.store.apply_mutations([{'op':'delete','id':record['id']}],self.store.revision())

    def test_manual_drift_is_visible_and_unchecked_conflict_is_not_applied(self):
        self.mirror.apply(self.reviewed());rid=key('import-','practice:found')
        with self.store.connection() as db:
            r=self.store.get_record(rid);r['name']='Externally changed';db.execute('UPDATE campaign_records SET body=? WHERE id=?',(json.dumps(r),rid))
        r=self.mirror.preview(self.snapshot);self.assertEqual(len(r['conflicts']),1)
        request=self.reviewed();request['resolveIds']=[]
        with self.assertRaises(RevisionConflict):self.mirror.apply(request)

    def test_interrupted_write_rolls_back_records_head_and_history(self):
        before=self.store.list_records();original=self.store._write_record
        def fail(db,record):
            original(db,record);raise RuntimeError('Representative interrupted write')
        with patch.object(self.store,'_write_record',side_effect=fail):
            with self.assertRaises(RuntimeError):self.mirror.apply(self.reviewed())
        self.assertEqual(self.store.list_records(),before);self.assertEqual(self.mirror.head()['hash'],'');self.assertEqual(self.mirror.history(),[])

    def test_replaced_events_and_rumors_do_not_advance_current_links(self):
        self.snapshot['events']=[event('old'),event('new',replaces=['old'],status='rumor',basis='Claimed')]
        self.mirror.apply(self.reviewed());records=self.store.list_records()
        self.assertEqual(len(records),1);self.assertEqual(records[0]['epistemic'],'unresolved')
        self.assertEqual(records[0]['data']['outcome_id'],'new')

    def test_invalid_campaign_and_extra_data_fail_before_any_write(self):
        for snapshot in [{**self.snapshot,'campaignId':'live'},{**self.snapshot,'apiKey':'DO_NOT_COPY'},
                         {**self.snapshot,'events':[event(),event()]}]:
            with self.assertRaises(ValueError):self.mirror.preview(snapshot)
        self.assertEqual(self.store.revision(),0)

    def test_api_integration_and_campaign_isolation(self):
        service=CampaignService(Path(self.tmp.name)/'service',Path(self.tmp.name)/'public')
        r=service.dispatch('POST','/outcomes/preview',{'snapshot':self.snapshot},'practice')
        result=service.dispatch('POST','/outcomes/apply',{**r,'approved':True,'resolveIds':[]},'practice')
        self.assertEqual(result['historyCount'],1)
        self.assertEqual(service.dispatch('POST','/outcomes/status',{},'other')['hash'],'')

    def test_service_origin_survives_projection_but_never_crosses_audience_boundary(self):
        self.snapshot['events'][0]['serviceLink']={'origin':'session-old','recordId':'PRIVATE_SERVICE_RECORD','signature':'a'*64}
        self.mirror.apply(self.reviewed());record=self.store.get_record(key('import-','practice:found'))
        self.assertEqual(record['data']['service_origin']['recordId'],'PRIVATE_SERVICE_RECORD')
        self.assertNotIn('PRIVATE_SERVICE_RECORD',json.dumps(self.store.list_records('player')))

if __name__=='__main__':unittest.main()
