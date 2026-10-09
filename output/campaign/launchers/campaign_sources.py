"""Read-only canonical ingestion, page citations, and conservative initial state.

PDF bytes are never changed. Only the local SQLite search index is written. Source
text is evidence, never executable instructions. A PDF extraction failure is returned
explicitly; it is never reported as a successfully indexed book.
"""
import hashlib
from functools import lru_cache
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import concurrent.futures

from campaign_store import validate_record

PUBLIC_PDF = frozenset(('The-Echo-Below-Player-Guide.pdf',))
PUBLIC_MARKDOWN = frozenset(('Player-Guide.md',))
CANONICAL_MARKDOWN = frozenset((
    'Campaign-Core.md', 'Current-Party.md', 'Continuity-Reference.md', 'Player-Guide.md',
    'Echo-Below-Questbook.md', 'Echo-Below-Campaign-Outline.md', 'Five-Character-Stories.md',
    'Session-01-Actual-Recap.md', 'Session-02-03-Actual-Recap.md',
    'Session-01-DM-Run-Sheet.md', 'Session-02-Phandalin-DM-Run-Sheet.md',
    'Session-03-Gundren-Castle-DM-Run-Sheet.md', 'Session-04-Wave-Echo-DM-Run-Sheet.md',
    'Site-Adventures.md', 'Settlements-Guide.md', 'Undermountain-Roadmap.md',
    'Waterdeep-First-Expedition-Guide.md', 'Finale.md', 'Travel-Guide.md', 'Clue-Handouts.md',
))


def sha256_file(path):
    digest = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()


def source_id(filename):
    return 'source-' + hashlib.sha256(filename.encode()).hexdigest()[:24]


@lru_cache(maxsize=1)
def _bundled_pdf_python():
    candidate = Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3'
    if not candidate.is_file():
        return None
    try:
        result = subprocess.run([str(candidate), '-c', 'import pypdf'], capture_output=True, timeout=8)
        return str(candidate) if result.returncode == 0 else None
    except (OSError, subprocess.SubprocessError):
        return None


def pdf_pages(path):
    """Return text per physical PDF page using pypdf or a configured local extractor."""
    if importlib.util.find_spec('pypdf') is not None:
        from pypdf import PdfReader
        reader = PdfReader(str(path))
        return [page.extract_text() or '' for page in reader.pages]
    executable = os.environ.get('ECHO_PDF_PYTHON', '').strip()
    if not executable and not shutil.which('pdftotext'):
        executable = _bundled_pdf_python()
    if executable:
        # An explicitly configured local Python may have pypdf even when the launcher
        # runs with the system Python. No shell expansion, network, or installation.
        code = 'import json,sys; from pypdf import PdfReader; print(json.dumps([p.extract_text() or "" for p in PdfReader(sys.argv[1]).pages]))'
        process = subprocess.run([executable, '-c', code, str(path)], capture_output=True, text=True, timeout=180)
        if process.returncode:
            raise RuntimeError('ECHO_PDF_PYTHON could not extract PDF text: ' + process.stderr[-500:])
        value = json.loads(process.stdout)
        if not isinstance(value, list) or not all(isinstance(page, str) for page in value):
            raise RuntimeError('PDF extractor returned an invalid page list')
        return value
    extractor = shutil.which('pdftotext')
    if extractor:
        process = subprocess.run([extractor, '-layout', str(path), '-'], capture_output=True, text=True, timeout=180)
        if process.returncode:
            raise RuntimeError('pdftotext failed: ' + process.stderr[-500:])
        pages = process.stdout.split('\f')
        if pages and not pages[-1].strip():
            pages.pop()
        return pages
    raise RuntimeError('PDF text extraction unavailable. Install pypdf in the launcher Python, install pdftotext, or set ECHO_PDF_PYTHON to a Python with pypdf.')


