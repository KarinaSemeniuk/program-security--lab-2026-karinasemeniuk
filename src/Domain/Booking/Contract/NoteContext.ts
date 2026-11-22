/** Authenticated context binding ciphertext to one owner and revision. */
export interface NoteContext {
  /** Stable booking UUID. */
  readonly bookingId: string;
  /** Immutable booking owner. */
  readonly ownerId: string;
  /** Optimistic content revision. */
  readonly revision: number;
}
