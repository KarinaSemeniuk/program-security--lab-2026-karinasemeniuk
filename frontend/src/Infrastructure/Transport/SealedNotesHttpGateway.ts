import { SealedNote } from "#ui-domain/Booking/Contract/SealedNote";
import { ISealedNotesGateway } from "#ui-domain/Booking/OutsourceContract/ISealedNotesGateway";
/** Transports envelopes using the existing same-origin authenticated session. */
export class SealedNotesHttpGateway implements ISealedNotesGateway {
  /** @param base - Same deployment API base. */
  public constructor(private readonly base: string) {}
  private async request(id: string, body?: object): Promise<SealedNote | null> {
    const response = await fetch(this.base + "/api/bookings/" + encodeURIComponent(id) + "/sealed-note", {
      method: body ? "POST" : "GET", credentials: "include", cache: "no-store", redirect: "error",
      headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error(response.status === 409 ? "Нотатку вже змінено. Завантажте актуальну версію." : "Немає доступу до нотатки.");
    const result: unknown = await response.json();
    if (typeof result !== "object" || result === null || !("note" in result)) throw new Error("Некоректна відповідь.");
    if (result.note === null) return null;
    const x = result.note as Record<string, unknown>;
    if (typeof x !== "object" || !x || x.version !== 1 || x.algorithm !== "AES-256-GCM" ||
      !["keyId", "ownerId", "bookingId", "nonce", "ciphertext"].every(k => typeof x[k] === "string") || !Number.isSafeInteger(x.revision)) throw new Error("Некоректний формат нотатки.");
    return x as unknown as SealedNote;
  }
  /** @param id - Owned booking UUID. @returns Ciphertext or absence. @throws Error On denied/invalid response. */
  public read(id: string): Promise<SealedNote | null> { return this.request(id); }
  /** @param id - Owned booking UUID. @param note - Encrypted envelope. @param revision - Observed version. @returns Stored ciphertext. @throws Error On failed write. */
  public async save(id: string, note: SealedNote, revision: number): Promise<SealedNote> {
    const result = await this.request(id, { envelope: note, revision });
    if (!result) throw new Error("Відсутній результат збереження."); return result;
  }
}
