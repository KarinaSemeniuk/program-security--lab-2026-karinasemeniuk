import { AValueObject } from "#domain/SharedKernel/Abstracts/AValueObject";
import { BookingStatus } from "#domain/Booking/Enum/BookingStatus";
import { InvalidBookingTransitionException } from "#domain/Booking/Exception/InvalidBookingTransitionException";
/** Validated immutable status value. */
export class BookingStatusVO extends AValueObject<BookingStatus> {
  /** @param value - Supported lifecycle status. @throws InvalidBookingTransitionException On invalid stored status. */
  public constructor(value: BookingStatus) {
    if (!Object.values(BookingStatus).includes(value)) throw new InvalidBookingTransitionException();
    super(value);
  }
}
