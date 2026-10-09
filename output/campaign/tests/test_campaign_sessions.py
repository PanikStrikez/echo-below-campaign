"""Session review/commit integration tests using an isolated real SQLite store."""
import copy
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'launchers'))
from ai_service import AIError
from campaign_store import CampaignStore, RevisionConflict
from campaign_sessions import SessionEngine


def state_record(identifier='npc-durnan', name='Durnan', kind='npc'):
    return {'id': identifier, 'kind': kind, 'name': name, 'visibility': 'dm',
            'epistemic': 'confirmed', 'facts': [], 'data': {}}


class SessionEngineTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory(prefix='echo-session-test-')
        self.addCleanup(directory.cleanup)
        self.store = CampaignStore(Path(directory.name) / 'state.sqlite3')
        self.engine = SessionEngine(self.store)

    def commit(self, draft, ids=None, **overrides):
        kwargs = {'expected_revision': draft['baseRevision'],
                  'mutation_ids': ids if ids is not None else [m['id'] for m in draft['mutations']],
                  'approved': True, 'draft_version': draft['draftVersion']}
        kwargs.update(overrides)
        return self.engine.commit(draft['id'], **kwargs)

    def test_mixed_notes_are_private_until_explicitly_disclosed(self):
        notes = '[DM] The mentor is secretly a spy.\nThe party missed the hidden chamber.\n[PLAYER] Durnan gave us supper.'
        draft = self.engine.analyze('Fixture session', notes, 'We returned safely.')
        self.assertEqual(draft['playerRecap'], 'Durnan gave us supper.\n\nWe returned safely.')
        self.assertIn('secretly a spy', draft['dmRecap'])
        self.assertEqual(self.store.revision(), 0)
        self.assertEqual(self.store.list_records(), [])
        self.commit(draft)
        public = json.dumps(self.store.list_records(audience='player'))
        self.assertIn('Durnan gave us supper.', public)
        self.assertNotIn('spy', public)
        self.assertNotIn('hidden chamber', public)
        self.assertEqual(self.store.search('Durnan', audience='npc', npc_id='npc-durnan'), [])

    def test_no_public_notes_means_no_player_recap(self):
        draft = self.engine.analyze('Private notes', 'The door hides a secret passage.')
        self.assertEqual(draft['playerRecap'], '')
        self.assertTrue(any('No player-safe notes' in item for item in draft['warnings']))

    def test_dm_tag_in_public_notes_is_rejected(self):
        with self.assertRaises(AIError):
            self.engine.analyze('Private tag', 'We returned.', '[DM] The destination is secret.')

    def test_npc_observations_update_state_without_granting_knowledge(self):
        self.store.upsert_record(state_record(), expected_revision=0)
        draft = self.engine.analyze('Portal', '[PLAYER] Durnan promised a room.\nDurnan secretly mistrusts the visitor.')
        npc_change = next(m for m in draft['mutations'] if m['record']['id'] == 'npc-durnan')
        self.assertEqual(npc_change['record']['kind'], 'npc')
        self.assertEqual(len(npc_change['record']['facts']), 2)
        self.commit(draft, [npc_change['id']])
        self.assertIn('mistrusts', self.store.get_record('npc-durnan')['data']['last_session_observation']['text'])
        self.assertEqual(self.store.search('mistrusts', audience='npc', npc_id='npc-durnan'), [])

    def test_boolean_draft_version_is_rejected(self):
        draft = self.engine.analyze('Version', 'We returned.')
        draft['draftVersion'] = True
        with self.assertRaises(AIError):
            self.engine.save(draft['id'], draft)

    def test_inline_dm_tag_cannot_enter_player_recap(self):
        try:
            draft = self.engine.analyze('Mixed inline note', '[PLAYER] We met a guard. [DM] SECRET identity is the villain.')
        except AIError:
            return  # Rejecting ambiguous visibility is also fail-closed.
        self.assertNotIn('SECRET', draft['playerRecap'])
        for mutation in draft['mutations']:
            for fact in mutation['record']['facts']:
                if fact['visibility'] == 'player':
                    self.assertNotIn('SECRET', fact['text'])

    def test_classifier_keeps_uncertain_and_missed_clues_out_of_confirmed_knowledge(self):
        self.store.upsert_record(state_record(), expected_revision=0)
        draft = self.engine.analyze('After the Portal',
                                    'Durnan may know the symbol; unresolved.\nThe party missed the clue.\nDurnan promised a room.')
        self.assertTrue(draft['unresolvedThreads'])
        self.assertEqual(draft['cluesMissed'], ['The party missed the clue.'])
        self.assertNotIn('The party missed the clue.', draft['cluesLearned'])
        self.assertEqual(draft['mutations'][0]['record']['epistemic'], 'unresolved')
        self.assertTrue(draft['relationshipChanges'])
        self.assertTrue(draft['npcChanges'])
        self.assertTrue(any('another route' in item for item in draft['nextSessionPrep']))

    def test_provenance_retains_note_hash_and_exact_line(self):
        notes = '# Heading\n\n[PLAYER] We visited the inn.'
        draft = self.engine.analyze('Provenance', notes)
        citation = draft['mutations'][0]['record']['facts'][0]['provenance'][0]
        self.assertEqual(citation['sha256'], hashlib.sha256(notes.encode()).hexdigest())
        self.assertEqual(citation['page'], 3)
        self.assertEqual(citation['source_id'], draft['id'])

    def test_oversized_statement_is_not_silently_committed_as_truncated_fact(self):
        statement = 'x' * 4100 + ' This account is false.'
        try:
            draft = self.engine.analyze('Long note', statement)
        except AIError:
            return
        self.assertEqual(draft['mutations'][0]['record']['facts'][0]['text'], statement)

    def test_review_is_required_before_commit(self):
        draft = self.engine.analyze('Review', 'The party returned.')
        with self.assertRaises(AIError) as raised:
            self.commit(draft, approved=False)
        self.assertEqual(raised.exception.code, 'review_required')
        self.assertEqual(self.store.revision(), 0)

    def test_reviewed_draft_version_is_required(self):
        draft = self.engine.analyze('Review', 'The party returned.')
        for version in (None, True, '1'):
            with self.subTest(version=version):
                with self.assertRaises(AIError):
                    self.commit(draft, draft_version=version)
        self.assertEqual(self.store.revision(), 0)

    def test_save_uses_draft_conflicts_and_does_not_accept_forged_identity(self):
        draft = self.engine.analyze('Review', 'Original notes.')
        saved = self.engine.save(draft['id'], {'draftVersion': 1, 'title': 'Reviewed title',
                                               'baseRevision': 500, 'notes': 'Forged notes',
                                               'id': 'forged', 'status': 'committed'})
        self.assertEqual(saved['draftVersion'], 2)
        self.assertEqual(saved['baseRevision'], 0)
        self.assertEqual(saved['notes'], 'Original notes.')
        self.assertEqual(saved['id'], draft['id'])
        self.assertEqual(saved['status'], 'review')
        with self.assertRaises(AIError):
            self.engine.save(draft['id'], {'draftVersion': 1, 'title': 'Stale'})
        with self.assertRaises(AIError):
            self.commit(draft)

    def test_stale_state_cannot_overwrite_new_play(self):
        draft = self.engine.analyze('Before new play', 'The party returned.')
        self.store.upsert_record(state_record(), expected_revision=0)
        with self.assertRaises(RevisionConflict):
            self.commit(draft)
        self.assertEqual(self.engine.get(draft['id'])['status'], 'review')
        self.assertEqual(self.store.revision(), 1)
        self.assertEqual(len(self.store.list_records()), 1)

    def test_selected_subset_and_empty_selection_are_explicit_atomic_receipts(self):
        draft = self.engine.analyze('Two events', 'First event.\nSecond event.')
        receipt = self.commit(draft, ids=[draft['mutations'][1]['id']])
        self.assertEqual(receipt['revision'], 1)
        self.assertEqual(len(self.store.list_records()), 1)
        self.assertIn('Second event.', self.store.list_records()[0]['facts'][0]['text'])
        other = self.engine.analyze('Recap only', 'Private note.')
        self.commit(other, ids=[])
        self.assertEqual(len(self.store.list_records()), 1)
        self.assertEqual(self.engine.get(other['id'])['status'], 'committed')

    def test_commit_is_idempotent_and_committed_drafts_are_immutable(self):
        draft = self.engine.analyze('Review', 'The party returned.')
        first, second = self.commit(draft), self.commit(draft)
        self.assertEqual(first['revision'], second['revision'])
        self.assertTrue(second['alreadyCommitted'])
        self.assertEqual(self.store.revision(), 1)
        with self.assertRaises(AIError):
            self.engine.save(draft['id'], {'draftVersion': 1, 'playerRecap': 'Changed'})

    def test_invalid_second_mutation_rolls_back_everything(self):
        draft = self.engine.analyze('Invalid batch', 'First event.\nSecond event.')
        mutations = copy.deepcopy(draft['mutations'])
        mutations[1]['record']['facts'][0]['id'] = mutations[0]['record']['facts'][0]['id']
        draft = self.engine.save(draft['id'], {'draftVersion': 1, 'mutations': mutations})
        with self.assertRaises(ValueError):
            self.commit(draft)
        self.assertEqual(self.store.list_records(), [])
        self.assertEqual(self.store.revision(), 0)
        self.assertEqual(self.engine.get(draft['id'])['status'], 'review')

    def test_receipt_failure_rolls_back_state_and_session_status_together(self):
        draft = self.engine.analyze('Rollback', 'The party returned.')
        apply = self.store.apply_mutations
        def failing_apply(*args, **kwargs):
            hook = kwargs['commit_hook']
            def fail_after_receipt(conn, result):
                hook(conn, result)
                raise RuntimeError('Injected receipt failure')
            kwargs['commit_hook'] = fail_after_receipt
            return apply(*args, **kwargs)
        with patch.object(self.store, 'apply_mutations', side_effect=failing_apply):
            with self.assertRaises(RuntimeError):
                self.commit(draft)
        self.assertEqual(self.store.revision(), 0)
        self.assertEqual(self.store.list_records(), [])
        self.assertEqual(self.engine.get(draft['id'])['status'], 'review')

    def test_duplicate_and_foreign_mutation_ids_are_rejected(self):
        draft = self.engine.analyze('Review', 'The party returned.')
        mid = draft['mutations'][0]['id']
        for ids in ([mid, mid], ['foreign-mutation']):
            with self.assertRaises(AIError):
                self.commit(draft, ids=ids)
        self.assertEqual(self.store.revision(), 0)

    def test_legacy_import_preserves_private_detail_and_witness_boundaries(self):
        event = {'id': 'old-event-1', 'approved': True, 'status': 'confirmed', 'basis': 'Observed',
                 'kind': 'discovery', 'title': 'SECRET private title', 'detail': 'SECRET private detail',
                 'publicTitle': 'A delivery', 'playerText': 'Durnan received the parcel.',
                 'share': 'party', 'knows': ['party', 'durnan']}
        story = {'continuity': {'events': [event, {**event, 'id': 'planned', 'status': 'planned'},
                                           {**event, 'id': 'unapproved', 'approved': False}]}}
        draft = self.engine.import_story('campaign-a', 'session-old', story)
        self.assertEqual(len(draft['mutations']), 1)
        self.assertNotIn('SECRET', draft['playerRecap'])
        self.commit(draft)
        player = json.dumps(self.store.list_records(audience='player'))
        self.assertNotIn('SECRET', player)
        self.assertEqual(len(self.store.search('parcel', audience='npc', npc_id='npc-durnan')), 1)
        self.assertEqual(self.store.search('parcel', audience='npc', npc_id='npc-halaster'), [])
        again = self.engine.import_story('campaign-a', 'session-old', story)
        self.assertEqual(again['mutations'], [])

    def test_import_requires_both_party_disclosure_and_party_knowledge(self):
        event = {'id': 'old-1', 'approved': True, 'status': 'confirmed', 'basis': 'Observed',
                 'detail': 'Private discovery.', 'playerText': 'Not disclosed.', 'share': 'party', 'knows': ['durnan']}
        draft = self.engine.import_story('campaign-a', '', {'continuity': {'events': [event]}})
        self.assertEqual(draft['playerRecap'], '')
        self.assertTrue(all(fact['visibility'] == 'dm' for fact in draft['mutations'][0]['record']['facts']))


if __name__ == '__main__':
    unittest.main()
