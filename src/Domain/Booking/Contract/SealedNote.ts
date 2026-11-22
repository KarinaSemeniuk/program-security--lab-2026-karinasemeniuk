/** Client-authenticated ciphertext. No decryption key is accepted by the server. */
export interface SealedNote {
  /** Immutable envelope profile. */
  version: 1;
  /** Fixed authenticated cipher. */
  algorithm: "AES-256-GCM";
  /** Public fingerprint of the client key. */
  keyId: string;
  /** Authenticated owner binding. */
  ownerId: string;
  /** Authenticated booking binding. */
  bookingId: string;
  /** Monotonically increasing authenticated version. */
  revision: number;
  /** Unique 96-bit nonce in canonical base64. */
  nonce: string;
  /** Ciphertext including the 128-bit authentication tag, in base64. */
  ciphertext: string;
}