# Native macOS Vision keeps image-only books local. The generated helper and OCR
# cache live beside the private database, never in sources/ or the served app tree.
VISION_OCR_SWIFT = r"""
import Foundation
import PDFKit
import Vision
import AppKit

guard CommandLine.arguments.count == 5,
      let first = Int(CommandLine.arguments[2]),
      let last = Int(CommandLine.arguments[3]),
      let document = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1])) else {
    fputs("Cannot open source PDF or parse page range\n", stderr); exit(2)
}
var pages: [String: String] = [:]
var failed: [Int] = []
let end = last == 0 ? document.pageCount : min(last, document.pageCount)
for index in max(0, first - 1)..<end {
    autoreleasepool {
        guard let page = document.page(at: index) else { failed.append(index + 1); return }
        let bounds = page.bounds(for: .mediaBox)
        let scale: CGFloat = 2.0
        let width = max(1, Int(bounds.width * scale))
        let height = max(1, Int(bounds.height * scale))
        guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
              let context = CGContext(data: nil, width: width, height: height,
                bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace,
                bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
            failed.append(index + 1); return
        }
        context.setFillColor(NSColor.white.cgColor)
        context.fill(CGRect(x: 0, y: 0, width: width, height: height))
        context.scaleBy(x: scale, y: scale)
        page.draw(with: .mediaBox, to: context)
        guard let image = context.makeImage() else { failed.append(index + 1); return }
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.usesLanguageCorrection = true
        request.recognitionLanguages = ["en-US"]
        do {
            try VNImageRequestHandler(cgImage: image, options: [:]).perform([request])
            let observations = request.results ?? []
            // Preserve local OCR results as uncertain source evidence. Two-column
            // pages may need checking in the cited PDF before using exact rules.
            let lines = observations.sorted { a, b in
                if abs(a.boundingBox.midY - b.boundingBox.midY) > 0.012 {
                    return a.boundingBox.midY > b.boundingBox.midY
                }
                return a.boundingBox.minX < b.boundingBox.minX
            }.compactMap { $0.topCandidates(1).first?.string }
            pages[String(index + 1)] = lines.joined(separator: "\n")
        } catch { failed.append(index + 1) }
    }
}
let result: [String: Any] = ["page_count": document.pageCount, "pages": pages, "failed": failed]
do {
    let data = try JSONSerialization.data(withJSONObject: result)
    try data.write(to: URL(fileURLWithPath: CommandLine.arguments[4]), options: .atomic)
} catch { fputs("Cannot write local OCR result\n", stderr); exit(3) }
if !failed.isEmpty { fputs("Local macOS Vision could not recognize one or more pages\n", stderr); exit(1) }
"""


def ocr_pdf_pages(path, checksum, cache_root, page_count=None):
    """OCR an image-only PDF locally, with exact physical page + source-hash cache.

    Native OCR may take minutes on a complete sourcebook; service callers run this
    in their existing background indexing worker. No hosted OCR is ever contacted.
    """
    if os.environ.get('ECHO_SOURCE_OCR', '1') == '0':
        raise RuntimeError('Image-only PDF needs OCR; local OCR is disabled by ECHO_SOURCE_OCR=0')
    if sys.platform != 'darwin' or not shutil.which('swiftc'):
        raise RuntimeError('Image-only PDF needs OCR. Automatic local OCR requires macOS Vision and Swift command-line tools; provide a searchable local PDF on other systems.')
    cache_root = Path(cache_root)
    cache_root.mkdir(parents=True, exist_ok=True, mode=0o700)
    cache_root.chmod(0o700)
    helper_version = hashlib.sha256(VISION_OCR_SWIFT.encode()).hexdigest()[:16]
    cached = cache_root / (checksum + '-' + helper_version + '.json')
    if cached.is_file():
        try:
            value = json.loads(cached.read_text())
            if (value['source_sha256'] == checksum and value['extractor'] == helper_version and
                    isinstance(value['pages'], list) and all(isinstance(page, str) for page in value['pages']) and
                    value['pages'] and (page_count is None or len(value['pages']) == page_count) and
                    any(page.strip() for page in value['pages'])):
                return value['pages']
        except (OSError, ValueError, KeyError, TypeError):
            pass
    executable = cache_root / ('vision-ocr-' + helper_version)
    if not executable.is_file():
        with tempfile.TemporaryDirectory(prefix='compile-', dir=cache_root) as folder:
            folder = Path(folder)
            swift_file = folder / 'source-ocr.swift'
            swift_file.write_text(VISION_OCR_SWIFT)
            output = folder / 'vision-ocr'
            compile_result = subprocess.run([shutil.which('swiftc'), '-O', '-module-cache-path', str(cache_root / 'swift-modules'),
                                             str(swift_file), '-o', str(output)], capture_output=True, text=True, timeout=180)
            if compile_result.returncode:
                raise RuntimeError('Could not prepare local macOS OCR: ' + compile_result.stderr[-500:])
            output.chmod(0o700)
            os.replace(output, executable)
    with tempfile.TemporaryDirectory(prefix='pages-', dir=cache_root) as folder:
        folder = Path(folder)
        def batch(bounds):
            first, last = bounds
            output = folder / ('pages-%s-%s.json' % (first, last))
            response = subprocess.run([str(executable), str(path), str(first), str(last), str(output)],
                                      capture_output=True, text=True, timeout=1200)
            if response.returncode or not output.is_file():
                raise RuntimeError('Local OCR failed for pages %s-%s. macOS Vision requires access to its local recognition services. %s' %
                                   (first, last or 'end', response.stderr[-300:]))
            value = json.loads(output.read_text())
            if value.get('failed'):
                raise RuntimeError('Local OCR failed on physical PDF pages: ' + ', '.join(map(str, value['failed'])))
            return value
        if page_count:
            ranges = [(start, min(start + 31, page_count)) for start in range(1, page_count + 1, 32)]
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
                batches = list(pool.map(batch, ranges))
        else:
            batches = [batch((1, 0))]
            page_count = batches[0]['page_count']
        pages = [''] * page_count
        seen = set()
        for value in batches:
            if value.get('page_count') != page_count:
                raise RuntimeError('OCR physical page count changed during extraction')
            for number, content in value['pages'].items():
                index = int(number) - 1
                if not 0 <= index < page_count or not isinstance(content, str):
                    raise RuntimeError('OCR returned invalid page data')
                pages[index] = content
                seen.add(index)
        if len(seen) != page_count or not any(page.strip() for page in pages):
            raise RuntimeError('Local OCR did not produce complete usable page text')
        if sha256_file(path) != checksum:
            raise RuntimeError('Source PDF changed during OCR; retry indexing the current file')
        value = {'source_sha256': checksum, 'extractor': helper_version, 'pages': pages}
        target = folder / 'cache.json'
        target.write_text(json.dumps(value, ensure_ascii=False))
        target.chmod(0o600)
        os.replace(target, cached)
        return pages


