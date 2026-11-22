import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe InvalidBookingDuration failure. */
export class InvalidBookingDurationException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Тривалість і початок мають відповідати інтервалам ресурсу."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.InvalidBookingDuration; }
}
