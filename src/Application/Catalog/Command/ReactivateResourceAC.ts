import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
/** Authenticated reactivate intent with observed version. */
export class ReactivateResourceAC {
  /** @param actor - Session identity. @param resourceId - Resource UUID. @param revision - Observed version.  */
  public constructor(public readonly actor: UserDTO, public readonly resourceId: string, public readonly revision: number) {}
}