def text_chunks(text, max_chars=2200, overlap=220):
    text = re.sub(r'[ \t]+', ' ', text.replace('\x00', ''))
    text = re.sub(r'\n{3,}', '\n\n', text).strip()
    start = 0
    while start < len(text):
        end = min(start + max_chars, len(text))
        if end < len(text):
            split = max(text.rfind('\n', start + max_chars // 2, end), text.rfind('. ', start + max_chars // 2, end))
            if split > start:
                end = split + 1
        value = text[start:end].strip()
        if value:
            yield value
        if end == len(text):
            break
        start = max(start + 1, end - overlap)


def _metadata(path):
    if 'Actual-Recap' in path.name:
        return {'authority': 'actual_play', 'source_warning': 'Actual table record. Later approved state and later actual records control changes.'}
    if path.name in ('Current-Party.md', 'Player-Guide.md'):
        return {'authority': 'current_campaign', 'source_warning': 'Current checkpoint; character mechanics follow the live sheets.'}
    if path.name in ('Echo-Below-Questbook.md', 'Echo-Below-Campaign-Outline.md', 'Five-Character-Stories.md'):
        return {'authority': 'current_dm_plan', 'source_warning': 'Adopted DM planning supersedes older provisional arcs. Future scenes are not completed events.'}
    if path.name == 'The-Echo-Below-DM-Book.pdf':
        return {'authority': 'compiled_campaign_reference', 'source_warning': 'Earlier compiled book. Current campaign files, adopted questbook, and actual-play records supersede outdated details.'}
    if path.name == 'The-Echo-Below-Player-Guide.pdf':
        return {'authority': 'compiled_player_reference', 'source_warning': 'Earlier player guide. Current Player-Guide.md and approved state supersede outdated party/checkpoint details.'}
    if path.suffix.lower() == '.pdf':
        return {'authority': 'sourcebook_reference', 'source_warning': 'Published/reference material; describes possible content, not proof of events at this table. Custom campaign continuity takes precedence.'}
    return {'authority': 'campaign_reference', 'source_warning': 'Preparation/reference. Do not promote planned scenes, rumors, or theories to completed facts.'}


def ingest_sources(store, source_root, campaign_root, seed=True):
    """Index canonical sources and seed missing records without overwriting DM edits.

    Returns {ok,indexed,unchanged,failed,seeded,source_manifest}. The report is DM-only.
    A failed replacement revokes old chunks to avoid silently retrieving stale text.
    """
    source_root, campaign_root = Path(source_root).resolve(), Path(campaign_root).resolve()
    paths = [(path, 'sources/' + path.name) for path in sorted(source_root.glob('*.pdf'))]
    paths += [(campaign_root / name, 'campaign/' + name) for name in sorted(CANONICAL_MARKDOWN) if (campaign_root / name).is_file()]
    hub = campaign_root.parent / 'waterdeep' / 'Waterdeep-Hub.md'
    if hub.is_file():
        paths.append((hub, 'waterdeep/Waterdeep-Hub.md'))
    report = {'ok': True, 'indexed': 0, 'unchanged': 0, 'failed': [], 'seeded': [], 'removed': 0}
    if not source_root.is_dir():
        report['failed'].append({'filename': str(source_root), 'error': 'Canonical sources directory does not exist'})
    existing = {item['id']: item for item in store.source_manifest()}
    seen = set()
    for path, filename in paths:
        identifier = source_id(filename)
        seen.add(identifier)
        try:
            checksum = sha256_file(path)
            public = ((path.suffix.lower() == '.pdf' and path.name in PUBLIC_PDF) or
                      (path.suffix.lower() == '.md' and path.name in PUBLIC_MARKDOWN))
            visibility = 'player' if public else 'dm'
            old = existing.get(identifier)
            if old and old['sha256'] == checksum and old['visibility'] == visibility:
                report['unchanged'] += 1
                continue
            used_ocr = False
            if path.suffix.lower() == '.pdf':
                try:
                    pages = pdf_pages(path)
                except RuntimeError as extraction_error:
                    if not str(extraction_error).startswith('PDF text extraction unavailable.'):
                        raise
                    pages = []
                if not pages or not any(page.strip() for page in pages):
                    pages = ocr_pdf_pages(path, checksum, store.db_path.parent / 'source-ocr', page_count=len(pages) or None)
                    used_ocr = True
            else:
                pages = [path.read_text(encoding='utf-8')]
            if not pages or not any(page.strip() for page in pages):
                raise RuntimeError('No extractable text; OCR is required before this source can be searched')
            metadata = _metadata(path)
            metadata['extraction'] = 'macos_vision_ocr' if used_ocr else 'text_layer'
            if used_ocr:
                metadata['source_warning'] += ' Locally OCR-read scan: confirm exact rules, numbers, and column order against the cited PDF page.'
            metadata.update({'managed_by': 'canonical-ingest-v1', 'page_basis': 'physical_pdf_page' if path.suffix.lower() == '.pdf' else 'whole_markdown_file',
                             'empty_pages': [i + 1 for i, page in enumerate(pages) if not page.strip()]})
            chunks = []
            for page_no, page in enumerate(pages, 1):
                for index, value in enumerate(text_chunks(page)):
                    chunks.append({'id': identifier + ':p' + str(page_no) + ':c' + str(index + 1),
                                   'page': page_no, 'chunk_index': index, 'text': value,
                                   'sha256': hashlib.sha256(value.encode()).hexdigest(),
                                   'epistemic': 'unresolved'})
            source = {'id': identifier, 'filename': filename, 'sha256': checksum,
                      'visibility': visibility, 'format': path.suffix.lower().lstrip('.'),
                      'page_count': len(pages), 'metadata': metadata}
            if sha256_file(path) != checksum:
                raise RuntimeError('Source file changed during extraction; retry indexing the current file')
            store.put_source(source, chunks)
            report['indexed'] += 1
        except Exception as error:
            if identifier in existing:
                store.remove_source(identifier)
            report['failed'].append({'filename': filename, 'error': str(error)[:1200]})
    # Only revoke missing files if their directory exists. A temporarily unmounted
    # source root is surfaced as a failure and cannot erase the existing index.
    for identifier, item in existing.items():
        if (identifier not in seen and item['metadata'].get('managed_by') == 'canonical-ingest-v1'
                and (not item['filename'].startswith('sources/') or source_root.is_dir())):
            store.remove_source(identifier)
            report['removed'] += 1
    report['seeded'] = seed_initial_state(store, source_root, campaign_root) if seed else []
    report['source_manifest'] = store.source_manifest()
    report['ok'] = not report['failed']
    return report


def seed_initial_state(store, source_root, campaign_root):
    """Conservative curated facts: disclosure and possession are not inferred from prep."""
    source_root, campaign_root = Path(source_root), Path(campaign_root)
    def cite(name, locator, page=None):
        path = campaign_root / name
        filename = 'campaign/' + name
        if not path.is_file():
            return []
        result = {'source_id': source_id(filename), 'filename': filename,
                  'sha256': sha256_file(path), 'locator': locator}
        if page is not None:
            result['page'] = page
        return [result]

    core = cite('Campaign-Core.md', 'Waterdeep: a home that moves the story; The opening')
    guide = cite('Player-Guide.md', 'Your current party; Where you left off')
    actual = cite('Session-02-03-Actual-Recap.md', 'Combined actual-play record')
    hub_path = campaign_root.parent / 'waterdeep' / 'Waterdeep-Hub.md'
    hub = []
    if hub_path.is_file():
        hub = [{'source_id': source_id('waterdeep/Waterdeep-Hub.md'), 'filename': 'waterdeep/Waterdeep-Hub.md',
                'sha256': sha256_file(hub_path), 'locator': 'Eight recurring faces: Durnan; Selise Ardent'}]
    elif (source_root / 'The-Echo-Below-DM-Book.pdf').is_file():
        hub = [{'source_id': source_id('sources/The-Echo-Below-DM-Book.pdf'), 'filename': 'sources/The-Echo-Below-DM-Book.pdf',
                'sha256': sha256_file(source_root / 'The-Echo-Below-DM-Book.pdf'), 'page': 11}]

    def fact(identifier, text, provenance, visibility='dm', npc_ids=None, player_safe=False, epistemic='confirmed'):
        return dict(id=identifier, text=text, provenance=provenance, visibility=visibility,
                    npc_ids=npc_ids or [], player_safe=player_safe, epistemic=epistemic)

    def npc(identifier, name, provenance, facts):
        return dict(id=identifier, kind='npc', name=name, visibility='dm', epistemic='confirmed',
                    provenance=provenance, data={'origin': 'canonical_initial_seed', 'encounter_status': 'DM must establish contact in play'}, facts=facts)

    records = []
    if hub:
        records.extend([
            npc('npc-durnan', 'Durnan', hub, [
                fact('npc-durnan:host', 'Durnan operates the Yawning Portal in Waterdeep, offering meals, lodging, and practical expedition advice.', hub, 'npc', ['npc-durnan'], True),
                fact('npc-durnan:return', 'Durnan asks adventurers to tell someone when they expect to return.', hub, 'npc', ['npc-durnan'], True),
                fact('npc-durnan:log', 'Durnan kept a page from an abandoned expedition log and has heard the peculiar two-beat description from earlier survivors.', hub, 'npc', ['npc-durnan']),
                fact('npc-durnan:limits', 'Durnan does not know what the Nine mean.', hub, 'dm'),
            ]),
            npc('npc-selise', 'Selise Ardent', hub, [
                fact('npc-selise:scholar', 'Selise Ardent is a translator and cartographic historian at the Second Margin bookshop in the Castle Ward of Waterdeep.', hub, 'npc', ['npc-selise'], True),
                fact('npc-selise:evidence', 'Selise separates observation, inference, and disputed claims; she asks permission before copying an artifact or document.', hub, 'npc', ['npc-selise'], True),
                fact('npc-selise:mentor', 'A mentor’s disappearance led Selise to buy the shop. An old floor plan has a room the current building lacks.', hub, 'npc', ['npc-selise']),
                fact('npc-selise:limits', 'Selise has not found the Silent Library and does not know the fate of its society.', hub, 'dm'),
            ])])
    if core:
        records.extend([
            npc('npc-gundren', 'Gundren Rockseeker', core, [
                fact('npc-gundren:job', 'Gundren Rockseeker hired the adventurers to escort supplies to Phandalin.', guide or core, 'npc', ['npc-gundren'], True),
                fact('npc-gundren:trust', 'Gundren values trustworthy companions and careful accounts of discoveries.', core, 'npc', ['npc-gundren'], True),
                fact('npc-gundren:medallion', 'Gundren acquired the black stone medallion without understanding it and intended to consult Trista. Its handoff must be established in play.', core, 'dm'),
                fact('npc-gundren:capture', 'Redbrands abducted Gundren and delivered him to Cragmaw Castle. The party has learned the Redbrand connection but has no reported knowledge of the castle destination.', core, 'dm'),
            ]),
            npc('npc-halaster', 'Halaster', core, [
                fact('npc-halaster:name', 'Halaster is a wizard associated with Undermountain beneath Waterdeep.', core, 'npc', ['npc-halaster'], True),
                fact('npc-halaster:research', 'Halaster studies the knot in the Weave; his research and the Nine are hidden campaign information.', core, 'npc', ['npc-halaster']),
                fact('npc-halaster:recognition', 'A meaningful Forge interaction can bring the present party to Halaster’s attention. Do not assume this has happened.', core, 'dm', epistemic='unresolved'),
                fact('npc-halaster:agency', 'The knot is not a confirmed sentient villain, and Halaster is not all-knowing.', core, 'dm', epistemic='unresolved'),
            ]),
        ])
    if guide:
        records.extend([
            dict(id='quest-find-gundren', kind='quest', name='Find Gundren', visibility='player', epistemic='confirmed', provenance=guide,
                 data={'status': 'active'}, facts=[fact('quest-find-gundren:known', 'The party learned that the Redbrands have Gundren. His rescue is unresolved.', guide, 'player')]),
            dict(id='thread-redbrand-hideout', kind='thread', name='Enter the Redbrand hideout', visibility='player', epistemic='confirmed', provenance=guide,
                 data={'status': 'active'}, facts=[fact('thread-redbrand-hideout:checkpoint', 'Play stopped just before the party entered the Redbrand hideout; the approach remains to be chosen.', guide, 'player')]),
            dict(id='clue-black-spider', kind='clue', name='The Black Spider exists', visibility='player', epistemic='confirmed', provenance=guide,
                 data={'learned': True}, facts=[fact('clue-black-spider:known', 'The party learned that the Black Spider exists.', guide, 'player')]),
            dict(id='location-phandalin', kind='location', name='Phandalin', visibility='player', epistemic='confirmed', provenance=guide,
                 facts=[fact('location-phandalin:job', 'The party’s supply escort job led toward Phandalin.', guide, 'player')]),
        ])
    session_one = cite('Session-01-Actual-Recap.md', 'Actual outcome: Yeemik, Sildar, and the BELOW token')
    if session_one:
        records.extend([
            dict(id='choice-yeemik-bargain', kind='choice', name='Bargain with Yeemik', visibility='player', epistemic='confirmed', provenance=session_one,
                 data={'session': 'session-01'}, facts=[fact('choice-yeemik-bargain:outcome', 'The party left Yeemik in charge after he released Sildar under their bargain.', session_one, 'player')]),
            dict(id='item-below-token', kind='item', name='BELOW token', visibility='dm', epistemic='confirmed', provenance=session_one,
                 data={'holder': 'Trista', 'party_shared': False}, facts=[fact('item-below-token:custody', 'Trista privately kept the BELOW token. Donavan noticed concealment without learning what she hid.', session_one)]),
            dict(id='relationship-party-yeemik', kind='relationship', name='Party and Yeemik', visibility='player', epistemic='confirmed', provenance=session_one,
                 data={'from_id': 'party', 'to_id': 'npc-yeemik', 'relationship': 'bargain honored; later attitude unresolved'},
                 facts=[fact('relationship-party-yeemik:bargain', 'Yeemik released Sildar under a bargain with the party.', session_one, 'player')]),
        ])
    with store.connection() as db:
        previously_seeded = {row['record_id'] for row in db.execute('SELECT record_id FROM campaign_seeded')}
    new = [validate_record(record) for record in records
           if record['id'] not in previously_seeded and store.get_record(record['id']) is None]
    def mark_seeded(db, result=None):
        for record in records:
            db.execute('INSERT OR IGNORE INTO campaign_seeded(record_id) VALUES(?)', (record['id'],))
    if new:
        # Mark first import atomically. Later re-ingestion must neither overwrite a
        # DM edit nor resurrect a seeded record that the DM deliberately deleted.
        store.apply_mutations([{'op': 'upsert', 'record': record} for record in new], store.revision(), actor='dm', commit_hook=mark_seeded)
    elif records:
        with store.connection() as db:
            mark_seeded(db)
    return [record['id'] for record in new]


# Convenience name for service initialization without full PDF indexing.
seed_campaign = seed_initial_state


if __name__ == '__main__':
    import argparse
    from campaign_store import CampaignStore
    parser = argparse.ArgumentParser(description='Index local Echo Below canonical sources without modifying them')
    parser.add_argument('--db', required=True)
    parser.add_argument('--sources', required=True)
    parser.add_argument('--campaign', default=str(Path(__file__).resolve().parents[1]))
    arguments = parser.parse_args()
    result = ingest_sources(CampaignStore(arguments.db), arguments.sources, arguments.campaign)
    print(json.dumps(result, indent=2))
    sys.exit(0 if result['ok'] else 1)
