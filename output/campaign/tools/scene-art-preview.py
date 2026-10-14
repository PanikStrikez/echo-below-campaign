# Compact chat preview only. The native generated PNG is never modified.
import sys,io,base64
from PIL import Image
im=Image.open(sys.argv[1]).convert('RGB');im.thumbnail((320,214))
out=io.BytesIO();im.save(out,format='JPEG',quality=65)
print(base64.b64encode(out.getvalue()).decode('ascii'),end='')
