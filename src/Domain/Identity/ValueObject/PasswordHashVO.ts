import { AValueObject } from "#domain/SharedKernel/Abstracts/AValueObject";
import { InvalidPasswordHashException } from "#domain/Identity/Exception/InvalidPasswordHashException";

/**
 * Internal password representation confined to Identity and its adapters.
 * Invariant: a complete bcrypt 2b hash using the configured cost 12.
 */
export class PasswordHashVO extends AValueObject<string> {
  /**
   * Validates the representation returned by the password-hashing adapter.
   * @param value - Complete encoded bcrypt hash.
   * @throws InvalidPasswordHashException If a plaintext or malformed value is supplied.
   */
  public constructor(value: string) {
    if (!/^\$2b\$12\$[./A-Za-z0-9]{53}$/.test(value)) {
      throw new InvalidPasswordHashException();
    }
    super(value);
  }
}
