import { ADomainEvent } from "#domain/SharedKernel/Abstracts/ADomainEvent";
import { BookingCancelledDED } from "#domain/Booking/Event/Data/BookingCancelledDED";
import { BookingEventRegistry } from "#domain/Booking/Event/Registry/BookingEventRegistry";
/** Serialized BookingCancelled domain event. */
export class BookingCancelledDE extends ADomainEvent {
  /** @param eventId - Unique UUID. @param sourceId - Booking UUID. @param timestamp - Occurrence instant. @param data - Immutable event payload. */
  public constructor(eventId: string, sourceId: string, timestamp: string, private readonly data: BookingCancelledDED) { super(eventId, sourceId, timestamp); }
  /** @returns Stable event name. */
  public override getEventName(): BookingEventRegistry { return BookingEventRegistry.Cancelled; }
  /** @returns Specific payload constructor. */
  public override getEventDataClass(): typeof BookingCancelledDED { return BookingCancelledDED; }
  /** @returns Immutable payload. */
  public override getData(): BookingCancelledDED { return this.data; }
}
