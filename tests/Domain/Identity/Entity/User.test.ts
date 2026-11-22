import { User } from "#domain/Identity/Entity/User";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { UserRole } from "#domain/Identity/Enum/UserRole";
import { InvalidUserCreationTimeException } from "#domain/Identity/Exception/InvalidUserCreationTimeException";

describe("domain", () => {
  describe("identity.domain", () => {
    describe("User", () => {
      const id = new UserIdVO("11111111-1111-4111-8111-111111111111");
      const email = new EmailVO("user@example.test");
      const hash = new PasswordHashVO("$2b$12$" + "a".repeat(53));
      it("creates only an unblocked USER and retains validated account values", () => {
        const user = User.register(id, email, hash, new Date("2026-10-30T00:00:00Z"));
        expect(user.getId()).toBe(id);
        expect(user.getEmail()).toBe(email);
        expect(user.getPasswordHash()).toBe(hash);
        expect(user.getRole().getValue()).toBe(UserRole.User);
        expect(user.isBlocked()).toBe(false);
      });
      it("protects its timestamp from external mutation", () => {
        const created = new Date("2026-10-30T00:00:00Z");
        const user = User.register(id, email, hash, created);
        created.setFullYear(2000);
        user.getCreatedAt().setFullYear(2001);
        expect(user.getCreatedAt().toISOString()).toBe("2026-10-30T00:00:00.000Z");
      });
      it("rejects an invalid creation timestamp", () => {
        expect(() => User.register(id, email, hash, new Date("invalid")))
          .toThrow(InvalidUserCreationTimeException);
      });
    });
  });
});
