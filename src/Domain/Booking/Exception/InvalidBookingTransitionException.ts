import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe InvalidBookingTransition failure. */
export class InvalidBookingTransitionException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Бронювання вже завершено або скасовано."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.InvalidBookingTransition; }
}
