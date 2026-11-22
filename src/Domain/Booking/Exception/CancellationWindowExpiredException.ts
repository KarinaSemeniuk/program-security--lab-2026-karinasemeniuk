import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe CancellationWindowExpired failure. */
export class CancellationWindowExpiredException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Скасувати можна щонайменше за дві години до початку."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.CancellationWindowExpired; }
}
