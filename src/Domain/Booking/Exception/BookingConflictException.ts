import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe BookingConflict failure. */
export class BookingConflictException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Бронювання вже змінено. Оновіть список і повторіть спробу."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.BookingConflict; }
}
