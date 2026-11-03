"""Traffic spike drill: python scripts/load_test.py http://localhost:8000 500 (needs the API running)."""
import json,sys,urllib.request as u
from concurrent.futures import ThreadPoolExecutor
b=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8000';n=int(sys.argv[2]) if len(sys.argv)>2 else 200
f=json.load(u.urlopen(b+'/features'))['features'];body=json.dumps({'features':{k:1.0 for k in f}}).encode()
def hit(_):
    try:return u.urlopen(u.Request(b+'/predict',body,{'Content-Type':'application/json'})).status
    except Exception as e:return getattr(e,'code',0)
with ThreadPoolExecutor(32) as ex:s=list(ex.map(hit,range(n)))
print({c:s.count(c) for c in set(s)})
