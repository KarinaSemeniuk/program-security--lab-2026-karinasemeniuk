import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Typed ListMyBookingsAQ intent; actor comes only from session resolution. */
export class ListMyBookingsAQ {
  /** @param actor - Validated request value or authenticated actor. @param filter - all/upcoming/past/cancelled projection. @param page - Validated request value or authenticated actor. */
  public constructor(public readonly actor: UserDTO, public readonly page: number, public readonly filter = "all") {}
}
