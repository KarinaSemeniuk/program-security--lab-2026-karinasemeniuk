import { account } from "../../../fixtures/account";
import { AuthenticateUserService } from "#domain/Identity/Service/AuthenticateUserService";
import { User } from "#domain/Identity/Entity/User";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { UserRoleVO } from "#domain/Identity/ValueObject/UserRoleVO";
import { UserRole } from "#domain/Identity/Enum/UserRole";
import { InvalidCredentialsException } from "#domain/Identity/Exception/InvalidCredentialsException";

describe("AuthenticateUserService", () => {
  const findByEmail = jest.fn();
  const verify = jest.fn();
  const service = new AuthenticateUserService({ findByEmail, findById: jest.fn() }, { verify });
  beforeEach(() => { findByEmail.mockReset().mockResolvedValue(account()); verify.mockReset().mockResolvedValue(true); });
  it("normalizes email while preserving password bytes", async () => {
    const password = " Тиха кімната для ідей ";
    expect(await service.authenticate(" USER@example.test ", password)).toBeInstanceOf(User);
    expect(findByEmail).toHaveBeenCalledWith("user@example.test");
    expect(verify).toHaveBeenCalledWith(password, account().getPasswordHash().getValue());
  });
  it("uses a dummy comparison for missing accounts", async () => {
    findByEmail.mockResolvedValue(undefined);
    await expect(service.authenticate("missing@example.test", "long password here")).rejects.toThrow(InvalidCredentialsException);
    expect(verify).toHaveBeenCalledWith("long password here", "");
  });
  it("does not reveal blocked accounts or wrong passwords", async () => {
    findByEmail.mockResolvedValue(account(true));
    await expect(service.authenticate("user@example.test", "long password here")).rejects.toThrow(InvalidCredentialsException);
    expect(verify).toHaveBeenCalledTimes(1);
    findByEmail.mockResolvedValue(account()); verify.mockResolvedValue(false);
    await expect(service.authenticate("user@example.test", "wrong password here")).rejects.toThrow(InvalidCredentialsException);
  });
  it("maps malformed addresses to the same comparison path", async () => {
    await expect(service.authenticate("invalid", "long password here")).rejects.toThrow(InvalidCredentialsException);
    expect(findByEmail).not.toHaveBeenCalled(); expect(verify).toHaveBeenCalledWith("long password here", "");
  });
  it.each(["", "a".repeat(73), "ї".repeat(37), "a\ud800", "a\udfff"])("rejects passwords unsafe for bcrypt", async password => {
    await expect(service.authenticate("user@example.test", password)).rejects.toThrow(InvalidCredentialsException);
  });
  it("propagates persistence failure instead of calling it invalid credentials", async () => {
    findByEmail.mockRejectedValue(new Error("private"));
    await expect(service.authenticate("user@example.test", "long password here")).rejects.toThrow("private");
    expect(verify).not.toHaveBeenCalled();
  });
});
