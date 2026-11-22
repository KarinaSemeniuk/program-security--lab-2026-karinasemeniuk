/** Transient registration intent; contains sensitive input and must not be logged. */
export class RegisterUserAC {
  /** Email submitted for account creation. */
  public readonly email: string;
  /** Exact password, retained only while registration executes. */
  public readonly password: string;

  /**
   * Carries validated transport types to the registration use case.
   * @param email - Submitted account identifier.
   * @param password - Submitted sensitive password value.
   */
  public constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }
}
