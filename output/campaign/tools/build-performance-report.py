"""Compare dated browser evidence, with explicit scope and unchanged/negative results."""
from pathlib import Path
import html
import json

OUT=Path(__file__).resolve().parents[2]/'audits/performance'

def build():
    before=json.loads((OUT/'before-combat.json').read_text())
    after=json.loads((OUT/'after-combat.json').read_text())
    sections=json.loads((OUT/'map-sections.json').read_text())
    assert before['searchResultFingerprint']==after['searchResultFingerprint']
    assert before['environment']['sourceBackupSha256']==after['environment']['sourceBackupSha256']
    assert after['startupPreservation'] and after['maintenance']['geometry']
    labels={
        'startup':'Startup to saved Run screen',
        'mapLoadAndDecode':'Map switch, image decode and two frames',
        'dragToFrame':'Automated drag to frame (includes browser automation)',
        'dragReleaseToSavedFrame':'Drag release to saved frame',
        'tvResync':'Explicit TV resync to next frame',
        'searchFourQueries':'Four search queries',
        'phoneUpdateAllFive':'HP update reaching all five combat phone views',
    }
    rows=[]
    for key,label in labels.items():
        b=before['measurements'][key];a=after['measurements'][key]
        rows.append({'id':key,'label':label,'beforeMedianMs':b['medianMs'],'afterMedianMs':a['medianMs'],
                     'beforeP95Ms':b['p95Ms'],'afterP95Ms':a['p95Ms'],'samplesPerRun':a['samples'],
                     'medianReductionPercent':round((1-a['medianMs']/b['medianMs'])*100,1)})
    report={'at':after['at'],'before':before['at'],'after':after['at'],'environment':after['environment'],
            'dataset':after['dataset'],'comparisons':rows,
            'unchangedTvMapRebuilds':{'before':before['duplicateTvUpdates']['map'],'after':after['duplicateTvUpdates']['map'],'resyncs':12},
            'searchResultsIdentical':True,'startupStatePreserved':True,'mapGeometryPreserved':True,
            'liveServicesRestarted':False,'liveCampaignChanged':False,'physicalTestStatus':'Not checked; user skipped rehearsal',
            'sections':sections,
            'limitations':['Single paired run; timings vary with machine load. Samples are not a statistical guarantee.',
                           'Real headless Chrome and temporary real HTTP services on loopback; no physical TV, Wi-Fi, phone or speaker claim.',
                           'Scene-map loading was slower in the measured after run. Effects remained near the headless animation-frame cap; no proven effects gain.',
                           'Drag-to-frame includes mouse automation. It is not a direct hardware input-latency measurement.',
                           'Optional map crops preserve exact pixels but are not wired into automatic scene navigation. All four together use more disk space.',
                           'Modules still execute in original order. Downloads are preloaded in parallel; feature modules are not lazy-loaded.']}
    (OUT/'Browser-Performance.json').write_text(json.dumps(report,indent=2)+'\n')
    e=html.escape
    table=''.join(f'<tr><th scope="row">{e(r["label"])}</th><td>{r["beforeMedianMs"]}</td><td>{r["afterMedianMs"]}</td><td>{r["samplesPerRun"]}</td><td>{r["beforeP95Ms"]} / {r["afterP95Ms"]}</td></tr>' for r in rows)
    limitations=''.join('<li>'+e(s)+'</li>' for s in report['limitations'])
    text=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Browser performance — Echo Below</title>
<style>body{{max-width:980px;margin:36px auto;padding:0 24px;background:#142029;color:#edf1ef;font:17px/1.6 system-ui}}h1,h2{{color:#e7c591}}table{{border-collapse:collapse;width:100%;font-size:15px}}td,th{{border-bottom:1px solid #475963;padding:12px;text-align:left}}a{{color:#ead2a8}}.note{{padding:18px;border:1px solid #52656f;border-radius:10px}}code{{overflow-wrap:anywhere}}@media(max-width:650px){{.table{{overflow:auto}}}}</style>
<h1>Browser performance</h1><p>Measured {e(after['at'])} · Chrome {e(after['environment']['browser'])} · {e(after['environment']['hardware'])}</p>
<p class="note">Isolated restored campaign: ten sessions, 103 original tokens, 150 added stress tokens, and five separate phone browser clients. Live campaign, source books, services and joins were untouched. Physical rehearsal: <b>Not checked — skipped at your request.</b></p>
<h2>Before and after</h2><p>All timings in milliseconds. Median values and p95 come from the samples retained in the linked evidence.</p><div class="table"><table><thead><tr><th>Workflow</th><th>Before</th><th>After</th><th>Samples</th><th>p95 before / after</th></tr></thead><tbody>{table}</tbody></table></div>
<h2>What changed</h2><ul><li>DM dependencies download in parallel while executing in the same order. Private dependencies are excluded from player pages.</li><li>Unchanged TV updates reuse the current map: 12 unnecessary map rebuilds before, zero after. Changed positions, views and layers still update.</li><li>Position-only changes retain the roster. Its controls follow the latest token after commands and undo.</li><li>Combat and pending-request phone updates poll at 450 ms; quiet exploration and offline retries stay at 950 ms.</li><li>Search avoids repeated scoring and token scans; result identities stayed identical.</li></ul>
<h2>Smaller public map sections</h2><p>The original Phandalin image is 1536 × 1024 pixels (4.10 MB). Four optional 768 × 512 crops each use about 1.12 MB. Every saved pixel was compared with the source, including the shared boundaries. One section decoded in a median 5.3 ms versus 14.9 ms for the full image. These are exact crops, not new detail. They are prepared assets only; the current atlas and saved geometry are unchanged.</p>
<h2>Preservation checks</h2><p>Startup retained the imported party, tokens, fog and map data exactly. Movement retained map geometry. The immutable source backup hash stayed <code>{e(after['environment']['sourceBackupSha256'])}</code>. New regression coverage checks retained-row edits after movement, drag undo, TV invalidation and private preloads.</p>
<h2>Limits</h2><ul>{limitations}</ul>
<h2>Evidence</h2><p><a href="before-combat.json">Before samples and module hashes</a> · <a href="after-combat.json">After samples and module hashes</a> · <a href="map-sections.json">Saved crop comparison and decode measurements</a> · <a href="Browser-Performance.json">Combined report</a> · <a href="../release-check/latest.html">Current release checks</a></p></html>'''
    (OUT/'Browser-Performance.html').write_text(text)
    print('Performance report: '+str(OUT/'Browser-Performance.html'))

if __name__=='__main__':
    build()
