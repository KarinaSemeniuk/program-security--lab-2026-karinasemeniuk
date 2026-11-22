import { ACoreException } from "#domain/SharedKernel/Exception/Abstracts/ACoreException";
import { CoreExceptionRegistry } from "#domain/SharedKernel/Exception/Registry/CoreExceptionRegistry";

/** Identifies the OriginNotAllowed failure without exposing sensitive inputs. */
export class OriginNotAllowedException extends ACoreException {
  private static readonly MESSAGE = "Походження запиту не дозволене.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(OriginNotAllowedException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): CoreExceptionRegistry.OriginNotAllowed {
    return CoreExceptionRegistry.OriginNotAllowed;
  }
}
