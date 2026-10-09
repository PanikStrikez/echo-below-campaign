import contextlib
import io
import os
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'launchers'))
from setup_voice_key import store_key


class VoiceKeySetupTests(unittest.TestCase):
    def test_private_atomic_storage_and_no_echo(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary) / 'private'
            output = io.StringIO()
            with contextlib.redirect_stdout(output):
                store_key(folder, 'FAKE_TEST_ONLY_123456789')
            self.assertEqual(output.getvalue(), '')
            self.assertEqual(folder.stat().st_mode & 0o777, 0o700)
            self.assertEqual((folder / 'elevenlabs.key').stat().st_mode & 0o777, 0o600)
            self.assertEqual((folder / 'elevenlabs.key').read_text(), 'FAKE_TEST_ONLY_123456789')
            self.assertEqual(len(list(folder.iterdir())), 1)

    def test_symlink_public_directory_and_header_injection_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary) / 'private'
            folder.mkdir(mode=0o700)
            with self.assertRaises(ValueError):
                store_key(folder, 'FAKE_TEST_ONLY_123456789\nHeader: injected')
            folder.chmod(0o755)
            with self.assertRaises(ValueError):
                store_key(folder, 'FAKE_TEST_ONLY_123456789')
            folder.chmod(0o700)
            target = Path(temporary) / 'target'
            target.write_text('leave this alone')
            (folder / 'elevenlabs.key').symlink_to(target)
            with self.assertRaises(ValueError):
                store_key(folder, 'FAKE_TEST_ONLY_123456789')
            self.assertEqual(target.read_text(), 'leave this alone')


if __name__ == '__main__':
    unittest.main()
