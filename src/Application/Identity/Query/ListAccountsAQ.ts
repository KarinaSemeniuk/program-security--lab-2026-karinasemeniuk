import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Admin-only bounded account directory query. */
export class ListAccountsAQ {
  /** @param actor - Session identity. @param page - Zero-based page. @param search - Email search. */
  public constructor(public readonly actor:UserDTO,public readonly page:number,public readonly search:string) {}
}
