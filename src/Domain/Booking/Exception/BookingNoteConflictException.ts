import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe note failure. */
export class BookingNoteConflictException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Нотатку вже змінено. Завантажте актуальну версію перед збереженням."); }
  /** @returns Immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.BookingNoteConflict; }
}
