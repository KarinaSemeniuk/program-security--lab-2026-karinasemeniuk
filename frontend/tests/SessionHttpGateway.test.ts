import { SessionHttpGateway } from "#ui-infrastructure/Transport/SessionHttpGateway";
import { SessionUC } from "#ui-application/Identity/UseCase/SessionUC";

describe("session client", () => {
  const gateway = new SessionHttpGateway("");
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  beforeEach(() => { fetchMock = jest.spyOn(globalThis, "fetch"); });
  afterEach(() => fetchMock.mockReset());
  const user = { id: "id", email: "user@example.test", role: "USER", createdAt: "2026-10-30" };
  it("uses cookies and sends the exact password only on login", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ user }), { status: 200 }));
    expect(await gateway.signIn("user@example.test", " пароль ")).toEqual({ status: "authenticated", user });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ credentials: "include", body: JSON.stringify({ email: "user@example.test", password: " пароль " }) }));
  });
  it("distinguishes anonymous session from rejected credentials", async () => {
    fetchMock.mockImplementation(async () => new Response("", { status: 401 }));
    expect(await gateway.current()).toEqual({ status: "anonymous" });
    expect(await gateway.signIn("x", "x")).toMatchObject({ status: "failed", message: "Невірний email або пароль." });
  });
  it("reports retry interval and successful logout", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 429, headers: { "Retry-After": "60" } }));
    expect(await gateway.signIn("x", "x")).toMatchObject({ status: "failed", retryAfterSeconds: 60 });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect(await gateway.signOut()).toEqual({ status: "signedOut" });
  });
  it("does not declare successful logout on server/network failure", async () => {
    fetchMock.mockResolvedValueOnce(new Response("private failure", { status: 503 }));
    expect(await gateway.signOut()).toMatchObject({ status: "failed" });
    fetchMock.mockRejectedValueOnce(new Error("private connection info"));
    expect(await gateway.signOut()).toMatchObject({ status: "failed" });
  });
  it("rejects malformed account data", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ user: { passwordHash: "private" } }), { status: 200 }));
    expect(await gateway.current()).toMatchObject({ status: "failed" });
  });
  it("checks required inputs before transport", async () => {
    const session = new SessionUC(gateway);
    expect(await session.signIn(" ", "x")).toMatchObject({ status: "failed" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
