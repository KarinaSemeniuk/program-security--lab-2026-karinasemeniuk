// Explicit local API/PostgreSQL check. Own synthetic fixtures and isolated temporary key file.
import { PrismaClient } from '@prisma/client';
import { randomBytes,randomUUID } from 'node:crypto';
import { mkdtempSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import bcrypt from 'bcrypt';
import assert from 'node:assert/strict';
import { FileNoteKeyring } from '../../dist/Infrastructure/Configuration/FileNoteKeyring.js';
import { AesGcmNoteCipher } from '../../dist/Infrastructure/Cryptography/AesGcmNoteCipher.js';
import { PrismaNoteKeyRotation } from '../../dist/Infrastructure/Persistence/PrismaNoteKeyRotation.js';
const db=new PrismaClient();const port=Number(process.env.ROOMBOOK_NOTES_QA_PORT||'3108');
const origin='http://127.0.0.1:5208',base=`http://127.0.0.1:${port}`;
const directory=mkdtempSync(join(tmpdir(),'roombook-note-qa-')),keyPath=join(directory,'keys.json');
writeFileSync(keyPath,JSON.stringify({version:1,activeId:'qa-first',keys:{'qa-first':randomBytes(32).toString('hex')}}),{mode:0o600});
const keys=new FileNoteKeyring(keyPath),cipher=new AesGcmNoteCipher(()=>keys.load());
const accounts=[],resourceId=randomUUID(),checks=[];let child;let createdResource=false;
const password='Synthetic private notes навчання';
async function req(path,status,body,cookie,extra={}){
 const response=await fetch(base+'/api'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)});
 if(status!==undefined)assert.equal(response.status,status,`${path}: expected ${status}, got ${response.status}`);
 checks.push({path:path.split('?')[0],status:response.status});return response;
}
try{
 await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
 const hash=await bcrypt.hash(password,12);
 for(const role of ['USER','USER','ADMIN'])accounts.push(await db.userModel.create({data:{id:randomUUID(),email:`qa-notes-${randomUUID()}@example.test`,passwordHash:hash,role}}));
 await db.resourceModel.create({data:{id:resourceId,name:'QA private notes '+resourceId,capacity:1,minSlotMinutes:30}});createdResource=true;
 child=spawn(process.execPath,['--env-file=.env','dist/Framework/main.js'],{env:{...process.env,PORT:String(port),CORS_ORIGIN:origin,NOTE_KEYRING_PATH:keyPath},stdio:['ignore','pipe','pipe']});
 let ready=false;
 for(let i=0;i<80;i++){if(child.exitCode!==null)throw new Error('QA API failed before readiness');try{if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
 assert.ok(ready,'QA server unavailable');
 const cookies=[];
 for(const account of accounts){const response=await req('/auth/login',200,{email:account.email,password});cookies.push(response.headers.get('set-cookie').split(';')[0]);}
 const begin=Math.ceil((Date.now()+3*86400_000)/1800_000)*1800_000;
 const booking=(await(await req('/bookings',201,{resourceId,startAt:new Date(begin).toISOString(),endAt:new Date(begin+3600_000).toISOString()},cookies[0])).json()).booking;
 const path=`/bookings/${booking.id}/private-note`;
 assert.deepEqual((await(await req(path,200,undefined,cookies[0])).json()).note,{text:'',revision:0,updatedAt:''});
 await req(path,401);await req(path,403,undefined,cookies[1]);await req(path,403,undefined,cookies[2]);
 await req(path,403,{text:'foreign',revision:0},cookies[1]);
 await req(path,403,{text:'foreign',revision:0},cookies[0],{Origin:'http://evil.example'});
 await req(path,400,{text:'x',revision:0,ownerId:accounts[0].id},cookies[0]);
 await req(path,400,{text:'x'.repeat(2001),revision:0},cookies[0]);
 const plaintext='  Синтетичний план зустрічі 💻\nПриватна нотатка  ';
 const saved=(await(await req(path,200,{text:plaintext,revision:0},cookies[0])).json()).note;
 assert.equal(saved.revision,1);assert.equal(saved.text,plaintext);
 const stored=await db.bookingNoteModel.findUnique({where:{bookingId:booking.id}});
 assert.equal(stored.formatVersion,1);assert.notEqual(stored.ciphertext,plaintext);assert.ok(!JSON.stringify(stored).includes('Синтетичний'));
 assert.equal((await(await req(path,200,undefined,cookies[0])).json()).note.text,plaintext);
 await req(path,409,{text:'stale',revision:0},cookies[0]);
 const race=await Promise.all([req(path,undefined,{text:'revision A',revision:1},cookies[0]),req(path,undefined,{text:'revision B',revision:1},cookies[0])]);
 assert.deepEqual(race.map(response=>response.status).sort(),[200,409]);
 const current=(await(await req(path,200,undefined,cookies[0])).json()).note;assert.equal(current.revision,2);
 const valid=await db.bookingNoteModel.findUnique({where:{bookingId:booking.id}});
 for(const field of ['ciphertext','tag','nonce']){
  const old=valid[field];const changed=(old[0]==='0'?'1':'0')+old.slice(1);
  await db.bookingNoteModel.update({where:{bookingId:booking.id},data:{[field]:changed}});
  const rejected=await req(path,422,undefined,cookies[0]);assert.ok(!('note' in await rejected.json()));
  await req(path,422,{text:'cannot overwrite corruption',revision:2},cookies[0]);
  await db.bookingNoteModel.update({where:{bookingId:booking.id},data:{[field]:valid[field]}});
 }
 await db.bookingModel.update({where:{id:booking.id},data:{userId:accounts[1].id}});
 await req(path,422,undefined,cookies[1]);
 await db.bookingModel.update({where:{id:booking.id},data:{userId:accounts[0].id}});
 const mine=await(await req('/bookings/mine',200,undefined,cookies[0])).json();
 assert.ok(mine.bookings.every(row=>!('privateNote' in row)&&!('text' in row)&&!('ciphertext' in row)));
 // Exercise more than two rotation pages. Never include any pre-existing user notes.
 let rotation;
 const foreignCount=await db.bookingNoteModel.count({where:{bookingId:{not:booking.id}}});
 if(foreignCount===0){
  const rows=Array.from({length:205},(_,i)=>({id:randomUUID(),userId:accounts[0].id,resourceId,startAt:new Date(begin+100*86400_000+i*1800_000),endAt:new Date(begin+100*86400_000+(i+1)*1800_000),status:'CONFIRMED'}));
  await db.bookingModel.createMany({data:rows});
  await db.bookingNoteModel.createMany({data:rows.map((row,i)=>{const encrypted=cipher.encrypt('Synthetic rotation '+i,{bookingId:row.id,ownerId:accounts[0].id,revision:1});return{bookingId:row.id,formatVersion:encrypted.version,keyId:encrypted.keyId,nonce:encrypted.nonce,ciphertext:encrypted.ciphertext,tag:encrypted.tag,revision:1};})});
  const damaged=await db.bookingNoteModel.findUnique({where:{bookingId:rows[204].id}});
  await db.bookingNoteModel.update({where:{bookingId:damaged.bookingId},data:{tag:(damaged.tag[0]==='0'?'1':'0')+damaged.tag.slice(1)}});
  await assert.rejects(()=>new PrismaNoteKeyRotation(process.env.DATABASE_URL,keys).rotate());
  const stagedKey=keys.load().activeId;
  assert.equal(await db.bookingNoteModel.count({where:{keyId:stagedKey}}),0);
  await db.bookingNoteModel.update({where:{bookingId:damaged.bookingId},data:{tag:damaged.tag}});
  rotation=await new PrismaNoteKeyRotation(process.env.DATABASE_URL,keys).rotate(true);assert.equal(rotation.processed,206);
  assert.equal(rotation.activeId,stagedKey);
  rotation.failureRecoveryVerified=true;
  assert.equal(await db.bookingNoteModel.count({where:{keyId:{not:rotation.activeId}}}),0);
  assert.equal((await(await req(path,200,undefined,cookies[0])).json()).note.text,current.text);
  assert.equal((await new PrismaNoteKeyRotation(process.env.DATABASE_URL,keys).rotate(true)).processed,0);
 }else rotation={skipped:'Pre-existing notes found; shared rotation deliberately not run with isolated QA keys.'};
 await req('/auth/logout',204,{},cookies[0]);await req(path,401,undefined,cookies[0]);
 console.log(JSON.stringify({result:'passed',checks,rotation,plaintextAtRest:false},null,2));
}finally{
 if(child&&child.exitCode===null){child.kill('SIGINT');await once(child,'exit');}
 if(createdResource){await db.bookingModel.deleteMany({where:{resourceId}});await db.resourceModel.deleteMany({where:{id:resourceId}});}
 await db.userModel.deleteMany({where:{id:{in:accounts.map(row=>row.id)}}});await db.$disconnect();rmSync(directory,{recursive:true,force:true});
}
