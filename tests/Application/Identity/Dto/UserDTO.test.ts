import { UserDTO } from "#application/Identity/Dto/UserDTO";
import { User } from "#domain/Identity/Entity/User";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";

describe("application", () => {
  describe("identity.application", () => {
    describe("UserDTO", () => {
      it("serializes an explicit public field set without any credential field", () => {
        const user = User.register(new UserIdVO("11111111-1111-4111-8111-111111111111"),
          new EmailVO("user@example.test"), new PasswordHashVO("$2b$12$" + "a".repeat(53)),
          new Date("2026-10-30T00:00:00Z"));
        const result: unknown = JSON.parse(JSON.stringify(new UserDTO(user)));
        expect(result).toEqual({
          id: "11111111-1111-4111-8111-111111111111", email: "user@example.test",
          role: "USER", createdAt: "2026-10-30T00:00:00.000Z",
        });
      });
    });
  });
});
