"""Canonical ingestion: page provenance, retries, idempotence and disclosure."""
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'launchers'))
from campaign_store import CampaignStore
from campaign_sources import ingest_sources, seed_initial_state, pdf_pages, source_id, text_chunks, ocr_pdf_pages, VISION_OCR_SWIFT


class SourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.sources = self.root / 'sources'
        self.campaign = self.root / 'output' / 'campaign'
        self.sources.mkdir()
        self.campaign.mkdir(parents=True)
        self.store = CampaignStore(self.root / 'private' / 'campaign.sqlite3')

    def pdf(self, name, content=b'fixture pdf bytes'):
        path = self.sources / name
        path.write_bytes(content)
        return path

    def test_page_hash_filename_and_visibility_are_preserved(self):
        private = self.pdf('sourcebook.pdf')
        public = self.pdf('The-Echo-Below-Player-Guide.pdf')
        originals = {path: path.read_bytes() for path in (private, public)}
        def extract(path):
            return ['Tavern lore first page', 'Tavern lore second page'] if path.name == private.name else ['Tavern lore player-safe guide']
        with patch('campaign_sources.pdf_pages', side_effect=extract):
            report = ingest_sources(self.store, self.sources, self.campaign)
        self.assertTrue(report['ok'])
        self.assertEqual(report['indexed'], 2)
        dm = self.store.search('Tavern lore', 'dm')
        book = [item for item in dm if item['citations'][0]['filename'] == 'sources/sourcebook.pdf']
        self.assertEqual({item['citations'][0]['page'] for item in book}, {1, 2})
        self.assertEqual(book[0]['citations'][0]['sha256'], hashlib.sha256(private.read_bytes()).hexdigest())
        player = self.store.search('Tavern', 'player')
        self.assertEqual(len(player), 1)
        self.assertIn('player-safe', player[0]['text'])
        self.assertEqual(self.store.search('Tavern', 'npc', 'npc-durnan'), [])
        for path, original in originals.items():
            self.assertEqual(path.read_bytes(), original)

    def test_random_player_filename_does_not_make_a_source_public(self):
        self.pdf('Secrets-Player-Handout.pdf')
        with patch('campaign_sources.pdf_pages', return_value=['Secret treasure canary']):
            ingest_sources(self.store, self.sources, self.campaign)
        self.assertEqual(self.store.search('canary', 'player'), [])
        self.assertEqual(len(self.store.search('canary', 'dm')), 1)

    def test_idempotent_reingest_skips_extraction(self):
        self.pdf('sourcebook.pdf')
        with patch('campaign_sources.pdf_pages', return_value=['Canary ordinary tavern']) as extract:
            first = ingest_sources(self.store, self.sources, self.campaign)
            second = ingest_sources(self.store, self.sources, self.campaign)
        self.assertEqual(extract.call_count, 1)
        self.assertEqual(second['indexed'], 0)
        self.assertEqual(second['unchanged'], 1)
        self.assertEqual(self.store.summary()['chunks'], 1)

    def test_changed_source_replaces_chunks_and_deleted_source_revokes(self):
        path = self.pdf('sourcebook.pdf')
        with patch('campaign_sources.pdf_pages', return_value=['Old text canary']):
            ingest_sources(self.store, self.sources, self.campaign)
        path.write_bytes(b'changed source')
        with patch('campaign_sources.pdf_pages', return_value=['New text robin']):
            ingest_sources(self.store, self.sources, self.campaign)
        self.assertEqual(self.store.search('canary'), [])
        self.assertEqual(len(self.store.search('robin')), 1)
        path.unlink()
        result = ingest_sources(self.store, self.sources, self.campaign)
        self.assertEqual(result['removed'], 1)
        self.assertEqual(self.store.search('robin'), [])

    def test_failed_extraction_is_reported_and_revokes_stale_text(self):
        path = self.pdf('sourcebook.pdf')
        with patch('campaign_sources.pdf_pages', return_value=['Secret canary']):
            ingest_sources(self.store, self.sources, self.campaign)
        path.write_bytes(b'changed inaccessible')
        with patch('campaign_sources.pdf_pages', side_effect=RuntimeError('Extractor unavailable')):
            report = ingest_sources(self.store, self.sources, self.campaign)
        self.assertFalse(report['ok'])
        self.assertIn('unavailable', report['failed'][0]['error'])
        self.assertEqual(self.store.search('canary'), [])

    def test_scan_only_pdf_is_not_reported_successful(self):
        self.pdf('scanned.pdf')
        with patch('campaign_sources.pdf_pages', return_value=['', ' ']), patch('campaign_sources.ocr_pdf_pages', side_effect=RuntimeError('OCR is required')):
            result = ingest_sources(self.store, self.sources, self.campaign)
        self.assertFalse(result['ok'])
        self.assertEqual(result['indexed'], 0)
        self.assertIn('OCR', result['failed'][0]['error'])

    def test_ocr_fallback_is_local_cited_and_marked_uncertain(self):
        path = self.pdf('scanned.pdf')
        with patch('campaign_sources.pdf_pages', return_value=['', '']), patch('campaign_sources.ocr_pdf_pages', return_value=['First OCR canary', 'Second OCR page']) as ocr:
            result = ingest_sources(self.store, self.sources, self.campaign)
        self.assertTrue(result['ok'])
        self.assertEqual(ocr.call_args.args[0], path.resolve())
        self.assertEqual(ocr.call_args.args[2], self.store.db_path.parent / 'source-ocr')
        row = self.store.search('canary')[0]
        self.assertEqual(row['citations'][0]['page'], 1)
        self.assertEqual(row['epistemic'], 'unresolved')
        self.assertIn('Locally OCR-read', row['source_warning'])
        self.assertEqual(self.store.search('canary', 'player'), [])

    def test_hash_matched_local_ocr_cache_avoids_native_execution(self):
        checksum = 'a' * 64
        cache = self.store.db_path.parent / 'source-ocr'
        cache.mkdir()
        version = hashlib.sha256(VISION_OCR_SWIFT.encode()).hexdigest()[:16]
        target = cache / (checksum + '-' + version + '.json')
        target.write_text(json.dumps({'source_sha256': checksum, 'extractor': version, 'pages': ['Cached page one', 'Cached page two']}))
        with patch('campaign_sources.sys.platform', 'darwin'), patch('campaign_sources.shutil.which', return_value='/usr/bin/swiftc'), patch('campaign_sources.subprocess.run') as run:
            pages = ocr_pdf_pages(self.sources / 'scan.pdf', checksum, cache, 2)
        self.assertEqual(pages, ['Cached page one', 'Cached page two'])
        run.assert_not_called()

    def test_source_replacement_during_extraction_does_not_get_wrong_hash(self):
        path = self.pdf('sourcebook.pdf')
        def extract(source):
            source.write_bytes(b'changed during extraction')
            return ['Old page canary']
        with patch('campaign_sources.pdf_pages', side_effect=extract):
            report = ingest_sources(self.store, self.sources, self.campaign)
        self.assertFalse(report['ok'])
        self.assertIn('changed during', report['failed'][0]['error'])
        self.assertEqual(self.store.search('canary'), [])

    def test_disabled_ocr_never_runs_native_tools(self):
        with patch.dict('os.environ', {'ECHO_SOURCE_OCR': '0'}), patch('campaign_sources.subprocess.run') as run:
            with self.assertRaisesRegex(RuntimeError, 'disabled'):
                ocr_pdf_pages(self.sources / 'scan.pdf', 'a' * 64, self.root / 'cache')
        run.assert_not_called()

    def test_missing_extractor_is_explicit(self):
        with patch('campaign_sources.importlib.util.find_spec', return_value=None), patch('campaign_sources.shutil.which', return_value=None), patch.dict('os.environ', {'ECHO_PDF_PYTHON': ''}), patch('campaign_sources._bundled_pdf_python', return_value=None):
            with self.assertRaisesRegex(RuntimeError, 'unavailable'):
                pdf_pages(self.sources / 'test.pdf')

    def test_seed_preserves_dm_edits_and_does_not_reveal_secrets(self):
        # Exercise curated seed against the actual canonical files, never edit them.
        actual_campaign = Path(__file__).resolve().parents[1]
        actual_sources = actual_campaign.parents[1] / 'sources'
        seeded = seed_initial_state(self.store, actual_sources, actual_campaign)
        self.assertTrue({'npc-durnan', 'npc-gundren', 'npc-selise', 'npc-halaster'}.issubset(seeded))
        self.assertEqual({item['kind'] for item in self.store.list_records()}, {'npc', 'quest', 'clue', 'location', 'item', 'relationship', 'choice', 'thread'})
        durnan = self.store.get_record('npc-durnan')
        durnan['name'] = 'DM edited name'
        self.store.upsert_record(durnan)
        before = self.store.revision()
        self.assertEqual(seed_initial_state(self.store, actual_sources, actual_campaign), [])
        self.assertEqual(self.store.revision(), before)
        self.assertEqual(self.store.get_record('npc-durnan')['name'], 'DM edited name')
        self.assertNotIn('abandoned expedition log', json.dumps(self.store.search('expedition log', 'npc', 'npc-durnan')))
        public = json.dumps(self.store.list_records('player'))
        for secret in ('Halaster', 'Silent Library', 'Cragmaw Castle', 'BELOW token'):
            self.assertNotIn(secret, public)
        self.assertTrue(self.store.search('meals lodging', 'npc', 'npc-durnan'))
        self.assertEqual(self.store.search('meals lodging', 'npc', 'npc-selise'), [])

    def test_reingest_does_not_resurrect_a_deleted_seed(self):
        actual_campaign = Path(__file__).resolve().parents[1]
        actual_sources = actual_campaign.parents[1] / 'sources'
        seed_initial_state(self.store, actual_sources, actual_campaign)
        self.store.apply_mutations([{'op': 'delete', 'id': 'npc-durnan'}], self.store.revision())
        self.assertEqual(seed_initial_state(self.store, actual_sources, actual_campaign), [])
        self.assertIsNone(self.store.get_record('npc-durnan'))

    def test_current_markdown_is_public_only_on_exact_allowlist(self):
        (self.campaign / 'Player-Guide.md').write_text('Known canary public checkpoint')
        (self.campaign / 'Campaign-Core.md').write_text('Hidden canary DM secret')
        ingest_sources(self.store, self.sources, self.campaign)
        texts = [row['text'] for row in self.store.search('canary', 'player')]
        self.assertEqual(texts, ['Known canary public checkpoint'])

    def test_practice_campaign_indexes_reference_without_seed_state(self):
        (self.campaign / 'Player-Guide.md').write_text('Known canary public checkpoint')
        result = ingest_sources(self.store, self.sources, self.campaign, seed=False)
        self.assertTrue(result['ok'])
        self.assertEqual(result['seeded'], [])
        self.assertEqual(self.store.list_records(), [])
        self.assertEqual(self.store.revision(), 0)
        self.assertTrue(self.store.search('canary', 'player'))

    def test_chunking_is_bounded_and_preserves_tail(self):
        value = ('word ' * 1000) + 'last_marker'
        chunks = list(text_chunks(value))
        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(len(chunk) <= 2200 for chunk in chunks))
        self.assertTrue(chunks[-1].endswith('last_marker'))


if __name__ == '__main__':
    unittest.main()
