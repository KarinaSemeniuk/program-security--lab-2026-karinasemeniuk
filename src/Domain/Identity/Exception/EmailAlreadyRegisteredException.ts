import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";

/** Identifies the EmailAlreadyRegistered failure without exposing sensitive inputs. */
export class EmailAlreadyRegisteredException extends AIdentityException {
  private static readonly MESSAGE = "Цей email уже зареєстрований.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(EmailAlreadyRegisteredException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): IdentityExceptionRegistry.EmailAlreadyRegistered {
    return IdentityExceptionRegistry.EmailAlreadyRegistered;
  }
}
