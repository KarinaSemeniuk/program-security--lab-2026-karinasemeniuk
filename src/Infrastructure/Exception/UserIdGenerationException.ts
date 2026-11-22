import { AInfrastructureException } from "#infrastructure/Exception/Abstracts/AInfrastructureException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";

/** Identifies the UserIdGeneration failure without exposing sensitive inputs. */
export class UserIdGenerationException extends AInfrastructureException {
  private static readonly MESSAGE = "Не вдалося створити ідентифікатор користувача.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(UserIdGenerationException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): InfrastructureExceptionRegistry.UserIdGeneration {
    return InfrastructureExceptionRegistry.UserIdGeneration;
  }
}
