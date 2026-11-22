import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Immutable BookingStatusChanged payload, containing stable references only. */
export class BookingStatusChangedDED {
  /** @param bookingId - Event reference or state. @param oldStatus - Event reference or state. @param newStatus - Event reference or state.  */
  public constructor(public readonly bookingId: string, public readonly oldStatus: string, public readonly newStatus: string) {}
  /** @returns Plain serializable payload. */
  public toJSON(): Record<string, string> { return { bookingId: this.bookingId, oldStatus: this.oldStatus, newStatus: this.newStatus }; }
  /** @param value - Serialized payload. @returns Typed payload. @throws InvalidRequestBodyException On malformed data. */
  public static fromJSON(value: unknown): BookingStatusChangedDED {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new InvalidRequestBodyException();
    const record = value as Record<string, unknown>;
    const fields = ['bookingId', 'oldStatus', 'newStatus'];
    if (Object.keys(record).length !== fields.length || fields.some(key => typeof record[key] !== "string")) throw new InvalidRequestBodyException();
    return new BookingStatusChangedDED(record.bookingId as string, record.oldStatus as string, record.newStatus as string);
  }
}
