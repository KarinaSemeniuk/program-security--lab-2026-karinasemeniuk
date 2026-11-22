import { OutsideOpeningHoursException } from "#domain/Booking/Exception/OutsideOpeningHoursException";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { BookableResource } from "#domain/Booking/Contract/BookableResource";
import { InactiveResourceException } from "#domain/Booking/Exception/InactiveResourceException";
import { InvalidBookingDurationException } from "#domain/Booking/Exception/InvalidBookingDurationException";
import { BookingInPastException } from "#domain/Booking/Exception/BookingInPastException";
import { BookingSlotUnavailableException } from "#domain/Booking/Exception/BookingSlotUnavailableException";
/** Central creation rules, reused under the database resource lock. */
export class CreateBookingDPolicy {
  /** @param resource - Current resource reference. @param range - Requested interval. @param occupied - Current active intervals. @param now - Current clock. @throws ARoomBookException If any creation rule fails. */
  public assert(resource: BookableResource, range: TimeRangeVO, occupied: readonly TimeRangeVO[], now: Date): void {
    if (!resource.isActive) throw new InactiveResourceException();
    const step = resource.minSlotMinutes * 60_000;
    if (range.durationMs() > 7 * 86400_000 || range.durationMs() % step !== 0 || range.getStart().getTime() % step !== 0) throw new InvalidBookingDurationException();
    if (range.getStart().getTime() <= now.getTime()) throw new BookingInPastException();
    if (resource.isOpen === false) throw new OutsideOpeningHoursException();
    if (occupied.some(other => range.overlaps(other))) throw new BookingSlotUnavailableException();
  }
}
