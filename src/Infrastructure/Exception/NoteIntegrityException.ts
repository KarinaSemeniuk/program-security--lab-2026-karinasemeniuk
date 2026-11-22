import { AInfrastructureException } from "#infrastructure/Exception/Abstracts/AInfrastructureException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";
/** Safe cryptographic/storage failure without secret material. */
export class NoteIntegrityException extends AInfrastructureException {
  /** Creates a sanitized failure. */
  public constructor() { super("Не вдалося перевірити цілісність нотатки. Дані не відображено."); }
  /** @returns Immutable allocation. */
  protected override getCodeEnum(): number { return InfrastructureExceptionRegistry.NoteIntegrity; }
}
