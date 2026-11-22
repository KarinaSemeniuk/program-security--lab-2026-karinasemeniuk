import { ACoreException } from "#domain/SharedKernel/Exception/Abstracts/ACoreException";
import { CoreExceptionRegistry } from "#domain/SharedKernel/Exception/Registry/CoreExceptionRegistry";

/** Identifies the InvalidRequestBody failure without exposing sensitive inputs. */
export class InvalidRequestBodyException extends ACoreException {
  private static readonly MESSAGE = "Некоректне тіло запиту.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(InvalidRequestBodyException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): CoreExceptionRegistry.InvalidRequestBody {
    return CoreExceptionRegistry.InvalidRequestBody;
  }
}
