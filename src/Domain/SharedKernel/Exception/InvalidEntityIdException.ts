import { ACoreException } from "#domain/SharedKernel/Exception/Abstracts/ACoreException";
import { CoreExceptionRegistry } from "#domain/SharedKernel/Exception/Registry/CoreExceptionRegistry";

/** Identifies the InvalidEntityId failure without exposing sensitive inputs. */
export class InvalidEntityIdException extends ACoreException {
  private static readonly MESSAGE = "Некоректний ідентифікатор сутності.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(InvalidEntityIdException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): CoreExceptionRegistry.InvalidEntityId {
    return CoreExceptionRegistry.InvalidEntityId;
  }
}
