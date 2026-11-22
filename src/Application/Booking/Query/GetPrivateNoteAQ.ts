import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Owner-only GetPrivateNoteAQ intent. Never log credential/note objects. */
export class GetPrivateNoteAQ {
  /** @param actor - Server actor or submitted note reference/value. @param bookingId - Server actor or submitted note reference/value. */
  public constructor(public readonly actor: UserDTO, public readonly bookingId: string) {}
}
