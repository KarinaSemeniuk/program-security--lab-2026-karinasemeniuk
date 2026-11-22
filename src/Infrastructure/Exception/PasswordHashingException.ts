import { AInfrastructureException } from "#infrastructure/Exception/Abstracts/AInfrastructureException";
import { InfrastructureExceptionRegistry } from "#infrastructure/Exception/Registry/InfrastructureExceptionRegistry";

/** Identifies the PasswordHashing failure without exposing sensitive inputs. */
export class PasswordHashingException extends AInfrastructureException {
  private static readonly MESSAGE = "Не вдалося захистити пароль.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(PasswordHashingException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): InfrastructureExceptionRegistry.PasswordHashing {
    return InfrastructureExceptionRegistry.PasswordHashing;
  }
}
