import { User } from "#domain/Identity/Entity/User";
import { UserRole } from "#domain/Identity/Enum/UserRole";

/** Explicit public account projection with no credential fields. */
export class UserDTO {
  /** Stable identifier used by subsequent account operations. */
  public readonly id: string;
  /** Canonical email identifying the created account. */
  public readonly email: string;
  /** System-assigned role, never taken from registration input. */
  public readonly role: UserRole;
  /** Account creation timestamp in ISO 8601 format. */
  public readonly createdAt: string;

  /**
   * Selects only fields allowed outside Identity.
   * @param user - Aggregate successfully persisted by the use case.
   */
  public constructor(user: User) {
    this.id = user.getId().getValue();
    this.email = user.getEmail().getValue();
    this.role = user.getRole().getValue();
    this.createdAt = user.getCreatedAt().toISOString();
  }
}
