import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";
/** Safe authentication failure, independent of account existence. */
export class UnauthenticatedException extends AIdentityException {
  /** Creates a public failure without credentials. */
  public constructor() { super("Увійдіть до облікового запису."); }
  /** Returns the immutable allocation. */
  protected override getCodeEnum(): IdentityExceptionRegistry.Unauthenticated { return IdentityExceptionRegistry.Unauthenticated; }
}
