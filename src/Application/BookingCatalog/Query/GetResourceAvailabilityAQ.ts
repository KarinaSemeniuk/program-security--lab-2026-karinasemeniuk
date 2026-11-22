/** Typed GetResourceAvailabilityAQ intent; actor comes only from session resolution. */
export class GetResourceAvailabilityAQ {
  /** @param resourceId - Validated request value or authenticated actor. @param timeZone - IANA display zone, UTC for legacy callers. @param date - Validated request value or authenticated actor. */
  public constructor(public readonly resourceId: string, public readonly date: string, public readonly timeZone = "UTC") {}
}
