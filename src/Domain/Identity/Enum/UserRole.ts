/** Stored account roles; Guest is represented by absence of authentication. */
export enum UserRole {
  /** Standard role assigned by public registration. */
  User = "USER",
  /** Privileged role provisioned outside public registration. */
  Admin = "ADMIN",
}
