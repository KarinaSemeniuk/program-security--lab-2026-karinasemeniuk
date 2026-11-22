import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";

/** Identifies the InvalidPasswordUnicode failure without exposing sensitive inputs. */
export class InvalidPasswordUnicodeException extends AIdentityException {
  private static readonly MESSAGE = "Пароль містить некоректні Unicode-символи.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(InvalidPasswordUnicodeException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): IdentityExceptionRegistry.InvalidPasswordUnicode {
    return IdentityExceptionRegistry.InvalidPasswordUnicode;
  }
}
