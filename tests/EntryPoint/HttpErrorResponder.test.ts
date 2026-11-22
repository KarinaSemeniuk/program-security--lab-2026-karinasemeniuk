import { HttpErrorResponder } from "#entrypoint/HttpErrorResponder";
import { EmailAlreadyRegisteredException } from "#domain/Identity/Exception/EmailAlreadyRegisteredException";
import { PasswordTooShortException } from "#domain/Identity/Exception/PasswordTooShortException";
import { PasswordHashingException } from "#infrastructure/Exception/PasswordHashingException";
import { UserPersistenceWriteException } from "#infrastructure/Exception/UserPersistenceWriteException";
import { RateLimitExceededException } from "#domain/SharedKernel/Exception/RateLimitExceededException";

describe("entry-point", () => {
  describe("HttpErrorResponder", () => {
    const errors = new HttpErrorResponder();
    it.each([
      { error: new PasswordTooShortException(), status: 400, code: "RB.IDN.2" },
      { error: new EmailAlreadyRegisteredException(), status: 409, code: "RB.IDN.6" },
      { error: new PasswordHashingException(), status: 500, code: "RB.INF.4" },
      { error: new UserPersistenceWriteException(), status: 503, code: "RB.INF.3" },
      { error: new RateLimitExceededException(), status: 429, code: "RB.CORE.9" },
      { error: { type: "entity.parse.failed" }, status: 400, code: "RB.CORE.1" },
      { error: { type: "entity.too.large" }, status: 413, code: "RB.CORE.3" },
      { error: { type: "encoding.unsupported" }, status: 415, code: "RB.CORE.4" },
    ])("maps the stable code and HTTP status for $code", ({ error, status, code }) => {
      expect(errors.status(error)).toBe(status);
      expect(errors.normalize(error).getCode()).toBe(code);
    });
    it("hides unknown errors and their potentially sensitive messages", () => {
      const raw = new Error("private internal detail");
      const safe = errors.normalize(raw);
      expect(errors.status(raw)).toBe(500);
      expect(safe.getCode()).toBe("RB.CORE.5");
      expect(safe.getPublicMessage()).not.toContain(raw.message);
    });
  });
});
