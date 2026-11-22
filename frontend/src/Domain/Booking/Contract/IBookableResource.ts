import { IResourceDraft } from "#ui-domain/Booking/Contract/IResourceDraft";
/** Safe IBookableResource API projection. */
export interface IBookableResource extends IResourceDraft {
  /** Resource-local IANA zone. */
  readonly timeZone: string;
  /** Sunday-first opening windows. */
  readonly weekly: {open:number;close:number}[];
  /** Resource-local closed dates. */
  readonly closedDates: string[];
  /** Observed version for Admin writes. */
  readonly revision: number;
  /** Public id value. */
  readonly id: string;
  /** Public name value. */
  readonly name: string;
  /** Public capacity value. */
  readonly capacity: number;
  /** Public minSlotMinutes value. */
  readonly minSlotMinutes: number;
  /** Public isActive value. */
  readonly isActive: boolean;
}
