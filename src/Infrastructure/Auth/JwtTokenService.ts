import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { ITokenService } from "#domain/Identity/OutsourceContract/ITokenService";
import { AccessToken } from "#domain/Identity/Contract/AccessToken";
import { UnauthenticatedException } from "#domain/Identity/Exception/UnauthenticatedException";
import { InvalidConfigurationException } from "#domain/SharedKernel/Exception/InvalidConfigurationException";
import { HttpRequestHandlingException } from "#domain/SharedKernel/Exception/HttpRequestHandlingException";
/** Fixed HS256 JWT profile; no algorithm negotiation or client-selected keys. */
export class JwtTokenService implements ITokenService {
  /** @param secret - Random hex-encoded 256-bit or longer signing key. @throws InvalidConfigurationException For weak/missing configuration. */
  public constructor(private readonly secret: string) {
    if (!/^[a-f0-9]{64,}$/i.test(secret)) throw new InvalidConfigurationException();
  }
  /** @param userId - Account UUID. @param role - Current role. @returns Token and session claims. @throws HttpRequestHandlingException On signing failure. */
  public issue(userId: string, role: string): { token: string; claims: AccessToken } {
    try {
      const sessionId = randomUUID();
      const now = Math.floor(Date.now() / 1000);
      const token = jwt.sign({ sub: userId, role, jti: sessionId, iat: now, exp: now + 900 }, this.secret,
        { algorithm: "HS256", issuer: "roombook", audience: "roombook-web" });
      return { token, claims: { userId, sessionId, expiresAt: new Date((now + 900) * 1000) } };
    } catch { throw new HttpRequestHandlingException(); }
  }
  /** @param token - Untrusted JWT. @returns Validated claims. @throws UnauthenticatedException If any verification fails. */
  public verify(token: string): AccessToken {
    try {
      if (token.length > 2048) throw new UnauthenticatedException();
      const claims = jwt.verify(token, this.secret, { algorithms: ["HS256"], issuer: "roombook", audience: "roombook-web" });
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (typeof claims === "string" || typeof claims.sub !== "string" || !uuid.test(claims.sub) ||
          typeof claims.jti !== "string" || !uuid.test(claims.jti) || !Number.isInteger(claims.exp) ||
          !Number.isInteger(claims.iat) || claims.exp! - claims.iat! !== 900 || claims.iat! > Date.now() / 1000 + 5) {
        throw new UnauthenticatedException();
      }
      return { userId: claims.sub, sessionId: claims.jti, expiresAt: new Date(claims.exp! * 1000) };
    } catch { throw new UnauthenticatedException(); }
  }
}
