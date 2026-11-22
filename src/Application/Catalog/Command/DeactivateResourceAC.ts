import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Typed DeactivateResourceAC intent; actor comes only from session resolution. */
export class DeactivateResourceAC {
  /** @param actor - Validated request value or authenticated actor. @param resourceId - Validated request value or authenticated actor. */
  public constructor(public readonly actor: UserDTO, public readonly resourceId: string) {}
}
