// Explicit local integration verification, outside the isolated Jest suite.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import net from 'node:net';
const port = Number(process.env.ROOMBOOK_WORKSPACE_QA_PORT || '3115');
const origin = 'http://127.0.0.1:5215';
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
  const room=(await(await req('/resources',201,{name:'QA service '+suffix,capacity:4,minSlotMinutes:30},admin)).json()).resource;resourceIds.push(room.id);const path=`/resources/${room.id}`;
  const holiday=new Date(day.getTime()+86400_000).toISOString().slice(0,10);
  const calendar={timeZone:'UTC',weekly:Array.from({length:7},()=>({open:540,close:1080})),closedDates:[holiday],revision:0};
  await req(path+'/calendar',403,calendar,user);await req(path+'/calendar',400,{...calendar,timeZone:'Invalid/Zone'},admin);
  await req(path+'/calendar',200,calendar,admin);await req(path+'/calendar',409,calendar,admin);
  const date=day.toISOString().slice(0,10);
  const slots=(await(await req(path+'/availability?date='+date+'&timeZone=UTC',200)).json()).slots;
  assert.equal(slots.find(slot=>slot.startAt===instant(8)).available,false);assert.equal(slots.find(slot=>slot.startAt===instant(9)).available,true);assert.equal(slots.find(slot=>slot.startAt===instant(18)).available,false);
  for(const [date,hours]of[['2026-03-29',23],['2026-10-25',25]]){const grid=(await(await req(path+'/availability?date='+date+'&timeZone=Europe%2FKyiv',200)).json()).slots;assert.equal(grid.length,hours*2);}
  await req('/bookings',409,{resourceId:room.id,startAt:instant(8),endAt:instant(9)},user);
  await req('/bookings',409,{resourceId:room.id,startAt:new Date(day.getTime()+86400_000+12*3600_000).toISOString(),endAt:new Date(day.getTime()+86400_000+13*3600_000).toISOString()},user);
  const booking=(await(await req('/bookings',201,{resourceId:room.id,startAt:instant(12),endAt:instant(13)},user)).json()).booking;
  const note='Synthetic note retained through movement';await req(`/bookings/${booking.id}/private-note`,200,{text:note,revision:0},user);
  const occupied=(await(await req('/bookings',201,{resourceId:room.id,startAt:instant(14),endAt:instant(15)},other)).json()).booking;
  const move={startAt:instant(12.5),endAt:instant(13.5),revision:0};
  await req(`/bookings/${booking.id}/reschedule`,403,move,other);
  const moved=(await(await req(`/bookings/${booking.id}/reschedule`,200,move,user)).json()).booking;assert.equal(moved.id,booking.id);assert.equal(moved.revision,1);
  await req(`/bookings/${booking.id}/reschedule`,409,move,user);
  const before=await db.bookingModel.findUnique({where:{id:booking.id}});
  await req(`/bookings/${booking.id}/reschedule`,409,{startAt:instant(14),endAt:instant(15),revision:1},user);
  assert.deepEqual(await db.bookingModel.findUnique({where:{id:booking.id}}),before);
  assert.equal((await(await req(`/bookings/${booking.id}/private-note`,200,undefined,user)).json()).note.text,note);
  await req(`/bookings/${booking.id}/reschedule`,409,{startAt:instant(8),endAt:instant(9),revision:1},user);
  const race=await Promise.all([req(`/bookings/${booking.id}/reschedule`,undefined,{startAt:instant(10),endAt:instant(11),revision:1},user),req(`/bookings/${booking.id}/reschedule`,undefined,{startAt:instant(16),endAt:instant(17),revision:1},user)]);assert.deepEqual(race.map(response=>response.status).sort(),[200,409]);
  const upcoming=await(await req('/bookings/mine?filter=upcoming',200,undefined,user)).json();assert.ok(upcoming.bookings.some(row=>row.id===booking.id));
  await req('/bookings/mine?filter=unknown',400,undefined,user);
  await req(`/bookings/${booking.id}/cancel`,200,{},user);const cancelled=await(await req('/bookings/mine?filter=cancelled',200,undefined,user)).json();assert.equal(cancelled.total,1);assert.equal(cancelled.bookings[0].id,booking.id);
  await req(`/bookings/${booking.id}/reschedule`,409,{...move,revision:2},user);
  const second=await login(accounts[1]);await req('/account/sessions/revoke-others',200,{},user);await req('/bookings/mine',401,undefined,second);await req('/bookings/mine',200,undefined,user);
  await req('/account/password',400,{currentPassword:'wrong current password',newPassword:'New service пароль навчання 2026'},user);
  await req('/account/password',400,{currentPassword:password,newPassword:'short'},user);
  const another=await login(accounts[1]);const newPassword='New service пароль навчання 2026';await req('/account/password',200,{currentPassword:password,newPassword},user);
  await req('/bookings/mine',401,undefined,user);await req('/bookings/mine',401,undefined,another);await req('/auth/login',401,{email:accounts[1].email,password});
  const changed=await req('/auth/login',200,{email:accounts[1].email,password:newPassword});const fresh=changed.headers.get('set-cookie').split(';')[0];
  await req('/admin/accounts',403,undefined,fresh);const page=await(await req('/admin/accounts?search='+encodeURIComponent(suffix),200,undefined,admin)).json();assert.equal(page.total,3);assert.ok(page.accounts.every(row=>!('passwordHash'in row)));
  await req(`/admin/accounts/${accounts[0].id}/block`,403,{blocked:true},admin);
  await req(`/admin/accounts/${accounts[2].id}/block`,403,{blocked:true},fresh);
  await req(`/admin/accounts/${accounts[2].id}/block`,200,{blocked:true},admin);await req('/bookings/mine',401,undefined,other);
  assert.equal((await db.bookingModel.findUnique({where:{id:occupied.id}})).status,'CONFIRMED');
  await req(`/admin/accounts/${accounts[2].id}/block`,200,{blocked:false},admin);await req('/bookings/mine',401,undefined,other);const restored=await login(accounts[2]);await req('/bookings/mine',200,undefined,restored);
  console.log(JSON.stringify({result:'passed',checks:checks.length,DSTDays:[23,25],atomicMovement:true,notesPreserved:true,credentialRevocation:true,blockedBookingsPreserved:true},null,2));
} finally {
  if(resourceIds.length){await db.bookingModel.deleteMany({where:{resourceId:{in:resourceIds}}});await db.resourceModel.deleteMany({where:{id:{in:resourceIds}}});}
  await db.userModel.deleteMany({where:{id:{in:accounts.map(account=>account.id)}}});
  await db.$disconnect();
  if(child&&child.exitCode===null){child.kill('SIGINT');await once(child,'exit');}
}
