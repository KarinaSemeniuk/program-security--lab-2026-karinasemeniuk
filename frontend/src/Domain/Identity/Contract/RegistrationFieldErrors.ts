/** Non-sensitive field feedback displayed by the registration form. */
export type RegistrationFieldErrors =
  Partial<Record<"email" | "password" | "confirmation", string>>;
