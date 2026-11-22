// Explicit, idempotent sample catalog. Existing names/activation are never overwritten.
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
const resources = [
  {id:'b0000000-0000-4000-8000-000000000001',name:'Переговорна «Ідея»',capacity:6,minSlotMinutes:30,type:'ROOM',description:'Простір для командних зустрічей, обговорень і презентацій.',location:'Перший поверх · зона зустрічей',equipment:['Wi-Fi','Екран','Маркерна дошка']},
  {id:'b0000000-0000-4000-8000-000000000002',name:'Кімната «Фокус»',capacity:2,minSlotMinutes:60,type:'ROOM',description:'Тиха кімната для зосередженої роботи та розмов удвох.',location:'Другий поверх · тиха зона',equipment:['Wi-Fi','Розетки','Настільне освітлення']},
  {id:'b0000000-0000-4000-8000-000000000003',name:'Робоче місце біля вікна',capacity:1,minSlotMinutes:30,type:'DESK',description:'Індивідуальне робоче місце з природним освітленням.',location:'Другий поверх · відкритий простір',equipment:['Wi-Fi','Розетки','Регульоване крісло']},
];
try {
  for(const resource of resources) await db.resourceModel.upsert({where:{id:resource.id},create:resource,update:{}});
  console.log('Three sample catalog resources are available. Existing records were preserved.');
} catch { console.error('Cannot initialize catalog. Apply migrations and verify local PostgreSQL.'); process.exitCode=1; }
finally { await db.$disconnect(); }
