import { SealedNote } from "#ui-domain/Booking/Contract/SealedNote";
import { ISealedNoteCipher } from "#ui-domain/Booking/OutsourceContract/ISealedNoteCipher";
/** AES-GCM runs only on the endpoint. AAD binds identity, booking, revision and key fingerprint. */
export class WebCryptoSealedNotes implements ISealedNoteCipher {
  private encode(bytes: Uint8Array): string { return btoa(String.fromCharCode(...bytes)); }
  private decode(text: string): Uint8Array {
    const bytes = Uint8Array.from(atob(text), c => c.charCodeAt(0));
    if (this.encode(bytes) !== text) throw new Error("Некоректне кодування.");
    return bytes;
  }
  private aad(note: Omit<SealedNote, "nonce" | "ciphertext">): Uint8Array {
    return new TextEncoder().encode(JSON.stringify({ version: note.version, algorithm: note.algorithm, keyId: note.keyId, ownerId: note.ownerId, bookingId: note.bookingId, revision: note.revision }));
  }
  private async key(raw: string): Promise<{ key: CryptoKey; keyId: string }> {
    const bytes = this.decode(raw); if (bytes.length !== 32) throw new Error("Ключ повинен містити 256 біт.");
    const key = await crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
    const keyId = [...digest.slice(0, 16)].map(b => b.toString(16).padStart(2, "0")).join("");
    return { key, keyId };
  }
  /** @returns Random client-only AES-256 key in base64. */
  public createKey(): string { return this.encode(crypto.getRandomValues(new Uint8Array(32))); }
  /** @param raw - Client recovery key. @param text - Private note. @param ownerId - Account binding. @param bookingId - Booking binding. @param revision - Next revision. @returns Opaque envelope. @throws Error On invalid key/text or encryption failure. */
  public async seal(raw: string, text: string, ownerId: string, bookingId: string, revision: number): Promise<SealedNote> {
    if ([...text].length > 2000 || !Number.isSafeInteger(revision) || revision < 1) throw new Error("Некоректна нотатка.");
    const { key, keyId } = await this.key(raw);
    const metadata = { version: 1 as const, algorithm: "AES-256-GCM" as const, keyId, ownerId, bookingId, revision };
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const bytes = await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce, additionalData: this.aad(metadata), tagLength: 128 }, key, new TextEncoder().encode(text));
    return { ...metadata, nonce: this.encode(nonce), ciphertext: this.encode(new Uint8Array(bytes)) };
  }
  /** @param raw - Client key. @param note - Untrusted envelope. @param ownerId - Expected owner. @param bookingId - Expected booking. @returns Verified plaintext. @throws Error On tampering or a wrong key. */
  public async open(raw: string, note: SealedNote, ownerId: string, bookingId: string): Promise<string> {
    if (note.version !== 1 || note.algorithm !== "AES-256-GCM" || note.ownerId !== ownerId || note.bookingId !== bookingId || !Number.isSafeInteger(note.revision) || note.revision < 1) throw new Error("Невідповідні дані нотатки.");
    const { key, keyId } = await this.key(raw); if (keyId !== note.keyId) throw new Error("Потрібен інший ключ.");
    const nonce = this.decode(note.nonce); if (nonce.length !== 12) throw new Error("Некоректне початкове значення.");
    const bytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv: nonce, additionalData: this.aad(note), tagLength: 128 }, key, this.decode(note.ciphertext));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  }
}
