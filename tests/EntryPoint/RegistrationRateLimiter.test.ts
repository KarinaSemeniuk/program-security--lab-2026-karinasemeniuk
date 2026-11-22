import { RegistrationRateLimiter } from "#entrypoint/RegistrationRateLimiter";
import { RateLimitExceededException } from "#domain/SharedKernel/Exception/RateLimitExceededException";

describe("entry-point", () => {
  describe("RegistrationRateLimiter", () => {
    it("permits five attempts and rejects the sixth for one direct client", () => {
      const limiter = new RegistrationRateLimiter();
      for (let count = 0; count < 5; count += 1) limiter.consume("client", 0);
      expect(() => limiter.consume("client", 1)).toThrow(RateLimitExceededException);
    });
    it("starts a new window after expiry", () => {
      const limiter = new RegistrationRateLimiter(1, 100);
      limiter.consume("client", 0);
      expect(() => limiter.consume("client", 100)).not.toThrow();
    });
    it("does not share one client's quota with another client", () => {
      const limiter = new RegistrationRateLimiter(1);
      limiter.consume("one", 0);
      expect(() => limiter.consume("two", 1)).not.toThrow();
    });
    it("bounds address tracking and reclaims expired records", () => {
      const limiter = new RegistrationRateLimiter(1, 100, 1);
      limiter.consume("one", 0);
      expect(() => limiter.consume("two", 1)).toThrow(RateLimitExceededException);
      expect(() => limiter.consume("two", 100)).not.toThrow();
    });
  });
});
