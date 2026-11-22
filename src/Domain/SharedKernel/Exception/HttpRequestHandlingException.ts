import { ACoreException } from "#domain/SharedKernel/Exception/Abstracts/ACoreException";
import { CoreExceptionRegistry } from "#domain/SharedKernel/Exception/Registry/CoreExceptionRegistry";

/** Identifies the HttpRequestHandling failure without exposing sensitive inputs. */
export class HttpRequestHandlingException extends ACoreException {
  private static readonly MESSAGE = "Не вдалося обробити HTTP-запит.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(HttpRequestHandlingException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): CoreExceptionRegistry.HttpRequestHandling {
    return CoreExceptionRegistry.HttpRequestHandling;
  }
}
