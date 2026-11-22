// Isolated signed-artifact/API check. Never changes the real installation license or trust key.
import {PrismaClient} from '@prisma/client';import bcrypt from 'bcrypt';import {randomUUID,generateKeyPairSync,sign,constants} from 'node:crypto';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawn} from 'node:child_process';import {once} from 'node:events';import net from 'node:net';import assert from 'node:assert/strict';
const db=new PrismaClient(),directory=mkdtempSync(join(tmpdir(),'roombook-license-qa-')),artifact=join(directory,'license.json'),publicPath=join(directory,'public.pem');
const pair=generateKeyPairSync('rsa',{modulusLength:3072});writeFileSync(publicPath,pair.publicKey.export({type:'spki',format:'pem'}));
const installationId=randomUUID(),port=Number(process.env.ROOMBOOK_LICENSE_QA_PORT||'3110'),origin='http://127.0.0.1:5210',base=`http://127.0.0.1:${port}`;
const now=Date.now();const claims={productId:'roombook',installationId,licenseId:randomUUID(),holder:'Synthetic QA installation',issuedAt:new Date(now-5000).toISOString(),notBefore:new Date(now-4000).toISOString(),expiresAt:new Date(now+86400_000).toISOString(),features:['booking','private-notes','resource-admin']};
function issue(changes={}){const payload=Buffer.from(JSON.stringify({...claims,...changes}));const signature=sign('sha256',payload,{key:pair.privateKey,padding:constants.RSA_PKCS1_PSS_PADDING,saltLength:constants.RSA_PSS_SALTLEN_DIGEST});const envelope={payload:payload.toString('base64'),signature:signature.toString('base64')};writeFileSync(artifact,JSON.stringify(envelope));return envelope;}
const accounts=[],resources=[],checks=[];let child;
async function req(path,status,body,cookie,expectedCode){const response=await fetch(base+'/api'+path,{method:body===undefined?'GET':'POST',headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{})},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(response.status,status,`${path}: ${response.status}`);const result=await response.json();if(expectedCode)assert.equal(result.error.code,expectedCode);checks.push({path:path.split('?')[0],status});return result;}
try{
 await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
 const password='Synthetic license QA password';const hash=await bcrypt.hash(password,12);
 for(const role of ['USER','ADMIN'])accounts.push(await db.userModel.create({data:{id:randomUUID(),email:`qa-license-${randomUUID()}@example.test`,passwordHash:hash,role}}));
 issue();child=spawn(process.execPath,['--env-file=.env','dist/Framework/main.js'],{env:{...process.env,PORT:String(port),CORS_ORIGIN:origin,LICENSE_PATH:artifact,LICENSE_PUBLIC_KEY_PATH:publicPath,ROOMBOOK_INSTALLATION_ID:installationId},stdio:['ignore','pipe','pipe']});
 let ready=false;for(let i=0;i<80;i++){if(child.exitCode!==null)throw new Error('QA API exited');try{if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}assert.ok(ready);
 const cookies=[];for(const account of accounts){const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email:account.email,password})});assert.equal(response.status,200);cookies.push(response.headers.get('set-cookie').split(';')[0]);}
 await req('/admin/service',403,undefined,cookies[0]);const status=(await req('/admin/service',200,undefined,cookies[1])).service;assert.deepEqual(Object.keys(status).sort(),['active','expiresAt','features']);assert.equal(status.active,true);
 const resource=(await req('/resources',201,{name:'QA licensed room '+randomUUID(),capacity:1,minSlotMinutes:30},cookies[1])).resource;resources.push(resource.id);
 const begin=Math.ceil((Date.now()+3*86400_000)/1800_000)*1800_000;
 const body={resourceId:resource.id,startAt:new Date(begin).toISOString(),endAt:new Date(begin+1800_000).toISOString()};
 const booking=(await req('/bookings',201,body,cookies[0])).booking;
 const notePath=`/bookings/${booking.id}/private-note`;
 await req(notePath,200,{text:'Synthetic licensed note',revision:0},cookies[0]);
 const nextBody={...body,startAt:new Date(begin+3600_000).toISOString(),endAt:new Date(begin+5400_000).toISOString()};
 issue({features:[]});await req('/bookings',403,nextBody,cookies[0],'RB.LIC.3');await req(notePath,403,{text:'denied',revision:1},cookies[0],'RB.LIC.3');
 await req('/resources',403,{name:'denied',capacity:1,minSlotMinutes:30},cookies[1],'RB.LIC.3');
 issue({expiresAt:new Date(now-1000).toISOString()});await req('/bookings',403,nextBody,cookies[0],'RB.LIC.2');
 assert.equal((await req('/admin/service',200,undefined,cookies[1])).service.active,false);
 assert.equal((await req(notePath,200,undefined,cookies[0])).note.text,'Synthetic licensed note');await req('/bookings/mine',200,undefined,cookies[0]);
 issue({installationId:randomUUID()});await req('/bookings',403,nextBody,cookies[0],'RB.LIC.1');
 issue({productId:'other-product'});await req('/bookings',403,nextBody,cookies[0],'RB.LIC.1');
 const original=issue();const bytes=Buffer.from(original.payload,'base64');bytes[0]^=1;writeFileSync(artifact,JSON.stringify({...original,payload:bytes.toString('base64')}));
 await req('/bookings',403,nextBody,cookies[0],'RB.LIC.1');
 // Entitlement cannot trap users' existing data or prevent cancellation/deactivation.
 await req(`/bookings/${booking.id}/cancel`,200,{},cookies[0]);await req(`/resources/${resource.id}/deactivate`,200,{},cookies[1]);
 console.log(JSON.stringify({result:'passed',checks,realInstallationLicenseUntouched:true},null,2));
}finally{
 if(child&&child.exitCode===null){child.kill('SIGINT');await once(child,'exit');}
 if(resources.length){await db.bookingModel.deleteMany({where:{resourceId:{in:resources}}});await db.resourceModel.deleteMany({where:{id:{in:resources}}});}
 await db.userModel.deleteMany({where:{id:{in:accounts.map(account=>account.id)}}});await db.$disconnect();rmSync(directory,{recursive:true,force:true});
}
