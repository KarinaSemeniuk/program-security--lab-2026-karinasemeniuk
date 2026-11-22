/** Password comparison without exposing the hashing library to Domain. */
export interface IPasswordVerifier {
  /** @param password - Exact supplied value. @param hash - Stored bcrypt hash, or empty for a dummy comparison. @returns Whether credentials match. @throws ARoomBookException On cryptographic failure. */
  verify(password: string, hash: string): Promise<boolean>;
}
