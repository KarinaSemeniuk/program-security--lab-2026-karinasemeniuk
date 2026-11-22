import { Booking } from "#domain/Booking/Entity/Booking";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
/** Atomic lifecycle persistence, with no personal data in availability projections. */
export interface IBookingRepository {
  /** @param booking - Valid confirmed aggregate. @throws ARoomBookException On a locked revalidation, overlap or persistence failure. */
  place(booking: Booking): Promise<void>;
  /** @param id - UUID. @param actorId - Resolved user. @param admin - Current role. @returns Cancelled aggregate. @throws ARoomBookException On denied/missing/terminal/cutoff failure. */
  cancel(id: string, actorId: string, admin: boolean): Promise<Booking>;
  /** @param userId - Server-resolved owner. @param page - Zero-based bounded page. @param filter - Optional server-side history category. @returns Own history and total. @throws ARoomBookException On read failure. */
  mine(userId: string, page: number, filter?: "all"|"upcoming"|"past"|"cancelled"): Promise<{ bookings: Booking[]; total: number; resourceNames: Record<string, string> }>;
  /** @param resourceId - Resource UUID. @param range - At most 31 days. @param page - Zero-based page. @returns Admin history and total. @throws ARoomBookException On read failure. */
  forResource(resourceId: string, range: TimeRangeVO, page: number): Promise<{ bookings: Booking[]; total: number; resourceNames: Record<string, string> }>;
  /** @param resourceId - Resource UUID. @param range - Requested day/range. @returns Only anonymous active intervals. @throws ARoomBookException On read failure. */
  occupied(resourceId: string, range: TimeRangeVO): Promise<TimeRangeVO[]>;
  /** @returns Count of newly completed bookings. @throws ARoomBookException On storage failure. */
  completeEnded(): Promise<number>;
}
