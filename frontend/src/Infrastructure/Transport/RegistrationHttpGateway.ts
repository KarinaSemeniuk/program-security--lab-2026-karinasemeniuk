import { IRegistrationGateway } from "#ui-domain/Identity/OutsourceContract/IRegistrationGateway";
import { IRegistrationCredentials } from "#ui-domain/Identity/Contract/IRegistrationCredentials";
import { IRegisteredAccount } from "#ui-domain/Identity/Contract/IRegisteredAccount";
import { RegistrationOutcome } from "#ui-domain/Identity/Contract/RegistrationOutcome";

/** JSON transport that exposes only explicitly selected public response fields. */
export class RegistrationHttpGateway implements IRegistrationGateway {
  private readonly baseUrl: string;

  /**
   * Configures the public API location and an injectable request capability.
   * @param baseUrl - Empty for the local proxy, or an explicit HTTP(S) API base.
   * @param request - Browser fetch; replace with a mock for isolated tests.
   */
  public constructor(baseUrl = "", private readonly request: typeof fetch = globalThis.fetch.bind(globalThis)) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * Sends exactly email and password on an explicit form submission.
   * @param credentials - Validated credentials retained only during this request.
   * @returns A safe expected result; network and parser failures are normalized.
   */
  public async register(credentials: IRegistrationCredentials): Promise<Exclude<RegistrationOutcome, { status: "invalid" }>> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 15_000);
    try {
      if (this.baseUrl) {
        const address = new URL(this.baseUrl);
        if (!["http:", "https:"].includes(address.protocol) || address.username || address.password) {
          return this.unexpected();
        }
      }
      const response = await this.request(this.baseUrl + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      });
      const text = await response.text();
      if (text.length > 16_384) return this.unexpected();
      if (response.status >= 500) return {
        status: "failed", reason: "server",
        message: "Не вдалося завершити реєстрацію. Спробуйте трохи пізніше.",
      };
      if (response.status === 429) {
        const raw = Number(response.headers.get("Retry-After"));
        const retryAfterSeconds = Number.isInteger(raw) && raw >= 1 && raw <= 3600 ? raw : 900;
        return { status: "failed", reason: "rate-limit", retryAfterSeconds,
          message: "Забагато спроб реєстрації. Зачекайте перед наступною спробою." };
      }
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { return this.unexpected(); }
      if (response.status === 201) {
        const user = this.publicUser(parsed);
        return user ? { status: "created", user } : this.unexpected();
      }
      if (response.status === 409) return {
        status: "failed", reason: "conflict", field: "email",
        message: "Цей email уже зареєстрований. Скористайтеся іншою адресою.",
      };
      if (typeof parsed === "object" && parsed !== null && "error" in parsed &&
          typeof parsed.error === "object" && parsed.error !== null && "code" in parsed.error) {
        const code = parsed.error.code;
        const messages: Readonly<Record<string, { field: "email" | "password"; message: string }>> = {
          "RB.IDN.1": { field: "email", message: "Перевірте адресу email." },
          "RB.IDN.2": { field: "password", message: "Пароль має містити щонайменше 15 символів." },
          "RB.IDN.3": { field: "password", message: "Пароль має займати не більше 72 байтів UTF-8." },
          "RB.IDN.4": { field: "password", message: "Цей пароль надто поширений. Оберіть іншу унікальну фразу." },
          "RB.IDN.5": { field: "password", message: "Пароль містить некоректні Unicode-символи." },
        };
        if (typeof code === "string") {
          const known = messages[code];
          if (known) return { status: "failed", reason: "rejected", ...known };
        }
      }
      return this.unexpected();
    } catch {
      return { status: "failed", reason: "network",
        message: "Не вдалося з’єднатися. Перевірте підключення та спробуйте ще раз." };
    } finally { globalThis.clearTimeout(timeout); }
  }

  private unexpected(): Exclude<RegistrationOutcome, { status: "invalid" }> {
    return { status: "failed", reason: "unexpected",
      message: "Не вдалося підтвердити результат реєстрації. Спробуйте пізніше." };
  }

  private publicUser(value: unknown): IRegisteredAccount | null {
    if (typeof value !== "object" || value === null || !("user" in value) ||
        typeof value.user !== "object" || value.user === null) return null;
    const user = value.user;
    if (!("id" in user) || !("email" in user) || !("role" in user) || !("createdAt" in user) ||
        typeof user.id !== "string" || typeof user.email !== "string" ||
        user.email.length === 0 || user.email.length > 254 || user.role !== "USER" ||
        typeof user.createdAt !== "string" || !Number.isFinite(Date.parse(user.createdAt)) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id)) return null;
    return { id: user.id, email: user.email, role: "USER", createdAt: user.createdAt };
  }
}
