"""Portable package boundary, using a tiny synthetic campaign and fake credentials."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'launchers'))
from portable_package import build, verify


class AIExportTests(unittest.TestCase):
    def test_private_ai_copies_are_excluded_regardless_of_capitalization(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            root = folder / 'app'
            app = root / 'output' / 'campaign'
            copied = app / 'copied-settings'
            copied.mkdir(parents=True)
            marker = b'PRIVATE_AI_COPY_MUST_NOT_TRAVEL'
            for name in ('ChatGPT-Connection.JSON', 'Service.JSON', 'ElevenLabs.KEY', 'Voices.JSON',
                         'campaign.sqlite3', 'campaign.sqlite3-wal', 'campaign.sqlite3-shm', 'campaign.DB', '.env'):
                (copied / name).write_bytes(marker)
            (copied / 'Voice-Audio').mkdir()
            (copied / 'Voice-Audio' / 'sample.mp3').write_bytes(marker)
            (app / 'AI-Service.js').write_text('/* reusable client */')
            archive = {'format': 'echo-below-campaign-v2', 'sessions': [{'id': 'practice', 'state': {}}]}
            target = folder / 'practice.zip'
            build(root, archive, target)
            with zipfile.ZipFile(target) as package:
                self.assertIn('output/campaign/AI-Service.js', package.namelist())
                for name in package.namelist():
                    self.assertNotIn(marker, package.read(name), name)

    def test_voice_profile_choices_and_campaign_audio_survive_without_private_samples(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            root = folder / 'app'
            app = root / 'output' / 'campaign'
            (app / 'audio').mkdir(parents=True)
            (app / 'audio' / 'tavern.mp3').write_bytes(b'APPROVED_CAMPAIGN_AMBIENCE')
            (app / 'voice-audio').mkdir()
            (app / 'voice-audio' / 'private-sample.audio').write_bytes(b'PRIVATE_SAMPLE_BYTES')
            # Voice direction and a selected stock-voice reference are campaign data.
            # The sample itself, account setup and service history are machine-local.
            voice_cast = {'version': 1, 'profiles': [{
                'id': 'synthetic-narrator', 'style': 'Calm and clear', 'notes': 'DM listening note',
                'voice': {'status': 'selected', 'provider': 'elevenlabs', 'voiceId': 'stock-synthetic',
                          'model': 'test-model', 'auditionId': 'private-sample', 'selectedBy': 'dm'}
            }], 'history': []}
            archive = {'format': 'echo-below-campaign-v2',
                       'sessions': [{'id': 'practice', 'state': {'party': {'pc-a': {'hp': 7}}}}],
                       'story': {'voiceCast': voice_cast, 'journal': [{'text': 'Approved event'}]},
                       'presentation': {'media': [{'file': 'audio/tavern.mp3'}]}}
            before = json.dumps(archive, sort_keys=True)
            target = folder / 'practice.zip'
            build(root, archive, target)
            self.assertTrue(verify(target))
            self.assertEqual(json.dumps(archive, sort_keys=True), before)
            with zipfile.ZipFile(target) as package:
                self.assertEqual(json.loads(package.read('campaign-backup.json')), archive)
                self.assertEqual(package.read('output/campaign/audio/tavern.mp3'), b'APPROVED_CAMPAIGN_AMBIENCE')
                self.assertNotIn('output/campaign/voice-audio/private-sample.audio', package.namelist())
                manifest = json.loads(package.read('MANIFEST.json'))
                self.assertEqual(manifest['requiredMedia'], ['output/campaign/audio/tavern.mp3'])

    def test_linked_private_file_cannot_be_included_under_an_innocent_name(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            root = folder / 'app'
            app = root / 'output' / 'campaign'
            app.mkdir(parents=True)
            private = folder / 'private-key'
            private.write_bytes(b'PRIVATE_LINKED_CREDENTIAL')
            (app / 'ordinary-settings.txt').symlink_to(private)
            archive = {'format': 'echo-below-campaign-v2', 'sessions': [{'id': 'practice', 'state': {}}]}
            target = folder / 'practice.zip'
            build(root, archive, target)
            with zipfile.ZipFile(target) as package:
                self.assertNotIn('output/campaign/ordinary-settings.txt', package.namelist())
                for name in package.namelist():
                    self.assertNotIn(b'PRIVATE_LINKED_CREDENTIAL', package.read(name))

    def test_private_ai_files_and_source_books_do_not_travel(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            root = folder / 'app'
            app = root / 'output' / 'campaign'
            app.mkdir(parents=True)
            (app / 'AI-Service.js').write_text('/* reusable client */')
            (app / 'Session-01-TV-Display.html').write_text('<title>Isolated</title>')
            private = folder / 'private-ai'
            private.mkdir()
            marker = 'FAKE_TEST_CREDENTIAL_NEVER_EXPORT'
            (private / 'chatgpt-connection.json').write_text(marker)
            # Even an accidental copy into the campaign tree must be excluded.
            (app / 'chatgpt-connection.json').write_text(marker)
            (app / 'service.json').write_text(json.dumps({'planConfirmed': True}))
            (app / 'elevenlabs.key').write_text(marker)
            (app / 'voices.json').write_text('PRIVATE_AUDITION_TEXT')
            (app / 'voice-audio').mkdir()
            (app / 'voice-audio' / 'fixture.audio').write_bytes(b'PRIVATE_AUDITION_AUDIO')
            (root / 'sources').mkdir()
            (root / 'sources' / 'personal-book.pdf').write_bytes(b'PRIVATE_BOOK_BODY')
            archive = {'format': 'echo-below-campaign-v2', 'sessions': [{'id': 'practice', 'state': {'party': {}}}]}
            target = folder / 'practice.zip'
            build(root, archive, target)
            self.assertTrue(verify(target))
            with zipfile.ZipFile(target) as package:
                self.assertIn('output/campaign/AI-Service.js', package.namelist())
                self.assertNotIn('output/campaign/chatgpt-connection.json', package.namelist())
                for name in package.namelist():
                    content = package.read(name)
                    for forbidden in (marker.encode(), b'planConfirmed', b'PRIVATE_BOOK_BODY', b'PRIVATE_AUDITION_TEXT', b'PRIVATE_AUDITION_AUDIO'):
                        self.assertNotIn(forbidden, content)
                self.assertEqual(json.loads(package.read('campaign-backup.json')), archive)


if __name__ == '__main__':
    unittest.main()
