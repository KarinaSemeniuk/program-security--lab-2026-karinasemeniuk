import { RegisterUserUC } from "#application/Identity/UseCase/RegisterUserUC";
import { RegisterUserAC } from "#application/Identity/Command/RegisterUserAC";
import { User } from "#domain/Identity/Entity/User";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { EmailAlreadyRegisteredException } from "#domain/Identity/Exception/EmailAlreadyRegisteredException";

describe("application", () => {
  describe("identity.application", () => {
    describe("RegisterUserUC", () => {
      it("passes the command unchanged to Domain and returns a safe public projection", async () => {
        const user = User.register(new UserIdVO("11111111-1111-4111-8111-111111111111"),
          new EmailVO("user@example.test"), new PasswordHashVO("$2b$12$" + "a".repeat(53)),
          new Date("2026-10-30T00:00:00Z"));
        const register = jest.fn<Promise<User>, [string, string]>().mockResolvedValue(user);
        const result = await new RegisterUserUC({ register })
          .execute(new RegisterUserAC(" USER@example.test ", " cedar river fo"));
        expect(register).toHaveBeenCalledWith(" USER@example.test ", " cedar river fo");
        expect(Object.keys(result).sort()).toEqual(["createdAt", "email", "id", "role"]);
        expect(result.email).toBe("user@example.test");
      });
      it("preserves a domain rejection", async () => {
        const register = jest.fn<Promise<User>, [string, string]>()
          .mockRejectedValue(new EmailAlreadyRegisteredException());
        await expect(new RegisterUserUC({ register })
          .execute(new RegisterUserAC("user@example.test", "cedar river fog")))
          .rejects.toThrow(EmailAlreadyRegisteredException);
      });
    });
  });
});
