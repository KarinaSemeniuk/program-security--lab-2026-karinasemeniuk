import { ACoreException } from "#domain/SharedKernel/Exception/Abstracts/ACoreException";
import { CoreExceptionRegistry } from "#domain/SharedKernel/Exception/Registry/CoreExceptionRegistry";

/** Identifies the RequestBodyTooLarge failure without exposing sensitive inputs. */
export class RequestBodyTooLargeException extends ACoreException {
  private static readonly MESSAGE = "Тіло запиту перевищує дозволений розмір.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(RequestBodyTooLargeException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): CoreExceptionRegistry.RequestBodyTooLarge {
    return CoreExceptionRegistry.RequestBodyTooLarge;
  }
}
