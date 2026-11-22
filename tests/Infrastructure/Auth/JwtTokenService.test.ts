import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { JwtTokenService } from "#infrastructure/Auth/JwtTokenService";
import { UnauthenticatedException } from "#domain/Identity/Exception/UnauthenticatedException";
import { InvalidConfigurationException } from "#domain/SharedKernel/Exception/InvalidConfigurationException";

describe("JwtTokenService", () => {
  const secret = "a1".repeat(32);
  const service = new JwtTokenService(secret);
  const id = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  function sign(overrides: object = {}, options: jwt.SignOptions = {}): string {
    const payload = Object.fromEntries(Object.entries({ sub: id, jti: randomUUID(), role: "USER", iat: now, exp: now + 900, ...overrides }).filter(([, value]) => value !== undefined));
    return jwt.sign(payload, secret,
      { algorithm: "HS256", issuer: "roombook", audience: "roombook-web", ...options });
  }
  it("issues distinct sessions with exact expiry, issuer and audience", () => {
    const one = service.issue(id, "USER");
    const two = service.issue(id, "USER");
    expect(service.verify(one.token)).toEqual(one.claims);
    expect(two.claims.sessionId).not.toBe(one.claims.sessionId);
    expect(jwt.decode(one.token)).toMatchObject({ sub: id, role: "USER", iss: "roombook", aud: "roombook-web" });
  });
  it.each(["", "weak", "x".repeat(64)])("rejects weak configuration", secret => {
    expect(() => new JwtTokenService(secret)).toThrow(InvalidConfigurationException);
  });
  it.each(["", "invalid", "a".repeat(2049)])("rejects malformed tokens", token => {
    expect(() => service.verify(token)).toThrow(UnauthenticatedException);
  });
  it.each([
    [{ exp: now - 1, iat: now - 901 }, {}],
    [{ exp: now + 901 }, {}],
    [{ sub: "invalid" }, {}],
    [{ jti: "invalid" }, {}],
    [{ exp: undefined }, {}],
    [{ iat: now + 60, exp: now + 960 }, {}],
    [{}, { issuer: "other" }],
    [{}, { audience: "other" }],
    [{}, { algorithm: "HS384" }],
  ] as [object, jwt.SignOptions][]) ("rejects unsafe claims or profile %p", (claims, options) => {
    expect(() => service.verify(sign(claims, options))).toThrow(UnauthenticatedException);
  });
  it("rejects altered signatures and unsigned tokens", () => {
    const token = sign();
    expect(() => service.verify(token.slice(0, -5) + "aaaaa")).toThrow(UnauthenticatedException);
    const unsigned = token.split(".").slice(0, 2).join(".") + ".";
    expect(() => service.verify(unsigned)).toThrow(UnauthenticatedException);
    expect(() => new JwtTokenService("b2".repeat(32)).verify(token)).toThrow(UnauthenticatedException);
  });
});
