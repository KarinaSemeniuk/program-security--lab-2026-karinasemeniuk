/** Identity generation for bookings and their events. */
export interface IBookingIdFactory {
  /** @returns New UUID v4. @throws ARoomBookException On random-source failure. */
  next(): string;
}
