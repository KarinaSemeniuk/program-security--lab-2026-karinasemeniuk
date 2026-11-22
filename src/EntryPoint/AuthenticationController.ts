import express, { type Router, type Request, type CookieOptions } from "express";
import { SignInUserUC } from "#application/Identity/UseCase/SignInUserUC";
import { GetCurrentUserUC } from "#application/Identity/UseCase/GetCurrentUserUC";
import { SignOutUserUC } from "#application/Identity/UseCase/SignOutUserUC";
import { SignInUserAC } from "#application/Identity/Command/SignInUserAC";
import { SignOutUserAC } from "#application/Identity/Command/SignOutUserAC";
import { GetCurrentUserAQ } from "#application/Identity/Query/GetCurrentUserAQ";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
import { OriginNotAllowedException } from "#domain/SharedKernel/Exception/OriginNotAllowedException";
import { UnsupportedMediaTypeException } from "#domain/SharedKernel/Exception/UnsupportedMediaTypeException";
import { RateLimitExceededException } from "#domain/SharedKernel/Exception/RateLimitExceededException";
import { RegistrationRateLimiter } from "#entrypoint/RegistrationRateLimiter";

/** HTTP authentication mapping, cookies and CSRF controls; no credential rules. */
export class AuthenticationController {
  private readonly limiter = new RegistrationRateLimiter(10, 60_000);
  /** @param signIn - Login orchestration. @param current - Protected account query. @param signOut - Revocation orchestration. @param origin - Exact frontend origin. @param secure - HTTPS cookie flag. */
  public constructor(private readonly signIn: Pick<SignInUserUC, "execute">,
    private readonly current: Pick<GetCurrentUserUC, "execute">,
    private readonly signOut: Pick<SignOutUserUC, "execute">,
    private readonly origin: string, private readonly secure: boolean) {}

  /** @param request - Untrusted cookie headers. @returns The single credential or empty when ambiguous/malformed. */
  public cookie(request: Pick<Request, "headers">): string {
    const matches = (request.headers.cookie ?? "").split(";").map(s => s.trim()).filter(s => s.startsWith("roombook_session="));
    if (matches.length !== 1) return "";
    const value = matches[0]!.slice("roombook_session=".length);
    return /^[A-Za-z0-9_.-]{1,2048}$/.test(value) ? value : "";
  }

  /** @param body - Untrusted JSON. @returns Only exact credential strings. @throws InvalidRequestBodyException For malformed/extra fields. */
  public credentials(body: unknown): { email: string; password: string } {
    if (typeof body !== "object" || body === null || Array.isArray(body) ||
        Object.keys(body).length !== 2 || !("email" in body) || !("password" in body) ||
        typeof body.email !== "string" || typeof body.password !== "string") throw new InvalidRequestBodyException();
    return { email: body.email, password: body.password };
  }

  /** @returns Routes ready to mount before the final error responder. */
  public routes(): Router {
    const router = express.Router();
    const options: CookieOptions = { httpOnly: true, sameSite: "strict", secure: this.secure, path: "/api" };
    router.use((_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });
    router.use((request, response, next) => {
      if (request.method !== "POST") { next(); return; }
      try {
        if (request.get("origin") !== this.origin || request.get("sec-fetch-site") === "cross-site") throw new OriginNotAllowedException();
        if (request.path === "/login") {
          try { this.limiter.consume(request.socket.remoteAddress ?? "unknown"); }
          catch (error: unknown) {
            if (error instanceof RateLimitExceededException) response.set("Retry-After", "60");
            throw error;
          }
        }
        if (!request.is("application/json")) throw new UnsupportedMediaTypeException();
        next();
      } catch (error: unknown) { next(error); }
    });
    router.use(express.json({ limit: "8kb", strict: true, inflate: false }));
    router.post("/login", async (request, response, next) => {
      try {
        const input = this.credentials(request.body as unknown);
        const result = await this.signIn.execute(new SignInUserAC(input.email, input.password, this.cookie(request)));
        response.locals.actorId = result.user.id;
        response.cookie("roombook_session", result.token, { ...options, maxAge: 900_000 });
        response.json({ user: result.user });
      } catch (error: unknown) { next(error); }
    });
    router.get("/me", async (request, response, next) => {
      try { const user = await this.current.execute(new GetCurrentUserAQ(this.cookie(request))); response.locals.actorId = user.id; response.json({ user }); }
      catch (error: unknown) { next(error); }
    });
    router.post("/logout", async (request, response, next) => {
      try {
        const body: unknown = request.body;
        if (typeof body !== "object" || body === null || Array.isArray(body) || Object.keys(body).length !== 0) throw new InvalidRequestBodyException();
        await this.signOut.execute(new SignOutUserAC(this.cookie(request)));
        response.clearCookie("roombook_session", options);
        response.sendStatus(204);
      } catch (error: unknown) { next(error); }
    });
    return router;
  }
}
