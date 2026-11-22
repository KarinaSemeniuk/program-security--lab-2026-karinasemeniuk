/** Owner-only note result, deliberately absent from booking history. */
export interface IPrivateBookingNote {
  /** Exact private text. */
  readonly text: string;
  /** Last observed optimistic revision. */
  readonly revision: number;
  /** Last saved instant; empty for a new note. */
  readonly updatedAt: string;
}
