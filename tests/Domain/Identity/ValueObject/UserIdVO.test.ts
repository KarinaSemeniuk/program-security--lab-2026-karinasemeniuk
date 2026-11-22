import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { InvalidEntityIdException } from "#domain/SharedKernel/Exception/InvalidEntityIdException";

describe("domain", () => {
  describe("identity.domain", () => {
    describe("UserIdVO", () => {
      it("canonicalizes a valid UUID v4", () => {
        expect(new UserIdVO("AAAAAAAA-BBBB-4CCC-8DDD-EEEEEEEEEEEE").getValue())
          .toBe("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
      });
      it.each(["", "not-a-uuid", "11111111-1111-1111-8111-111111111111",
        "11111111-1111-4111-1111-111111111111"])("rejects invalid UUID: %s", (id) => {
        expect(() => new UserIdVO(id)).toThrow(InvalidEntityIdException);
      });
    });
  });
});
