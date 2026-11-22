import { AEntityIdVO } from "#domain/SharedKernel/Abstracts/AEntityIdVO";
/** Typed immutable UUID for Booking. */
export class BookingIdVO extends AEntityIdVO {
  /** @param value - UUID v4. @throws InvalidEntityIdException On invalid input. */
  public constructor(value: string) { super(value); }
}
