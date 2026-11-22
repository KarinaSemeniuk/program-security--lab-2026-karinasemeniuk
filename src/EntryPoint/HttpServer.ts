import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { Server } from "node:http";
import { WorkspaceController } from "#entrypoint/WorkspaceController";
import { AuthenticationController } from "#entrypoint/AuthenticationController";
import { RegistrationController } from "#entrypoint/RegistrationController";
import { RegistrationRateLimiter } from "#entrypoint/RegistrationRateLimiter";
import { HttpErrorResponder } from "#entrypoint/HttpErrorResponder";
import { OriginNotAllowedException } from "#domain/SharedKernel/Exception/OriginNotAllowedException";
import { UnsupportedMediaTypeException } from "#domain/SharedKernel/Exception/UnsupportedMediaTypeException";
import { RouteNotFoundException } from "#domain/SharedKernel/Exception/RouteNotFoundException";
import { HttpRequestHandlingException } from "#domain/SharedKernel/Exception/HttpRequestHandlingException";

/** HTTP entry point exposing explicitly public health and registration routes. */
export class HttpServer {
  private readonly application: Express;
  // Absence represents the lifecycle stage before listen/after close.
  private listener: Server | null = null;

  /**
   * Wires transport controls independently from registration business logic.
   * @param registration - Registration request mapper and application caller.
   * @param corsOrigin - Exact configured frontend origin.
   * @param workspace - Catalog and reservation routes.
   * @param authentication - Optional authentication routes, supplied by production wiring.
   * @param limiter - Bounded, direct-client attempt limiter.
   */
  public constructor(
    registration: RegistrationController,
    corsOrigin: string,
    limiter = new RegistrationRateLimiter(),
    authentication?: AuthenticationController,
    workspace?: WorkspaceController,
  ) {
    this.application = express();
    this.application.disable("x-powered-by");
    this.application.set("trust proxy", false);
    const errors = new HttpErrorResponder();

    this.application.use((request, response, next) => {
      response.vary("Origin");
      if (request.path.startsWith("/api/")) response.set("Cache-Control", "no-store");
      const origin = request.get("origin");
      if (origin && origin !== corsOrigin) {
        next(new OriginNotAllowedException());
        return;
      }
      if (origin) { response.set("Access-Control-Allow-Origin", corsOrigin); response.set("Access-Control-Allow-Credentials", "true"); }
      if (request.method === "OPTIONS" && request.path.startsWith("/api/")) {
        response.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.set("Access-Control-Allow-Headers", "Content-Type");
        response.sendStatus(204);
        return;
      }
      next();
    });
    this.application.get("/health", (_request, response) => {
      response.status(200).json({ status: "ok", application: "RoomBook" });
    });
    this.application.post(
      "/api/auth/register",
      (request, _response, next) => {
        try {
          limiter.consume(request.socket.remoteAddress ?? "unknown");
          if (!request.is("application/json")) throw new UnsupportedMediaTypeException();
          next();
        } catch (error: unknown) { next(errors.normalize(error)); }
      },
      express.json({ limit: "8kb", strict: true, inflate: false }),
      async (request, response, next) => {
        try {
          const body: unknown = request.body;
          const user = await registration.register(body);
          response.set("Cache-Control", "no-store");
          response.status(201).json({ user });
        } catch (error: unknown) { next(errors.normalize(error)); }
      },
    );
    if (authentication) this.application.use("/api/auth", authentication.routes());
    if (workspace) this.application.use("/api", workspace.routes());
    this.application.use((_request, _response, next) => { next(new RouteNotFoundException()); });
    this.application.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
      errors.respond(error, response);
    });
  }

  /**
   * Binds the local listener after configuration and persistence are ready.
   * @param port - Validated API port.
   * @returns Completion after the listener is bound.
   * @throws HttpRequestHandlingException If the listener cannot start.
   */
  public async start(port: number): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      let started = false;
      try {
        const listener = this.application.listen(port, "127.0.0.1", () => {
          started = true;
          resolve();
        });
        this.listener = listener;
        listener.on("error", () => {
          const error = new HttpRequestHandlingException();
          if (!started) reject(error);
          else {
            console.error(error.getCode() + ": " + error.getPublicMessage());
            process.exitCode = 1;
          }
        });
      } catch { reject(new HttpRequestHandlingException()); }
    });
  }

  /**
   * Drains active requests before persistence is disconnected.
   * @returns Completion once the local listener is closed.
   * @throws HttpRequestHandlingException If the listener cannot close.
   */
  public async close(): Promise<void> {
    const listener = this.listener;
    if (!listener) return;
    await new Promise<void>((resolve, reject) => {
      listener.close((error) => {
        if (error) reject(new HttpRequestHandlingException());
        else resolve();
      });
    });
    this.listener = null;
  }
}
