import { GetPrivateNoteAQ } from "#application/Booking/Query/GetPrivateNoteAQ";
import { IBookingNoteRepository } from "#domain/Booking/OutsourceContract/IBookingNoteRepository";
import { PrivateBookingNote } from "#domain/Booking/Contract/PrivateBookingNote";
import { BookingIdVO } from "#domain/Booking/ValueObject/BookingIdVO";
import { BookingNoteVO } from "#domain/Booking/ValueObject/BookingNoteVO";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Coordinates explicit owner-only note access. Admin has no ownership bypass. */
export class GetPrivateNoteUC {
  /** @param notes - Owner-checking encrypted repository. */
  public constructor(private readonly notes: IBookingNoteRepository) {}
  /** @param intent - Server-resolved actor and private intent. @returns Authenticated note. @throws ARoomBookException On validation/access/integrity/storage failure. */
  public execute(intent: GetPrivateNoteAQ): Promise<PrivateBookingNote> {
    
    return this.notes.read(new BookingIdVO(intent.bookingId).getValue(), intent.actor.id);
  }
}
