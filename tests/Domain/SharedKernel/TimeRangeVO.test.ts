import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
describe("SharedKernel TimeRangeVO", () => {
  const range = (a: number, b: number): TimeRangeVO => new TimeRangeVO(new Date(a).toISOString(), new Date(b).toISOString());
  it("uses half-open boundaries and preserves immutable dates", () => {
    const first = range(1000, 2000);
    expect(first.overlaps(range(2000, 3000))).toBe(false);
    expect(first.overlaps(range(1999, 3000))).toBe(true);
    expect(first.overlaps(range(1000, 2000))).toBe(true);
    const start = first.getStart(); start.setTime(0);
    expect(first.getStart().getTime()).toBe(1000); expect(first.durationMs()).toBe(1000);
  });
  it.each([["invalid", "invalid"], ["2026-02-30T00:00:00.000Z", "2026-03-04T00:00:00.000Z"],
    ["2026-01-01T00:00:00Z", "2026-01-02T00:00:00.000Z"],
    ["2026-01-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z"]])("rejects invalid/noncanonical/reversed input", (a, b) => {
      expect(() => new TimeRangeVO(a, b)).toThrow(InvalidRequestBodyException);
    });
});
