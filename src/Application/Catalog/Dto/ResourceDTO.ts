import { Resource } from "#domain/Catalog/Entity/Resource";
/** Safe public resource projection. */
export class ResourceDTO {
  /** Resource-local IANA zone. */
  public readonly timeZone: string;
  /** Sunday-first opening windows. */
  public readonly weekly: {open:number;close:number}[];
  /** Resource-local closed dates. */
  public readonly closedDates: string[];
  /** Resource kind. */
  public readonly type: string;
  /** Plain-text description. */
  public readonly description: string;
  /** Plain-text location. */
  public readonly location: string;
  /** Equipment labels. */
  public readonly equipment: string[];
  /** Optimistic concurrency revision. */
  public readonly revision: number;
  /** Stable ID. */
  public readonly id: string;
  /** Display name. */
  public readonly name: string;
  /** Maximum occupants. */
  public readonly capacity: number;
  /** Minutes per slot. */
  public readonly minSlotMinutes: number;
  /** Activation state. */
  public readonly isActive: boolean;
  /** @param resource - Valid aggregate. */
  public constructor(resource: Resource) {
    this.timeZone = resource.getCalendar().getTimeZone(); this.weekly = resource.getCalendar().getWeekly(); this.closedDates = resource.getCalendar().getClosedDates();
    const details = resource.getDetails(); this.type = details.getType(); this.description = details.getDescription(); this.location = details.getLocation(); this.equipment = details.getEquipment(); this.revision = resource.getRevision();
    this.id = resource.getId().getValue(); this.name = resource.getName(); this.capacity = resource.getCapacity();
    this.minSlotMinutes = resource.getSlot().getValue(); this.isActive = resource.isActive();
  }
}
