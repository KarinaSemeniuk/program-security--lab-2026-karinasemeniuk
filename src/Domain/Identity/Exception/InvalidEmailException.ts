import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";

/** Identifies the InvalidEmail failure without exposing sensitive inputs. */
export class InvalidEmailException extends AIdentityException {
  private static readonly MESSAGE = "Введи коректну адресу email.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(InvalidEmailException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): IdentityExceptionRegistry.InvalidEmail {
    return IdentityExceptionRegistry.InvalidEmail;
  }
}
