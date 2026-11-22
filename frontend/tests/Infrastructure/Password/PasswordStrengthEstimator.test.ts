import { PasswordStrengthEstimator } from "#ui-infrastructure/Password/PasswordStrengthEstimator";

describe("frontend.infrastructure", () => {
  describe("password.infrastructure", () => {
    describe("PasswordStrengthEstimator", () => {
      const estimator = new PasswordStrengthEstimator();
      it.each(["aaaaaaaaaaaaaaa", "qwertyuiopasdfgh", "roombookroombook"])(
        "recognizes predictable patterns", (password) => {
          const score = estimator.estimate(password, ["roombook"]);
          expect(score).not.toBeNull();
          expect(score).toBeLessThanOrEqual(1);
        },
      );
      it("returns only a primitive estimate for a longer unrelated phrase", () => {
        const score = estimator.estimate("river-cloud-amber-orbit-velvet", []);
        expect(typeof score).toBe("number");
        expect(score).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
