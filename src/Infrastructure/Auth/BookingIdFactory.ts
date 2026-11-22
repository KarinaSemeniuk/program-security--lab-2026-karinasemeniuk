import { randomUUID } from "node:crypto";
import { IBookingIdFactory } from "#domain/Booking/OutsourceContract/IBookingIdFactory";
import { UserIdGenerationException } from "#infrastructure/Exception/UserIdGenerationException";
/** Platform UUID adapter shared by booking/event allocation. */
export class BookingIdFactory implements IBookingIdFactory {
  /** @returns New UUID v4. @throws UserIdGenerationException On random-source failure. */
  public next(): string { try { return randomUUID(); } catch { throw new UserIdGenerationException(); } }
}
