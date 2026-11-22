import { HttpTelemetry } from "#infrastructure/Transport/HttpTelemetry";
import { EventEmitter } from "node:events";
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Request, Response } from "express";

describe("HttpTelemetry", () => {
  const dirs: string[] = [];
  afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });
  function journal(size = 1000000) {
    const dir = mkdtempSync(join(tmpdir(), "roombook-audit-")); dirs.push(dir);
    const path = join(dir, "audit.jsonl"); return { path, dir, service: new HttpTelemetry(path, size, 2) };
  }
  function request(service: HttpTelemetry, status = 200, route = "/login") {
    const res = Object.assign(new EventEmitter(), { locals: {}, statusCode: status, set: jest.fn() });
    const req = { method: "POST", route: { path: route }, path: "/api/auth/login", socket: { remoteAddress: "127.0.0.1" },
      body: { password: "DoNotLogThis" }, headers: { authorization: "Bearer SecretToken", cookie: "PrivateCookie" }, query: { secret: "PrivateQuery" } };
    const next = jest.fn(); service.middleware()(req as unknown as Request, res as unknown as Response, next);
    expect(next).toHaveBeenCalledTimes(1); res.emit("finish"); return res;
  }
  it("selects metadata, generates correlation IDs and excludes credentials", () => {
    const { service, path } = journal(); const res = request(service);
    const text = readFileSync(path, "utf8"); const event = JSON.parse(text);
    expect(text).not.toMatch(/DoNotLogThis|SecretToken|PrivateCookie|PrivateQuery/);
    expect(event).toMatchObject({ actorId: "anonymous", route: "/login", status: 200, level: "INFO" });
    expect(event.requestId).toMatch(/^[a-f0-9-]{36}$/); expect(res.set).toHaveBeenCalledWith("X-Request-ID", event.requestId);
    expect(statSync(path).mode & 0o777).toBe(0o600);
  });
  it("emits one threshold alert for five denied logins in a minute", () => {
    const { service, path } = journal(); for (let i = 0; i < 7; i++) request(service, 401);
    const events = readFileSync(path, "utf8").trim().split("\n").map(line => JSON.parse(line));
    expect(events.filter(e => e.event === "monitor.threshold")).toHaveLength(1);
    expect(service.snapshot()).toMatchObject({ failedLogins: 7, serverErrors: 0 });
  });
  it("rotates journals with a fixed archive limit", () => {
    const { service, dir } = journal(500); for (let i = 0; i < 10; i++) request(service);
    expect(readdirSync(dir).sort()).toEqual(["audit.jsonl", "audit.jsonl.1", "audit.jsonl.2"]);
  });
  it("expires samples from the monitoring window", () => {
    const { service } = journal(); const clock = jest.spyOn(Date, "now").mockReturnValue(100000);
    request(service, 503); expect(service.snapshot().serverErrors).toBe(1);
    clock.mockReturnValue(160001); expect(service.snapshot().requests).toBe(0);
  });
});
