import bcrypt from "bcrypt";
import { IPasswordHasher } from "#domain/Identity/OutsourceContract/IPasswordHasher";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { PasswordHashingException } from "#infrastructure/Exception/PasswordHashingException";

/** Password hashing adapter using bcrypt 2b and cost 12. */
export class BcryptPasswordHasher implements IPasswordHasher {
  /**
   * Creates a new salted representation of validated registration credentials.
   * @param password - Exact password accepted by the domain password policy.
   * @returns A complete bcrypt hash suitable for Identity persistence.
   * @throws PasswordHashingException If bcrypt cannot compute the hash.
   * @throws InvalidPasswordHashException If an unexpected representation is returned.
   */
  public async hash(password: string): Promise<PasswordHashVO> {
    try {
      return new PasswordHashVO(await bcrypt.hash(password, 12));
    } catch (error: unknown) {
      if (error instanceof ARoomBookException) throw error;
      throw new PasswordHashingException();
    }
  }
}
