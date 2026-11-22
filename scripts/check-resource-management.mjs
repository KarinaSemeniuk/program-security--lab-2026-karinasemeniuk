// Explicit local integration verification, outside the isolated Jest suite.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import net from 'node:net';
const port = Number(process.env.ROOMBOOK_WORKSPACE_QA_PORT || '3112');
const origin = 'http://127.0.0.1:5212';
const base = `http://127.0.0.1:${port}`;
const db = new PrismaClient();
const suffix = randomUUID();
const accounts = [];
const resourceIds = [];
const checks = [];
let child;
const password = 'Workspace synthetic навчання 2026';
const day = new Date(); day.setUTCDate(day.getUTCDate() + 3); day.setUTCHours(0,0,0,0);
const instant = hour => new Date(day.getTime() + hour * 3600_000).toISOString();
async function req(path, status, body, cookie, headers = {}) {
  const response = await fetch(base + '/api' + path, { method: body === undefined ? 'GET' : 'POST',
    headers: { Origin: origin, ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body) });
  if (status !== undefined) assert.equal(response.status, status, `${path}: expected ${status}, got ${response.status}`);
  checks.push({ path: path.split('?')[0], status: response.status }); return response;
}
async function login(account) {
  const response = await req('/auth/login',200,{email:account.email,password});
  return response.headers.get('set-cookie').split(';')[0];
}
try {
  await new Promise((resolve,reject)=>{const probe=net.createServer();probe.once('error',reject);probe.listen(port,'127.0.0.1',()=>probe.close(resolve));});
  const hash = await bcrypt.hash(password,12);
  for (const role of ['ADMIN','USER','USER']) {
    const account = await db.userModel.create({data:{id:randomUUID(),email:`qa-${accounts.length}-${suffix}@example.test`,passwordHash:hash,role},select:{id:true,email:true}});
    accounts.push(account);
  }
  child=spawn(process.execPath,['--env-file=.env','dist/Framework/main.js'],{env:{...process.env,PORT:String(port),CORS_ORIGIN:origin},stdio:['ignore','pipe','pipe']});
  let ready=false;
  for(let i=0;i<80;i++){
    if(child.exitCode!==null) throw new Error('QA server exited before ready');
    try{if((await fetch(base+'/health')).ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  assert.ok(ready,'QA server unavailable');
  const admin=await login(accounts[0]), user=await login(accounts[1]), other=await login(accounts[2]);
  const draft = {name:'QA деталі '+suffix,capacity:4,minSlotMinutes:30,type:'ROOM',description:'Опис\nДругий рядок <script>literal</script>',location:'Поверх 2',equipment:['Wi-Fi','Екран']};
  const resource = (await (await req('/resources',201,draft,admin)).json()).resource; resourceIds.push(resource.id);
  assert.equal(resource.revision,0); assert.equal(resource.description,draft.description);
  const path = `/resources/${resource.id}`;
  assert.equal((await (await req(path,200)).json()).resource.location,draft.location);
  await req('/admin'+path,401); await req('/admin'+path,403,undefined,user);
  const booking=(await (await req('/bookings',201,{resourceId:resource.id,startAt:instant(12),endAt:instant(13)},user)).json()).booking;
  const {minSlotMinutes,...editable}=draft;
  const update={...editable,name:'Змінений простір '+suffix,type:'DESK',capacity:1,description:'💚'.repeat(2000),equipment:Array.from({length:20},(_,i)=>String(i)+'💚'.repeat(28)),revision:0};
  await req(path+'/update',403,update,user); await req(path+'/update',401,update);
  await req(path+'/update',403,update,admin,{Origin:'http://evil.example'});
  await req(path+'/update',400,{...update,minSlotMinutes:60},admin);
  await req(path+'/update',400,{...update,type:'HOTEL'},admin);
  await req(path+'/update',400,{...update,equipment:['Wi-Fi','wi-fi']},admin);
  await req(path+'/update',400,{...update,description:'x'.repeat(2001)},admin);
  const changed=(await (await req(path+'/update',200,update,admin)).json()).resource;
  assert.equal(changed.revision,1);assert.equal(changed.minSlotMinutes,30);assert.equal(changed.description,update.description);
  await req(path+'/update',409,update,admin);
  const before=await db.bookingModel.findUnique({where:{id:booking.id}});
  assert.equal(before.startAt.toISOString(),booking.startAt);assert.equal(before.status,booking.status);
  const off=(await (await req(path+'/deactivate',200,{},admin)).json()).resource;assert.equal(off.revision,2);
  await req(path,404);await req('/admin'+path,200,undefined,admin);
  await req(path+'/update',409,{...update,revision:1},admin);
  await req(path+'/reactivate',403,{revision:2},user);
  await req(path+'/reactivate',409,{revision:1},admin);
  const active=(await (await req(path+'/reactivate',200,{revision:2},admin)).json()).resource;assert.equal(active.revision,3);assert.equal(active.isActive,true);
  assert.equal((await (await req(path+'/reactivate',200,{revision:3},admin)).json()).resource.revision,3);
  await req(path,200);
  // Competing editors: one winner, one conflict; no lost update.
  const race=await Promise.all([req(path+'/update',undefined,{...update,name:'Editor A',revision:3},admin),req(path+'/update',undefined,{...update,name:'Editor B',revision:3},admin)]);
  assert.deepEqual(race.map(response=>response.status).sort(),[200,409]);
  const after=await db.bookingModel.findUnique({where:{id:booking.id}});assert.deepEqual(after,before);
  const current=(await (await req(path,200)).json()).resource;assert.equal(current.revision,4);
  const slots=(await (await req(path+'/availability?date='+day.toISOString().slice(0,10),200)).json()).slots;
  assert.equal(slots.find(slot=>slot.startAt===booking.startAt).available,false);
  // An existing cookie must lose management rights immediately after downgrade.
  await db.userModel.update({where:{id:accounts[0].id},data:{role:'USER'}});
  await req(path+'/update',403,{...update,revision:4},admin);
  await req(path+'/reactivate',403,{revision:4},admin);
  console.log(JSON.stringify({result:'passed',checks,bookingPreserved:true,concurrentEditors:'one success, one conflict'},null,2));
} finally {
  if(resourceIds.length){await db.bookingModel.deleteMany({where:{resourceId:{in:resourceIds}}});await db.resourceModel.deleteMany({where:{id:{in:resourceIds}}});}
  await db.userModel.deleteMany({where:{id:{in:accounts.map(account=>account.id)}}});
  await db.$disconnect();
  if(child&&child.exitCode===null){child.kill('SIGINT');await once(child,'exit');}
}
