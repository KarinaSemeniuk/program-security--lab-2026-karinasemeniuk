/** Immutable Booking failure allocations. */
export enum BookingExceptionRegistry {
  /** Context segment. */
  SEGMENT = "BKG",
  /** Stale booking version. */
  BookingConflict = 13,
  /** Resource-local calendar rejects new interval. */
  OutsideOpeningHours = 12,
  /** BookingNoteConflict failure. */
  BookingNoteConflict = 11,
  /** InvalidBookingNote failure. */
  InvalidBookingNote = 10,
  /** InvalidTimeRange failure. */
  InvalidTimeRange = 1,
  /** BookingSlotUnavailable failure. */
  BookingSlotUnavailable = 2,
  /** InactiveResource failure. */
  InactiveResource = 3,
  /** InvalidBookingDuration failure. */
  InvalidBookingDuration = 4,
  /** BookingInPast failure. */
  BookingInPast = 5,
  /** BookingNotFound failure. */
  BookingNotFound = 6,
  /** BookingAccessDenied failure. */
  BookingAccessDenied = 7,
  /** CancellationWindowExpired failure. */
  CancellationWindowExpired = 8,
  /** InvalidBookingTransition failure. */
  InvalidBookingTransition = 9,
}
