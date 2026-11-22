import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";
/** Safe authentication failure, independent of account existence. */
export class AccountNotFoundException extends AIdentityException {
  /** Creates a public failure without credentials. */
  public constructor() { super("Обліковий запис не знайдено."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): IdentityExceptionRegistry.AccountNotFound { return IdentityExceptionRegistry.AccountNotFound; }
}
