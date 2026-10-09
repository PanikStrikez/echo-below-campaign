"""Interactive local credential entry. Never sends a key to a browser or campaign."""
import getpass
import os
from pathlib import Path
import re
import stat
import tempfile
import warnings


def store_key(directory, value):
    if not isinstance(value, str) or not re.fullmatch(r'[A-Za-z0-9_-]{16,1024}', value):
        raise ValueError('That does not look like a complete API key. Nothing was saved.')
    directory = Path(directory)
    if directory.is_symlink():
        raise ValueError('Private settings folder must not be a shortcut or symbolic link.')
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    info = directory.stat()
    if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o077:
        raise ValueError('Private settings folder needs owner-only access before saving a key.')
    target = directory / 'elevenlabs.key'
    if target.is_symlink():
        raise ValueError('The key destination must not be a symbolic link.')
    fd, temporary = tempfile.mkstemp(prefix='.voice-key-', dir=directory)
    try:
        with os.fdopen(fd, 'w') as stream:
            os.fchmod(stream.fileno(), 0o600)
            stream.write(value)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def main():
    print('Echo Below — private ElevenLabs setup')
    print('This saves your key on this Mac, outside campaign files. No network request is made.')
    print('Use your Free or Creator account. This helper does not buy credits or enable generation.')
    print('Paste below and press Return. Your key will stay hidden while you type.')
    try:
        with warnings.catch_warnings():
            warnings.simplefilter('error', getpass.GetPassWarning)
            value = getpass.getpass('ElevenLabs API key: ')
        if not value.strip():
            print('Cancelled. Nothing was saved.')
            return
        store_key(Path.home() / '.echo-below-ai', value.strip())
        value = None
        print('Saved privately. Return to Settings > AI assistance > Voice auditions.')
        print('Refresh, approve an included-credit limit if needed, then check your account allowance.')
        print('A saved key is not yet a verified connection. Additional spending stays disabled.')
    except (ValueError, OSError, getpass.GetPassWarning):
        print('The key could not be saved safely. Run this helper in Terminal; keep the key out of chat.')
    except (KeyboardInterrupt, EOFError):
        print('\nCancelled. Nothing was saved.')


if __name__ == '__main__':
    main()
