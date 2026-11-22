import { SessionOutcome } from "#ui-domain/Identity/Contract/SessionOutcome";
/** Browser session transport with opaque HttpOnly credentials. */
export interface ISessionGateway {
  /** @param email - Submitted address. @param password - Exact submitted secret. @returns Safe login outcome. */
  signIn(email: string, password: string): Promise<SessionOutcome>;
  /** @returns Current account or anonymous state. */
  current(): Promise<SessionOutcome>;
  /** @returns Confirmed logout or actionable failure. */
  signOut(): Promise<SessionOutcome>;
}
