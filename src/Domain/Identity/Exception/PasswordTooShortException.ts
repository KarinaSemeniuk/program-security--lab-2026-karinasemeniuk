import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";

/** Identifies the PasswordTooShort failure without exposing sensitive inputs. */
export class PasswordTooShortException extends AIdentityException {
  private static readonly MESSAGE = "Пароль має містити щонайменше 15 символів.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(PasswordTooShortException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): IdentityExceptionRegistry.PasswordTooShort {
    return IdentityExceptionRegistry.PasswordTooShort;
  }
}
