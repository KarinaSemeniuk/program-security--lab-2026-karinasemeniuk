import { randomUUID } from "node:crypto";
import { closeSync, constants, existsSync, mkdirSync, openSync, renameSync, statSync, unlinkSync, writeSync } from "node:fs";
import { dirname } from "node:path";
import type { RequestHandler } from "express";

/** Bounded local audit journal. Only explicitly selected transport metadata can be written. */
export class HttpTelemetry {
  private samples: { at: number; status: number; login: boolean }[] = [];
  private lastAlert = 0;
  private writeFailures = 0;
  /** @param path - Private JSONL destination. @param maxBytes - Rotation size. @param archives - Retained completed files. @param chain - Optional single-writer integrity journal. */
  public constructor(private readonly path: string, private readonly maxBytes = 5 * 1024 * 1024, private readonly archives = 5,
    private readonly chain?: { append(data: Record<string, string | number>): unknown }) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  }
  private append(record: object): void {
    try {
      const line = JSON.stringify(record) + "\n";
      if (existsSync(this.path) && statSync(this.path).size + Buffer.byteLength(line) > this.maxBytes) {
        if (existsSync(this.path + "." + this.archives)) unlinkSync(this.path + "." + this.archives);
        for (let i = this.archives - 1; i >= 1; i--) {
          if (existsSync(this.path + "." + i)) renameSync(this.path + "." + i, this.path + "." + (i + 1));
        }
        renameSync(this.path, this.path + ".1");
      }
      const fd = openSync(this.path, constants.O_WRONLY | constants.O_APPEND | constants.O_CREAT | constants.O_NOFOLLOW, 0o600);
      try { writeSync(fd, line); } finally { closeSync(fd); }
    } catch {
      this.writeFailures++;
      if (this.writeFailures === 1) console.error("RoomBook audit journal is unavailable.");
    }
  }
  /** @returns Bounded last-minute availability and failure counters, with logging health. */
  public snapshot(): { requests: number; failedLogins: number; serverErrors: number; writeFailures: number } {
    const since = Date.now() - 60_000;
    this.samples = this.samples.filter(sample => sample.at >= since);
    return { requests: this.samples.length, failedLogins: this.samples.filter(sample => sample.login && sample.status === 401).length,
      serverErrors: this.samples.filter(sample => sample.status >= 500).length, writeFailures: this.writeFailures };
  }
  /** @returns Middleware which records completed requests without bodies, credentials or query parameters. */
  public middleware(): RequestHandler {
    return (request, response, next) => {
      const id = randomUUID();
      const start = process.hrtime.bigint();
      response.set("X-Request-ID", id);
      response.once("finish", () => {
        const known = request.route as { path?: unknown } | undefined;
        const route = typeof known?.path === "string" ? known.path : "unmatched";
        const method = ["GET", "POST", "OPTIONS", "HEAD", "PUT", "PATCH", "DELETE"].includes(request.method) ? request.method : "OTHER";
        const actor = typeof response.locals.actorId === "string" && /^[a-f0-9-]{36}$/i.test(response.locals.actorId) ? response.locals.actorId : "anonymous";
        const status = response.statusCode;
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const time = new Date().toISOString();
        const code = typeof response.locals.errorCode === "string" ? response.locals.errorCode : "";
        const objectId = request.path.match(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(?:\/|$)/i)?.[0].replaceAll("/", "") || "";
        const sourceIp = request.socket.remoteAddress || "unknown";
        this.append({ time, level: status >= 500 ? "ERROR" : status >= 400 ? "WARNING" : "INFO", event: "http.completed",
          requestId: id, actorId: actor, objectId, sourceIp, method, route, status, durationMs: Math.round(durationMs * 100) / 100, code });
        if (method === "POST" && status >= 200 && status < 300 && this.chain) {
          try { this.chain.append({ requestId: id, actorId: actor, objectId, method, route, status }); }
          catch { this.append({ time, level: "ERROR", event: "ledger.write-failed", requestId: id }); }
        }
        this.samples.push({ at: Date.now(), status, login: route === "/login" });
        if (this.samples.length > 10000) this.samples.shift();
        const metrics = this.snapshot();
        if ((metrics.failedLogins >= 5 || metrics.serverErrors >= 3) && Date.now() - this.lastAlert >= 60_000) {
          this.lastAlert = Date.now();
          this.append({ time, level: "WARNING", event: "monitor.threshold", requestId: id, ...metrics });
        }
      });
      next();
    };
  }
}
