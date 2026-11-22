import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { User } from "#domain/Identity/Entity/User";

/** Persistence operations required by registration. */
export interface IUserRepository {
  /**
   * Checks availability of a canonical email.
   * @param email - Validated normalized identifier.
   * @returns Whether an account already owns it.
   * @throws ARoomBookException If the persistence adapter cannot complete the lookup.
   */
  existsByEmail(email: EmailVO): Promise<boolean>;
  /**
   * Persists a newly registered aggregate.
   * @param user - Account satisfying the registration invariants.
   * @throws EmailAlreadyRegisteredException If a concurrent registration owns the email.
   * @throws ARoomBookException If persistence fails.
   */
  save(user: User): Promise<void>;
}
