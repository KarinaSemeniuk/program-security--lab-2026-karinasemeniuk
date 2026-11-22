import { AValueObject } from "#domain/SharedKernel/Abstracts/AValueObject";
import { UserRole } from "#domain/Identity/Enum/UserRole";
import { InvalidUserRoleException } from "#domain/Identity/Exception/InvalidUserRoleException";

/** Immutable account role. Invariant: the value is a supported UserRole member. */
export class UserRoleVO extends AValueObject<UserRole> {
  /**
   * Checks a role supplied by trusted application or persistence code.
   * @param value - Supported account role.
   * @throws InvalidUserRoleException If an unsupported runtime value is supplied.
   */
  public constructor(value: UserRole) {
    if (!Object.values(UserRole).includes(value)) {
      throw new InvalidUserRoleException();
    }
    super(value);
  }
}
