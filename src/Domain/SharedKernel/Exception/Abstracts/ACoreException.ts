import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { CoreExceptionRegistry } from "#domain/SharedKernel/Exception/Registry/CoreExceptionRegistry";

/** Binds failures to the CORE registry. */
export abstract class ACoreException extends ARoomBookException {
  /**
   * Associates a safe message with this boundary's registry.
   * @param message - Public explanation without internal details.
   */
  protected constructor(message: string) {
    super(message, CoreExceptionRegistry);
  }

  /** Supplies one of this registry's immutable numeric allocations. */
  protected abstract override getCodeEnum(): Exclude<CoreExceptionRegistry, CoreExceptionRegistry.SEGMENT>;
}
