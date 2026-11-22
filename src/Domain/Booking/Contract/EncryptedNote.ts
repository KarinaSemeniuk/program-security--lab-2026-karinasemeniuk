/** Versioned cryptographic envelope. No key material or plaintext belongs here. */
export interface EncryptedNote {
  /** Format version. */
  readonly version: number;
  /** Non-secret key selector. */
  readonly keyId: string;
  /** Hex-encoded 96-bit nonce. */
  readonly nonce: string;
  /** Hex-encoded ciphertext. */
  readonly ciphertext: string;
  /** Hex-encoded 128-bit authentication tag. */
  readonly tag: string;
}
