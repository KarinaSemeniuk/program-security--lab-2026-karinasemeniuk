import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { INoteCipher } from "#domain/Booking/OutsourceContract/INoteCipher";
import { NoteContext } from "#domain/Booking/Contract/NoteContext";
import { EncryptedNote } from "#domain/Booking/Contract/EncryptedNote";
import { NoteKeyring } from "#infrastructure/Cryptography/NoteKeyring";
import { NoteProtectionException } from "#infrastructure/Exception/NoteProtectionException";
import { NoteIntegrityException } from "#infrastructure/Exception/NoteIntegrityException";
import { NoteKeyConfigurationException } from "#infrastructure/Exception/NoteKeyConfigurationException";
/** Node/OpenSSL AES-256-GCM adapter; plaintext is released only after final tag verification. */
export class AesGcmNoteCipher implements INoteCipher {
  /** @param keys - Fresh validated key source; no hard-coded/default key. */
  public constructor(private readonly keys: () => NoteKeyring) {}
  private aad(keyId: string, context: NoteContext): Buffer {
    return Buffer.from(JSON.stringify(["RoomBook", "booking-private-note", 1, keyId, context.bookingId, context.ownerId, context.revision]), "utf8");
  }
  /** @param text - Exact validated UTF-8 note. @param context - Expected record binding. @returns Versioned envelope. @throws ARoomBookException On key/protection failure. */
  public encrypt(text: string, context: NoteContext): EncryptedNote {
    try {
      const ring = this.keys(); const nonce = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", ring.key(ring.activeId), nonce, { authTagLength: 16 });
      cipher.setAAD(this.aad(ring.activeId, context));
      const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
      return { version: 1, keyId: ring.activeId, nonce: nonce.toString("hex"), ciphertext: ciphertext.toString("hex"), tag: cipher.getAuthTag().toString("hex") };
    } catch (error: unknown) { if (error instanceof NoteKeyConfigurationException) throw error; throw new NoteProtectionException(); }
  }
  /** @param value - Untrusted stored envelope. @param context - Expected owner/record/revision. @returns Authenticated plaintext only. @throws ARoomBookException On failed integrity or unavailable keys. */
  public decrypt(value: EncryptedNote, context: NoteContext): string {
    try {
      if (value.version !== 1 || !/^[a-zA-Z0-9_-]{1,64}$/.test(value.keyId) || !/^[a-f0-9]{24}$/.test(value.nonce) ||
          !/^[a-f0-9]{32}$/.test(value.tag) || !/^(?:[a-f0-9]{2}){0,8000}$/.test(value.ciphertext)) throw new NoteIntegrityException();
      const decipher = createDecipheriv("aes-256-gcm", this.keys().key(value.keyId), Buffer.from(value.nonce, "hex"), { authTagLength: 16 });
      decipher.setAAD(this.aad(value.keyId, context)); decipher.setAuthTag(Buffer.from(value.tag, "hex"));
      const verified = Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "hex")), decipher.final()]);
      return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(verified);
    } catch (error: unknown) { if (error instanceof NoteKeyConfigurationException) throw error; throw new NoteIntegrityException(); }
  }
}
