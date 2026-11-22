import { ResourceCalendarVO } from "#domain/Catalog/ValueObject/ResourceCalendarVO";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { SlotDurationVO } from "#domain/Catalog/ValueObject/SlotDurationVO";
import { InvalidResourceException } from "#domain/Catalog/Exception/InvalidResourceException";
import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
import { ResourceConflictException } from "#domain/Catalog/Exception/ResourceConflictException";
import { IEntity } from "#domain/SharedKernel/Contract/IEntity";
/** Bookable resource. Invariants: bounded visible name/capacity, immutable identity and slot size; deactivation preserves history. */
export class Resource implements IEntity<ResourceIdVO> {
  /** @param id - Stable ID. @param name - Resource display name. @param capacity - Positive bounded integer. @param slot - Valid slot duration. @param active - Current availability switch. @param details - Valid descriptive information. @param revision - Nonnegative storage revision. @param calendar - Resource-local opening rules. @throws InvalidResourceException On invalid data. */
  public constructor(private readonly id: ResourceIdVO, private name: string,
    private capacity: number, private readonly slot: SlotDurationVO, private active = true, private details = new ResourceDetailsVO(), private revision = 0, private calendar = new ResourceCalendarVO()) {
    if (name !== name.trim() || !name || [...name].length > 100 || /[\p{Cc}\p{Cs}]/u.test(name) ||
        !Number.isSafeInteger(revision) || revision < 0 || !Number.isInteger(capacity) || capacity < 1 || capacity > 1000) throw new InvalidResourceException();
  }
  /** @returns Immutable resource identity. */
  public getId(): ResourceIdVO { return this.id; }
  /** @returns Display name. */
  public getName(): string { return this.name; }
  /** @returns Resource capacity. */
  public getCapacity(): number { return this.capacity; }
  /** @returns Slot configuration. */
  public getSlot(): SlotDurationVO { return this.slot; }
  /** @returns Whether new bookings are permitted. */
  public isActive(): boolean { return this.active; }
  /** Preserves identity/history while disabling future bookings. */
  public deactivate(): void { if (this.active) { this.active = false; this.revision++; } }
  /** @returns Current immutable opening rules. */
  public getCalendar(): ResourceCalendarVO { return this.calendar; }
  /** @param calendar - Valid opening rules. @param expected - Observed resource revision. @throws ResourceConflictException On stale data. */
  public setCalendar(calendar: ResourceCalendarVO, expected: number): void { this.assertRevision(expected); this.calendar = calendar; this.revision++; }
  /** @returns Immutable descriptive value. */
  public getDetails(): ResourceDetailsVO { return this.details; }
  /** @returns Current optimistic concurrency version. */
  public getRevision(): number { return this.revision; }
  private assertRevision(expected: number): void {
    if (!Number.isSafeInteger(expected) || expected < 0 || expected !== this.revision) throw new ResourceConflictException();
  }
  /** @param name - Display name normalized by trimming before validation. @param capacity - New maximum occupants. @param details - Valid descriptive value. @param expected - Observed revision. @throws ResourceConflictException On stale data. @throws InvalidResourceException On invalid name/capacity. */
  public update(name: string, capacity: number, details: ResourceDetailsVO, expected: number): void {
    this.assertRevision(expected);
    const valid = new Resource(this.id, name.trim(), capacity, this.slot, this.active, details, this.revision);
    this.name = valid.name; this.capacity = valid.capacity; this.details = details; this.revision++;
  }
  /** @param expected - Observed revision. @throws ResourceConflictException On stale data. */
  public reactivate(expected: number): void { this.assertRevision(expected); if (!this.active) { this.active = true; this.revision++; } }
}
