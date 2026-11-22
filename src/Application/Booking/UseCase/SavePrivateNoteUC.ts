import { SavePrivateNoteAC } from "#application/Booking/Command/SavePrivateNoteAC";
import { IBookingNoteRepository } from "#domain/Booking/OutsourceContract/IBookingNoteRepository";
import { PrivateBookingNote } from "#domain/Booking/Contract/PrivateBookingNote";
import { BookingIdVO } from "#domain/Booking/ValueObject/BookingIdVO";
import { BookingNoteVO } from "#domain/Booking/ValueObject/BookingNoteVO";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Coordinates explicit owner-only note access. Admin has no ownership bypass. */
export class SavePrivateNoteUC {
  /** @param notes - Owner-checking encrypted repository. */
  public constructor(private readonly notes: IBookingNoteRepository) {}
  /** @param intent - Server-resolved actor and private intent. @returns Authenticated note. @throws ARoomBookException On validation/access/integrity/storage failure. */
  public execute(intent: SavePrivateNoteAC): Promise<PrivateBookingNote> {
    if (!Number.isInteger(intent.revision) || intent.revision < 0 || intent.revision >= 2147483647) throw new InvalidRequestBodyException();
    return this.notes.save(new BookingIdVO(intent.bookingId).getValue(), intent.actor.id, new BookingNoteVO(intent.text), intent.revision);
  }
}
