import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { InvalidPasswordHashException } from "#domain/Identity/Exception/InvalidPasswordHashException";

describe("domain", () => {
  describe("identity.domain", () => {
    describe("PasswordHashVO", () => {
      // Synthetic representation for format validation, not an account credential.
      const encoded = "$2b$12$" + "a".repeat(53);
      it("retains a complete configured bcrypt representation", () => {
        expect(new PasswordHashVO(encoded).getValue()).toBe(encoded);
      });
      it.each(["", "plaintext-is-not-a-hash", encoded.slice(0, -1),
        "$2b$04$" + "a".repeat(53), "$2b$12$" + "!".repeat(53)])(
        "rejects invalid credential representation", (value) => {
          expect(() => new PasswordHashVO(value)).toThrow(InvalidPasswordHashException);
        },
      );
    });
  });
});
