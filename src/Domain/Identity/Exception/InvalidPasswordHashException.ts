import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";

/** Identifies the InvalidPasswordHash failure without exposing sensitive inputs. */
export class InvalidPasswordHashException extends AIdentityException {
  private static readonly MESSAGE = "Некоректне представлення хешу пароля.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(InvalidPasswordHashException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): IdentityExceptionRegistry.InvalidPasswordHash {
    return IdentityExceptionRegistry.InvalidPasswordHash;
  }
}
