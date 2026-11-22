/** Immutable exception allocations for this boundary. */
export enum IdentityExceptionRegistry {
  /** Stable registry segment; numeric members below are never reused. */
  SEGMENT = "IDN",
  /** InvalidCurrentPassword allocation. */
  InvalidCurrentPassword = 15,
  /** AccountNotFound allocation. */
  AccountNotFound = 14,
  /** AccountConflict allocation. */
  AccountConflict = 13,
  /** AccountAccessDenied allocation. */
  AccountAccessDenied = 12,
  /** Authentication failure allocation. */
  Unauthenticated = 11,
  /** Authentication failure allocation. */
  InvalidCredentials = 10,
  /** Allocated code for InvalidEmail failures. */
  InvalidEmail = 1,
  /** Allocated code for PasswordTooShort failures. */
  PasswordTooShort = 2,
  /** Allocated code for PasswordTooLong failures. */
  PasswordTooLong = 3,
  /** Allocated code for PasswordBlocklisted failures. */
  PasswordBlocklisted = 4,
  /** Allocated code for InvalidPasswordUnicode failures. */
  InvalidPasswordUnicode = 5,
  /** Allocated code for EmailAlreadyRegistered failures. */
  EmailAlreadyRegistered = 6,
  /** Allocated code for InvalidPasswordHash failures. */
  InvalidPasswordHash = 7,
  /** Allocated code for InvalidUserRole failures. */
  InvalidUserRole = 8,
  /** Allocated code for InvalidUserCreationTime failures. */
  InvalidUserCreationTime = 9,
}
