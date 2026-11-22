import { AInfrastructureException } from "#infrastructure/Exception/Abstracts/AInfrastructureException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";

/** Identifies the BlocklistLoading failure without exposing sensitive inputs. */
export class BlocklistLoadingException extends AInfrastructureException {
  private static readonly MESSAGE = "Не вдалося завантажити список неприйнятних паролів.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(BlocklistLoadingException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): InfrastructureExceptionRegistry.BlocklistLoading {
    return InfrastructureExceptionRegistry.BlocklistLoading;
  }
}
