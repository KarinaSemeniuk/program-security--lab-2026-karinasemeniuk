import { ISessionGateway } from "#ui-domain/Identity/OutsourceContract/ISessionGateway";
import { SessionOutcome } from "#ui-domain/Identity/Contract/SessionOutcome";
/** Coordinates session intents independently from React and HTTP. */
export class SessionUC {
  /** @param gateway - Browser transport composed by Framework. */
  public constructor(private readonly gateway: ISessionGateway) {}
  /** @param email - Submitted address. @param password - Exact password. @returns Safe session outcome. */
  public signIn(email: string, password: string): Promise<SessionOutcome> {
    if (!email.trim() || !password) return Promise.resolve({ status: "failed", message: "Введіть email і пароль." });
    return this.gateway.signIn(email, password);
  }
  /** @returns Server-confirmed account state. */
  public current(): Promise<SessionOutcome> { return this.gateway.current(); }
  /** @returns Server-confirmed logout result. */
  public signOut(): Promise<SessionOutcome> { return this.gateway.signOut(); }
}
