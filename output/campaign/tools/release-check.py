"""One release gate. All campaign writes go to disposable profiles/fixtures.

No live provider request is part of this command. Historical specialist rehearsals
are inventoried separately rather than implied by a successful core release gate.
"""
from pathlib import Path
import argparse
import datetime
import hashlib
import html
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import importlib.util
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'launchers'))
from status_evidence import versions

APP = Path(__file__).resolve().parents[1]
PROJECT = APP.parents[1]
TOOLS = APP / 'tools'
OUTPUT = PROJECT / 'output/audits/release-check'
BROWSERS = ['check-campaign-boundary-browser.cjs','check-voice-handoff-browser.cjs','check-voice-studio-browser.cjs','check-voice-auditions-browser.js','check-performance-browser.cjs','check-table-rehearsal-browser.cjs','check-current-status-browser.cjs','check-stage9-browser.cjs', 'check-hybrid-combat-browser.js','check-party-actions-browser.cjs',
            'check-outcomes-browser.js', 'check-stage3-recovery-browser.js',
            'check-evening-path-browser.js','check-reconciliation-browser.cjs','check-whole-backup-browser.cjs']
SERVICES = ['check-stage4-five-phones.py', 'check-stage4-phone-health.py',
            'check-phone-service.py', 'check-atlas-asset-boundary.py',
            'check-portable-service.py', 'check-portable-package.py', 'check-stage9-package.py']


def inventory():
    entries = []
    for path in sorted([*TOOLS.glob('check-*'), *APP.joinpath('tests').glob('*')]):
        if path.suffix not in ('.js', '.cjs', '.py'):
            continue
        source = path.read_text()
        if path.parent.name == 'tests':
            category, gate = 'unit or mocked service', True
        elif 'playwright' in source:
            category, gate = 'isolated browser rehearsal', path.name in BROWSERS
        elif path.suffix == '.py':
            category, gate = 'local service or asset fixture', path.name in SERVICES
        else:
            category, gate = 'in-memory or source-contract check', True
        entries.append({'file': str(path.relative_to(APP)), 'category': category,
                        'coreGate': gate, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                        'note': '' if gate else 'Specialist rehearsal; inventoried, not executed by the core gate.'})
    return entries


def run(label, category, command, env, timeout=180):
    start = time.monotonic()
    process = subprocess.Popen(command, cwd=PROJECT, env=env, stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, text=True, start_new_session=True)
    try:
        output, _ = process.communicate(timeout=timeout)
        code = process.returncode
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGTERM)
        try:
            output, _ = process.communicate(timeout=8)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            output, _ = process.communicate()
        code = 124
        output += '\nTimed out; stopped this test process and its temporary children.'
    row = {'name': label, 'category': category, 'passed': code == 0,
           'exitCode': code, 'seconds': round(time.monotonic() - start, 2), 'output': output[-24000:]}
    print(('PASS' if row['passed'] else 'FAIL') + ' ' + label, flush=True)
    return row


def prove_detection(node, env, temp):
    mutations = [
        ('future-schema rejection', APP/'Session-01-Reliability.js',
         'if (version > VERSION)', 'if (false)', 'ECHO_TEST_RELIABILITY_SOURCE',
         APP/'tests/reliability.test.cjs', 'Missing expected exception'),
        ('token drag commit', APP/'Session-01-Battleboard.js',
         'function placeTokensDirect(actorId, destination) {',
         'function placeTokensDirect(actorId, destination) { return;',
         'ECHO_TEST_BOARD_SOURCE', TOOLS/'check-token-drag.js', 'drag saves once'),
        ('DM module leakage', APP/'Session-01-Loader.js',
         "if (!player && boundary.echo) await load('Echo-Below-Table-Content.js');", "await load('Echo-Below-Table-Content.js');", 'ECHO_TEST_LOADER_SOURCE',
         APP/'tests/module-loader.test.cjs', 'Player loader must exclude')
    ]
    proofs = []
    for label, original, before, after, variable, target, expected in mutations:
        source = original.read_text()
        if before not in source:
            proofs.append({'name': label, 'passed': False, 'error': 'Mutation anchor changed; update the proof.'})
            continue
        mutant = Path(temp)/('mutant-'+original.name)
        mutant.write_text(source.replace(before, after))
        row = run('Fault proof: '+label, 'deliberately broken temporary module',
                  [node, str(target)], {**env, variable: str(mutant)}, timeout=60)
        caught = row['exitCode'] != 0 and expected in row['output']
        proofs.append({'name': label, 'passed': caught, 'faultCaught': caught,
                       'expectedFailure': expected, 'observedExitCode': row['exitCode'],
                       'output': row['output'], 'productionFileUnchanged': original.read_text() == source})
        print(('CAUGHT' if caught else 'MISSED')+' '+label, flush=True)
    return proofs


