import { PasswordTooShortException } from "#domain/Identity/Exception/PasswordTooShortException";
import { PasswordTooLongException } from "#domain/Identity/Exception/PasswordTooLongException";
import { PasswordBlocklistedException } from "#domain/Identity/Exception/PasswordBlocklistedException";
import { InvalidPasswordUnicodeException } from "#domain/Identity/Exception/InvalidPasswordUnicodeException";
import { EmailAlreadyRegisteredException } from "#domain/Identity/Exception/EmailAlreadyRegisteredException";

import { IUserRepository } from "#domain/Identity/OutsourceContract/IUserRepository";
import { IPasswordHasher } from "#domain/Identity/OutsourceContract/IPasswordHasher";
import { IUserIdFactory } from "#domain/Identity/OutsourceContract/IUserIdFactory";
import { PasswordPolicyService } from "#domain/Identity/Service/PasswordPolicyService";
import { PasswordValidationIssue } from "#domain/Identity/Enum/PasswordValidationIssue";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { User } from "#domain/Identity/Entity/User";

/** Enforces account registration invariants before persistence. */
export class RegisterUserService {
  /**
   * Supplies Identity's required outward contracts.
   * @param users - Account persistence with atomic uniqueness enforcement.
   * @param hasher - Password protection adapter.
   * @param ids - UUID allocation adapter.
   * @param passwords - Configured registration password policy.
   */
  public constructor(
    private readonly users: IUserRepository,
    private readonly hasher: IPasswordHasher,
    private readonly ids: IUserIdFactory,
    private readonly passwords: PasswordPolicyService,
  ) {}

  /**
   * Validates credentials and creates a standard account.
   * @param submittedEmail - User-supplied email, normalized by EmailVO.
   * @param password - Exact password value retained only during this operation.
   * @returns The persisted USER aggregate.
   * @throws InvalidEmailException If the email is outside the supported profile.
   * @throws PasswordTooShortException If fewer than 15 code points are supplied.
   * @throws PasswordTooLongException If the UTF-8 representation exceeds 72 bytes.
   * @throws PasswordBlocklistedException If the whole password is blocklisted.
   * @throws InvalidPasswordUnicodeException If Unicode input is malformed.
   * @throws EmailAlreadyRegisteredException If the normalized email is already used.
   * @throws ARoomBookException If an infrastructure contract fails.
   */
  public async register(submittedEmail: string, password: string): Promise<User> {
    const email = new EmailVO(submittedEmail);
    const result = this.passwords.validate(password);
    if (!result.isValid) {
      switch (result.issue) {
        case PasswordValidationIssue.TooShort: throw new PasswordTooShortException();
        case PasswordValidationIssue.TooLong: throw new PasswordTooLongException();
        case PasswordValidationIssue.Blocklisted: throw new PasswordBlocklistedException();
        case PasswordValidationIssue.InvalidUnicode: throw new InvalidPasswordUnicodeException();
      }
    }
    if (await this.users.existsByEmail(email)) throw new EmailAlreadyRegisteredException();
    const passwordHash = await this.hasher.hash(password);
    const user = User.register(this.ids.create(), email, passwordHash, new Date());
    await this.users.save(user);
    return user;
  }
}
