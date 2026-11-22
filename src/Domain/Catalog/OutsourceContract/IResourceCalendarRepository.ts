import { Resource } from "#domain/Catalog/Entity/Resource";
import { ResourceCalendarVO } from "#domain/Catalog/ValueObject/ResourceCalendarVO";
/** Atomic opening-rule changes under the placement resource lock. */
export interface IResourceCalendarRepository {
  /** @param id - UUID. @param calendar - Valid rules. @param revision - Observed version. @returns Updated aggregate. @throws ARoomBookException On stale, missing or storage failure. */
  setCalendar(id: string, calendar: ResourceCalendarVO, revision: number): Promise<Resource>;
}
