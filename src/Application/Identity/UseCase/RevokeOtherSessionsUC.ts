import { RevokeOtherSessionsAC } from "#application/Identity/Command/RevokeOtherSessionsAC";
import { IAccountManagementRepository } from "#domain/Identity/OutsourceContract/IAccountManagementRepository";
import { ITokenService } from "#domain/Identity/OutsourceContract/ITokenService";
/** Revokes other device sessions while retaining only the current verified identifier. */
export class RevokeOtherSessionsUC {
  /** @param accounts - Session mutation. @param tokens - Verified current identity; EntryPoint also resolves current active account. */
  public constructor(private readonly accounts:IAccountManagementRepository,private readonly tokens:ITokenService) {}
  /** @param command - Current authenticated cookie. @returns Revoked count. @throws ARoomBookException On invalid token or storage failure. */
  public execute(command:RevokeOtherSessionsAC) { const claims=this.tokens.verify(command.token); return this.accounts.revokeOthers(claims.userId,claims.sessionId); }
}
