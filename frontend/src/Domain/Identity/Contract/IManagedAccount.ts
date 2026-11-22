/** Safe Admin-only account directory entry; contains no credentials. */
export interface IManagedAccount {
  /** UUID. */
  id:string;
  /** Canonical email. */
  email:string;
  /** Current role. */
  role:"USER"|"ADMIN";
  /** Access state. */
  isBlocked:boolean;
  /** ISO creation time. */
  createdAt:string;
}
