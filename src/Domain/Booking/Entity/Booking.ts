import { CancellationWindowExpiredException } from "#domain/Booking/Exception/CancellationWindowExpiredException";
import { BookableResource } from "#domain/Booking/Contract/BookableResource";
import { CreateBookingDPolicy } from "#domain/Booking/Policy/CreateBookingDPolicy";
import { BookingConflictException } from "#domain/Booking/Exception/BookingConflictException";
import { BookingInPastException } from "#domain/Booking/Exception/BookingInPastException";
import { BookingRescheduledDE } from "#domain/Booking/Event/BookingRescheduledDE";
import { BookingRescheduledDED } from "#domain/Booking/Event/Data/BookingRescheduledDED";
import { AEventEntity } from "#domain/SharedKernel/Abstracts/AEventEntity";
import { IEntity } from "#domain/SharedKernel/Contract/IEntity";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { BookingIdVO } from "#domain/Booking/ValueObject/BookingIdVO";
import { BookingStatus } from "#domain/Booking/Enum/BookingStatus";
import { BookingStatusVO } from "#domain/Booking/ValueObject/BookingStatusVO";
import { IBookingIdFactory } from "#domain/Booking/OutsourceContract/IBookingIdFactory";
import { CancelBookingDPolicy } from "#domain/Booking/Policy/CancelBookingDPolicy";
import { InvalidBookingTransitionException } from "#domain/Booking/Exception/InvalidBookingTransitionException";
import { BookingPlacedDE } from "#domain/Booking/Event/BookingPlacedDE";
import { BookingPlacedDED } from "#domain/Booking/Event/Data/BookingPlacedDED";
import { BookingCancelledDE } from "#domain/Booking/Event/BookingCancelledDE";
import { BookingCancelledDED } from "#domain/Booking/Event/Data/BookingCancelledDED";
import { BookingStatusChangedDE } from "#domain/Booking/Event/BookingStatusChangedDE";
import { BookingStatusChangedDED } from "#domain/Booking/Event/Data/BookingStatusChangedDED";
/** Reservation aggregate. Invariants: immutable ownership, versioned range, guarded lifecycle, no terminal-state reversal. */
export class Booking extends AEventEntity implements IEntity<BookingIdVO> {
  private constructor(private readonly id: BookingIdVO, private readonly userId: string, private readonly resourceId: string,
    private range: TimeRangeVO, private status: BookingStatus, private readonly createdAt: string, private revision = 0) { super(); new BookingStatusVO(status); }
  /** @param id - New UUID. @param userId - Current account reference. @param resourceId - Resource reference. @param range - Validated interval. @param now - Creation instant. @returns Pending aggregate. */
  public static place(id: BookingIdVO, userId: string, resourceId: string, range: TimeRangeVO, now: Date): Booking {
    return new Booking(id, userId, resourceId, range, BookingStatus.Pending, now.toISOString());
  }
  /** @param id - Stored UUID. @param userId - Immutable owner. @param resourceId - Resource reference. @param range - Stored interval. @param status - Stored status. @param createdAt - Original timestamp. @param revision - Stored interval revision. @returns Aggregate without historical events. */
  public static restore(id: BookingIdVO, userId: string, resourceId: string, range: TimeRangeVO, status: BookingStatus, createdAt: string, revision = 0): Booking {
    return new Booking(id, userId, resourceId, range, status, createdAt, revision);
  }
  /** @param ids - Event UUID source. @param now - Confirmation instant. @throws InvalidBookingTransitionException For an invalid transition. */
  public confirm(ids: IBookingIdFactory, now: Date): void {
    if (this.status !== BookingStatus.Pending) throw new InvalidBookingTransitionException();
    this.transition(BookingStatus.Confirmed, ids, now);
    this.triggerEvent(new BookingPlacedDE(ids.next(), this.id.getValue(), now.toISOString(),
      new BookingPlacedDED(this.id.getValue(), this.userId, this.resourceId, this.range.getStart().toISOString(), this.range.getEnd().toISOString())), "placed");
  }
  /** @param actorId - Authenticated caller. @param admin - Current privilege. @param ids - Event UUID source. @param now - Cancellation clock. @throws ARoomBookException If ownership, cutoff or transition rejects. */
  public cancel(actorId: string, admin: boolean, ids: IBookingIdFactory, now: Date): void {
    new CancelBookingDPolicy().assert(this.userId, actorId, admin, this.status, this.range.getStart(), now);
    this.transition(BookingStatus.Cancelled, ids, now);
    this.triggerEvent(new BookingCancelledDE(ids.next(), this.id.getValue(), now.toISOString(),
      new BookingCancelledDED(this.id.getValue(), actorId)), "cancelled");
  }
  /** @returns Observed interval revision. */
  public getRevision(): number { return this.revision; }
  /** @param actorId - Session identity. @param admin - Current role. @param expected - Observed revision. @param range - Target interval. @param resource - Current creation decision. @param occupied - Other active intervals. @param ids - Event IDs. @param now - Clock. @throws ARoomBookException On denied, stale, cutoff or invalid target. */
  public reschedule(actorId:string, admin:boolean, expected:number, range:TimeRangeVO, resource:BookableResource, occupied:readonly TimeRangeVO[], ids:IBookingIdFactory, now:Date): void {
    new CancelBookingDPolicy().assert(this.userId,actorId,admin,this.status,this.range.getStart(),now);
    if (this.range.getStart().getTime() <= now.getTime()) throw new BookingInPastException();
    if (!admin && this.range.getStart().getTime()-now.getTime()<2*3600_000) throw new CancellationWindowExpiredException();
    if (!Number.isSafeInteger(expected) || expected < 0 || expected !== this.revision) throw new BookingConflictException();
    new CreateBookingDPolicy().assert(resource,range,occupied,now);
    const old = this.range; this.range = range; this.revision++;
    this.triggerEvent(new BookingRescheduledDE(ids.next(),this.id.getValue(),now.toISOString(),new BookingRescheduledDED(this.id.getValue(),old.getStart().toISOString(),old.getEnd().toISOString(),range.getStart().toISOString(),range.getEnd().toISOString())),"rescheduled:"+this.revision);
  }
  /** @param now - Scheduler clock. @returns Whether a confirmed ended reservation completed. */
  public complete(now: Date): boolean {
    if (this.status !== BookingStatus.Confirmed || this.range.getEnd().getTime() > now.getTime()) return false;
    this.status = BookingStatus.Completed; return true;
  }
  private transition(next: BookingStatus, ids: IBookingIdFactory, now: Date): void {
    const old = this.status; this.status = next;
    this.triggerEvent(new BookingStatusChangedDE(ids.next(), this.id.getValue(), now.toISOString(),
      new BookingStatusChangedDED(this.id.getValue(), old, next)), old + ":" + next);
  }
  /** @returns Immutable booking identity. */
  public getId(): BookingIdVO { return this.id; }
  /** @returns Immutable owner reference. */
  public getUserId(): string { return this.userId; }
  /** @returns Immutable resource reference. */
  public getResourceId(): string { return this.resourceId; }
  /** @returns Current immutable interval value (replaced atomically during rescheduling). */
  public getRange(): TimeRangeVO { return this.range; }
  /** @returns Current lifecycle state. */
  public getStatus(): BookingStatus { return this.status; }
  /** @returns Original canonical timestamp. */
  public getCreatedAt(): string { return this.createdAt; }
}
