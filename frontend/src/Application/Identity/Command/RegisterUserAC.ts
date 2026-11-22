/** Transient form intent; credentials are never persisted or logged. */
export class RegisterUserAC {
  /** Email supplied by the form. */
  public readonly email: string;
  /** Exact registration password. */
  public readonly password: string;
  /** Exact confirmation checked locally and excluded from the API payload. */
  public readonly confirmation: string;

  /**
   * Captures one explicit registration submission.
   * @param email - Submitted account identifier.
   * @param password - Sensitive password value.
   * @param confirmation - Sensitive confirmation value.
   */
  public constructor(email: string, password: string, confirmation: string) {
    this.email = email;
    this.password = password;
    this.confirmation = confirmation;
  }
}
