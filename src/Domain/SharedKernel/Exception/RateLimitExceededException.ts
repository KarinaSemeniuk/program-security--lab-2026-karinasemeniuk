import { ACoreException } from "#domain/SharedKernel/Exception/Abstracts/ACoreException";
import { CoreExceptionRegistry } from "#domain/SharedKernel/Exception/Registry/CoreExceptionRegistry";

/** Identifies the RateLimitExceeded failure without exposing sensitive inputs. */
export class RateLimitExceededException extends ACoreException {
  private static readonly MESSAGE = "Забагато спроб. Спробуй пізніше.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(RateLimitExceededException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): CoreExceptionRegistry.RateLimitExceeded {
    return CoreExceptionRegistry.RateLimitExceeded;
  }
}
