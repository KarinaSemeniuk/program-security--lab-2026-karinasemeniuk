/** Safe IBookingView API projection. */
export interface IBookingView {
  /** Observed interval version; old read-only fixtures may omit it. */
  readonly revision?: number;
  /** Public id value. */
  readonly id: string;
  /** Public resourceId value. */
  readonly resourceId: string;
  /** Public resourceName value. */
  readonly resourceName: string;
  /** Public userId value. */
  readonly userId: string;
  /** Public startAt value. */
  readonly startAt: string;
  /** Public endAt value. */
  readonly endAt: string;
  /** Public status value. */
  readonly status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  /** Public createdAt value. */
  readonly createdAt: string;
}
