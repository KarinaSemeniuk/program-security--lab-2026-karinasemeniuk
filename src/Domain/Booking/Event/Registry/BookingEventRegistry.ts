/** Stable serialized event names. */
export enum BookingEventRegistry {
  /** Creation committed. */
  /** Time changed without replacing identity/owner. */
  Rescheduled = "Booking.Rescheduled",
  Placed = "Booking.Placed",
  /** Lifecycle transition. */
  StatusChanged = "Booking.StatusChanged",
  /** Cancellation committed. */
  Cancelled = "Booking.Cancelled",
}
