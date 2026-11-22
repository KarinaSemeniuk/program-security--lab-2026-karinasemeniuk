import { AInfrastructureException } from "#infrastructure/Exception/Abstracts/AInfrastructureException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";

/** Identifies the UserPersistenceRead failure without exposing sensitive inputs. */
export class UserPersistenceReadException extends AInfrastructureException {
  private static readonly MESSAGE = "Не вдалося перевірити обліковий запис.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(UserPersistenceReadException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): InfrastructureExceptionRegistry.UserPersistenceRead {
    return InfrastructureExceptionRegistry.UserPersistenceRead;
  }
}
