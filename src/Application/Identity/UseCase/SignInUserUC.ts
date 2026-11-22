import { AuthenticateUserService } from "#domain/Identity/Service/AuthenticateUserService";
import { ITokenService } from "#domain/Identity/OutsourceContract/ITokenService";
import { ISessionRepository } from "#domain/Identity/OutsourceContract/ISessionRepository";
import { SignInUserAC } from "#application/Identity/Command/SignInUserAC";
import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { UnauthenticatedException } from "#domain/Identity/Exception/UnauthenticatedException";
/** Coordinates credentials, token issuance and durable session registration. */
export class SignInUserUC {
  /** @param authentication - Credential rules. @param tokens - JWT adapter. @param sessions - Shared active sessions. */
  public constructor(private readonly authentication: AuthenticateUserService, private readonly tokens: ITokenService, private readonly sessions: ISessionRepository) {}
  /** @param command - Exact credentials and previous cookie. @returns Safe user and transport credential. @throws ARoomBookException On rejected credentials or adapter failure. */
  public async execute(command: SignInUserAC): Promise<{ user: UserDTO; token: string }> {
    const user = await this.authentication.authenticate(command.email, command.password);
    if (command.previousToken) {
      try { await this.sessions.revoke(this.tokens.verify(command.previousToken)); }
      catch (error: unknown) { if (!(error instanceof UnauthenticatedException)) throw error; }
    }
    const issued = this.tokens.issue(user.getId().getValue(), user.getRole().getValue());
    await this.sessions.create(issued.claims);
    if (!await this.authentication.isCurrent(user)) { await this.sessions.revoke(issued.claims); throw new UnauthenticatedException(); }
    return { user: new UserDTO(user), token: issued.token };
  }
}