def write_report(report):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    old = OUTPUT/'latest.json'
    if old.exists():
        prior=json.loads(old.read_text())
        history=OUTPUT/'history';history.mkdir(exist_ok=True)
        stamp=prior.get('at','undated').replace(':','-')
        for suffix in ('json','html'):
            source=OUTPUT/('latest.'+suffix)
            if source.exists():
                shutil.copyfile(source,history/(stamp+'.'+suffix))
    (OUTPUT/'latest.json').write_text(json.dumps(report, indent=2)+'\n')
    escape = html.escape
    rows = []
    for row in report['checks']:
        rows.append(f'<details><summary><b>{"Passed" if row["passed"] else "Failed"}</b> — '
                    f'{escape(row["name"])} <small>{escape(row["category"])} · {row["seconds"]}s</small></summary>'
                    f'<pre>{escape(row["output"])}</pre></details>')
    faults = ''.join(f'<li>{escape(p["name"])}: {"caught" if p["passed"] else "NOT caught"}</li>'
                     for p in report['faultProofs'])
    status = 'Core release checks passed' if report['coreGatePassed'] else 'Release checks need attention'
    text = f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Echo Below release check</title><style>body{{max-width:960px;margin:40px auto;padding:0 22px;background:#151c22;color:#edf0ec;font:17px/1.55 system-ui}}h1,h2{{color:#e9c98b}}small{{display:block;color:#b4bdc6}}details{{border:1px solid #46515b;border-radius:8px;margin:9px 0;padding:12px}}summary{{cursor:pointer}}pre{{white-space:pre-wrap;font-size:13px}}.notice{{padding:16px;background:#26343c;border-radius:8px}}a{{color:#dfc695}}</style>
<h1>{status}</h1><p>{escape(report['at'])}</p><p class="notice">Live campaign and phone connections were not changed. No provider requests were made. Physical table checks remain separate.</p>
<p>{sum(r['passed'] for r in report['checks'])}/{len(report['checks'])} check commands passed; individual test counts appear in their results. {len(report['inventory'])} existing test files inventoried.</p>
<h2>Deliberate faults</h2><ul>{faults}</ul><h2>Results</h2>{''.join(rows)}
<h2>Physical checks still needed</h2><ul><li>Flat TV readability, safe edges, rotation, and grid size.</li><li>Real phones on table Wi-Fi; disconnect and rejoin one phone.</li><li>Private headphone preview and public speaker playback.</li></ul>
<p>Real providers: not tested in this release gate. Service tests use fixtures or mocks. Specialist browser rehearsals outside this gate remain listed in <a href="latest.json">the full report</a>.</p></html>'''
    (OUTPUT/'latest.html').write_text(text)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--list', action='store_true', help='List all test files without running them.')
    parser.add_argument('--no-browser', action='store_true', help='Partial diagnostic only; cannot pass the core release gate.')
    args = parser.parse_args()
    entries = inventory()
    if args.list:
        print(json.dumps(entries, indent=2))
        return 0
    node = shutil.which('node')
    if not node:
        print('Node.js is required to run the app checks.', file=sys.stderr)
        return 2
    # Use the available desktop test runtime without installing packages or making
    # network requests. A supplied NODE_PATH always takes precedence.
    env = {**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'}
    candidate = Path.home()/'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
    if not env.get('NODE_PATH') and candidate.is_dir():
        env['NODE_PATH'] = str(candidate)
    for key in ['ECHO_TEST_RELIABILITY_SOURCE','ECHO_TEST_BOARD_SOURCE','ECHO_TEST_LOADER_SOURCE',
                'ECHO_TEST_PROJECT_ROOT','ECHO_TEST_GROUP_BACKUP','ECHO_TEST_VOICE_FIXTURE']:
        env.pop(key, None)
    initial_versions=versions(APP)
    report = {'versions':initial_versions,'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'profile': 'partial diagnostic' if args.no_browser else 'core release gate',
              'inventory': entries, 'checks': [], 'faultProofs': [],
              'liveCampaignChanged': False, 'liveServicesRestarted': False,
              'realProviderRequests': 0, 'physicalDevicesTested': False}
    with tempfile.TemporaryDirectory(prefix='echo-release-check-') as temp:
        env['ECHO_TEST_REPORT_DIR'] = temp
        checks = report['checks']
        checks.append(run('Reusable extraction parity', 'source and generated module hashes', [sys.executable,str(TOOLS/'build-reusable-core.py'),'--check'],env))
        checks.append(run('JavaScript unit suite', 'unit and mocked audience context',
                          [node, '--test', *map(str, sorted((APP/'tests').glob('*.test.cjs')))], env))
        checks.append(run('Python service suite', 'temporary stores and mocked providers',
                          [sys.executable, '-m', 'unittest', 'discover', '-s', str(APP/'tests'), '-p', 'test_*.py'], env))
        for entry in entries:
            path = APP/entry['file']
            if path.parent == TOOLS and entry['category'] == 'in-memory or source-contract check':
                checks.append(run(path.name, entry['category'], [node,str(path)], env, timeout=60))
        for name in SERVICES:
            checks.append(run(name, 'temporary local service or package fixture',
                              [sys.executable,str(TOOLS/name)], env))
        if not args.no_browser:
            for name in BROWSERS:
                checks.append(run(name, 'fresh browser rehearsal',
                                  [node,'--require',str(TOOLS/'browser-test-isolation.cjs'),str(TOOLS/name)], env))
        report['faultProofs'] = prove_detection(node, env, temp)
        # Retain compact browser evidence, not source stores or a browser profile.
        if (Path(temp)/'Stage-9-Browser-Verification.json').exists():
            report['restoreBrowserEvidence'] = json.loads((Path(temp)/'Stage-9-Browser-Verification.json').read_text())
    report['versionsUnchanged']=initial_versions==versions(APP)
    report['coreGatePassed'] = report['versionsUnchanged'] and not args.no_browser and all(c['passed'] for c in report['checks']) and all(p['passed'] and p['productionFileUnchanged'] for p in report['faultProofs'])
    report['diagnosticsPassed'] = all(c['passed'] for c in report['checks']) and all(p['passed'] for p in report['faultProofs'])
    write_report(report)
    spec=importlib.util.spec_from_file_location('current_status_builder',TOOLS/'build-current-status.py')
    builder=importlib.util.module_from_spec(spec);spec.loader.exec_module(builder);builder.build()
    print(('CORE CHECKS PASSED' if report['coreGatePassed'] else 'CORE CHECKS NOT COMPLETE')+' · '+str(OUTPUT/'latest.html'))
    return 0 if report['coreGatePassed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
