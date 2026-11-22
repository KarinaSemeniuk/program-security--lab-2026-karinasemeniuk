import { AuthenticateUserService } from "#domain/Identity/Service/AuthenticateUserService";
import { User } from "#domain/Identity/Entity/User";
import { UserIdVO } from "#domain/Identity/ValueObject/UserIdVO";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { UserRoleVO } from "#domain/Identity/ValueObject/UserRoleVO";
import { UserRole } from "#domain/Identity/Enum/UserRole";
import { InvalidCredentialsException } from "#domain/Identity/Exception/InvalidCredentialsException";

export function account(blocked = false): User {
  return User.restore(new UserIdVO("00000000-0000-4000-8000-000000000001"), new EmailVO("user@example.test"),
    new PasswordHashVO("$2b$12$" + "a".repeat(53)), new UserRoleVO(UserRole.User), blocked, new Date("2026-10-30T00:00:00Z"));
}
