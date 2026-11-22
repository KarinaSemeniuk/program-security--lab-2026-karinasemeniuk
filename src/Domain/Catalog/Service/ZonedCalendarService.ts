import { InvalidResourceCalendarException } from "#domain/Catalog/Exception/InvalidResourceCalendarException";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
/** Civil-date operations backed by runtime IANA rules, including DST day boundaries. */
export class ZonedCalendarService {
  /** @param zone - Supported IANA zone. @returns Reusable unambiguous numeric formatter. @throws InvalidResourceCalendarException On invalid zone. */
  public formatter(zone: string): Intl.DateTimeFormat {
    try { if (!zone || zone.length > 100) throw new InvalidResourceCalendarException();
      return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit", hourCycle:"h23" });
    } catch { throw new InvalidResourceCalendarException(); }
  }
  /** @param date - Canonical civil day, bounded to 2000–2100. @throws InvalidResourceCalendarException On invalid date. */
  public assertDate(date: string): void {
    const value = new Date(date + "T00:00:00.000Z");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value.getTime()) || value.toISOString().slice(0,10) !== date || date < "2000-01-01" || date > "2100-12-31") throw new InvalidResourceCalendarException();
  }
  /** @param value - Actual instant. @param formatter - Validated zone formatter. @returns Civil date, weekday and minute within it. */
  public parts(value: Date, formatter: Intl.DateTimeFormat): { date: string; weekday: number; minute: number } {
    const parts = Object.fromEntries(formatter.formatToParts(value).map(part => [part.type, part.value]));
    const date = `${parts.year}-${parts.month}-${parts.day}`;
    return { date, weekday: new Date(date + "T00:00:00Z").getUTCDay(), minute: Number(parts.hour)*60 + Number(parts.minute) };
  }
  /** @param date - Civil date. @param zone - Display zone. @returns Exact local day as UTC instants; missing civil dates fail. @throws InvalidResourceCalendarException On invalid/missing day. */
  public day(date: string, zone: string): TimeRangeVO {
    this.assertDate(date); const formatter = this.formatter(zone); const center = Date.parse(date + "T00:00:00Z");
    const boundary = (target: string): number => {
      let lo = center - 36*3600_000, hi = center + 60*3600_000;
      while (hi-lo > 60_000) { const mid = Math.floor((lo+hi)/120_000)*60_000; if (this.parts(new Date(mid), formatter).date < target) lo = mid; else hi = mid; }
      return hi;
    };
    const next = new Date(center + 86400_000).toISOString().slice(0,10); const start = boundary(date), end = boundary(next);
    if (start >= end || this.parts(new Date(start), formatter).date !== date) throw new InvalidResourceCalendarException();
    return new TimeRangeVO(new Date(start).toISOString(), new Date(end).toISOString());
  }
}
