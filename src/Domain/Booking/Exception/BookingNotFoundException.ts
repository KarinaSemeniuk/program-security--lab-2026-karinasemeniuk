import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe BookingNotFound failure. */
export class BookingNotFoundException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Бронювання не знайдено."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.BookingNotFound; }
}
