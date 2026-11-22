import { IBookingView } from "#ui-domain/Booking/Contract/IBookingView";
/** One private history page. */
export interface BookingPage {
  /** At most fifty records. */
  readonly bookings: IBookingView[];
  /** Total visible records. */
  readonly total: number;
}
