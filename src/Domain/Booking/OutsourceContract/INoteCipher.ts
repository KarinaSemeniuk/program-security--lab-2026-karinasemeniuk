import { EncryptedNote } from "#domain/Booking/Contract/EncryptedNote";
import { NoteContext } from "#domain/Booking/Contract/NoteContext";
/** Authenticated encryption boundary; cryptographic primitives stay in Infrastructure. */
export interface INoteCipher {
  /** @param text - Exact validated note. @param context - Immutable owner/revision binding. @returns Authenticated envelope. @throws ARoomBookException On key/protection failure. */
  encrypt(text: string, context: NoteContext): EncryptedNote;
  /** @param value - Untrusted stored envelope. @param context - Expected owner/revision binding. @returns Plaintext only after authentication succeeds. @throws ARoomBookException If integrity/key/format verification fails. */
  decrypt(value: EncryptedNote, context: NoteContext): string;
}
