import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Typed ListAllResourcesAQ intent; actor comes only from session resolution. */
export class ListAllResourcesAQ {
  /** @param actor - Validated request value or authenticated actor. */
  public constructor(public readonly actor: UserDTO) {}
}
