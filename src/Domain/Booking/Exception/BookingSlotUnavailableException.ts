import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe BookingSlotUnavailable failure. */
export class BookingSlotUnavailableException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Цей час уже зайнятий. Оновіть доступність."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.BookingSlotUnavailable; }
}
