/** Admin-only account projection, excluding all credentials. */
export interface ManagedAccount {
  /** UUID. */
  readonly id:string;
  /** Canonical account email. */
  readonly email:string;
  /** Current role, not editable over HTTP. */
  readonly role:"USER"|"ADMIN";
  /** Current access block. */
  readonly isBlocked:boolean;
  /** ISO creation time. */
  readonly createdAt:string;
}
