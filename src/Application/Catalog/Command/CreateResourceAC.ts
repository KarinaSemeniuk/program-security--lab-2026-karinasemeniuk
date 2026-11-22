import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Typed CreateResourceAC intent; actor comes only from session resolution. */
export class CreateResourceAC {
  /** @param actor - Validated request value or authenticated actor. @param name - Validated request value or authenticated actor. @param capacity - Validated request value or authenticated actor. @param details - Optional validated resource description. @param minSlotMinutes - Validated request value or authenticated actor. */
  public constructor(public readonly actor: UserDTO, public readonly name: string, public readonly capacity: number, public readonly minSlotMinutes: number, public readonly details?: ResourceDetailsVO) {}
}
