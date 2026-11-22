/** Verified token identity; role is always reloaded from the user record. */
export interface AccessToken {
  /** Account UUID. */
  readonly userId: string;
  /** Unique session UUID. */
  readonly sessionId: string;
  /** Absolute expiry. */
  readonly expiresAt: Date;
}
