/** Public account data returned after successful registration. */
export interface IRegisteredAccount {
  /** UUID allocated by the backend. */
  readonly id: string;
  /** Canonical email returned by the backend. */
  readonly email: string;
  /** Public registration always produces a standard user. */
  readonly role: "USER";
  /** ISO timestamp returned by the backend. */
  readonly createdAt: string;
}
