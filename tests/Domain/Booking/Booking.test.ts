import { Booking } from "#domain/Booking/Entity/Booking";
import { BookingIdVO } from "#domain/Booking/ValueObject/BookingIdVO";
import { BookingStatus } from "#domain/Booking/Enum/BookingStatus";
import { CreateBookingService } from "#domain/Booking/Service/CreateBookingService";
import { CreateBookingDPolicy } from "#domain/Booking/Policy/CreateBookingDPolicy";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { CancellationWindowExpiredException } from "#domain/Booking/Exception/CancellationWindowExpiredException";
import { BookingAccessDeniedException } from "#domain/Booking/Exception/BookingAccessDeniedException";
import { InvalidBookingTransitionException } from "#domain/Booking/Exception/InvalidBookingTransitionException";
import { BookingSlotUnavailableException } from "#domain/Booking/Exception/BookingSlotUnavailableException";
import { InactiveResourceException } from "#domain/Booking/Exception/InactiveResourceException";
import { InvalidBookingDurationException } from "#domain/Booking/Exception/InvalidBookingDurationException";
import { BookingInPastException } from "#domain/Booking/Exception/BookingInPastException";
import { randomUUID } from "node:crypto";
const ids = { next: randomUUID };
const resource = { id: randomUUID(), name: "Кімната", isActive: true, minSlotMinutes:30 };
const range = new TimeRangeVO("2026-11-01T12:00:00.000Z","2026-11-01T13:00:00.000Z");
const now = new Date("2026-11-01T10:00:00.000Z");
const owner = randomUUID();
const create = (): Booking => new CreateBookingService(ids).create(owner,resource,range,[],now);
describe("Booking rules and lifecycle", () => {
  it("auto-confirms, emits specific+generic events and drains once", () => {
    const booking=create(); expect(booking.getStatus()).toBe(BookingStatus.Confirmed);
    const events=booking.pullEvents(); expect(events.map(event=>event.getEventName()).sort()).toEqual(["Booking.Placed","Booking.StatusChanged"]);
    expect(new Set(events.map(event=>event.eventId)).size).toBe(2);
    expect(events[0]?.schemaVersion).toBe(1); expect(booking.pullEvents()).toEqual([]);
  });
  it("permits cancellation exactly two hours before start", () => {
    const booking=create(); booking.pullEvents(); booking.cancel(owner,false,ids,now);
    expect(booking.getStatus()).toBe(BookingStatus.Cancelled);
    expect(booking.pullEvents().map(event=>event.getEventName()).sort()).toEqual(["Booking.Cancelled","Booking.StatusChanged"]);
  });
  it("retains the documented unrestricted pending-owner cancellation", () => {
    const pending = Booking.place(new BookingIdVO(randomUUID()),owner,resource.id,range,now);
    pending.cancel(owner,false,ids,new Date("2026-11-01T11:59:59.000Z"));
    expect(pending.getStatus()).toBe(BookingStatus.Cancelled);
  });
  it("rejects owner cancellation a millisecond after cutoff", () => {
    expect(()=>create().cancel(owner,false,ids,new Date(now.getTime()+1))).toThrow(CancellationWindowExpiredException);
  });
  it("rejects other users but permits an admin without the cutoff", () => {
    expect(()=>create().cancel(randomUUID(),false,ids,now)).toThrow(BookingAccessDeniedException);
    const booking=create();booking.cancel(randomUUID(),true,ids,new Date("2026-11-01T12:30:00.000Z"));
    expect(booking.getStatus()).toBe(BookingStatus.Cancelled);
  });
  it("cannot revive/cancel terminal states, including as Admin", () => {
    const booking=create();booking.cancel(owner,false,ids,now);
    expect(()=>booking.confirm(ids,now)).toThrow(InvalidBookingTransitionException);
    expect(()=>booking.cancel(owner,true,ids,now)).toThrow(InvalidBookingTransitionException);
    expect(booking.complete(new Date("2026-11-02"))).toBe(false);
  });
  it("completes only confirmed ended bookings, without read-side changes", () => {
    const booking=create();booking.pullEvents();
    expect(booking.complete(new Date("2026-11-01T12:59:59.999Z"))).toBe(false);
    expect(booking.complete(new Date("2026-11-01T13:00:00.000Z"))).toBe(true);
    expect(booking.getStatus()).toBe(BookingStatus.Completed);expect(booking.pullEvents()).toEqual([]);
    expect(()=>booking.cancel(owner,true,ids,now)).toThrow(InvalidBookingTransitionException);
  });
  it("enforces inactive, grid, future and overlap rules", () => {
    const policy = new CreateBookingDPolicy();
    expect(()=>policy.assert({...resource,isActive:false},range,[],now)).toThrow(InactiveResourceException);
    expect(()=>policy.assert(resource,new TimeRangeVO("2026-11-01T12:01:00.000Z","2026-11-01T13:01:00.000Z"),[],now)).toThrow(InvalidBookingDurationException);
    expect(()=>policy.assert(resource,new TimeRangeVO("2026-11-01T12:00:00.000Z","2026-11-01T12:31:00.000Z"),[],now)).toThrow(InvalidBookingDurationException);
    expect(()=>policy.assert(resource,range,[],range.getStart())).toThrow(BookingInPastException);
    expect(()=>policy.assert(resource,range,[range],now)).toThrow(BookingSlotUnavailableException);
    expect(()=>policy.assert(resource,range,[new TimeRangeVO("2026-11-01T13:00:00.000Z","2026-11-01T14:00:00.000Z")],now)).not.toThrow();
  });
  it("rehydrates persisted status without new events", () => {
    const booking=Booking.restore(new BookingIdVO(randomUUID()),owner,resource.id,range,BookingStatus.Completed,now.toISOString());
    expect(booking.getRange()).toBe(range);expect(booking.pullEvents()).toEqual([]);
  });
});
