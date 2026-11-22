/** Reasons a registration password fails the domain password policy. */
export enum PasswordValidationIssue {
  TooShort = "TOO_SHORT",
  TooLong = "TOO_LONG",
  Blocklisted = "BLOCKLISTED",
  InvalidUnicode = "INVALID_UNICODE",
}
