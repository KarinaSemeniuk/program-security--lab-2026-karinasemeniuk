import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { ResourceCalendarVO } from "#domain/Catalog/ValueObject/ResourceCalendarVO";
/** Authenticated reactivate intent with observed version. */
export class SetResourceCalendarAC {
  /** @param actor - Session identity. @param resourceId - Resource UUID. @param calendar - Valid opening rules. @param revision - Observed version.  */
  public constructor(public readonly actor: UserDTO, public readonly resourceId: string, public readonly calendar: ResourceCalendarVO, public readonly revision: number) {}
}
