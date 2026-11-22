import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Current Admin identity and exact target state; no role-changing command exists. */
export class SetAccountBlockedAC {
  /** @param actor - Session identity. @param accountId - Target UUID. @param blocked - Desired block state. */
  public constructor(public readonly actor:UserDTO,public readonly accountId:string,public readonly blocked:boolean) {}
}
