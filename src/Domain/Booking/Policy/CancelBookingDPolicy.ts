import { BookingStatus } from "#domain/Booking/Enum/BookingStatus";
import { BookingAccessDeniedException } from "#domain/Booking/Exception/BookingAccessDeniedException";
import { CancellationWindowExpiredException } from "#domain/Booking/Exception/CancellationWindowExpiredException";
import { InvalidBookingTransitionException } from "#domain/Booking/Exception/InvalidBookingTransitionException";
/** Ownership, role and time checks directly before state mutation. */
export class CancelBookingDPolicy {
  /** @param ownerId - Booking owner. @param actorId - Server-resolved caller. @param admin - Current role check. @param status - Locked status. @param startAt - Start instant. @param now - Request clock. @throws ARoomBookException If cancellation is forbidden. */
  public assert(ownerId: string, actorId: string, admin: boolean, status: BookingStatus, startAt: Date, now: Date): void {
    if (!admin && ownerId !== actorId) throw new BookingAccessDeniedException();
    if (![BookingStatus.Pending, BookingStatus.Confirmed].includes(status)) throw new InvalidBookingTransitionException();
    if (!admin && status === BookingStatus.Confirmed && startAt.getTime() - now.getTime() < 2 * 3600_000) throw new CancellationWindowExpiredException();
  }
}
