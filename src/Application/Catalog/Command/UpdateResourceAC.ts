import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
/** Authenticated update intent with observed version. */
export class UpdateResourceAC {
  /** @param actor - Session identity. @param resourceId - Resource UUID. @param revision - Observed version. @param name - Label. @param capacity - Occupants. @param details - Validated metadata. */
  public constructor(public readonly actor: UserDTO, public readonly resourceId: string, public readonly name: string, public readonly capacity: number, public readonly details: ResourceDetailsVO, public readonly revision: number) {}
}
