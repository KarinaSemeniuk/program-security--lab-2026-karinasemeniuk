import { BookingSelectionService } from "#ui-domain/Booking/Service/BookingSelectionService";
describe("Client booking selection", () => {
  const service = new BookingSelectionService();
  const slots = [ { startAt: "a", endAt: "b", available: true }, { startAt: "b", endAt: "c", available: true }, { startAt: "c", endAt: "d", available: false } ];
  it("selects only a whole contiguous available interval", () => {
    expect(service.contiguous(slots, 0)).toBe(2); expect(service.select(slots, 0, 2)).toEqual({ status: "selected", startAt: "a", endAt: "c" });
    for (const units of [-1, 0, 0.5, 3, NaN]) expect(service.select(slots, 0, units)).toEqual({ status: "invalid" });
  });
  it("rejects invalid positions, missing slots and discontinuities", () => {
    expect(service.contiguous(slots, -1)).toBe(0); expect(service.select([], 0, 1)).toEqual({ status: "invalid" });
    expect(service.contiguous([{ startAt: "a", endAt: "b", available: true }, { startAt: "gap", endAt: "c", available: true }], 0)).toBe(1);
  });
});
