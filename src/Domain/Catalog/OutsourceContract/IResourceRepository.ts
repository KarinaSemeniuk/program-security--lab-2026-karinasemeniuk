import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
import { Resource } from "#domain/Catalog/Entity/Resource";
/** Catalog persistence without ORM types. */
export interface IResourceRepository {
  /** @param includeInactive - Admin-only projection. @returns Resources ordered by name. @throws ARoomBookException On storage failure. */
  list(includeInactive: boolean): Promise<Resource[]>;
  /** @param id - UUID. @returns Resource or explicit absence. @throws ARoomBookException On read failure. */
  find(id: string): Promise<Resource | undefined>;
  /** @param name - Valid display name. @param capacity - Capacity. @param details - Optional validated resource description. @param minSlotMinutes - Slot length. @returns Persisted valid aggregate. @throws ARoomBookException On invalid input/storage failure. */
  create(name: string, capacity: number, minSlotMinutes: number, details?: ResourceDetailsVO): Promise<Resource>;
  /** @param id - Resource UUID. @returns Deactivated resource. @throws ARoomBookException On missing resource/storage failure. */
  deactivate(id: string): Promise<Resource>;
}
