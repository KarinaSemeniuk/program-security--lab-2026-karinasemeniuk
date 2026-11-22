import { SealedNote } from "#domain/Booking/Contract/SealedNote";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Validates the public envelope, binding and size; authenticity is verified only by the client. */
export class SealedNoteVO {
  private readonly value: SealedNote;
  /** @param input - Untrusted envelope. @param bookingId - Validated route ID. @param ownerId - Server-resolved account. @param revision - Expected next version. @throws InvalidRequestBodyException On shape or binding failure. */
  public constructor(input: unknown, bookingId: string, ownerId: string, revision: number) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) throw new InvalidRequestBodyException();
    const x = input as Record<string, unknown>;
    const fields = ["version", "algorithm", "keyId", "ownerId", "bookingId", "revision", "nonce", "ciphertext"];
    if (Object.keys(x).length !== fields.length || fields.some(k => !(k in x)) || x.version !== 1 || x.algorithm !== "AES-256-GCM" ||
      typeof x.keyId !== "string" || !/^[a-f0-9]{32}$/.test(x.keyId) || x.ownerId !== ownerId || x.bookingId !== bookingId ||
      x.revision !== revision || !Number.isSafeInteger(revision) || revision < 1 || revision > 2147483647 ||
      typeof x.nonce !== "string" || !/^[A-Za-z0-9+/]{16}$/.test(x.nonce) || typeof x.ciphertext !== "string" ||
      x.ciphertext.length < 24 || x.ciphertext.length > 11000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(x.ciphertext)) throw new InvalidRequestBodyException();
    this.value = { version: 1, algorithm: "AES-256-GCM", keyId: x.keyId, ownerId, bookingId, revision, nonce: x.nonce, ciphertext: x.ciphertext };
  }
  /** @returns A detached validated ciphertext envelope. */
  public getValue(): SealedNote { return { ...this.value }; }
}
