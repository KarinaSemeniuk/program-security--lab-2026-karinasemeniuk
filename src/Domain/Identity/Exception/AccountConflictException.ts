import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";
/** Safe authentication failure, independent of account existence. */
export class AccountConflictException extends AIdentityException {
  /** Creates a public failure without credentials. */
  public constructor() { super("Дані облікового запису змінилися. Повторіть вхід і спробу."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): IdentityExceptionRegistry.AccountConflict { return IdentityExceptionRegistry.AccountConflict; }
}
