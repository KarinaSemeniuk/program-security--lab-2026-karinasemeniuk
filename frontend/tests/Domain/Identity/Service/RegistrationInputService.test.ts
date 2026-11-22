import { RegistrationInputService } from "#ui-domain/Identity/Service/RegistrationInputService";

describe("frontend.domain", () => {
  describe("identity.domain.service", () => {
    describe("RegistrationInputService", () => {
      const validation = new RegistrationInputService();
      it.each(["cedar river fog", " cedar river fo", "тиха річка восени", "ж".repeat(36), "🌿".repeat(18)])(
        "accepts matching passwords within Unicode and byte boundaries", (password) => {
          expect(validation.validate(" USER@example.test ", password, password)).toEqual({});
        },
      );
      it.each(["", "invalid", "a@@example.test", "a b@example.test", "x".repeat(255) + "@example.test"])(
        "reports invalid email", (email) => {
          expect(validation.validate(email, "cedar river fog", "cedar river fog").email).toBeTruthy();
        },
      );
      it.each(["", "cedar river fo", "🌿".repeat(8), "ж".repeat(37), "🌿".repeat(19), "cedar river fog\uD800"])(
        "reports unacceptable password boundaries", (password) => {
          expect(validation.validate("user@example.test", password, password).password).toBeTruthy();
        },
      );
      it("requires confirmation", () => {
        expect(validation.validate("user@example.test", "cedar river fog", "").confirmation).toBeTruthy();
      });
      it("compares exact values without trimming the confirmation", () => {
        expect(validation.validate("user@example.test", " cedar river fo", "cedar river fo").confirmation).toBeTruthy();
      });
    });
  });
});
