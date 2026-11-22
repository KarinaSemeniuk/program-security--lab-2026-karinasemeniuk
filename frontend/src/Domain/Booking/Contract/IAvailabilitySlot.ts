/** Safe IAvailabilitySlot API projection. */
export interface IAvailabilitySlot {
  /** Public startAt value. */
  readonly startAt: string;
  /** Public endAt value. */
  readonly endAt: string;
  /** Public available value. */
  readonly available: boolean;
}
