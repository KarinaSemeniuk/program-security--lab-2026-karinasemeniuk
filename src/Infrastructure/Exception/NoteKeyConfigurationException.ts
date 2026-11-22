import { AInfrastructureException } from "#infrastructure/Exception/Abstracts/AInfrastructureException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";
/** Safe cryptographic/storage failure without secret material. */
export class NoteKeyConfigurationException extends AInfrastructureException {
  /** Creates a sanitized failure. */
  public constructor() { super("Ключі захисту нотаток недоступні."); }
  /** @returns Immutable allocation. */
  protected override getCodeEnum(): number { return InfrastructureExceptionRegistry.NoteKeyConfiguration; }
}
