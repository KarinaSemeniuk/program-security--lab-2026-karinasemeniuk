import { PasswordValidationResult } from "#domain/Identity/Contract/PasswordValidationResult";
import { PasswordValidationIssue } from "#domain/Identity/Enum/PasswordValidationIssue";

/**
 * Enforces the registration password policy without altering the supplied value.
 * Expected validation failures are returned as typed feedback for the caller.
 */
export class PasswordPolicyService {
  private static readonly MIN_CODE_POINTS = 15;
  private static readonly MAX_UTF8_BYTES = 72;
  private readonly blockedPasswords: ReadonlySet<string>;

  /**
   * Takes a snapshot of the configured blocklist for consistent validation.
   *
   * @param blockedPasswords - Complete password values rejected at registration.
   */
  public constructor(blockedPasswords: ReadonlySet<string>) {
    this.blockedPasswords = new Set(blockedPasswords);
  }

  /**
   * Evaluates a password before hashing or account creation.
   *
   * @param password - The unchanged password submitted for registration.
   * @returns Acceptance or the first applicable policy violation.
   */
  public validate(password: string): PasswordValidationResult {
    if (password.length > PasswordPolicyService.MAX_UTF8_BYTES) {
      return { isValid: false, issue: PasswordValidationIssue.TooLong };
    }

    // UTF-8 encoding replaces lone surrogates, which could alias distinct inputs.
    if (/[\uD800-\uDFFF]/u.test(password)) {
      return { isValid: false, issue: PasswordValidationIssue.InvalidUnicode };
    }

    if (Array.from(password).length < PasswordPolicyService.MIN_CODE_POINTS) {
      return { isValid: false, issue: PasswordValidationIssue.TooShort };
    }

    if (
      new TextEncoder().encode(password).byteLength >
      PasswordPolicyService.MAX_UTF8_BYTES
    ) {
      return { isValid: false, issue: PasswordValidationIssue.TooLong };
    }

    if (this.blockedPasswords.has(password)) {
      return { isValid: false, issue: PasswordValidationIssue.Blocklisted };
    }

    return { isValid: true };
  }
}
