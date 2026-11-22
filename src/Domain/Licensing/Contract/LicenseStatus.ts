/** Safe Admin-visible service entitlement, with no signature or key material. */
export interface LicenseStatus {
  /** Whether this installation currently verifies. */
  readonly active: boolean;
  /** Enabled named capabilities. */
  readonly features: readonly string[];
  /** Signed expiry, empty when verification failed. */
  readonly expiresAt: string;
}
