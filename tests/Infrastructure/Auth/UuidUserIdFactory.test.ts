import crypto from "node:crypto";
import { UuidUserIdFactory } from "#infrastructure/Auth/UuidUserIdFactory";
import { UserIdGenerationException } from "#infrastructure/Exception/UserIdGenerationException";

describe("infrastructure", () => {
  describe("auth.infrastructure", () => {
    describe("UuidUserIdFactory", () => {
      it("returns the runtime UUID as a validated identifier", () => {
        jest.spyOn(crypto, "randomUUID").mockReturnValue("11111111-1111-4111-8111-111111111111");
        expect(new UuidUserIdFactory().create().getValue()).toBe("11111111-1111-4111-8111-111111111111");
      });
      it("wraps allocation failures", () => {
        jest.spyOn(crypto, "randomUUID").mockImplementationOnce(() => {
          throw new Error("private allocation failure");
        });
        expect(() => new UuidUserIdFactory().create()).toThrow(UserIdGenerationException);
      });
    });
  });
});
