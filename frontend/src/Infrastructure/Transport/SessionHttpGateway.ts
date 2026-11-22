import { ISessionGateway } from "#ui-domain/Identity/OutsourceContract/ISessionGateway";
import { ICurrentUser } from "#ui-domain/Identity/Contract/ICurrentUser";
import { SessionOutcome } from "#ui-domain/Identity/Contract/SessionOutcome";
/** Cookie-aware JSON adapter; never reads, retains or logs JWTs. */
export class SessionHttpGateway implements ISessionGateway {
  /** @param baseUrl - Public API base, normally empty for the local proxy. */
  public constructor(private readonly baseUrl: string) {}
  /** @param email - Submitted email. @param password - Exact password. @returns Login outcome. */
  public signIn(email: string, password: string): Promise<SessionOutcome> {
    return this.request("login", { email, password });
  }
  /** @returns Safe current-account result. */
  public current(): Promise<SessionOutcome> { return this.request("me"); }
  /** @returns Logout confirmation; failures remain visible. */
  public signOut(): Promise<SessionOutcome> { return this.request("logout", {}); }
  private async request(action: string, body?: object): Promise<SessionOutcome> {
    try {
      const response = await fetch(this.baseUrl + "/api/auth/" + action, {
        method: body ? "POST" : "GET", credentials: "include", cache: "no-store",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      if (response.status === 401) return action === "me" ? { status: "anonymous" } :
        { status: "failed", message: "Невірний email або пароль." };
      if (response.status === 429) {
        const seconds = Number(response.headers.get("Retry-After"));
        return { status: "failed", message: "Забагато спроб. Зачекайте перед повторним входом.",
          retryAfterSeconds: Number.isFinite(seconds) && seconds > 0 ? Math.min(900, seconds) : 60 };
      }
      if (!response.ok) return { status: "failed", message: "Не вдалося виконати дію. Спробуйте ще раз." };
      if (action === "logout" && response.status === 204) return { status: "signedOut" };
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null || !("user" in data) || !this.isUser(data.user)) {
        return { status: "failed", message: "Не вдалося отримати профіль. Спробуйте ще раз." };
      }
      return { status: "authenticated", user: data.user };
    } catch { return { status: "failed", message: "Немає зв’язку із сервером. Перевірте підключення та повторіть спробу." }; }
  }
  private isUser(value: unknown): value is ICurrentUser {
    if (typeof value !== "object" || value === null) return false;
    return "id" in value && typeof value.id === "string" && "email" in value && typeof value.email === "string" &&
      "role" in value && (value.role === "USER" || value.role === "ADMIN") &&
      "createdAt" in value && typeof value.createdAt === "string";
  }
}
