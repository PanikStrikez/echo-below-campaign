import json, math, sys
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
dir=root/'scene-art-refresh'
rows=json.loads((dir/'Generation-Progress.json').read_text())
start=int(sys.argv[1]) if len(sys.argv)>1 else 0
count=int(sys.argv[2]) if len(sys.argv)>2 else 12
chosen=[r for r in rows if r.get('candidate')][start:start+count]
canvas=Image.new('RGB',(1536,368*math.ceil(len(chosen)/3)), '#ece6d7');d=ImageDraw.Draw(canvas)
for i,r in enumerate(chosen):
 im=Image.open(root/r['candidate']);im.thumbnail((508,338));x=i%3*512;y=i//3*368
 canvas.paste(im,(x,y));d.text((x+8,y+340),r['id'],fill='#172a23')
name=f'Review-{start:03d}'
canvas.save(dir/(name+'.jpg'),quality=90)
(dir/(name+'.json')).write_text(json.dumps([r['id'] for r in chosen]))
print(json.dumps({'sheet':str(dir/(name+'.jpg')),'ids':[r['id'] for r in chosen]}))
