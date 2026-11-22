import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Password replacement contains no client-supplied identity. */
export class ChangePasswordAC {
  /** @param actor - Resolved session account. @param currentPassword - Exact current value. @param newPassword - Exact replacement. */
  public constructor(public readonly actor:UserDTO,public readonly currentPassword:string,public readonly newPassword:string) {}
}
