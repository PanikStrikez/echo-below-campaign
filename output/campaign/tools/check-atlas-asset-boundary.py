"""Temporary phone service + asset fixtures. Never contacts or restarts a live service."""
import base64
import importlib.util
import json
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

app = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(app / 'launchers'))
spec = importlib.util.spec_from_file_location('boundary_phone', app / 'launchers/serve_phones.py')
phone = importlib.util.module_from_spec(spec)
spec.loader.exec_module(phone)
checks = []
png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=')
with tempfile.TemporaryDirectory(prefix='echo-asset-boundary-') as directory:
    root = Path(directory)
    for folder in ('assets', 'private-maps', 'atlas/tactical', 'atlas/art'):
        (root / folder).mkdir(parents=True)
    (root / 'assets/known.png').write_bytes(png)
    (root / 'private-maps/hidden.png').write_bytes(b'PRIVATE SOURCE MAP')
    (root / 'assets/alias.png').symlink_to(root / 'private-maps/hidden.png')
    (root / 'atlas/art/north-Terrain.png').symlink_to(root / 'private-maps/hidden.png')
    phone.CAMPAIGN = root
    image_snapshot = lambda source: {'isMap': True, 'public': {'presentation': {'sceneImage': source}}}
    assert phone.map_bytes(image_snapshot('assets/known.png')) == (png, 'image/png')
    assert phone.private_image_bytes('assets/known.png') == (png, 'image/png')
    assert phone.map_bytes(image_snapshot('assets/alias.png')) is None
    assert phone.private_image_bytes('assets/alias.png') is None
    assert phone.atlas_file_bytes('atlas/art/north-Terrain.png') is None
    for source in ('private-maps/hidden.png', 'atlas/tactical/wd-mending-bindery.svg',
                   '../private-maps/hidden.png', 'https://example.com/private.png'):
        assert phone.map_bytes(image_snapshot(source)) is None
    assert phone.map_bytes(image_snapshot('data:image/png;base64,' + base64.b64encode(b'<svg>PRIVATE</svg>').decode())) is None
    raster = 'data:image/png;base64,' + base64.b64encode(png).decode()
    assert phone.map_bytes(image_snapshot(raster)) == (png, 'image/png')
    checks.append('Only approved image roots or validated raster data resolve; aliases cannot enter private maps')

    phone.TABLE.update(active=True, last_dm=time.time(), claims={'test-token': 'pc-test'}, roster=[{'id': 'pc-test', 'name': 'Test'}],
        snapshot={'characters': {'pc-test': {'name': 'Test'}}, 'isMap': True,
                  'public': {'scene': 'public-floor', 'presentation': {'sceneImage': raster}},
                  'atlas': {'schemaVersion': 1, 'board': {'id': 'public-board', 'title': 'Dungeon floor', 'kind': 'interior',
                                     'image': raster, 'viewBox': [0, 0, 1, 1]}, 'places': [], 'rumors': [], 'routes': []}})
    server = ThreadingHTTPServer(('127.0.0.1', 0), phone.Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f'http://127.0.0.1:{server.server_port}'
    def get(route, authenticated=True):
        request = urllib.request.Request(base + route, headers={'Cookie': 'echo_phone=test-token'} if authenticated else {})
        try:
            response = urllib.request.urlopen(request, timeout=5)
        except urllib.error.HTTPError as error:
            response = error
        return response.status, response.headers, response.read()
    try:
        for route in ('/Campaign-Atlas-Data.js', '/Undermountain-Map-Collection.js', '/Waterdeep-Map-Collection.js',
                      '/map-audit/Location-Register.json', '/private-maps/hidden.png', '/atlas/tactical/wd-mending-bindery.svg',
                      '/atlas/tactical/Undermountain-Topology-DM.json', '/atlas/art/north-Terrain.png',
                      '/sources/book.pdf', '/__echo_package', '/download?path=private-maps/hidden.png',
                      '/thumbnail?path=private-maps/hidden.png', '/%2e%2e/private-maps/hidden.png'):
            status, headers, body = get(route)
            assert status == 404, (route, status)
            assert headers['Cache-Control'] == 'no-store'
            assert b'PRIVATE SOURCE MAP' not in body
        for route in ('/api/map', '/api/atlas-map'):
            status, headers, body = get(route)
            assert status == 200 and headers.get_content_type() == 'image/png' and body == png, (route, status, body[:100])
            assert headers['Cache-Control'] == 'no-store'
            assert headers['X-Content-Type-Options'] == 'nosniff'
            assert get(route, False)[0] == 401
        status, headers, body = get('/api/state')
        assert status == 200 and b'private-maps' not in body and b'atlas/tactical' not in body
        checks.append('Authenticated image endpoints return only current projected raster; private/download/thumbnail/catalog routes stay unavailable and uncached')
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)

print('\n'.join('PASS ' + check for check in checks))
