/** Transient authentication intent; never log this object. */
export class SignInUserAC {
  /** @param email - Transient submitted value. @param password - Transient submitted value. @param previousToken - Transient submitted value. */
  public constructor(public readonly email: string, public readonly password: string, public readonly previousToken: string) {}
}
