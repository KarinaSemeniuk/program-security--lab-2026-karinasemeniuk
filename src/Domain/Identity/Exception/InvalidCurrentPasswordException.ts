import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";
/** Safe authentication failure, independent of account existence. */
export class InvalidCurrentPasswordException extends AIdentityException {
  /** Creates a public failure without credentials. */
  public constructor() { super("Поточний пароль неправильний."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): IdentityExceptionRegistry.InvalidCurrentPassword { return IdentityExceptionRegistry.InvalidCurrentPassword; }
}
