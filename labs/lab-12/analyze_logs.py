from pathlib import Path
import re,json,collections,hashlib
from urllib.parse import unquote
root=Path(__file__).parent
rows=[]
for n,line in enumerate((root/'sources/webserver.log').read_text().splitlines(),1):
 m=re.fullmatch(r'(\S+) - - \[([^]]+)\] "(\S+) (.+) HTTP/([^"]+)" (\d+) (\d+) "([^"]*)" "([^"]*)"',line)
 if not m: raise ValueError(f'Cannot parse line {n}')
 ip,time,method,path,version,status,size,referer,ua=m.groups()
 rows.append(dict(line=n,ip=ip,time=time,method=method,path=unquote(path),status=int(status),bytes=int(size),userAgent=ua))
a=[r for r in rows if r['ip']=='185.220.101.22']
f=[r for r in a if r['method']=='POST' and r['path']=='/auth/login' and r['status']==401]
exports=[r for r in a if '/export?' in r['path']]
result=dict(totalRequests=len(rows),sourceIPs=dict(collections.Counter(r['ip'] for r in rows)),suspectRequests=len(a),failedLogins=len(f),firstFailed=f[0]['time'],lastFailed=f[-1]['time'],successfulLogin=[r for r in a if r['method']=='POST' and r['path']=='/auth/login' and r['status']==200],exports=exports,exportResponseBytes=sum(r['bytes'] for r in exports),sqlRequests=[r for r in a if r['path'].startswith('/api/catalog/search')],profileChanges=[r for r in a if r['method'] in ['PATCH','POST'] and '/profile' in r['path']],finalRequests=rows[-7:],sourceSHA256={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'sources').iterdir()})
(root/'evidence/libraxis-analysis.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
print(json.dumps({k:v for k,v in result.items() if k not in ['sqlRequests','finalRequests','profileChanges','successfulLogin']},ensure_ascii=False,indent=2))
