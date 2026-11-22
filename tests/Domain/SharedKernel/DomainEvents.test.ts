import { AEventEntity } from "#domain/SharedKernel/Abstracts/AEventEntity";
import { BookingCancelledDE } from "#domain/Booking/Event/BookingCancelledDE";
import { BookingCancelledDED } from "#domain/Booking/Event/Data/BookingCancelledDED";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
import { randomUUID } from "node:crypto";
class Queue extends AEventEntity { add(event:BookingCancelledDE,key:string):void{this.triggerEvent(event,key);} }
describe("Domain event contracts",()=>{
 it("deduplicates semantic events and drains exactly once",()=>{
  const queue=new Queue();const id=randomUUID();const event=new BookingCancelledDE(randomUUID(),id,new Date().toISOString(),new BookingCancelledDED(id,randomUUID()));
  queue.add(event,"cancel");queue.add(event,"cancel");expect(queue.pullEvents()).toEqual([event]);expect(queue.pullEvents()).toEqual([]);
  expect(event.getEventDataClass()).toBe(BookingCancelledDED);expect(event.getData().toJSON()).toHaveProperty("bookingId",id);
 });
 it("round-trips specific payloads without accepting malformed data",()=>{
  const data=new BookingCancelledDED(randomUUID(),randomUUID());expect(BookingCancelledDED.fromJSON(data.toJSON())).toEqual(data);
  for(const value of [null,{},[],{bookingId:1,cancelledBy:"x"},{...data.toJSON(),email:"private"}]) expect(()=>BookingCancelledDED.fromJSON(value)).toThrow(InvalidRequestBodyException);
 });
});
