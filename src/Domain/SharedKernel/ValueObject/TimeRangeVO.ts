import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Immutable half-open UTC interval. Invariants: finite canonical instants, end > start. */
export class TimeRangeVO {
  private readonly start: number;
  private readonly end: number;
  /** @param startAt - Canonical UTC ISO instant with milliseconds. @param endAt - Later canonical UTC instant. @throws InvalidRequestBodyException For invalid dates/range. */
  public constructor(startAt: string, endAt: string) {
    this.start = Date.parse(startAt); this.end = Date.parse(endAt);
    if (!Number.isFinite(this.start) || !Number.isFinite(this.end) || this.end <= this.start ||
        new Date(this.start).toISOString() !== startAt || new Date(this.end).toISOString() !== endAt) throw new InvalidRequestBodyException();
  }
  /** @returns Defensive start instant. */
  public getStart(): Date { return new Date(this.start); }
  /** @returns Defensive end instant. */
  public getEnd(): Date { return new Date(this.end); }
  /** @returns Duration in milliseconds. */
  public durationMs(): number { return this.end - this.start; }
  /** @param other - Another immutable range. @returns Whether half-open intervals overlap. */
  public overlaps(other: TimeRangeVO): boolean { return this.start < other.end && other.start < this.end; }
}
