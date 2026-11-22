import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";

/** Identifies the InvalidUserRole failure without exposing sensitive inputs. */
export class InvalidUserRoleException extends AIdentityException {
  private static readonly MESSAGE = "Некоректна роль користувача.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(InvalidUserRoleException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): IdentityExceptionRegistry.InvalidUserRole {
    return IdentityExceptionRegistry.InvalidUserRole;
  }
}
