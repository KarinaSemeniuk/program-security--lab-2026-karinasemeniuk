import { ABookingException } from "#domain/Booking/Exception/Abstracts/ABookingException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Safe note failure. */
export class InvalidBookingNoteException extends ABookingException {
  /** Creates a safe public failure. */
  public constructor() { super("Нотатка містить недопустимі символи або перевищує 2000 символів."); }
  /** @returns Immutable allocation. */
  protected override getCodeEnum(): number { return BookingExceptionRegistry.InvalidBookingNote; }
}
