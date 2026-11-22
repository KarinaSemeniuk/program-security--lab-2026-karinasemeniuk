import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";

/** Identifies the PasswordBlocklisted failure without exposing sensitive inputs. */
export class PasswordBlocklistedException extends AIdentityException {
  private static readonly MESSAGE = "Обери інший пароль: це значення є у списку поширених паролів.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(PasswordBlocklistedException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): IdentityExceptionRegistry.PasswordBlocklisted {
    return IdentityExceptionRegistry.PasswordBlocklisted;
  }
}
