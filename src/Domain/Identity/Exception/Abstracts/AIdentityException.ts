import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";

/** Binds failures to the IDN registry. */
export abstract class AIdentityException extends ARoomBookException {
  /**
   * Associates a safe message with this boundary's registry.
   * @param message - Public explanation without internal details.
   */
  protected constructor(message: string) {
    super(message, IdentityExceptionRegistry);
  }

  /** Supplies one of this registry's immutable numeric allocations. */
  protected abstract override getCodeEnum(): Exclude<IdentityExceptionRegistry, IdentityExceptionRegistry.SEGMENT>;
}
