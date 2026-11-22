import { CancelBookingAC } from "#application/Booking/Command/CancelBookingAC";
import { BookingDTO } from "#application/Booking/Dto/BookingDTO";
import { IBookingRepository } from "#domain/Booking/OutsourceContract/IBookingRepository";
import { BookingIdVO } from "#domain/Booking/ValueObject/BookingIdVO";
/** Cancellation rules run on the locked aggregate inside the repository. */
export class CancelBookingUC {
  /** @param bookings - Atomic booking persistence. */
  public constructor(private readonly bookings: IBookingRepository) {}
  /** @param command - Authenticated cancellation. @returns Cancelled booking. @throws ARoomBookException On denied/cutoff/terminal/storage failure. */
  public async execute(command: CancelBookingAC): Promise<BookingDTO> {
    return new BookingDTO(await this.bookings.cancel(new BookingIdVO(command.bookingId).getValue(), command.actor.id, command.actor.role === "ADMIN"));
  }
}
