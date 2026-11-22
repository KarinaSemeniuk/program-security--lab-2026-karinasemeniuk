import { ResourceCalendarVO } from "#domain/Catalog/ValueObject/ResourceCalendarVO";
import { InvalidResourceCalendarException } from "#domain/Catalog/Exception/InvalidResourceCalendarException";
/** Converts JSON storage through explicit shape checks and Domain validation. */
export class ResourceCalendarMapper {
  /** @param row - Resource calendar fields. @returns Validated immutable calendar. @throws InvalidResourceCalendarException On corrupt stored configuration. */
  public map(row: {timeZone?:string;weekly?:unknown;closedDates?:string[]}): ResourceCalendarVO {
    if (row.weekly === undefined) return new ResourceCalendarVO();
    if (!Array.isArray(row.weekly)) throw new InvalidResourceCalendarException();
    const weekly = row.weekly.map(value => {
      if (typeof value !== "object" || value === null || !("open" in value) || !("close" in value) || typeof value.open !== "number" || typeof value.close !== "number") throw new InvalidResourceCalendarException();
      return {open:value.open,close:value.close};
    });
    return new ResourceCalendarVO(row.timeZone, weekly, row.closedDates);
  }
}
