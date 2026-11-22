import { AValueObject } from "#domain/SharedKernel/Abstracts/AValueObject";
import { InvalidBookingNoteException } from "#domain/Booking/Exception/InvalidBookingNoteException";
/** Private note. Invariants: <=2000 code points, valid Unicode; exact whitespace preserved. */
export class BookingNoteVO extends AValueObject<string> {
  /** @param text - Exact private input, never logged. @throws InvalidBookingNoteException On length/Unicode/control failure. */
  public constructor(text: string) {
    if ([...text].length > 2000 || /[\p{Cs}\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/u.test(text)) throw new InvalidBookingNoteException();
    super(text);
  }
}
