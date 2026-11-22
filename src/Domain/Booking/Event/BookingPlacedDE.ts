import { ADomainEvent } from "#domain/SharedKernel/Abstracts/ADomainEvent";
import { BookingPlacedDED } from "#domain/Booking/Event/Data/BookingPlacedDED";
import { BookingEventRegistry } from "#domain/Booking/Event/Registry/BookingEventRegistry";
/** Serialized BookingPlaced domain event. */
export class BookingPlacedDE extends ADomainEvent {
  /** @param eventId - Unique UUID. @param sourceId - Booking UUID. @param timestamp - Occurrence instant. @param data - Immutable event payload. */
  public constructor(eventId: string, sourceId: string, timestamp: string, private readonly data: BookingPlacedDED) { super(eventId, sourceId, timestamp); }
  /** @returns Stable event name. */
  public override getEventName(): BookingEventRegistry { return BookingEventRegistry.Placed; }
  /** @returns Specific payload constructor. */
  public override getEventDataClass(): typeof BookingPlacedDED { return BookingPlacedDED; }
  /** @returns Immutable payload. */
  public override getData(): BookingPlacedDED { return this.data; }
}
