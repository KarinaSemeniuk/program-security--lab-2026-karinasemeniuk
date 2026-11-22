// Explicit local integration verification, outside the isolated Jest suite.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import net from 'node:net';
const port = Number(process.env.ROOMBOOK_WORKSPACE_QA_PORT || '3106');
const origin = 'http://127.0.0.1:5206';
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
  await req('/resources',200);
  await req('/resources',401,{name:'Forbidden',capacity:4,minSlotMinutes:30});
  await req('/resources',403,{name:'Forbidden',capacity:4,minSlotMinutes:30},user);
  await req('/admin/resources',403,undefined,user);
  await req('/resources',400,{name:'Bad slot',capacity:4,minSlotMinutes:7},admin);
  const resource=(await (await req('/resources',201,{name:'QA room '+suffix,capacity:4,minSlotMinutes:30},admin)).json()).resource;
  resourceIds.push(resource.id);
  const body={resourceId:resource.id,startAt:instant(12),endAt:instant(13)};
  await req('/bookings',401,body);
  await req('/bookings',403,body,user,{Origin:'http://evil.example'});
  await req('/bookings',400,{...body,userId:accounts[2].id},user);
  // One shared resource lock + exclusion constraint: exactly one success.
  const race=await Promise.all([req('/bookings',undefined,body,user),req('/bookings',undefined,body,other)].map(p=>p));
  assert.deepEqual(race.map(r=>r.status).sort(),[201,409]);
  const winnerIndex=race.findIndex(r=>r.status===201);
  const first=(await race[winnerIndex].json()).booking;
  const winner=winnerIndex===0?user:other;
  const loser=winnerIndex===0?other:user;
  assert.equal(first.userId,accounts[winnerIndex+1].id);
  let excluded=false;
  try { await db.bookingModel.create({data:{id:randomUUID(),userId:accounts[1].id,resourceId:resource.id,startAt:new Date(body.startAt),endAt:new Date(body.endAt),status:'CONFIRMED'}}); }
  catch { excluded=true; }
  assert.ok(excluded,'Database exclusion constraint did not reject a direct overlap');
  checks.push({path:'direct-database-overlap',status:'rejected'});
  const slots=(await (await req(`/resources/${resource.id}/availability?date=${day.toISOString().slice(0,10)}`,200)).json()).slots;
  assert.equal(slots.find(slot=>slot.startAt===body.startAt).available,false);
  assert.deepEqual(Object.keys(slots[0]).sort(),['available','endAt','startAt']);
  const adjacent=(await (await req('/bookings',201,{...body,startAt:instant(13),endAt:instant(14)},user)).json()).booking;
  await req(`/bookings/${first.id}/cancel`,403,{},loser);
  await req('/bookings/mine?userId='+accounts[0].id,400,undefined,user);
  const privatePage=await (await req('/bookings/mine',200,undefined,loser)).json();
  assert.ok(privatePage.bookings.every(booking=>booking.userId===(winnerIndex===0?accounts[2].id:accounts[1].id)));
  const bounds=new URLSearchParams({startAt:instant(0),endAt:instant(24)});
  await req(`/resources/${resource.id}/bookings?${bounds}`,403,undefined,user);
  const history=await (await req(`/resources/${resource.id}/bookings?${bounds}`,200,undefined,admin)).json();
  assert.equal(history.total,2);assert.ok(history.bookings.every(booking=>booking.resourceName===resource.name));
  await req(`/bookings/${first.id}/cancel`,200,{},winner);
  await req(`/bookings/${first.id}/cancel`,409,{},admin);
  const nearStart=Math.ceil((Date.now()+60_000)/(30*60_000))*(30*60_000);
  const near=(await (await req('/bookings',201,{resourceId:resource.id,startAt:new Date(nearStart).toISOString(),endAt:new Date(nearStart+1800_000).toISOString()},user)).json()).booking;
  await req(`/bookings/${near.id}/cancel`,409,{},user);
  await req(`/bookings/${near.id}/cancel`,200,{},admin);
  await req(`/resources/${resource.id}/deactivate`,403,{},user);
  await req(`/resources/${resource.id}/deactivate`,200,{},admin);
  const publicCatalog=await (await req('/resources',200)).json();
  assert.ok(!publicCatalog.resources.some(item=>item.id===resource.id));
  await req(`/resources/${resource.id}/availability?date=${day.toISOString().slice(0,10)}`,404);
  await req('/bookings',409,{...body,startAt:instant(15),endAt:instant(16)},user);
  const retained=await (await req(`/resources/${resource.id}/bookings?${bounds}`,200,undefined,admin)).json();
  assert.equal(retained.total,2);
  // Current role/status must take effect without reissuing JWTs.
  await db.userModel.update({where:{id:accounts[0].id},data:{role:'USER'}});
  await req('/resources',403,{name:'Denied after downgrade',capacity:1,minSlotMinutes:30},admin);
  await db.userModel.update({where:{id:accounts[0].id},data:{role:'ADMIN'}});
  await db.userModel.update({where:{id:accounts[1].id},data:{isBlocked:true}});
  await req('/bookings/mine',401,undefined,user);
  await db.userModel.update({where:{id:accounts[1].id},data:{isBlocked:false}});
  // Exercise scheduler guards on owned synthetic data, without waiting a minute.
  const { PrismaBookingRepository }=await import('../../dist/Infrastructure/Persistence/PrismaBookingRepository.js');
  const { BookingIdFactory }=await import('../../dist/Infrastructure/Auth/BookingIdFactory.js');
  const repository=new PrismaBookingRepository(db,new BookingIdFactory(),{dispatch(){}});
  const past=await db.bookingModel.create({data:{id:randomUUID(),userId:accounts[1].id,resourceId:resource.id,startAt:new Date(Date.now()-7200_000),endAt:new Date(Date.now()-3600_000),status:'CONFIRMED'}});
  await repository.completeEnded();
  assert.equal((await db.bookingModel.findUnique({where:{id:past.id}})).status,'COMPLETED');
  await req(`/bookings/${past.id}/cancel`,409,{},admin);
  assert.equal((await db.bookingModel.findUnique({where:{id:near.id}})).status,'CANCELLED');
  // A confirmed booking at an inactive resource remains cancellable and retained.
  await req(`/bookings/${adjacent.id}/cancel`,200,{},user);
  let limited=false;
  for(let i=0;i<12;i++){
    const response=await req('/bookings',undefined,body,user,{'X-Forwarded-For':`192.0.2.${i}`});
    if(response.status===429){assert.equal(response.headers.get('retry-after'),'60');limited=true;break;}
    assert.equal(response.status,409);
  }
  assert.ok(limited,'Booking rate limit was bypassed');
  console.log(JSON.stringify({result:'passed',checks},null,2));
} finally {
  if(resourceIds.length){await db.bookingModel.deleteMany({where:{resourceId:{in:resourceIds}}});await db.resourceModel.deleteMany({where:{id:{in:resourceIds}}});}
  await db.userModel.deleteMany({where:{id:{in:accounts.map(account=>account.id)}}});
  await db.$disconnect();
  if(child&&child.exitCode===null){child.kill('SIGINT');await once(child,'exit');}
}
