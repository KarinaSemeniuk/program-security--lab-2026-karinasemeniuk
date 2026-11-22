import { ACatalogException } from "#domain/Catalog/Exception/Abstracts/ACatalogException";
import { CatalogExceptionRegistry } from "#domain/Catalog/Exception/Registry/CatalogExceptionRegistry";
/** Safe InvalidResourceCalendar failure. */
export class InvalidResourceCalendarException extends ACatalogException {
  /** Creates a safe public failure. */
  public constructor() { super("Перевірте часовий пояс, години роботи й закриті дати."); }
  /** @returns Immutable exception allocation. */
  protected override getCodeEnum(): number { return CatalogExceptionRegistry.InvalidResourceCalendar; }
}
