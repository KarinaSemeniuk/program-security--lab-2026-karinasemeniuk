import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";

/** Password protection required by Identity without a cryptographic dependency. */
export interface IPasswordHasher {
  /**
   * Protects an already validated password using a fresh salt.
   * @param password - Exact submitted value; must never be logged.
   * @returns The complete protected password representation.
   * @throws ARoomBookException If the adapter cannot protect the password.
   */
  hash(password: string): Promise<PasswordHashVO>;
}
