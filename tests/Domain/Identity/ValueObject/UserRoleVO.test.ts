import { UserRole } from "#domain/Identity/Enum/UserRole";
import { UserRoleVO } from "#domain/Identity/ValueObject/UserRoleVO";
import { InvalidUserRoleException } from "#domain/Identity/Exception/InvalidUserRoleException";

describe("domain", () => {
  describe("identity.domain", () => {
    describe("UserRoleVO", () => {
      it.each([UserRole.User, UserRole.Admin])("accepts supported role: %s", (role) => {
        expect(new UserRoleVO(role).getValue()).toBe(role);
      });
      it("rejects an invalid runtime value received through a typed boundary", () => {
        expect(() => new UserRoleVO("SUPERADMIN" as UserRole)).toThrow(InvalidUserRoleException);
      });
    });
  });
});
