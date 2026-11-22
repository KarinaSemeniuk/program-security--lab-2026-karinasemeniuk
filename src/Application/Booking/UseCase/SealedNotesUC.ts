import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { ISealedNoteRepository } from "#domain/Booking/OutsourceContract/ISealedNoteRepository";
import { SealedNote } from "#domain/Booking/Contract/SealedNote";
import { SealedNoteVO } from "#domain/Booking/ValueObject/SealedNoteVO";
import { BookingIdVO } from "#domain/Booking/ValueObject/BookingIdVO";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Maps current server identity and versioned ciphertext to opaque owner-only storage. */
export class SealedNotesUC {
  /** @param repository - Owner-checking persistence. */
  public constructor(private readonly repository: ISealedNoteRepository) {}
  /** @param actor - Verified account. @param id - Route UUID. @returns Ciphertext or absence. @throws ARoomBookException On access/validation/storage failure. */
  public read(actor: UserDTO, id: string): Promise<SealedNote | null> { return this.repository.read(new BookingIdVO(id).getValue(), actor.id); }
  /** @param actor - Verified account. @param id - Route UUID. @param input - Untrusted envelope. @param revision - Observed revision. @returns Stored envelope. @throws ARoomBookException On access/validation/conflict/storage failure. */
  public save(actor: UserDTO, id: string, input: unknown, revision: number): Promise<SealedNote> {
    if (!Number.isInteger(revision) || revision < 0 || revision >= 2147483647) throw new InvalidRequestBodyException();
    const note = new SealedNoteVO(input, new BookingIdVO(id).getValue(), actor.id, revision + 1);
    return this.repository.save(note.getValue(), revision);
  }
}
