import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe InvalidTimeRange failure. */
export class InvalidTimeRangeException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Вкажіть коректний часовий інтервал у UTC."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.InvalidTimeRange; }
}
