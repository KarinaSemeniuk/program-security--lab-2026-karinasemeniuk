import { PasswordValidationIssue } from "#domain/Identity/Enum/PasswordValidationIssue";
import { PasswordPolicyService } from "#domain/Identity/Service/PasswordPolicyService";

describe("domain", () => {
  describe("identity.domain", () => {
    describe("identity.domain.service", () => {
      describe("PasswordPolicyService", () => {
        const service = new PasswordPolicyService(new Set(["passwordpassword"]));

        it.each([
          { name: "15 characters without required character classes", password: "cedar river fog" },
          { name: "a Ukrainian passphrase", password: "тиха річка восени" },
          { name: "exactly 72 ASCII bytes", password: "x".repeat(57) + "cedar river fog" },
          { name: "36 Cyrillic characters occupying 72 bytes", password: "ж".repeat(36) },
          { name: "18 emoji occupying 72 bytes", password: "🌿".repeat(18) },
          { name: "a leading space contributing to the length", password: " cedar river fo" },
          { name: "a trailing space contributing to the length", password: "cedar river fo " },
          { name: "a blocklisted value used only as a substring", password: "passwordpassword leaf" },
        ])("accepts $name", ({ password }) => {
          expect(service.validate(password)).toEqual({ isValid: true });
        });

        it.each([
          { name: "empty input", password: "", issue: PasswordValidationIssue.TooShort },
          { name: "14 characters", password: "cedar river fo", issue: PasswordValidationIssue.TooShort },
          { name: "8 emoji despite 16 UTF-16 units", password: "🌿".repeat(8), issue: PasswordValidationIssue.TooShort },
          { name: "73 ASCII bytes", password: "x".repeat(58) + "cedar river fog", issue: PasswordValidationIssue.TooLong },
          { name: "37 Cyrillic characters occupying 74 bytes", password: "ж".repeat(37), issue: PasswordValidationIssue.TooLong },
          { name: "19 emoji occupying 76 bytes", password: "🌿".repeat(19), issue: PasswordValidationIssue.TooLong },
          { name: "a complete blocklisted password", password: "passwordpassword", issue: PasswordValidationIssue.Blocklisted },
          { name: "an unpaired high surrogate", password: "cedar river fog\uD800", issue: PasswordValidationIssue.InvalidUnicode },
          { name: "an unpaired low surrogate", password: "cedar river fog\uDC00", issue: PasswordValidationIssue.InvalidUnicode },
        ])("rejects $name", ({ password, issue }) => {
          expect(service.validate(password)).toEqual({ isValid: false, issue });
        });

        it("keeps its blocklist snapshot when the supplied set is later changed", () => {
          const configured = new Set(["passwordpassword"]);
          const policy = new PasswordPolicyService(configured);
          configured.clear();

          expect(policy.validate("passwordpassword")).toEqual({
            isValid: false,
            issue: PasswordValidationIssue.Blocklisted,
          });
        });
      });
    });
  });
});
