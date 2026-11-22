import {createCipheriv,createDecipheriv,createHash,randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,copyFileSync,mkdirSync,mkdtempSync,rmSync,lstatSync,existsSync,readdirSync} from 'node:fs';
import {join,resolve,dirname,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const [mode,input,target,flag]=process.argv.slice(2);
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function run(cmd,args,env=process.env){const r=spawnSync(cmd,args,{env,encoding:'utf8',maxBuffer:8*1024*1024});if(r.status!==0)throw new Error('Backup command failed: '+cmd);return r.stdout;}
function key(){const path=process.env.BACKUP_KEY_FILE;if(!path)throw new Error('Set BACKUP_KEY_FILE outside the application directory.');const st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077)!==0)throw new Error('Backup key must be an owner-only regular file.');const text=readFileSync(path,'utf8').trim();if(!/^[a-f0-9]{64}$/i.test(text))throw new Error('Invalid backup key.');return Buffer.from(text,'hex')}
function database(url){const x=new URL(url);return {...process.env,PGHOST:x.hostname,PGPORT:x.port||'5432',PGUSER:decodeURIComponent(x.username),PGPASSWORD:decodeURIComponent(x.password),PGDATABASE:decodeURIComponent(x.pathname.slice(1))};}
function manifest(path){const m=JSON.parse(readFileSync(path+'.manifest.json','utf8'));const bytes=readFileSync(path);if(m.format!==1||m.sha256!==digest(bytes))throw new Error('Backup integrity check failed.');return {m,bytes};}
const temp=mkdtempSync(join(tmpdir(),'roombook-backup-'));
try{
 if(mode==='create'){
  if(!input)throw new Error('Provide a new output path.');const out=resolve(input);if(existsSync(out)||existsSync(out+'.manifest.json'))throw new Error('Backup already exists.');
  const stage=join(temp,'stage');mkdirSync(stage,{mode:0o700});
  run('pg_dump',['--format=custom','--no-owner','--no-privileges','--file='+join(stage,'database.dump')],database(process.env.DATABASE_URL));
  const files=[['.env','runtime.env'],[process.env.NOTE_KEYRING_PATH||'.secrets/note-keys.json','note-keys.json'],[process.env.LICENSE_PATH||'data/installation-license.json','installation-license.json'],[process.env.LICENSE_PUBLIC_KEY_PATH||'data/license-public.pem','license-public.pem'],[process.env.AUDIT_CHAIN_PATH||'var/audit/events-chain.jsonl','events-chain.jsonl']];
  for(const [from,to]of files){if(!existsSync(from))throw new Error('Required recovery material is missing.');copyFileSync(from,join(stage,to));}
  const archive=join(temp,'data.tar.gz');run('tar',['-czf',archive,'-C',stage,'.']);
  const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),nonce);cipher.setAAD(Buffer.from('RoomBook backup v1'));
  const encrypted=Buffer.concat([cipher.update(readFileSync(archive)),cipher.final()]);const bytes=Buffer.concat([Buffer.from('RBBAK1'),nonce,cipher.getAuthTag(),encrypted]);
  mkdirSync(dirname(out),{recursive:true,mode:0o700});writeFileSync(out,bytes,{flag:'wx',mode:0o600});
  const m={format:1,createdAt:new Date().toISOString(),applicationVersion:JSON.parse(readFileSync('package.json','utf8')).version,algorithm:'AES-256-GCM',sha256:digest(bytes),bytes:bytes.length,files:readdirSync(stage).sort()};
  writeFileSync(out+'.manifest.json',JSON.stringify(m,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify({result:'created',artifact:basename(out),...m},null,2));
 }else if(mode==='verify'){
  const {m,bytes}=manifest(resolve(input));if(bytes.subarray(0,6).toString()!=='RBBAK1')throw new Error('Invalid backup format.');
  const cipher=createDecipheriv('aes-256-gcm',key(),bytes.subarray(6,18));cipher.setAAD(Buffer.from('RoomBook backup v1'));cipher.setAuthTag(bytes.subarray(18,34));cipher.update(bytes.subarray(34));cipher.final();
  console.log(JSON.stringify({result:'verified',sha256:m.sha256,authenticated:true,bytes:bytes.length},null,2));
 }else if(mode==='restore'){
  if(!target)throw new Error('Provide an empty recovery directory.');const env=database(process.env.RESTORE_DATABASE_URL||'');
  if(!/^roombook_(restore|drill)_[a-z0-9_]+$/.test(env.PGDATABASE))throw new Error('Restore requires an isolated roombook_restore_* or roombook_drill_* database.');
  const out=resolve(target);mkdirSync(out,{recursive:true,mode:0o700});if(readdirSync(out).length)throw new Error('Recovery directory must be empty.');
  const {bytes}=manifest(resolve(input));if(bytes.subarray(0,6).toString()!=='RBBAK1')throw new Error('Invalid backup format.');
  const cipher=createDecipheriv('aes-256-gcm',key(),bytes.subarray(6,18));cipher.setAAD(Buffer.from('RoomBook backup v1'));cipher.setAuthTag(bytes.subarray(18,34));
  const archive=join(temp,'data.tar.gz');writeFileSync(archive,Buffer.concat([cipher.update(bytes.subarray(34)),cipher.final()]),{mode:0o600});
  const expected=new Set(['.','./','./database.dump','./events-chain.jsonl','./installation-license.json','./license-public.pem','./note-keys.json','./runtime.env']);
  if(run('tar',['-tzf',archive]).trim().split('\n').some(name=>!expected.has(name)))throw new Error('Unexpected recovery archive paths.');
  const stage=join(temp,'restore');mkdirSync(stage,{mode:0o700});run('tar',['-xzf',archive,'--no-same-owner','--no-same-permissions','-C',stage]);
  // Database names are validated above; existing test databases require an explicit replacement flag.
  const admin={...env,PGDATABASE:'postgres'};const found=run('psql',['-qAt','-c',"SELECT 1 FROM pg_database WHERE datname='"+env.PGDATABASE+"'"],admin).trim();
  if(found&&flag!=='--replace-test-database')throw new Error('Database exists; explicit --replace-test-database is required.');
  if(!found)run('createdb',['--maintenance-db=postgres',env.PGDATABASE],admin);
  run('pg_restore',['--exit-on-error','--single-transaction','--clean','--if-exists','--no-owner','--no-privileges','--dbname='+env.PGDATABASE,join(stage,'database.dump')],env);
  for(const f of readdirSync(stage).filter(f=>f!=='database.dump'))writeFileSync(join(out,f),readFileSync(join(stage,f)),{mode:0o600,flag:'wx'});
  console.log(JSON.stringify({result:'restored',database:env.PGDATABASE,recoveryFiles:readdirSync(out).sort()},null,2));
 }else throw new Error('Use create, verify or restore.');
}catch(error){console.error(error instanceof Error?error.message:'Backup operation failed.');process.exitCode=1}
finally{rmSync(temp,{recursive:true,force:true})}
