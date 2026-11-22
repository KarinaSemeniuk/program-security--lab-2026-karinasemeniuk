/** Admin-visible installation capabilities, without keys or signature artifacts. */
export interface IServiceLicense {
  /** Whether verification and validity window currently pass. */
  readonly active: boolean;
  /** Named enabled capabilities. */
  readonly features: readonly string[];
  /** UTC expiry; empty if unverifiable. */
  readonly expiresAt: string;
}
