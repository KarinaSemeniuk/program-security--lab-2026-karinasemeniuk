import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcrypt';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import ts from 'typescript';
import assert from 'node:assert/strict';
import {FileHashChain} from '../../dist/Infrastructure/Audit/FileHashChain.js';
const code=ts.transpileModule(readFileSync('frontend/src/Infrastructure/Cryptography/WebCryptoSealedNotes.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {WebCryptoSealedNotes}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const db=new PrismaClient(),origin='http://127.0.0.1:5173',base=process.env.ROOMBOOK_SECURITY_QA_BASE||('http://127.0.0.1:'+(process.env.PORT||'3000')),checks=[];
const suffix=randomUUID(),password='Local verification навчання 2026',accounts=[];
let resource,booking;
async function req(path,status,body,cookie){
 const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined});
 assert.equal(res.status,status,path);assert.equal(res.headers.get('x-content-type-options'),'nosniff');assert.match(res.headers.get('x-request-id'),/^[a-f0-9-]{36}$/);
 checks.push({path,status});return res;
}
try{
 const hash=await bcrypt.hash(password,12);
 for(const role of ['USER','USER','ADMIN'])accounts.push(await db.userModel.create({data:{id:randomUUID(),email:`sealed-${accounts.length}-${suffix}@example.test`,passwordHash:hash,role}}));
 const cookies=[];for(const a of accounts){const res=await req('/api/auth/login',200,{email:a.email,password});cookies.push(res.headers.get('set-cookie').split(';')[0]);}
 resource=await db.resourceModel.create({data:{id:randomUUID(),name:'Зустріч команди — тестова кімната',capacity:8,minSlotMinutes:30}});
 const start=new Date();start.setUTCDate(start.getUTCDate()+2);start.setUTCHours(10,0,0,0);
 booking=await db.bookingModel.create({data:{id:randomUUID(),userId:accounts[0].id,resourceId:resource.id,startAt:start,endAt:new Date(start.getTime()+3600000),status:'CONFIRMED'}});
 const path=`/api/bookings/${booking.id}/sealed-note`,cipher=new WebCryptoSealedNotes(),raw=cipher.createKey(),plaintext='План зустрічі: обговорити захист RoomBook і розподіл завдань.';
 await req(path,401);const empty=await (await req(path,200,undefined,cookies[0])).json();assert.equal(empty.note,null);
 const envelope=await cipher.seal(raw,plaintext,accounts[0].id,booking.id,1);
 await req(path,200,{envelope,revision:0},cookies[0]);
 const read=await(await req(path,200,undefined,cookies[0])).json();assert.equal(await new WebCryptoSealedNotes().open(raw,read.note,accounts[0].id,booking.id),plaintext);
 await req(path,403,undefined,cookies[1]);await req(path,403,undefined,cookies[2]);
 await req(path,400,{envelope:{...envelope,ownerId:accounts[1].id},revision:1},cookies[0]);
 await req(path,409,{envelope,revision:0},cookies[0]);
 await req(path,409,{envelope:{...envelope,revision:2},revision:1},cookies[0]);
 const corrupted={...envelope,ciphertext:(envelope.ciphertext[0]==='A'?'B':'A')+envelope.ciphertext.slice(1)};
 await assert.rejects(cipher.open(raw,corrupted,accounts[0].id,booking.id));
 await assert.rejects(cipher.open(cipher.createKey(),envelope,accounts[0].id,booking.id));
 await assert.rejects(cipher.open(raw,{...envelope,revision:2},accounts[0].id,booking.id));
 const stored=await db.$queryRaw`SELECT envelope FROM sealed_notes WHERE booking_id = ${booking.id}::uuid`;
 assert.ok(!JSON.stringify(stored).includes(plaintext));
 for(let i=0;i<5;i++)await req('/api/auth/login',401,{email:accounts[1].email,password:'NOT_A_REAL_PASSWORD'});
 const logs=readFileSync(process.env.AUDIT_LOG_PATH||'var/log/audit.jsonl','utf8');
 assert.ok(!logs.includes(password)&&!logs.includes(plaintext)&&!logs.includes(raw)&&!logs.includes(cookies[0]));
 const alerts=logs.trim().split('\n').map(JSON.parse).filter(e=>e.event==='monitor.threshold');assert.ok(alerts.length>0);
 const chainPath=process.env.AUDIT_CHAIN_PATH||'var/audit/events-chain.jsonl',ledger=new FileHashChain(chainPath);assert.ok(ledger.verify());
 const tmp=mkdtempSync(join(tmpdir(),'sealed-ledger-'));try{const records=readFileSync(chainPath,'utf8').trim().split('\n').map(JSON.parse);records[0].data.status=999;const path=join(tmp,'altered.jsonl');writeFileSync(path,records.map(JSON.stringify).join('\n')+'\n');assert.throws(()=>new FileHashChain(path));}finally{rmSync(tmp,{recursive:true,force:true})}
 console.log(JSON.stringify({result:'passed',checks,independentEndpointDecryption:true,wrongKeyRejected:true,ciphertextTamperingRejected:true,revisionTamperingRejected:true,plaintextAbsentFromDatabaseAndLogs:true,monitorThresholdDetected:true,ledgerTamperingDetected:true,checkpoint:ledger.checkpoint(),envelope},null,2));
 if(process.env.KEEP_QA_FIXTURE==='1'){const fixturePath=process.env.QA_FIXTURE_PATH||'var/qa/ui-fixture.json';mkdirSync(dirname(fixturePath),{recursive:true,mode:0o700});writeFileSync(fixturePath,JSON.stringify({email:accounts[0].email,password,bookingId:booking.id,ownerId:accounts[0].id,raw,cookie:cookies[0],plaintext}),{mode:0o600});}
}finally{
 if(process.env.KEEP_QA_FIXTURE!=='1'){
  if(resource){await db.bookingModel.deleteMany({where:{resourceId:resource.id}});await db.resourceModel.delete({where:{id:resource.id}})}
  await db.userModel.deleteMany({where:{id:{in:accounts.map(a=>a.id)}}});
 }
 await db.$disconnect();
}
