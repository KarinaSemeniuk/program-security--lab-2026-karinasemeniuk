import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Owner-only SavePrivateNoteAC intent. Never log credential/note objects. */
export class SavePrivateNoteAC {
  /** @param actor - Server actor or submitted note reference/value. @param bookingId - Server actor or submitted note reference/value. @param text - Server actor or submitted note reference/value. @param revision - Server actor or submitted note reference/value. */
  public constructor(public readonly actor: UserDTO, public readonly bookingId: string, public readonly text: string, public readonly revision: number) {}
}
