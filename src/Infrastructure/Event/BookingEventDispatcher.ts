import { ADomainEvent } from "#domain/SharedKernel/Abstracts/ADomainEvent";
import { IBookingEventDispatcher } from "#domain/Booking/OutsourceContract/IBookingEventDispatcher";
/** Explicit no-subscriber dispatcher for this release; events are not an audit log. */
export class BookingEventDispatcher implements IBookingEventDispatcher {
  /** @param events - Committed aggregate events. No downstream effects are registered yet. */
  public dispatch(events: readonly ADomainEvent[]): void {
    // Payloads intentionally never reach console logs. Future listeners must be
    // registered here or replace this adapter with a durable outbox implementation.
    void events;
  }
}
