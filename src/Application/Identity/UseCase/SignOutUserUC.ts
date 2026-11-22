import { ITokenService } from "#domain/Identity/OutsourceContract/ITokenService";
import { ISessionRepository } from "#domain/Identity/OutsourceContract/ISessionRepository";
import { UnauthenticatedException } from "#domain/Identity/Exception/UnauthenticatedException";
import { SignOutUserAC } from "#application/Identity/Command/SignOutUserAC";
/** Idempotent logout; a database failure must never masquerade as successful revocation. */
export class SignOutUserUC {
  /** @param tokens - JWT verification. @param sessions - Durable revocation. */
  public constructor(private readonly tokens: ITokenService, private readonly sessions: ISessionRepository) {}
  /** @param command - Current cookie. @throws ARoomBookException If revocation cannot be persisted. */
  public async execute(command: SignOutUserAC): Promise<void> {
    try { await this.sessions.revoke(this.tokens.verify(command.token)); }
    catch (error: unknown) { if (!(error instanceof UnauthenticatedException)) throw error; }
  }
}
