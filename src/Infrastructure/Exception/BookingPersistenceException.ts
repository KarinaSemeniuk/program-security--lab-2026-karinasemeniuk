import { AInfrastructureException } from "#infrastructure/Exception/Abstracts/AInfrastructureException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";
/** Safe storage failure. */
export class BookingPersistenceException extends AInfrastructureException {
  /** Creates a sanitized failure. */
  public constructor() { super("Сховище бронювань тимчасово недоступне."); }
  /** @returns Immutable failure allocation. */
  protected override getCodeEnum(): number { return InfrastructureExceptionRegistry.BookingPersistence; }
}
