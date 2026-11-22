import { User } from "#domain/Identity/Entity/User";
/** Account lookups for authentication; absence is explicit through an optional result. */
export interface IAuthenticationRepository {
  /** @param email - Canonical address. @returns Account or absence. @throws ARoomBookException On persistence failure. */
  findByEmail(email: string): Promise<User | undefined>;
  /** @param id - Account UUID. @returns Account or absence. @throws ARoomBookException On persistence failure. */
  findById(id: string): Promise<User | undefined>;
}
