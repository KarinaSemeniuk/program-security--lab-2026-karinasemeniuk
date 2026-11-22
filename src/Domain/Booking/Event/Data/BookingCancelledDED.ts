import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Immutable BookingCancelled payload, containing stable references only. */
export class BookingCancelledDED {
  /** @param bookingId - Event reference or state. @param cancelledBy - Event reference or state.  */
  public constructor(public readonly bookingId: string, public readonly cancelledBy: string) {}
  /** @returns Plain serializable payload. */
  public toJSON(): Record<string, string> { return { bookingId: this.bookingId, cancelledBy: this.cancelledBy }; }
  /** @param value - Serialized payload. @returns Typed payload. @throws InvalidRequestBodyException On malformed data. */
  public static fromJSON(value: unknown): BookingCancelledDED {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new InvalidRequestBodyException();
    const record = value as Record<string, unknown>;
    const fields = ['bookingId', 'cancelledBy'];
    if (Object.keys(record).length !== fields.length || fields.some(key => typeof record[key] !== "string")) throw new InvalidRequestBodyException();
    return new BookingCancelledDED(record.bookingId as string, record.cancelledBy as string);
  }
}
