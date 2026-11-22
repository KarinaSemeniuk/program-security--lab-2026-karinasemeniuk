import { RescheduleBookingAC } from "#application/Booking/Command/RescheduleBookingAC";
import { BookingDTO } from "#application/Booking/Dto/BookingDTO";
import { BookingIdVO } from "#domain/Booking/ValueObject/BookingIdVO";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { IRescheduleBookingRepository } from "#domain/Booking/OutsourceContract/IRescheduleBookingRepository";
/** Locked movement with ownership and calendar checks inside the atomic operation. */
export class RescheduleBookingUC {
  /** @param bookings - Atomic movement persistence. */
  public constructor(private readonly bookings:IRescheduleBookingRepository) {}
  /** @param command - Authenticated movement intent. @returns Updated booking. @throws ARoomBookException On invalid, stale, denied or storage failure. */
  public async execute(command:RescheduleBookingAC):Promise<BookingDTO> { return new BookingDTO(await this.bookings.reschedule(new BookingIdVO(command.bookingId).getValue(),command.actor.id,command.actor.role==="ADMIN",new TimeRangeVO(command.startAt,command.endAt),command.revision)); }
}
