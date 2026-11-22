import { SealedNote } from "#ui-domain/Booking/Contract/SealedNote";
/** Opaque ciphertext transport; never accepts a plaintext note or key. */
export interface ISealedNotesGateway {
  /** @param id - Booking UUID. @returns Latest envelope or absence. @throws Error On failed access/contract. */
  read(id: string): Promise<SealedNote | null>;
  /** @param id - Booking UUID. @param note - Ciphertext. @param revision - Observed version. @returns Stored envelope. @throws Error On denied/conflicting access. */
  save(id: string, note: SealedNote, revision: number): Promise<SealedNote>;
}
