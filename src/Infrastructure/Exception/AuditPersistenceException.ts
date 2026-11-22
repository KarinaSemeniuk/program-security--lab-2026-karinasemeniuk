import { AInfrastructureException } from "#infrastructure/Exception/Abstracts/AInfrastructureException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";
/** Safe audit failure without event content or private paths. */
export class AuditPersistenceException extends AInfrastructureException {
  /** Creates a public audit failure. */
  public constructor() { super("Не вдалося зберегти журнал подій."); }
  /** @returns Immutable audit failure allocation. */
  protected override getCodeEnum(): number { return InfrastructureExceptionRegistry.AuditPersistence; }
}
