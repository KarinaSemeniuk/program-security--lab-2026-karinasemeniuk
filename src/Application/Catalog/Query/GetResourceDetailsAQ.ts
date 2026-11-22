import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Resource detail lookup; actor is required only for inactive projection. */
export class GetResourceDetailsAQ {
  /** @param resourceId - UUID. @param actor - Optional session-derived Admin for inactive detail. */
  public constructor(public readonly resourceId: string, public readonly actor?: UserDTO) {}
}
