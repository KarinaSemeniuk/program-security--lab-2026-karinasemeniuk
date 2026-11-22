import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";

/** Identifies the PasswordTooLong failure without exposing sensitive inputs. */
export class PasswordTooLongException extends AIdentityException {
  private static readonly MESSAGE = "Пароль має займати не більше 72 байтів UTF-8.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(PasswordTooLongException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): IdentityExceptionRegistry.PasswordTooLong {
    return IdentityExceptionRegistry.PasswordTooLong;
  }
}
