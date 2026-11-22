import { IAuthenticationRepository } from "#domain/Identity/OutsourceContract/IAuthenticationRepository";
import { IPasswordVerifier } from "#domain/Identity/OutsourceContract/IPasswordVerifier";
import { EmailVO } from "#domain/Identity/ValueObject/EmailVO";
import { User } from "#domain/Identity/Entity/User";
import { InvalidCredentialsException } from "#domain/Identity/Exception/InvalidCredentialsException";
/** Verifies credentials with one bcrypt comparison for missing and blocked accounts as well. */
export class AuthenticateUserService {
  /** @param users - Authentication account lookups. @param passwords - Constant-cost bcrypt adapter. */
  public constructor(private readonly users: IAuthenticationRepository, private readonly passwords: IPasswordVerifier) {}
  /** @param snapshot - Successfully verified account. @returns Whether current credentials and active state still match the verification snapshot. @throws ARoomBookException On lookup failure. */
  public async isCurrent(snapshot:User):Promise<boolean> { const current=await this.users.findById(snapshot.getId().getValue()); return !!current && !current.isBlocked() && current.getPasswordHash().getValue()===snapshot.getPasswordHash().getValue(); }
  /** @param email - Submitted address. @param password - Exact password, never normalized.
   * @returns Active authenticated account. @throws InvalidCredentialsException For rejected credentials. @throws ARoomBookException On infrastructure failure.
   */
  public async authenticate(email: string, password: string): Promise<User> {
    let canonical = "";
    try { canonical = new EmailVO(email).getValue(); } catch { /* Invalid addresses use the same dummy path. */ }
    const user = canonical ? await this.users.findByEmail(canonical) : undefined;
    const validInput = isBcryptInputSafe(password);
    const valid = await this.passwords.verify(validInput ? password : "", user?.getPasswordHash().getValue() ?? "");
    if (!validInput || !valid || !user || user.isBlocked()) throw new InvalidCredentialsException();
    return user;
  }
}
// Keep Unicode rules independent from Node/transport; reject replacement-prone surrogates.
function isBcryptInputSafe(password: string): boolean {
  let bytes = 0;
  for (const char of password) {
    const cp = char.codePointAt(0)!;
    if (cp >= 0xd800 && cp <= 0xdfff) return false;
    bytes += cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4;
  }
  return bytes > 0 && bytes <= 72;
}
