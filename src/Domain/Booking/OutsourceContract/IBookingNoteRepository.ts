import { BookingNoteVO } from "#domain/Booking/ValueObject/BookingNoteVO";
import { PrivateBookingNote } from "#domain/Booking/Contract/PrivateBookingNote";
/** Owner-only encrypted note storage. Ownership is rechecked within the persistence operation. */
export interface IBookingNoteRepository {
  /** @param bookingId - Valid booking UUID. @param ownerId - Current authenticated account. @returns Authenticated plaintext note. @throws ARoomBookException On denied/missing/integrity/storage failure. */
  read(bookingId: string, ownerId: string): Promise<PrivateBookingNote>;
  /** @param bookingId - Booking UUID. @param ownerId - Authenticated account. @param note - Exact validated text. @param revision - Last observed revision. @returns New revision. @throws ARoomBookException On denied/conflict/integrity/storage failure. */
  save(bookingId: string, ownerId: string, note: BookingNoteVO, revision: number): Promise<PrivateBookingNote>;
}
