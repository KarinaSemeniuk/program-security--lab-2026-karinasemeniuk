import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";
/** Safe authentication failure, independent of account existence. */
export class InvalidCredentialsException extends AIdentityException {
  /** Creates a public failure without credentials. */
  public constructor() { super("Невірний email або пароль."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): IdentityExceptionRegistry.InvalidCredentials { return IdentityExceptionRegistry.InvalidCredentials; }
}
