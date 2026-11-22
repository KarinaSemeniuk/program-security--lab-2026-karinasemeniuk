import { SealedNote } from "#ui-domain/Booking/Contract/SealedNote";
/** Client-only encryption; raw keys never pass to the gateway. */
export interface ISealedNoteCipher {
  /** @returns Fresh 256-bit key encoded for offline recovery. */
  createKey(): string;
  /** @param raw - Client key. @param text - Exact private text. @param ownerId - Account binding. @param bookingId - Booking binding. @param revision - Next version. @returns Authenticated ciphertext. @throws Error For invalid inputs. */
  seal(raw: string, text: string, ownerId: string, bookingId: string, revision: number): Promise<SealedNote>;
  /** @param raw - Client key. @param note - Untrusted server envelope. @param ownerId - Expected owner. @param bookingId - Expected booking. @returns Authenticated plaintext. @throws Error On integrity/binding/key failure. */
  open(raw: string, note: SealedNote, ownerId: string, bookingId: string): Promise<string>;
}
