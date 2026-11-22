import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe InactiveResource failure. */
export class InactiveResourceException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Ресурс більше не приймає бронювання."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.InactiveResource; }
}
