import { Response } from "express";
import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { HttpRequestHandlingException } from "#domain/SharedKernel/Exception/HttpRequestHandlingException";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
import { RequestBodyTooLargeException } from "#domain/SharedKernel/Exception/RequestBodyTooLargeException";
import { UnsupportedMediaTypeException } from "#domain/SharedKernel/Exception/UnsupportedMediaTypeException";

/** Central HTTP projection of safe, stable project failures. */
export class HttpErrorResponder {
  /**
   * Wraps parser failures and hides foreign exception details.
   * @param error - Domain, infrastructure or transport failure.
   * @returns A project exception safe for public projection.
   */
  public normalize(error: unknown): ARoomBookException {
    if (error instanceof ARoomBookException) return error;
    if (typeof error === "object" && error !== null && "type" in error) {
      if (error.type === "entity.too.large") return new RequestBodyTooLargeException();
      if (error.type === "entity.parse.failed") return new InvalidRequestBodyException();
      if (error.type === "encoding.unsupported" || error.type === "charset.unsupported") {
        return new UnsupportedMediaTypeException();
      }
    }
    return new HttpRequestHandlingException();
  }

  /**
   * Maps project failures to HTTP status codes without leaking technical details.
   * @param error - Failure whose internal cause must remain private.
   * @returns The HTTP status used by the response envelope.
   */
  public status(error: unknown): number {
    const code = this.normalize(error).getCode();
    const explicit: Readonly<Record<string, number>> = {
      "RB.INF.13": 422, "RB.INF.14": 503,
      "RB.LIC.1": 403, "RB.LIC.2": 403, "RB.LIC.3": 403,
      "RB.BKG.10": 400, "RB.BKG.11": 409, "RB.INF.9": 503, "RB.INF.10": 422, "RB.INF.11": 503, "RB.INF.12": 503,
      "RB.CAT.6": 400, "RB.BKG.12": 409, "RB.BKG.13": 409, "RB.CAT.4": 400, "RB.CAT.5": 409, "RB.CAT.1": 400, "RB.CAT.2": 404, "RB.CAT.3": 403,
      "RB.BKG.1": 400, "RB.BKG.2": 409, "RB.BKG.3": 409, "RB.BKG.4": 400,
      "RB.BKG.5": 400, "RB.BKG.6": 404, "RB.BKG.7": 403, "RB.BKG.8": 409, "RB.BKG.9": 409,
      "RB.INF.7": 503, "RB.INF.8": 503,
      "RB.CORE.1": 400, "RB.CORE.2": 404, "RB.CORE.3": 413,
      "RB.CORE.4": 415, "RB.CORE.7": 400, "RB.CORE.8": 403,
      "RB.CORE.9": 429, "RB.IDN.1": 400, "RB.IDN.2": 400,
      "RB.IDN.3": 400, "RB.IDN.4": 400, "RB.IDN.5": 400,
      "RB.IDN.12": 403, "RB.IDN.13": 409, "RB.IDN.14": 404, "RB.IDN.15": 400, "RB.IDN.10": 401, "RB.IDN.11": 401, "RB.IDN.6": 409, "RB.INF.1": 503, "RB.INF.2": 503, "RB.INF.3": 503,
    };
    return explicit[code] ?? 500;
  }

  /**
   * Writes the single public API error envelope.
   * @param error - Failure to normalize and project.
   * @param response - Express response owned by EntryPoint.
   */
  public respond(error: unknown, response: Response): void {
    const normalized = this.normalize(error);
    const status = this.status(normalized);
    response.locals.errorCode = normalized.getCode();
    if (status === 429 && !response.hasHeader("Retry-After")) response.set("Retry-After", "900");
    response.status(status).json({
      error: { code: normalized.getCode(), message: normalized.getPublicMessage() },
    });
  }
}
