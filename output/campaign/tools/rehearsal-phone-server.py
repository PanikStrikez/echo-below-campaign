"""Throwaway phone service on loopback and an OS-chosen port. No live service or saves."""
import sys
from pathlib import Path
from http.server import ThreadingHTTPServer
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'launchers'))
import serve_phones as phone
server=ThreadingHTTPServer(('127.0.0.1',0),phone.Handler)
phone.PORT=server.server_address[1]
phone.lan_address=lambda:'127.0.0.1'
print(phone.PORT,flush=True)
server.serve_forever()
