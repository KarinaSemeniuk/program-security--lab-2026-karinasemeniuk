// Reproducible local release; allowlisted files exclude private configuration and development fixtures.
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync,cpSync,rmSync,existsSync,readdirSync,statSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
const destination=resolve(process.argv[2]||'artifacts');mkdirSync(destination,{recursive:true});
const version=JSON.parse(readFileSync('package.json')).version,stage=mkdtempSync(join(tmpdir(),'roombook-release-'));
function command(args){const r=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0)throw new Error('Release build failed.');return r.stdout;}
try{
 command(['node_modules/typescript/bin/tsc']);
 command(['frontend/node_modules/typescript/bin/tsc','-p','frontend/tsconfig.json','--noEmit']);
 command(['frontend/node_modules/vite/bin/vite.js','build','--config','frontend/vite.config.ts']);
 for(const path of ['dist','frontend/dist','prisma','package.json','package-lock.json','README.md','CHANGELOG.md','LICENSE','docs','.env.example','data/password-blocklist.json']){
  if(!existsSync(path))throw new Error('Required release file is missing.');mkdirSync(dirname(join(stage,path)),{recursive:true});cpSync(path,join(stage,path),{recursive:true});
 }
 for(const name of ['backup.mjs','monitor-logs.mjs','init-note-keys.mjs','installation-license.mjs']){
  mkdirSync(join(stage,'scripts'),{recursive:true});cpSync(join('scripts',name),join(stage,'scripts',name));
 }
 function walk(dir){return readdirSync(dir).flatMap(n=>{const p=join(dir,n);return statSync(p).isDirectory()?walk(p):[p]})}
 for(const path of walk(stage)){
  if(path.endsWith('.map')){rmSync(path);continue}
  if(/(?:^|\/)\.secrets(?:\/|$)|(?:^|\/)\.env$|\.key$|private\.pem$/.test(path))throw new Error('Private file in release.');
  const content=readFileSync(path,'utf8');if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content))throw new Error('Private key in release.');
 }
 const tar=join(destination,'roombook-'+version+'.tar.gz');
 const r=spawnSync('tar',['--sort=name','--mtime=2026-01-01 00:00:00Z','--owner=0','--group=0','--numeric-owner','-czf',tar,'-C',stage,'.'],{env:{...process.env,GZIP:'-n'},encoding:'utf8'});if(r.status!==0)throw new Error('Release packaging failed.');
 const hash=createHash('sha256').update(readFileSync(tar)).digest('hex');writeFileSync(tar+'.sha256',hash+'  '+tar.split('/').at(-1)+'\n');
 console.log(JSON.stringify({result:'prepared',version,artifact:tar.split('/').at(-1),sha256:hash,bytes:statSync(tar).size,privateFilesExcluded:true},null,2));
}catch{console.error('Could not prepare the local release.');process.exitCode=1}
finally{rmSync(stage,{recursive:true,force:true})}
