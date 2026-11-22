/** Safe current account; roles are assigned only by the server. */
export interface ICurrentUser {
  /** Account UUID. */
  readonly id: string;
  /** Canonical address. */
  readonly email: string;
  /** Current server role. */
  readonly role: "USER" | "ADMIN";
  /** ISO creation timestamp. */
  readonly createdAt: string;
}
