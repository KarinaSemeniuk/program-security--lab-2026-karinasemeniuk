import { ICurrentUser } from "#ui-domain/Identity/Contract/ICurrentUser";
/** Expected session outcomes; transport failures never expose arbitrary response text. */
export type SessionOutcome =
  | { status: "authenticated"; user: ICurrentUser }
  | { status: "anonymous" }
  | { status: "signedOut" }
  | { status: "failed"; message: string; retryAfterSeconds?: number };
