import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe BookingInPast failure. */
export class BookingInPastException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Бронювання має починатися в майбутньому."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.BookingInPast; }
}
