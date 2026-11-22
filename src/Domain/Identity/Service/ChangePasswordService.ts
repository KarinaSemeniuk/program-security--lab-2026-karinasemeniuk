import { PasswordPolicyService } from "#domain/Identity/Service/PasswordPolicyService";
import { PasswordValidationIssue } from "#domain/Identity/Enum/PasswordValidationIssue";
import { IPasswordHasher } from "#domain/Identity/OutsourceContract/IPasswordHasher";
import { PasswordHashVO } from "#domain/Identity/ValueObject/PasswordHashVO";
import { PasswordTooShortException } from "#domain/Identity/Exception/PasswordTooShortException";
import { PasswordTooLongException } from "#domain/Identity/Exception/PasswordTooLongException";
import { PasswordBlocklistedException } from "#domain/Identity/Exception/PasswordBlocklistedException";
import { InvalidPasswordUnicodeException } from "#domain/Identity/Exception/InvalidPasswordUnicodeException";
/** Applies the existing unchanged-password policy before hashing a replacement credential. */
export class ChangePasswordService {
  /** @param policy - Configured full-password blocklist and Unicode bounds. @param hasher - Bcrypt cost 12 adapter. */
  public constructor(private readonly policy:PasswordPolicyService,private readonly hasher:IPasswordHasher) {}
  /** @param password - Exact replacement value. @returns Valid protected credential. @throws ARoomBookException On policy or hashing failure. */
  public async protect(password:string):Promise<PasswordHashVO> {
    const result=this.policy.validate(password);
    if(!result.isValid) switch(result.issue) {
      case PasswordValidationIssue.TooShort:throw new PasswordTooShortException();
      case PasswordValidationIssue.TooLong:throw new PasswordTooLongException();
      case PasswordValidationIssue.Blocklisted:throw new PasswordBlocklistedException();
      case PasswordValidationIssue.InvalidUnicode:throw new InvalidPasswordUnicodeException();
    }
    return this.hasher.hash(password);
  }
}
