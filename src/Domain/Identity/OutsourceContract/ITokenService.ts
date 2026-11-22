import { AccessToken } from "#domain/Identity/Contract/AccessToken";
/** Signed access token capability. */
export interface ITokenService {
  /** @param userId - Account UUID. @param role - Current system role. @returns Token and verified metadata. @throws ARoomBookException If signing fails. */
  issue(userId: string, role: string): { token: string; claims: AccessToken };
  /** @param token - Untrusted compact JWT. @returns Verified claims. @throws UnauthenticatedException For invalid or expired tokens. */
  verify(token: string): AccessToken;
}
