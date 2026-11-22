import { SealedNote } from "#domain/Booking/Contract/SealedNote";
/** Owner-only opaque storage with optimistic concurrency and nonce reuse detection. */
export interface ISealedNoteRepository {
  /** @param id - Booking UUID. @param owner - Authenticated account. @returns Latest ciphertext or absence. @throws ARoomBookException On access/storage failure. */
  read(id: string, owner: string): Promise<SealedNote | null>;
  /** @param note - Validated client envelope. @param previousRevision - Last observed version. @returns Persisted ciphertext. @throws ARoomBookException On access/conflict/storage failure. */
  save(note: SealedNote, previousRevision: number): Promise<SealedNote>;
}
