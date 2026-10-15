"""Read-only version evidence. Does not open source books, saves, databases or accounts."""
from pathlib import Path
import hashlib
import json
import threading

MEDIA = {'.png','.jpg','.jpeg','.webp','.svg','.mp3','.ogg','.wav','.mp4','.m4a'}
CODE = {'.js','.css','.html','.py'}
EXCLUDED = {'tools','tests','archive','readiness','books','model-reference','__pycache__','ui-concepts','map-audit'}
_CACHE = {}
_LOCK = threading.Lock()


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024*1024), b''):
            h.update(chunk)
    return h.hexdigest()


def versions(app):
    app = Path(app).resolve()
    rows = {'app': [], 'assets': [], 'tests': []}
    with _LOCK:
        for p in sorted(app.rglob('*')):
            if not p.is_file() or p.is_symlink() or any(part.startswith('.') or part == '__pycache__' for part in p.relative_to(app).parts):
                continue
            rel = p.relative_to(app)
            if p.name.startswith('Campaign-Status-Evidence') or 'readiness' in rel.parts:
                continue  # Generated evidence is not part of the build it describes.
            if ('tests' in rel.parts or 'tools' in rel.parts) and p.suffix in {'.js','.cjs','.py'}:
                category = 'tests'
            elif p.suffix in MEDIA and not any(part in {'archive','tools','tests','books','ui-concepts','model-reference'} for part in rel.parts):
                category = 'assets'
            elif p.suffix in CODE and not any(part in EXCLUDED for part in rel.parts):
                category = 'app'
            elif p.name in {'Geography-Register.json','Location-Register.json','Map-Register-Data.js'}:
                category = 'assets'
            else:
                continue
            stat = p.stat()
            cache_key = str(p), stat.st_mtime_ns, stat.st_ctime_ns, stat.st_size
            sha = _CACHE.get(cache_key)
            if sha is None:
                sha = _CACHE[cache_key] = digest(p)
            rows[category].append({'path': rel.as_posix(), 'sha256': sha, 'bytes': stat.st_size})
        # Do not grow indefinitely after edits.
        live = {str(app / r['path']) for entries in rows.values() for r in entries}
        for k in list(_CACHE):
            if k[0] not in live:
                del _CACHE[k]
    result = {}
    for category, entries in rows.items():
        result[category] = {'sha256': hashlib.sha256(json.dumps(entries, sort_keys=True, separators=(',', ':')).encode()).hexdigest(),
                            'files': len(entries), 'bytes': sum(r['bytes'] for r in entries)}
    result['saveSchema'] = 3
    return result
