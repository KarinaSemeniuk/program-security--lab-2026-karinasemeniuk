import { AInfrastructureException } from "#infrastructure/Exception/Abstracts/AInfrastructureException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";

/** Identifies the UserPersistenceWrite failure without exposing sensitive inputs. */
export class UserPersistenceWriteException extends AInfrastructureException {
  private static readonly MESSAGE = "Не вдалося зберегти обліковий запис.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(UserPersistenceWriteException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): InfrastructureExceptionRegistry.UserPersistenceWrite {
    return InfrastructureExceptionRegistry.UserPersistenceWrite;
  }
}
