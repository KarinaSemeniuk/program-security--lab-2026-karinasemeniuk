import { IEntity } from "#domain/SharedKernel/Contract/IEntity";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { UserRole } from "#domain/Identity/Enum/UserRole";
import { UserRoleVO } from "#domain/Identity/ValueObject/UserRoleVO";
import { InvalidUserCreationTimeException } from "#domain/Identity/Exception/InvalidUserCreationTimeException";

/**
 * Identity account aggregate.
 * Invariants: immutable id, normalized email, bcrypt hash, valid creation time.
 * Public registration always creates an unblocked USER account.
 */
export class User implements IEntity<UserIdVO> {
  private readonly createdAt: Date;

  private constructor(
    private readonly id: UserIdVO,
    private readonly email: EmailVO,
    private readonly passwordHash: PasswordHashVO,
    private readonly role: UserRoleVO,
    private readonly blocked: boolean,
    createdAt: Date,
  ) {
    if (!Number.isFinite(createdAt.getTime())) throw new InvalidUserCreationTimeException();
    this.createdAt = new Date(createdAt.getTime());
  }

  /**
   * Creates an account using the public registration invariants.
   * @param id - Identifier allocated for this account.
   * @param email - Validated canonical account email.
   * @param passwordHash - Protected credentials produced by the hashing adapter.
   * @param createdAt - Valid creation timestamp.
   * @returns An unblocked USER account.
   * @throws InvalidUserCreationTimeException If the timestamp is invalid.
   */
  public static register(id: UserIdVO, email: EmailVO, passwordHash: PasswordHashVO, createdAt: Date): User {
    return new User(id, email, passwordHash, new UserRoleVO(UserRole.User), false, createdAt);
  }

  /** Rehydrates a trusted persistence record without applying registration defaults.
   * @param id - Persisted UUID. @param email - Canonical email. @param passwordHash - Stored hash.
   * @param role - Persisted role. @param blocked - Current access restriction. @param createdAt - Original timestamp.
   * @returns Valid account aggregate. @throws InvalidUserCreationTimeException If the timestamp is invalid.
   */
  public static restore(id: UserIdVO, email: EmailVO, passwordHash: PasswordHashVO, role: UserRoleVO, blocked: boolean, createdAt: Date): User {
    return new User(id, email, passwordHash, role, blocked, createdAt);
  }

  /** Returns the stable user identifier for persistence and public projections. */
  public getId(): UserIdVO { return this.id; }
  /** Returns the canonical email used for uniqueness and sign-in. */
  public getEmail(): EmailVO { return this.email; }
  /** Returns credentials only for Identity's persistence/authentication adapters. */
  public getPasswordHash(): PasswordHashVO { return this.passwordHash; }
  /** Returns the system-assigned account role. */
  public getRole(): UserRoleVO { return this.role; }
  /** Returns whether protected operations must reject this account. */
  public isBlocked(): boolean { return this.blocked; }
  /** Returns a defensive timestamp copy to preserve the aggregate's state. */
  public getCreatedAt(): Date { return new Date(this.createdAt.getTime()); }
}
