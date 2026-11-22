import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Immutable previous/new booking interval references; no private note content. */
export class BookingRescheduledDED {
  /** @param bookingId - Stable UUID. @param previousStart - Prior UTC start. @param previousEnd - Prior UTC end. @param startAt - New UTC start. @param endAt - New UTC end. */
  public constructor(public readonly bookingId:string, public readonly previousStart:string, public readonly previousEnd:string, public readonly startAt:string, public readonly endAt:string) {}
  /** @returns Plain serializable data. */
  public toJSON(): Record<string,string> { return {bookingId:this.bookingId,previousStart:this.previousStart,previousEnd:this.previousEnd,startAt:this.startAt,endAt:this.endAt}; }
  /** @param value - Serialized event data. @returns Typed immutable data. @throws InvalidRequestBodyException On malformed input. */
  public static fromJSON(value:unknown): BookingRescheduledDED {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new InvalidRequestBodyException();
    const data = value as Record<string,unknown>; const fields = ["bookingId","previousStart","previousEnd","startAt","endAt"];
    if (Object.keys(data).length!==5 || fields.some(field=>typeof data[field]!=="string")) throw new InvalidRequestBodyException();
    return new BookingRescheduledDED(data.bookingId as string,data.previousStart as string,data.previousEnd as string,data.startAt as string,data.endAt as string);
  }
}
