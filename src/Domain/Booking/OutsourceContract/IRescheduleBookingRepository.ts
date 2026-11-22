import { Booking } from "#domain/Booking/Entity/Booking";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
/** Atomic movement preserving the original on failure. */
export interface IRescheduleBookingRepository {
  /** @param id - Booking UUID. @param actorId - Session identity. @param admin - Current role. @param range - Target interval. @param revision - Observed version. @returns Moved aggregate. @throws ARoomBookException On denied, stale, invalid, overlap or storage failure. */
  reschedule(id:string,actorId:string,admin:boolean,range:TimeRangeVO,revision:number):Promise<Booking>;
}
