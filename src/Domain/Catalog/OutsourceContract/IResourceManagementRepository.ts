import { Resource } from "#domain/Catalog/Entity/Resource";
import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
/** Atomic version-checked resource management, serialized with placement/deactivation. */
export interface IResourceManagementRepository {
  /** @param id - UUID. @param name - Display name. @param capacity - Occupants. @param details - Validated metadata. @param revision - Observed version. @returns Updated aggregate. @throws ARoomBookException On conflict, missing resource or storage failure. */
  update(id: string, name: string, capacity: number, details: ResourceDetailsVO, revision: number): Promise<Resource>;
  /** @param id - UUID. @param revision - Observed version. @returns Active aggregate. @throws ARoomBookException On conflict, missing resource or storage failure. */
  reactivate(id: string, revision: number): Promise<Resource>;
}
