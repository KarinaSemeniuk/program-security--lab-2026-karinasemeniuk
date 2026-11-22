import { Resource } from "#domain/Catalog/Entity/Resource";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { SlotDurationVO } from "#domain/Catalog/ValueObject/SlotDurationVO";
/** Applies public resource creation defaults and display-name normalization. */
export class CreateResourceService {
  /** @param id - New UUID. @param name - Submitted label. @param capacity - Capacity. @param minutes - Slot length. @returns Active validated resource. @throws ARoomBookException On invalid configuration. */
  public create(id: ResourceIdVO, name: string, capacity: number, minutes: number): Resource {
    return new Resource(id, name.trim(), capacity, new SlotDurationVO(minutes));
  }
}
