/** Sensitive credentials accepted by the public registration boundary. */
export interface IRegistrationCredentials {
  /** Submitted account identifier. */
  readonly email: string;
  /** Exact password, sent only on explicit registration submission. */
  readonly password: string;
}
