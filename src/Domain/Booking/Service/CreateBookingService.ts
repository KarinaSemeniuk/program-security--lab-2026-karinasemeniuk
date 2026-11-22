import { Booking } from "#domain/Booking/Entity/Booking";
import { BookingIdVO } from "#domain/Booking/ValueObject/BookingIdVO";
import { IBookingIdFactory } from "#domain/Booking/OutsourceContract/IBookingIdFactory";
import { BookableResource } from "#domain/Booking/Contract/BookableResource";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { CreateBookingDPolicy } from "#domain/Booking/Policy/CreateBookingDPolicy";
/** Creates an automatically confirmed aggregate after domain checks. */
export class CreateBookingService {
  /** @param ids - UUID source. */
  public constructor(private readonly ids: IBookingIdFactory) {}
  /** @param userId - Current account reference. @param resource - Stable current configuration. @param range - Requested interval. @param occupied - Active intervals. @param now - Clock. @returns Confirmed aggregate with pending events. @throws ARoomBookException On validation failure. */
  public create(userId: string, resource: BookableResource, range: TimeRangeVO, occupied: readonly TimeRangeVO[], now: Date): Booking {
    new CreateBookingDPolicy().assert(resource, range, occupied, now);
    const booking = Booking.place(new BookingIdVO(this.ids.next()), userId, resource.id, range, now);
    booking.confirm(this.ids, now); return booking;
  }
}
