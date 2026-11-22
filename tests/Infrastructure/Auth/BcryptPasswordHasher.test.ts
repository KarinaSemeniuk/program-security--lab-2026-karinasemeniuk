import bcrypt from "bcrypt";
import { BcryptPasswordHasher } from "#infrastructure/Auth/BcryptPasswordHasher";
import { PasswordHashingException } from "#infrastructure/Exception/PasswordHashingException";

describe("infrastructure", () => {
  describe("auth.infrastructure", () => {
    describe("BcryptPasswordHasher", () => {
      it("creates fresh cost-12 hashes that verify the exact submitted password", async () => {
        const hasher = new BcryptPasswordHasher();
        const one = await hasher.hash(" cedar river fo");
        const two = await hasher.hash(" cedar river fo");
        expect(one.getValue()).not.toBe(two.getValue());
        expect(bcrypt.getRounds(one.getValue())).toBe(12);
        await expect(bcrypt.compare(" cedar river fo", one.getValue())).resolves.toBe(true);
        await expect(bcrypt.compare("cedar river fo", one.getValue())).resolves.toBe(false);
      });
      it("wraps foreign hashing failures before they leave Infrastructure", async () => {
        jest.spyOn(bcrypt, "hash").mockImplementationOnce(() => {
          throw new Error("private dependency failure");
        });
        await expect(new BcryptPasswordHasher().hash("cedar river fog"))
          .rejects.toThrow(PasswordHashingException);
      });
    });
  });
});
