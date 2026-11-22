import { BcryptPasswordVerifier } from "#infrastructure/Auth/BcryptPasswordVerifier";
import { BcryptPasswordHasher } from "#infrastructure/Auth/BcryptPasswordHasher";
describe("BcryptPasswordVerifier", () => {
  it("verifies real cost-12 Unicode credentials without trimming or accepting a dummy account", async () => {
    const password = " Тихий простір для ідей ";
    const hash = await new BcryptPasswordHasher().hash(password);
    const verifier = await BcryptPasswordVerifier.create();
    expect(await verifier.verify(password, hash.getValue())).toBe(true);
    expect(await verifier.verify(password.trim(), hash.getValue())).toBe(false);
    expect(await verifier.verify(password, "")).toBe(false);
  });
});
