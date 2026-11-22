import { RegistrationFieldErrors } from "#ui-domain/Identity/Contract/RegistrationFieldErrors";

/** Immediate registration feedback matching the documented password boundaries. */
export class RegistrationInputService {
  /** Minimum Unicode code-point count accepted for a registration password. */
  public static readonly MIN_PASSWORD_CODE_POINTS = 15;
  /** Maximum UTF-8 representation supported by the selected bcrypt policy. */
  public static readonly MAX_PASSWORD_UTF8_BYTES = 72;

  /**
   * Provides field feedback before any credentials are sent.
   * @param email - Submitted email; only its email-specific whitespace is ignored.
   * @param password - Exact password value, preserving all whitespace.
   * @param confirmation - Exact independently typed confirmation.
   * @returns Empty feedback when the request may proceed, otherwise field messages.
   */
  public validate(email: string, password: string, confirmation: string): RegistrationFieldErrors {
    const errors: RegistrationFieldErrors = {};
    const canonical = email.trim();
    const parts = canonical.split("@");
    if (canonical.length === 0) errors.email = "Вкажіть адресу email.";
    else if (canonical.length > 254 || parts.length !== 2 ||
      !(parts[0]?.length) || !parts[1]?.includes(".") || /\s/.test(canonical)) {
      errors.email = "Перевірте адресу email, наприклад name@example.com.";
    }
    if (/[\uD800-\uDFFF]/u.test(password)) {
      errors.password = "Пароль містить некоректні Unicode-символи.";
    } else if (Array.from(password).length < RegistrationInputService.MIN_PASSWORD_CODE_POINTS) {
      errors.password = "Додайте довжини: потрібно щонайменше 15 символів.";
    } else if (new TextEncoder().encode(password).byteLength > RegistrationInputService.MAX_PASSWORD_UTF8_BYTES) {
      errors.password = "Пароль перевищує 72 байти. Скоротіть його, зберігши унікальність.";
    }
    if (confirmation.length === 0) errors.confirmation = "Повторіть пароль.";
    else if (confirmation !== password) errors.confirmation = "Паролі не збігаються.";
    return errors;
  }
}
