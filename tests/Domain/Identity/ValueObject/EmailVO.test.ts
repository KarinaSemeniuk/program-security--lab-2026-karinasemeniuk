import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { InvalidEmailException } from "#domain/Identity/Exception/InvalidEmailException";

describe("domain", () => {
  describe("identity.domain", () => {
    describe("identity.domain.value-object", () => {
      describe("EmailVO", () => {
        it.each(["user@example.test", "first.last+tag@sub.example.test", "o'neal@example.test"])(
          "accepts supported syntax: %s", (email) => { expect(new EmailVO(email).getValue()).toBe(email); },
        );
        it("canonicalizes case and surrounding whitespace", () => {
          expect(new EmailVO("  USER@Example.TEST  ").getValue()).toBe("user@example.test");
        });
        it.each(["", "user", "a@@example.test", ".a@example.test", "a.@example.test",
          "a..b@example.test", "a b@example.test", "a@localhost", "a@-example.test",
          "a@example-.test", "a@example..test", "a@exam_ple.test",
          "x".repeat(65) + "@example.test", "a@" + "x".repeat(64) + ".test",
          "a@" + ["x".repeat(63), "x".repeat(63), "x".repeat(63), "x".repeat(63)].join("."),
        ])("rejects unsupported syntax: %s", (email) => {
          expect(() => new EmailVO(email)).toThrow(InvalidEmailException);
        });
      });
    });
  });
});
