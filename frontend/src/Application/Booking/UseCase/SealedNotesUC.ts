import { ISealedNoteCipher } from "#ui-domain/Booking/OutsourceContract/ISealedNoteCipher";
import { ISealedNotesGateway } from "#ui-domain/Booking/OutsourceContract/ISealedNotesGateway";
/** Client orchestration keeps encryption keys outside the transport contract. */
export class SealedNotesUC {
  /** @param gateway - Opaque persistence. @param cipher - Endpoint cryptography. */
  public constructor(private readonly gateway: ISealedNotesGateway, private readonly cipher: ISealedNoteCipher) {}
  /** @returns Offline recovery key; caller is responsible for saving it. */
  public createKey(): string { return this.cipher.createKey(); }
  /** @param raw - Client key. @param owner - Current account. @param booking - Owned UUID. @returns Decrypted latest note. @throws Error On key/access/integrity failure. */
  public async read(raw: string, owner: string, booking: string): Promise<{ text: string; revision: number }> {
    const note = await this.gateway.read(booking);
    return note ? { text: await this.cipher.open(raw, note, owner, booking), revision: note.revision } : { text: "", revision: 0 };
  }
  /** @param raw - Client key. @param owner - Current account. @param booking - Owned UUID. @param text - Private text. @param revision - Observed version. @returns Updated revision. @throws Error On access/conflict/cryptographic failure. */
  public async save(raw: string, owner: string, booking: string, text: string, revision: number): Promise<number> {
    const note = await this.cipher.seal(raw, text, owner, booking, revision + 1);
    const stored = await this.gateway.save(booking, note, revision);
    if (await this.cipher.open(raw, stored, owner, booking) !== text || stored.revision !== revision + 1) throw new Error("Не підтверджено збереження нотатки.");
    return stored.revision;
  }
}
