import sys,tempfile,json,zipfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'launchers'))
from portable_package import build,verify
from phone_health import claims,seen,acknowledge,manage
with tempfile.TemporaryDirectory() as tmp:
 root=Path(tmp);app=root/'output/campaign';app.mkdir(parents=True);(app/'map.png').write_bytes(b'art');(root/'sources').mkdir();(root/'sources/book.pdf').write_bytes(b'local book')
 archive={'format':'echo-below-campaign-v2','sessions':[{'id':'one','state':{}}]};dest=root/'bundle.zip';build(root,archive,dest);assert verify(dest)
 with zipfile.ZipFile(dest) as z:assert z.read('output/campaign/map.png')==b'art';assert json.loads(z.read('campaign-backup.json'))==archive;assert 'Start-Campaign.py' in z.namelist();assert not any(n.startswith('sources/') for n in z.namelist());assert json.loads(z.read('MANIFEST.json'))['sourceBooksIncluded'] is False
 with zipfile.ZipFile(dest,'a') as z:z.writestr('campaign-backup.json',b'corrupt')
 try:verify(dest);raise AssertionError('Corruption was accepted')
 except ValueError:pass
 t={'claims':{'a':'pc-a','b':'pc-b'},'roster':[{'id':'pc-a','name':'A'},{'id':'pc-b','name':'B'}],'revision':2,'events':[]};seen(t,'pc-a');acknowledge(t,'pc-a',2);assert claims(t)[0]['status']=='current';assert claims(t,now=t['phone_health']['pc-a']['seen']+20)[0]['status']=='offline';manage(t,'pc-a','release');assert t['claims']=={'b':'pc-b'}
print('Portable package and phone health passed: relocatable files, campaign archive, integrity corruption rejection, real freshness, isolated release.')
