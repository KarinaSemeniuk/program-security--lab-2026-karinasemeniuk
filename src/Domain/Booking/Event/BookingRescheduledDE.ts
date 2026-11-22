import { ADomainEvent } from "#domain/SharedKernel/Abstracts/ADomainEvent";
import { BookingRescheduledDED } from "#domain/Booking/Event/Data/BookingRescheduledDED";
import { BookingEventRegistry } from "#domain/Booking/Event/Registry/BookingEventRegistry";
/** Serialized BookingRescheduled domain event. */
export class BookingRescheduledDE extends ADomainEvent {
  /** @param eventId - Unique UUID. @param sourceId - Booking UUID. @param timestamp - Occurrence instant. @param data - Immutable event payload. */
  public constructor(eventId: string, sourceId: string, timestamp: string, private readonly data: BookingRescheduledDED) { super(eventId, sourceId, timestamp); }
  /** @returns Stable event name. */
  public override getEventName(): BookingEventRegistry { return BookingEventRegistry.Rescheduled; }
  /** @returns Specific payload constructor. */
  public override getEventDataClass(): typeof BookingRescheduledDED { return BookingRescheduledDED; }
  /** @returns Immutable payload. */
  public override getData(): BookingRescheduledDED { return this.data; }
}
