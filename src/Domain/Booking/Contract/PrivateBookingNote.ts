/** Owner-only note result; never included in history/list projections. */
export interface PrivateBookingNote {
  /** Exact private text; empty if absent/cleared. */
  readonly text: string;
  /** Zero for absent note, otherwise monotonically increasing content revision. */
  readonly revision: number;
  /** Last content-write timestamp, empty for absent note. */
  readonly updatedAt: string;
}
