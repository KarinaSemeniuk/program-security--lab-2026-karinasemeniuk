import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { BookingExceptionRegistry } from "#domain/Booking/Exception/Registry/BookingExceptionRegistry";
/** Binds failures to BKG. */
export abstract class ABookingException extends ARoomBookException {
  /** @param message - Safe public message. */
  protected constructor(message: string) { super(message, BookingExceptionRegistry); }
}
