import { ADomainEvent } from "#domain/SharedKernel/Abstracts/ADomainEvent";
import { BookingStatusChangedDED } from "#domain/Booking/Event/Data/BookingStatusChangedDED";
import { BookingEventRegistry } from "#domain/Booking/Event/Registry/BookingEventRegistry";
/** Serialized BookingStatusChanged domain event. */
export class BookingStatusChangedDE extends ADomainEvent {
  /** @param eventId - Unique UUID. @param sourceId - Booking UUID. @param timestamp - Occurrence instant. @param data - Immutable event payload. */
  public constructor(eventId: string, sourceId: string, timestamp: string, private readonly data: BookingStatusChangedDED) { super(eventId, sourceId, timestamp); }
  /** @returns Stable event name. */
  public override getEventName(): BookingEventRegistry { return BookingEventRegistry.StatusChanged; }
  /** @returns Specific payload constructor. */
  public override getEventDataClass(): typeof BookingStatusChangedDED { return BookingStatusChangedDED; }
  /** @returns Immutable payload. */
  public override getData(): BookingStatusChangedDED { return this.data; }
}
