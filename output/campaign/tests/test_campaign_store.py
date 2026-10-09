"""Executable knowledge-boundary and transaction tests, no credentials/network."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'launchers'))
from campaign_store import CampaignStore, RevisionConflict, validate_record, _opaque_id


def record(identifier='npc-test', visibility='dm'):
    return {'id': identifier, 'kind': 'npc', 'name': 'Private parent name', 'visibility': visibility,
            'data': {'secret': 'private-parent-canary'}, 'epistemic': 'confirmed',
            'provenance': [{'source_id': 'source-fixture', 'filename': 'secret-canary.md', 'page': 7, 'excerpt': 'private-citation-canary'}],
            'facts': [
                {'id': identifier + ':dm', 'text': 'Secret canary crimson vault', 'visibility': 'dm', 'epistemic': 'confirmed'},
                {'id': identifier + ':public', 'text': 'Public canary tavern opens', 'visibility': 'player', 'epistemic': 'confirmed'},
                {'id': identifier + ':spoken', 'text': 'Spoken canary warm meals', 'visibility': 'npc', 'npc_ids': ['npc-durnan'], 'player_safe': True, 'epistemic': 'confirmed'},
                {'id': identifier + ':hidden', 'text': 'Hidden canary expedition log', 'visibility': 'npc', 'npc_ids': ['npc-durnan'], 'player_safe': False, 'epistemic': 'confirmed'},
                {'id': identifier + ':other', 'text': 'Other canary bronze cartography', 'visibility': 'npc', 'npc_ids': ['npc-selise'], 'player_safe': True, 'epistemic': 'inferred'},
                {'id': identifier + ':shared', 'text': 'Shared canary dungeon entry', 'visibility': 'player', 'npc_ids': ['npc-durnan'], 'epistemic': 'unresolved'},
            ]}


class StoreTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.db = Path(self.temp.name) / 'private' / 'campaign.sqlite3'
        self.store = CampaignStore(self.db)

    def test_migration_reopen_is_idempotent(self):
        self.store.upsert_record(record())
        second = CampaignStore(self.db)
        self.assertEqual(second.revision(), 1)
        self.assertEqual(len(second.list_records()), 1)
        self.assertEqual(self.db.stat().st_mode & 0o777, 0o600)
        self.assertEqual(self.db.parent.stat().st_mode & 0o777, 0o700)

    def test_player_fact_projection_never_leaks_parent_or_provenance(self):
        self.store.upsert_record(record())
        self.assertEqual(self.store.list_records('player'), [])
        self.assertIsNone(self.store.get_record('npc-test', 'player'))
        hits = self.store.search('canary', 'player')
        self.assertEqual({row['id'] for row in hits}, {_opaque_id('npc-test:public'), _opaque_id('npc-test:shared')})
        encoded = json.dumps(hits)
        for secret in ('Private parent name', 'private-parent-canary', 'secret-canary.md', 'private-citation-canary', 'crimson', 'expedition'):
            self.assertNotIn(secret, encoded)
        self.assertNotIn('record_id', hits[0])

    def test_npc_disclosure_is_individual_knowledge_intersect_safe(self):
        self.store.upsert_record(record())
        durnan = self.store.search('canary', 'npc', 'npc-durnan')
        self.assertEqual({row['id'] for row in durnan}, {_opaque_id('npc-test:spoken'), _opaque_id('npc-test:shared')})
        selise = self.store.search('canary', 'npc', 'npc-selise')
        self.assertEqual([row['id'] for row in selise], [_opaque_id('npc-test:other')])
        self.assertEqual(self.store.search('canary', 'npc', 'npc-halaster'), [])
        self.assertEqual(len(self.store.search('canary', 'dm')), 6)

    def test_public_parent_never_discloses_private_data_status_or_facts(self):
        value = record(visibility='player')
        value['status'] = 'secret-planned-betrayal'
        self.store.upsert_record(value)
        public = self.store.get_record('npc-test', 'player')
        self.assertEqual(len(public['facts']), 2)
        for key in ('data', 'status', 'npc_ids'):
            self.assertNotIn(key, public)
        self.assertNotIn('private-citation-canary', json.dumps(public))

    def test_invalid_audience_and_missing_npc_fail_closed(self):
        for read in (self.store.list_records, lambda **kw: self.store.get_record('npc-test', **kw), lambda **kw: self.store.search('canary', **kw)):
            with self.assertRaises(ValueError):
                read(audience='DM')
            with self.assertRaises(ValueError):
                read(audience='npc')

    def test_permission_applies_before_limit(self):
        private = record()
        private['facts'] = [{'id': 'hidden-%d' % n, 'text': 'needle ' * 20, 'visibility': 'dm'} for n in range(150)]
        private['facts'].append({'id': 'allowed', 'text': 'needle once', 'visibility': 'player'})
        self.store.upsert_record(private)
        self.assertEqual([row['id'] for row in self.store.search('needle', 'player', limit=1)], [_opaque_id('allowed')])

    def test_batch_validation_is_atomic(self):
        with self.assertRaises(ValueError):
            self.store.apply_mutations([{'op': 'upsert', 'record': record()}, {'op': 'upsert', 'record': {'id': 'bad'}}], 0)
        self.assertEqual(self.store.list_records(), [])
        self.assertEqual(self.store.revision(), 0)

    def test_db_constraint_failure_rolls_back_prior_writes(self):
        first, second = record('first'), record('second')
        second['facts'][0]['id'] = first['facts'][0]['id']
        with self.assertRaises(ValueError):
            self.store.apply_mutations([{'op': 'upsert', 'record': first}, {'op': 'upsert', 'record': second}], 0)
        self.assertEqual(self.store.revision(), 0)
        self.assertEqual(self.store.search('canary'), [])

    def test_optimistic_revision_and_audit(self):
        self.store.upsert_record(record(), expected_revision=0)
        with self.assertRaises(RevisionConflict):
            self.store.upsert_record(record('second'), expected_revision=0)
        self.assertIsNone(self.store.get_record('second'))
        self.assertEqual(self.store.revision(), 1)
        with self.store.connection() as db:
            audit = db.execute('SELECT * FROM campaign_audit').fetchall()
        self.assertEqual(len(audit), 1)
        self.assertEqual(audit[0]['actor'], 'dm')

    def test_replacement_and_delete_remove_search_results(self):
        self.store.upsert_record(record())
        replacement = record()
        replacement['facts'] = []
        self.store.upsert_record(replacement, 1)
        self.assertEqual(self.store.search('canary'), [])
        self.store.apply_mutations([{'op': 'delete', 'id': 'npc-test'}], 2)
        self.assertIsNone(self.store.get_record('npc-test'))

    def test_non_dm_mutations_refused(self):
        for actor in ('player', 'npc', 'npc-durnan', '', 'DM'):
            with self.assertRaises(PermissionError):
                self.store.upsert_record(record(), actor=actor)
        self.assertEqual(self.store.revision(), 0)

    def test_receipt_hook_and_state_commit_are_one_transaction(self):
        with self.store.connection() as db:
            db.execute('CREATE TABLE receipt (id TEXT PRIMARY KEY, revision INTEGER)')
        def fail(db, result):
            db.execute('INSERT INTO receipt VALUES(?,?)', ('session-1', result['revision']))
            raise ValueError('receipt rejected')
        with self.assertRaises(ValueError):
            self.store.apply_mutations([{'op': 'upsert', 'record': record()}], 0, commit_hook=fail)
        self.assertEqual(self.store.revision(), 0)
        self.assertEqual(self.store.list_records(), [])
        with self.store.connection() as db:
            self.assertEqual(db.execute('SELECT COUNT(*) FROM receipt').fetchone()[0], 0)
        def accept(db, result):
            db.execute('INSERT INTO receipt VALUES(?,?)', ('session-1', result['revision']))
        self.store.apply_mutations([], 0, commit_hook=accept)
        self.assertEqual(self.store.revision(), 1)
        with self.assertRaises(ValueError):
            self.store.apply_mutations([], 1)

    def test_unknown_fields_invalid_knowledge_and_bad_json_fail(self):
        for mutate in (
            lambda r: r.update(secret='unknown-field'),
            lambda r: r.update(visibility='public'),
            lambda r: r.update(visibility='npc', npc_ids=[]),
            lambda r: r.update(visibility='dm', player_safe=True),
            lambda r: r.update(epistemic='certain'),
            lambda r: r.update(data={'nan': float('nan')}),
            lambda r: r['facts'][0].update(player_safe='false'),
        ):
            value = record()
            mutate(value)
            with self.assertRaises((ValueError, TypeError)):
                self.store.upsert_record(value)
        self.assertEqual(self.store.revision(), 0)

    def test_semantic_private_ids_do_not_disclose_spoilers(self):
        self.store.upsert_record({'id': 'secret-betrayal', 'name': 'Private villain', 'kind': 'clue',
                                 'provenance': [{'source_id': 'secret-villain-identity'}],
                                 'facts': [{'id': 'secret-betrayal:identity', 'text': 'A safe shared observation.', 'visibility': 'player'}]})
        player = self.store.search('shared', 'player')
        self.assertEqual(len(player), 1)
        encoded = json.dumps(player)
        self.assertNotIn('secret-betrayal', encoded)
        self.assertNotIn('secret-villain-identity', encoded)
        self.assertEqual(player[0]['id'], self.store.search('shared', 'player')[0]['id'])
        self.assertEqual(self.store.search('shared', 'dm')[0]['id'], 'secret-betrayal:identity')

    def test_manual_entries_have_explicit_provenance(self):
        value = self.store.upsert_record({'id': 'manual', 'kind': 'thread', 'name': 'Open question', 'facts': [{'text': 'Where is the wagon?'}]})
        self.assertEqual(value['facts'][0]['provenance'][0]['source_id'], 'dm-entry')

    def test_current_campaign_evidence_precedes_older_sourcebook_matches(self):
        for source_id, authority, text in [('old', 'sourcebook_reference', 'Gundren ' * 20), ('current', 'actual_play', 'Gundren remains missing.')]:
            self.store.put_source({'id': source_id, 'filename': source_id + '.md', 'sha256': source_id,
                                   'visibility': 'dm', 'format': 'md', 'page_count': 1,
                                   'metadata': {'authority': authority}},
                                  [{'id': source_id + ':p1', 'page': 1, 'chunk_index': 0, 'text': text, 'sha256': 'chunk'}])
        result = self.store.search('Where is Gundren?', limit=1)
        self.assertEqual(result[0]['authority'], 'actual_play')
        self.assertEqual(result[0]['text'], 'Gundren remains missing.')

    def test_query_syntax_cannot_change_authorization(self):
        self.store.upsert_record(record())
        self.assertEqual(self.store.search('" OR 1=1 -- crimson', 'player'), [])
        self.assertEqual(self.store.search('***'), [])


if __name__ == '__main__':
    unittest.main()
