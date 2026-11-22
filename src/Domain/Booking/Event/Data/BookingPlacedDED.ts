import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Immutable BookingPlaced payload, containing stable references only. */
export class BookingPlacedDED {
  /** @param bookingId - Event reference or state. @param userId - Event reference or state. @param resourceId - Event reference or state. @param startAt - Event reference or state. @param endAt - Event reference or state.  */
  public constructor(public readonly bookingId: string, public readonly userId: string, public readonly resourceId: string, public readonly startAt: string, public readonly endAt: string) {}
  /** @returns Plain serializable payload. */
  public toJSON(): Record<string, string> { return { bookingId: this.bookingId, userId: this.userId, resourceId: this.resourceId, startAt: this.startAt, endAt: this.endAt }; }
  /** @param value - Serialized payload. @returns Typed payload. @throws InvalidRequestBodyException On malformed data. */
  public static fromJSON(value: unknown): BookingPlacedDED {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new InvalidRequestBodyException();
    const record = value as Record<string, unknown>;
    const fields = ['bookingId', 'userId', 'resourceId', 'startAt', 'endAt'];
    if (Object.keys(record).length !== fields.length || fields.some(key => typeof record[key] !== "string")) throw new InvalidRequestBodyException();
    return new BookingPlacedDED(record.bookingId as string, record.userId as string, record.resourceId as string, record.startAt as string, record.endAt as string);
  }
}
