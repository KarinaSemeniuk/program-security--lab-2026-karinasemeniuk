import { Booking } from "#domain/Booking/Entity/Booking";
/** Owner/admin booking projection; never exposed by public availability. */
export class BookingDTO {
  /** Observed interval revision. */
  public readonly revision: number;
  /** Stable booking reference. */
  public readonly id: string;
  /** Stable resource reference. */
  public readonly resourceId: string;
  /** Owner reference, visible only to self/Admin. */
  public readonly userId: string;
  /** UTC start. */
  public readonly startAt: string;
  /** UTC exclusive end. */
  public readonly endAt: string;
  /** Current lifecycle state. */
  public readonly status: string;
  /** Stable resource display label in private history. */
  public readonly resourceName: string;
  /** Original timestamp. */
  public readonly createdAt: string;
  /** @param booking - Persisted aggregate. */
  public constructor(booking: Booking, resourceName = "") {
    this.resourceName = resourceName;
    this.revision = booking.getRevision();
    this.id = booking.getId().getValue(); this.resourceId = booking.getResourceId(); this.userId = booking.getUserId();
    this.startAt = booking.getRange().getStart().toISOString(); this.endAt = booking.getRange().getEnd().toISOString();
    this.status = booking.getStatus(); this.createdAt = booking.getCreatedAt();
  }
}
