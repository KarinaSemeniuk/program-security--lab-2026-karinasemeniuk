import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Typed CreateBookingAC intent; actor comes only from session resolution. */
export class CreateBookingAC {
  /** @param actor - Validated request value or authenticated actor. @param resourceId - Validated request value or authenticated actor. @param startAt - Validated request value or authenticated actor. @param endAt - Validated request value or authenticated actor. */
  public constructor(public readonly actor: UserDTO, public readonly resourceId: string, public readonly startAt: string, public readonly endAt: string) {}
}
