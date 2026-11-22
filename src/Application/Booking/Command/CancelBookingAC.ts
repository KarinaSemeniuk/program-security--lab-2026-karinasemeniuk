import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Typed CancelBookingAC intent; actor comes only from session resolution. */
export class CancelBookingAC {
  /** @param actor - Validated request value or authenticated actor. @param bookingId - Validated request value or authenticated actor. */
  public constructor(public readonly actor: UserDTO, public readonly bookingId: string) {}
}
