import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";
/** Safe authentication failure, independent of account existence. */
export class AccountAccessDeniedException extends AIdentityException {
  /** Creates a public failure without credentials. */
  public constructor() { super("Недостатньо прав для керування цим обліковим записом."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): IdentityExceptionRegistry.AccountAccessDenied { return IdentityExceptionRegistry.AccountAccessDenied; }
}
