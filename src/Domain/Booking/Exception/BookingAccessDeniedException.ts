import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe BookingAccessDenied failure. */
export class BookingAccessDeniedException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Недостатньо прав для цієї дії."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.BookingAccessDenied; }
}
