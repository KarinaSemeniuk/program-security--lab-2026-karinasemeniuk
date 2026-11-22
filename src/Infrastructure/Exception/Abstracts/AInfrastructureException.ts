import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";

/** Binds failures to the INF registry. */
export abstract class AInfrastructureException extends ARoomBookException {
  /**
   * Associates a safe message with this boundary's registry.
   * @param message - Public explanation without internal details.
   */
  protected constructor(message: string) {
    super(message, InfrastructureExceptionRegistry);
  }

  /** Supplies one of this registry's immutable numeric allocations. */
  protected abstract override getCodeEnum(): Exclude<InfrastructureExceptionRegistry, InfrastructureExceptionRegistry.SEGMENT>;
}
