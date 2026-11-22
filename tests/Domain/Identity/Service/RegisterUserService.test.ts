import { InvalidEmailException } from "#domain/Identity/Exception/InvalidEmailException";
import { PasswordTooShortException } from "#domain/Identity/Exception/PasswordTooShortException";
import { PasswordTooLongException } from "#domain/Identity/Exception/PasswordTooLongException";
import { PasswordBlocklistedException } from "#domain/Identity/Exception/PasswordBlocklistedException";
import { InvalidPasswordUnicodeException } from "#domain/Identity/Exception/InvalidPasswordUnicodeException";
import { EmailAlreadyRegisteredException } from "#domain/Identity/Exception/EmailAlreadyRegisteredException";

import { RegisterUserService } from "#domain/Identity/Service/RegisterUserService";
import { PasswordPolicyService } from "#domain/Identity/Service/PasswordPolicyService";
import { IUserRepository } from "#domain/Identity/OutsourceContract/IUserRepository";
import { IPasswordHasher } from "#domain/Identity/OutsourceContract/IPasswordHasher";
import { IUserIdFactory } from "#domain/Identity/OutsourceContract/IUserIdFactory";
import { User } from "#domain/Identity/Entity/User";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { UserRole } from "#domain/Identity/Enum/UserRole";
import { PasswordHashingException } from "#infrastructure/Exception/PasswordHashingException";

describe("domain", () => {
  describe("identity.domain", () => {
    describe("identity.domain.service", () => {
      describe("RegisterUserService", () => {
        let users: jest.Mocked<IUserRepository>;
        let hasher: jest.Mocked<IPasswordHasher>;
        let ids: jest.Mocked<IUserIdFactory>;
        let registration: RegisterUserService;
        const hash = new PasswordHashVO("$2b$12$" + "a".repeat(53));
        const id = new UserIdVO("11111111-1111-4111-8111-111111111111");
        beforeEach(() => {
          users = {
            existsByEmail: jest.fn<Promise<boolean>, [EmailVO]>().mockResolvedValue(false),
            save: jest.fn<Promise<void>, [User]>().mockResolvedValue(undefined),
          };
          hasher = { hash: jest.fn<Promise<PasswordHashVO>, [string]>().mockResolvedValue(hash) };
          ids = { create: jest.fn<UserIdVO, []>().mockReturnValue(id) };
          registration = new RegisterUserService(users, hasher, ids,
            new PasswordPolicyService(new Set(["passwordpassword"])));
        });
        it("normalizes email and persists an unblocked USER with protected credentials", async () => {
          const user = await registration.register(" USER@Example.TEST ", "cedar river fog");
          expect(users.existsByEmail.mock.calls[0]?.[0].getValue()).toBe("user@example.test");
          expect(users.save).toHaveBeenCalledWith(user);
          expect(user.getId()).toBe(id);
          expect(user.getEmail().getValue()).toBe("user@example.test");
          expect(user.getPasswordHash()).toBe(hash);
          expect(user.getRole().getValue()).toBe(UserRole.User);
          expect(user.isBlocked()).toBe(false);
        });
        it("passes the exact password to the protection adapter", async () => {
          await registration.register("user@example.test", " cedar river fo");
          expect(hasher.hash).toHaveBeenCalledWith(" cedar river fo");
        });
        it("rejects invalid email before outward calls", async () => {
          await expect(registration.register("invalid", "cedar river fog")).rejects.toThrow(InvalidEmailException);
          expect(users.existsByEmail).not.toHaveBeenCalled();
          expect(hasher.hash).not.toHaveBeenCalled();
        });
        it.each([
          { value: "short", exception: PasswordTooShortException },
          { value: "x".repeat(73), exception: PasswordTooLongException },
          { value: "passwordpassword", exception: PasswordBlocklistedException },
          { value: "cedar river fog\uD800", exception: InvalidPasswordUnicodeException },
        ])("rejects unacceptable passwords before outward calls", async ({ value, exception }) => {
          await expect(registration.register("user@example.test", value)).rejects.toThrow(exception);
          expect(users.existsByEmail).not.toHaveBeenCalled();
          expect(hasher.hash).not.toHaveBeenCalled();
          expect(users.save).not.toHaveBeenCalled();
        });
        it("rejects an existing normalized email before hashing", async () => {
          users.existsByEmail.mockResolvedValue(true);
          await expect(registration.register("USER@example.test", "cedar river fog"))
            .rejects.toThrow(EmailAlreadyRegisteredException);
          expect(hasher.hash).not.toHaveBeenCalled();
          expect(users.save).not.toHaveBeenCalled();
        });
        it("preserves the unique-index rejection from a concurrent registration", async () => {
          users.save.mockRejectedValue(new EmailAlreadyRegisteredException());
          await expect(registration.register("user@example.test", "cedar river fog"))
            .rejects.toThrow(EmailAlreadyRegisteredException);
        });
        it("preserves a project adapter failure and never persists credentials after it", async () => {
          hasher.hash.mockRejectedValue(new PasswordHashingException());
          await expect(registration.register("user@example.test", "cedar river fog"))
            .rejects.toThrow(PasswordHashingException);
          expect(users.save).not.toHaveBeenCalled();
        });
      });
    });
  });
});
