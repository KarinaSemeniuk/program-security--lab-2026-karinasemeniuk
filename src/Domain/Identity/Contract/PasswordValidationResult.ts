import { PasswordValidationIssue } from "#domain/Identity/Enum/PasswordValidationIssue";

/** Policy feedback consumed by registration and mapped to application errors. */
export type PasswordValidationResult =
  | { readonly isValid: true }
  | { readonly isValid: false; readonly issue: PasswordValidationIssue };
