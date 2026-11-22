import { ACoreException } from "#domain/SharedKernel/Exception/Abstracts/ACoreException";
import { CoreExceptionRegistry } from "#domain/SharedKernel/Exception/Registry/CoreExceptionRegistry";

/** Identifies the InvalidConfiguration failure without exposing sensitive inputs. */
export class InvalidConfigurationException extends ACoreException {
  private static readonly MESSAGE = "Некоректна конфігурація застосунку.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(InvalidConfigurationException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): CoreExceptionRegistry.InvalidConfiguration {
    return CoreExceptionRegistry.InvalidConfiguration;
  }
}
