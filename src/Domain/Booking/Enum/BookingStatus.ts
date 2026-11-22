/** Persistent booking lifecycle. */
export enum BookingStatus {
  /** Validated, awaiting same-transaction confirmation. */
  Pending = "PENDING",
  /** Active accepted reservation. */
  Confirmed = "CONFIRMED",
  /** Terminal cancellation. */
  Cancelled = "CANCELLED",
  /** Terminal elapsed booking. */
  Completed = "COMPLETED",
}
