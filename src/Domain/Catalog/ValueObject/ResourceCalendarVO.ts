import { OpeningWindow } from "#domain/Catalog/Contract/OpeningWindow";
import { ZonedCalendarService } from "#domain/Catalog/Service/ZonedCalendarService";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { InvalidResourceCalendarException } from "#domain/Catalog/Exception/InvalidResourceCalendarException";
/** Immutable resource-local opening rules; seven weekday windows and bounded holiday dates. */
export class ResourceCalendarVO {
  private readonly weekly: readonly OpeningWindow[];
  private readonly closedDates: readonly string[];
  private readonly formatter: Intl.DateTimeFormat;
  /** @param timeZone - IANA zone. @param weekly - Sunday-first seven windows, 0/0 is closed. @param closedDates - At most 366 distinct canonical dates. @throws InvalidResourceCalendarException On invalid configuration. */
  public constructor(private readonly timeZone = "Europe/Kyiv", weekly: readonly OpeningWindow[] = Array.from({length:7}, () => ({open:0,close:1440})), closedDates: readonly string[] = []) {
    const calendar = new ZonedCalendarService(); this.formatter = calendar.formatter(timeZone);
    if (weekly.length !== 7 || weekly.some(day => !Number.isInteger(day.open) || !Number.isInteger(day.close) || day.open < 0 || day.close > 1440 || !(day.open < day.close || (day.open === 0 && day.close === 0))) || closedDates.length > 366 || new Set(closedDates).size !== closedDates.length) throw new InvalidResourceCalendarException();
    closedDates.forEach(date => calendar.assertDate(date));
    this.weekly = weekly.map(day => ({...day})); this.closedDates = [...closedDates].sort();
  }
  /** @returns Resource-local IANA zone. */
  public getTimeZone(): string { return this.timeZone; }
  /** @returns Defensive copy of Sunday-first windows. */
  public getWeekly(): OpeningWindow[] { return this.weekly.map(day => ({...day})); }
  /** @returns Defensive copy of closed dates. */
  public getClosedDates(): string[] { return [...this.closedDates]; }
  /** @param range - Minute-aligned booking interval, at most seven days. @returns Whether every actual minute is open, including DST repetitions. */
  public allows(range: TimeRangeVO): boolean {
    if (range.durationMs() > 7*86400_000) return false;
    const calendar = new ZonedCalendarService();
    for (let instant = range.getStart().getTime(); instant < range.getEnd().getTime(); instant += 60_000) {
      const local = calendar.parts(new Date(instant), this.formatter); const day = this.weekly[local.weekday]!;
      if (this.closedDates.includes(local.date) || local.minute < day.open || local.minute >= day.close) return false;
    }
    return true;
  }
}
