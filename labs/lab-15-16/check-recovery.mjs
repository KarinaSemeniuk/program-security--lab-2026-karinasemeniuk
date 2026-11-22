import {spawnSync,spawn} from 'node:child_process';
import {once} from 'node:events';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {PrismaClient} from '@prisma/client';
import assert from 'node:assert/strict';
const artifact=process.env.QA_BACKUP_PATH||'.backups/recovery.rbbackup';
const temp=mkdtempSync(join(tmpdir(),'roombook-recovery-'));
const target=new URL(process.env.DATABASE_URL);target.pathname='/roombook_drill_'+Date.now();
const env={...process.env,RESTORE_DATABASE_URL:target.href};
let child,db;
function backup(args,ok=true){const r=spawnSync(process.execPath,['--env-file=.env','scripts/backup.mjs',...args],{env,encoding:'utf8'});assert.equal(r.status,ok?0:1,'Backup procedure outcome');return r.stdout?JSON.parse(r.stdout):{};}
try{
 const source=new PrismaClient();const expected={users:await source.userModel.count(),resources:await source.resourceModel.count(),bookings:await source.bookingModel.count()};await source.$disconnect();
 const a=performance.now();backup(['restore',artifact,join(temp,'first')]);
 db=new PrismaClient({datasources:{db:{url:target.href}}});
 const initial={users:await db.userModel.count(),resources:await db.resourceModel.count(),bookings:await db.bookingModel.count()};assert.deepEqual(initial,expected);
 // Destructive action is confined to the isolated roombook_drill_* database created above.
 await db.$executeRawUnsafe('TRUNCATE sealed_notes, booking_notes, bookings CASCADE');assert.equal(await db.bookingModel.count(),0);
 const lossAt=performance.now();backup(['restore',artifact,join(temp,'recovered'),'--replace-test-database']);
 const restored={users:await db.userModel.count(),resources:await db.resourceModel.count(),bookings:await db.bookingModel.count()};assert.deepEqual(restored,expected);
 const fixture=JSON.parse(readFileSync(process.env.QA_FIXTURE_PATH||'var/qa/ui-fixture.json','utf8'));
 child=spawn(process.execPath,['dist/Framework/main.js'],{env:{...process.env,DATABASE_URL:target.href,PORT:'3116',NOTE_KEYRING_PATH:join(temp,'recovered/note-keys.json'),LICENSE_PATH:join(temp,'recovered/installation-license.json'),LICENSE_PUBLIC_KEY_PATH:join(temp,'recovered/license-public.pem'),AUDIT_CHAIN_PATH:join(temp,'recovered/events-chain.jsonl'),AUDIT_LOG_PATH:join(temp,'recovered/audit.jsonl')},stdio:['ignore','pipe','pipe']});
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3116/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100))}assert.ok(ready);
 const login=await fetch('http://127.0.0.1:3116/api/auth/login',{method:'POST',headers:{Origin:process.env.CORS_ORIGIN,'Content-Type':'application/json'},body:JSON.stringify({email:fixture.email,password:fixture.password})});assert.equal(login.status,200);
 const cookie=login.headers.get('set-cookie').split(';')[0];
 const mine=await fetch('http://127.0.0.1:3116/api/bookings/mine',{headers:{Cookie:cookie}});assert.equal(mine.status,200);assert.ok((await mine.json()).bookings.some(b=>b.id===fixture.bookingId));
 const note=await fetch(`http://127.0.0.1:3116/api/bookings/${fixture.bookingId}/sealed-note`,{headers:{Cookie:cookie}});assert.equal(note.status,200);assert.equal((await note.json()).note.revision,1);
 const rtoSeconds=(performance.now()-lossAt)/1000;assert.ok(rtoSeconds<900);
 const recoveredKey=readFileSync(join(temp,'recovered/note-keys.json'));assert.deepEqual(recoveredKey,readFileSync(process.env.NOTE_KEYRING_PATH||'.secrets/note-keys.json'));
 // A changed archive with a forged hash still fails the authenticated decryption check.
 const bad=join(temp,'tampered.rbbackup'),bytes=Buffer.from(readFileSync(artifact));bytes[bytes.length-1]^=1;writeFileSync(bad,bytes);
 const m=JSON.parse(readFileSync(artifact+'.manifest.json'));m.sha256=createHash('sha256').update(bytes).digest('hex');writeFileSync(bad+'.manifest.json',JSON.stringify(m));backup(['verify',bad],false);
 console.log(JSON.stringify({result:'passed',sourceCounts:expected,afterLossBookings:0,restoredCounts:restored,restoredHealth:200,restoredLogin:200,restoredBooking:200,restoredSealedNote:200,keyringRecovered:true,tamperedArchiveRejected:true,rtoSeconds:Math.round(rtoSeconds*100)/100,rpoTargetSeconds:86400,rtoTargetSeconds:900,totalDrillSeconds:Math.round((performance.now()-a)/10)/100},null,2));
}finally{
 if(child&&child.exitCode===null){child.kill('SIGTERM');await once(child,'exit')}
 if(db)await db.$disconnect();rmSync(temp,{recursive:true,force:true});
 // Keep the restored test database for review; never drop the user's working database.
}
