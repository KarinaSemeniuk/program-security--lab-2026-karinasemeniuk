import { IAvailabilitySlot } from "#ui-domain/Booking/Contract/IAvailabilitySlot";
/** Pure client selection feedback. All reservation rules are independently enforced by the server. */
export class BookingSelectionService {
  /** @param slots - Ordered public slots. @param startIndex - Selected slot position. @returns Adjacent available count, zero for invalid selection. */
  public contiguous(slots: readonly IAvailabilitySlot[], startIndex: number): number {
    if (!Number.isInteger(startIndex) || startIndex < 0 || startIndex >= slots.length) return 0;
    let count = 0;
    for (let index = startIndex; index < slots.length; index++) {
      const current = slots[index];
      if (!current?.available) break;
      if (index > startIndex && slots[index - 1]?.endAt !== current.startAt) break;
      count++;
    }
    return count;
  }
  /** @param slots - Public grid. @param startIndex - Selected position. @param units - Whole adjacent slots. @returns Safe selection or explicit invalid result. */
  public select(slots: readonly IAvailabilitySlot[], startIndex: number, units: number): { status: "selected"; startAt: string; endAt: string } | { status: "invalid" } {
    if (!Number.isInteger(units) || units < 1) return { status: "invalid" };
    const available = this.contiguous(slots, startIndex);
    if (units > available) return { status: "invalid" };
    const first = slots[startIndex], last = slots[startIndex + units - 1];
    if (!first || !last) return { status: "invalid" };
    return { status: "selected", startAt: first.startAt, endAt: last.endAt };
  }
}
