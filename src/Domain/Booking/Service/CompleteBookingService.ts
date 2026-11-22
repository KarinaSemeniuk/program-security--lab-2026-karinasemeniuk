import { IBookingRepository } from "#domain/Booking/OutsourceContract/IBookingRepository";
/** Internal scheduled completion capability; terminal-state decisions run on locked aggregates. */
export class CompleteBookingService {
  /** @param bookings - Atomic persistence. */
  public constructor(private readonly bookings: IBookingRepository) {}
  /** @returns Count completed in this batch. @throws ARoomBookException On persistence failure. */
  public complete(): Promise<number> { return this.bookings.completeEnded(); }
}
