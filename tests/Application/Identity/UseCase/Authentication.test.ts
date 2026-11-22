import { account } from "../../../fixtures/account";
import { AuthenticateUserService } from "#domain/Identity/Service/AuthenticateUserService";
import { JwtTokenService } from "#infrastructure/Auth/JwtTokenService";
import { SignInUserUC } from "#application/Identity/UseCase/SignInUserUC";
import { GetCurrentUserUC } from "#application/Identity/UseCase/GetCurrentUserUC";
import { SignOutUserUC } from "#application/Identity/UseCase/SignOutUserUC";
import { SignInUserAC } from "#application/Identity/Command/SignInUserAC";
import { SignOutUserAC } from "#application/Identity/Command/SignOutUserAC";
import { GetCurrentUserAQ } from "#application/Identity/Query/GetCurrentUserAQ";
import { AccessToken } from "#domain/Identity/Contract/AccessToken";
import { UnauthenticatedException } from "#domain/Identity/Exception/UnauthenticatedException";

describe("authentication lifecycle", () => {
  const tokens = new JwtTokenService("ab".repeat(32));
  const active = new Map<string, AccessToken>();
  const sessions = {
    create: jest.fn(async (claims: AccessToken) => { active.set(claims.sessionId, claims); }),
    isActive: jest.fn(async (claims: AccessToken) => active.has(claims.sessionId)),
    revoke: jest.fn(async (claims: AccessToken) => { active.delete(claims.sessionId); }),
  };
  const users = { findByEmail: jest.fn(), findById: jest.fn() };
  const login = new SignInUserUC(new AuthenticateUserService(users, { verify: async () => true }), tokens, sessions);
  const me = new GetCurrentUserUC(users, tokens, sessions);
  const logout = new SignOutUserUC(tokens, sessions);
  const command = (previous = ""): SignInUserAC => new SignInUserAC("user@example.test", "long password here", previous);
  beforeEach(() => { active.clear(); users.findByEmail.mockResolvedValue(account()); users.findById.mockResolvedValue(account()); });
  it("returns only safe profile fields, then denies replay after logout", async () => {
    const result = await login.execute(command());
    const profile = await me.execute(new GetCurrentUserAQ(result.token));
    expect(Object.keys(profile).sort()).toEqual(["createdAt", "email", "id", "role"]);
    await logout.execute(new SignOutUserAC(result.token));
    await expect(me.execute(new GetCurrentUserAQ(result.token))).rejects.toThrow(UnauthenticatedException);
    await expect(logout.execute(new SignOutUserAC(result.token))).resolves.toBeUndefined();
  });
  it("rotates the previous cookie but preserves another device session", async () => {
    const old = await login.execute(command()); const other = await login.execute(command());
    const rotated = await login.execute(command(old.token));
    await expect(me.execute(new GetCurrentUserAQ(old.token))).rejects.toThrow(UnauthenticatedException);
    await expect(me.execute(new GetCurrentUserAQ(other.token))).resolves.toBeDefined();
    await expect(me.execute(new GetCurrentUserAQ(rotated.token))).resolves.toBeDefined();
  });
  it("rejects blocked and deleted accounts on existing sessions", async () => {
    const result = await login.execute(command());
    users.findById.mockResolvedValue(account(true));
    await expect(me.execute(new GetCurrentUserAQ(result.token))).rejects.toThrow(UnauthenticatedException);
    users.findById.mockResolvedValue(undefined);
    await expect(me.execute(new GetCurrentUserAQ(result.token))).rejects.toThrow(UnauthenticatedException);
  });
  it("revokes a just-created session if credentials change after bcrypt verification",async()=>{
    users.findById.mockResolvedValue(undefined);
    await expect(login.execute(command())).rejects.toThrow(UnauthenticatedException);
    expect(active.size).toBe(0);
  });
  it("allows idempotent logout without a valid cookie", async () => {
    await expect(logout.execute(new SignOutUserAC(""))).resolves.toBeUndefined();
    await expect(logout.execute(new SignOutUserAC("malformed"))).resolves.toBeUndefined();
  });
  it("fails logout if PostgreSQL revocation fails", async () => {
    const result = await login.execute(command());
    sessions.revoke.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(logout.execute(new SignOutUserAC(result.token))).rejects.toThrow("database unavailable");
    await expect(me.execute(new GetCurrentUserAQ(result.token))).resolves.toBeDefined();
  });
  it("never returns a credential if session persistence fails", async () => {
    sessions.create.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(login.execute(command())).rejects.toThrow("database unavailable");
  });
});
