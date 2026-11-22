// Local NFR-1 smoke benchmark, against an already running API. No production load claim.
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import assert from 'node:assert/strict';
const base = new URL(process.env.ROOMBOOK_QA_API || 'http://127.0.0.1:3000');
assert.ok(base.protocol==='http:'&&['127.0.0.1','localhost'].includes(base.hostname)&&!base.username&&!base.password);
const db = new PrismaClient();
const userId=randomUUID(),resourceId=randomUUID();
try {
  await db.userModel.create({data:{id:userId,email:`qa-perf-${userId}@example.test`,passwordHash:await bcrypt.hash('Synthetic performance only',12)}});
  await db.resourceModel.create({data:{id:resourceId,name:'QA performance '+resourceId,capacity:1,minSlotMinutes:30}});
  const start=Math.ceil((Date.now()+86400_000)/86400_000)*86400_000;
  for(let offset=0;offset<10000;offset+=1000){
    await db.bookingModel.createMany({data:Array.from({length:1000},(_,index)=>({id:randomUUID(),userId,resourceId,
      startAt:new Date(start+(offset+index)*1800_000),endAt:new Date(start+(offset+index+1)*1800_000),status:'CONFIRMED'}))});
  }
  const date=new Date(start+100*86400_000).toISOString().slice(0,10);
  const began=performance.now();
  const response=await fetch(new URL(`/api/resources/${resourceId}/availability?date=${date}`,base));
  const payload=await response.json();const elapsedMs=performance.now()-began;
  assert.equal(response.status,200);assert.equal(payload.slots.length,48);
  assert.ok(payload.slots.every(slot=>!slot.available));assert.ok(elapsedMs<500,`NFR-1 local smoke exceeded 500ms: ${elapsedMs.toFixed(2)}`);
  console.log(JSON.stringify({result:'passed',storedBookings:10000,slots:48,elapsedMs:Number(elapsedMs.toFixed(2)),scope:'single local request, not a concurrent load benchmark'},null,2));
} finally {
  await db.bookingModel.deleteMany({where:{resourceId}});await db.resourceModel.deleteMany({where:{id:resourceId}});await db.userModel.deleteMany({where:{id:userId}});await db.$disconnect();
}
