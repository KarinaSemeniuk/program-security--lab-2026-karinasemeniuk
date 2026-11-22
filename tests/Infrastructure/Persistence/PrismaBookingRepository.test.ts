import { PrismaClient } from "@prisma/client";
import { PrismaBookingRepository } from "#infrastructure/Persistence/PrismaBookingRepository";
import { CreateBookingService } from "#domain/Booking/Service/CreateBookingService";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { InactiveResourceException } from "#domain/Booking/Exception/InactiveResourceException";
import { BookingPersistenceException } from "#infrastructure/Exception/BookingPersistenceException";
import { randomUUID } from "node:crypto";
describe("PrismaBookingRepository transaction boundary",()=>{
 const resource={id:randomUUID(),name:"Room",isActive:true,minSlotMinutes:30};
 const ids={next:randomUUID};
 const tx={ $queryRaw:jest.fn(),resourceModel:{findUnique:jest.fn()},bookingModel:{findMany:jest.fn(),create:jest.fn()} };
 const transaction=jest.fn();const events={dispatch:jest.fn()};
 const client={$transaction:transaction} as unknown as PrismaClient;
 const repository=new PrismaBookingRepository(client,ids,events);
 const instant=Math.ceil((Date.now()+86400_000)/1800_000)*1800_000;
 const range=new TimeRangeVO(new Date(instant).toISOString(),new Date(instant+1800_000).toISOString());
 const booking=()=>new CreateBookingService(ids).create(randomUUID(),resource,range,[],new Date());
 beforeEach(()=>{
  events.dispatch.mockReset();tx.resourceModel.findUnique.mockReset().mockResolvedValue(resource);
  tx.bookingModel.findMany.mockReset().mockResolvedValue([]);tx.bookingModel.create.mockReset().mockResolvedValue({});
  transaction.mockReset().mockImplementation(async(callback:(scope:typeof tx)=>Promise<unknown>)=>callback(tx));
 });
 it("rechecks current resource state under lock and dispatches only after commit",async()=>{
  const entity=booking();await repository.place(entity);
  expect(tx.$queryRaw).toHaveBeenCalled();expect(tx.bookingModel.create).toHaveBeenCalled();
  expect(events.dispatch).toHaveBeenCalledTimes(1);expect(events.dispatch.mock.calls[0]![0]).toHaveLength(2);
  expect(entity.pullEvents()).toEqual([]);
 });
 it("rejects a resource deactivated after initial application validation",async()=>{
  tx.resourceModel.findUnique.mockResolvedValue({...resource,isActive:false});
  const entity=booking();await expect(repository.place(entity)).rejects.toThrow(InactiveResourceException);
  expect(tx.bookingModel.create).not.toHaveBeenCalled();expect(events.dispatch).not.toHaveBeenCalled();expect(entity.pullEvents()).toHaveLength(2);
 });
 it("does not publish or drain events on rollback",async()=>{
  transaction.mockRejectedValue(new Error("private database failure"));
  const entity=booking();await expect(repository.place(entity)).rejects.toThrow(BookingPersistenceException);
  expect(events.dispatch).not.toHaveBeenCalled();expect(entity.pullEvents()).toHaveLength(2);
 });
});
