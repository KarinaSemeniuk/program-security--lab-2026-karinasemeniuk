import { RegistrationHttpGateway } from "#ui-infrastructure/Transport/RegistrationHttpGateway";

describe("frontend.infrastructure", () => {
  describe("transport.infrastructure", () => {
    describe("RegistrationHttpGateway", () => {
      const user = {
        id: "11111111-1111-4111-8111-111111111111", email: "user@example.test",
        role: "USER", createdAt: "2026-10-30T00:00:00Z",
      };
      let request: jest.Mock<ReturnType<typeof fetch>, Parameters<typeof fetch>>;
      let gateway: RegistrationHttpGateway;
      beforeEach(() => {
        request = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
        gateway = new RegistrationHttpGateway("", request);
      });
      const credentials = { email: "user@example.test", password: "cedar river fog" };
      it("sends exactly the explicit registration fields and selects only the public response", async () => {
        request.mockResolvedValue(new Response(JSON.stringify({ user: { ...user, passwordHash: "hidden" } }), { status: 201 }));
        await expect(gateway.register(credentials)).resolves.toEqual({ status: "created", user });
        expect(request).toHaveBeenCalledWith("/api/auth/register", expect.objectContaining({
          method: "POST", credentials: "omit", referrerPolicy: "no-referrer",
          body: JSON.stringify(credentials),
        }));
      });
      it("rejects a nonstandard role in a creation response", async () => {
        request.mockResolvedValue(new Response(JSON.stringify({ user: { ...user, role: "ADMIN" } }), { status: 201 }));
        await expect(gateway.register(credentials)).resolves.toMatchObject({ status: "failed", reason: "unexpected" });
      });
      it("rejects incomplete public data", async () => {
        request.mockResolvedValue(new Response(JSON.stringify({ user: { email: user.email } }), { status: 201 }));
        await expect(gateway.register(credentials)).resolves.toMatchObject({ status: "failed", reason: "unexpected" });
      });
      it("classifies a duplicate email", async () => {
        request.mockResolvedValue(new Response("{}", { status: 409 }));
        await expect(gateway.register(credentials)).resolves.toMatchObject({ status: "failed", reason: "conflict", field: "email" });
      });
      it("uses only known public codes rather than rendering server messages", async () => {
        request.mockResolvedValue(new Response(JSON.stringify({ error: { code: "RB.IDN.4", message: "private unexpected detail" } }), { status: 400 }));
        const result = await gateway.register(credentials);
        expect(result).toMatchObject({ status: "failed", reason: "rejected", field: "password" });
        expect(JSON.stringify(result)).not.toContain("private unexpected detail");
      });
      it("preserves a bounded retry delay", async () => {
        request.mockResolvedValue(new Response("{}", { status: 429, headers: { "Retry-After": "120" } }));
        await expect(gateway.register(credentials)).resolves.toMatchObject({ status: "failed", reason: "rate-limit", retryAfterSeconds: 120 });
      });
      it("replaces an invalid retry delay with the documented default", async () => {
        request.mockResolvedValue(new Response("{}", { status: 429, headers: { "Retry-After": "-1" } }));
        await expect(gateway.register(credentials)).resolves.toMatchObject({ retryAfterSeconds: 900 });
      });
      it("normalizes backend failure without parsing or rendering technical details", async () => {
        request.mockResolvedValue(new Response("private database detail", { status: 503 }));
        const result = await gateway.register(credentials);
        expect(result).toMatchObject({ status: "failed", reason: "server" });
        expect(JSON.stringify(result)).not.toContain("private database detail");
      });
      it("normalizes a malformed response", async () => {
        request.mockResolvedValue(new Response("not JSON", { status: 201 }));
        await expect(gateway.register(credentials)).resolves.toMatchObject({ status: "failed", reason: "unexpected" });
      });
      it("rejects an excessive response before JSON processing", async () => {
        request.mockResolvedValue(new Response("x".repeat(17_000), { status: 201 }));
        await expect(gateway.register(credentials)).resolves.toMatchObject({ status: "failed", reason: "unexpected" });
      });
      it("normalizes network failures", async () => {
        request.mockRejectedValue(new Error("private transport detail"));
        const result = await gateway.register(credentials);
        expect(result).toMatchObject({ status: "failed", reason: "network" });
        expect(JSON.stringify(result)).not.toContain("private transport detail");
      });
      it("rejects a credential-bearing API configuration before sending anything", async () => {
        gateway = new RegistrationHttpGateway("https://name:secret@example.test", request);
        await expect(gateway.register(credentials)).resolves.toMatchObject({ status: "failed", reason: "unexpected" });
        expect(request).not.toHaveBeenCalled();
      });
    });
  });
});
