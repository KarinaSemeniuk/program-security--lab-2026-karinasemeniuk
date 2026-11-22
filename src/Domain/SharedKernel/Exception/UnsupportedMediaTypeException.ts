import { ACoreException } from "#domain/SharedKernel/Exception/Abstracts/ACoreException";
import { CoreExceptionRegistry } from "#domain/SharedKernel/Exception/Registry/CoreExceptionRegistry";

/** Identifies the UnsupportedMediaType failure without exposing sensitive inputs. */
export class UnsupportedMediaTypeException extends ACoreException {
  private static readonly MESSAGE = "Потрібен запит JSON у кодуванні UTF-8.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(UnsupportedMediaTypeException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): CoreExceptionRegistry.UnsupportedMediaType {
    return CoreExceptionRegistry.UnsupportedMediaType;
  }
}
