import { IAuthenticationRepository } from "#domain/Identity/OutsourceContract/IAuthenticationRepository";
import { ITokenService } from "#domain/Identity/OutsourceContract/ITokenService";
import { ISessionRepository } from "#domain/Identity/OutsourceContract/ISessionRepository";
import { UnauthenticatedException } from "#domain/Identity/Exception/UnauthenticatedException";
import { GetCurrentUserAQ } from "#application/Identity/Query/GetCurrentUserAQ";
import { UserDTO } from "#application/Identity/Dto/UserDTO";
/** Resolves current account state on every protected request. */
export class GetCurrentUserUC {
  /** @param users - Current accounts. @param tokens - JWT verification. @param sessions - Shared revocation state. */
  public constructor(private readonly users: IAuthenticationRepository, private readonly tokens: ITokenService, private readonly sessions: ISessionRepository) {}
  /** @param query - Cookie credential. @returns Public active account. @throws UnauthenticatedException For missing, expired, revoked or blocked access. @throws ARoomBookException On adapter failure. */
  public async execute(query: GetCurrentUserAQ): Promise<UserDTO> {
    const claims = this.tokens.verify(query.token);
    if (!await this.sessions.isActive(claims)) throw new UnauthenticatedException();
    const user = await this.users.findById(claims.userId);
    if (!user || user.isBlocked()) throw new UnauthenticatedException();
    return new UserDTO(user);
  }
}
