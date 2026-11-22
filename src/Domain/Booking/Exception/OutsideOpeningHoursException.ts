import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe OutsideOpeningHours failure. */
export class OutsideOpeningHoursException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Ресурс зачинений у вибраний час."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.OutsideOpeningHours; }
}
