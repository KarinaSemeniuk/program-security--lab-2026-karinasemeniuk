import { Resource } from "#domain/Catalog/Entity/Resource";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
/** Computes anonymous UTC-grid slots for a selected civil day from minified occupied intervals. */
export class ComputeAvailableSlotsService {
  /** @param resource - Configuration only. @param day - UTC bounds of the chosen civil day. @param occupied - Active intervals without personal data. @param now - Current clock instant. @returns Slot boundaries with availability. */
  public compute(resource: Resource, day: TimeRangeVO, occupied: readonly TimeRangeVO[], now: Date): { startAt: string; endAt: string; available: boolean }[] {
    const step = resource.getSlot().getValue() * 60_000;
    const result = [];
    for (let start = Math.ceil(day.getStart().getTime()/step)*step; start < day.getEnd().getTime(); start += step) {
      const range = new TimeRangeVO(new Date(start).toISOString(), new Date(start + step).toISOString());
      result.push({ startAt: range.getStart().toISOString(), endAt: range.getEnd().toISOString(),
        available: resource.isActive() && resource.getCalendar().allows(range) && start > now.getTime() && !occupied.some(other => range.overlaps(other)) });
    }
    return result;
  }
}
