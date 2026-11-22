import { AIdentityException } from "#domain/Identity/Exception/Abstracts/AIdentityException";
import { IdentityExceptionRegistry } from "#domain/Identity/Exception/Registry/IdentityExceptionRegistry";

/** Identifies the InvalidUserCreationTime failure without exposing sensitive inputs. */
export class InvalidUserCreationTimeException extends AIdentityException {
  private static readonly MESSAGE = "Некоректний час створення облікового запису.";

  /** Creates the public representation of this specific failure. */
  public constructor() {
    super(InvalidUserCreationTimeException.MESSAGE);
  }

  /** Preserves the registry allocation assigned to this failure. */
  protected override getCodeEnum(): IdentityExceptionRegistry.InvalidUserCreationTime {
    return IdentityExceptionRegistry.InvalidUserCreationTime;
  }
}
