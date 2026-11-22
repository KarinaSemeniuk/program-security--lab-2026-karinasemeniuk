import { WorkspaceHttpGateway } from "#ui-infrastructure/Transport/WorkspaceHttpGateway";
describe("Private note transport", () => {
  let fetchMock: jest.SpiedFunction<typeof fetch>; const gateway = new WorkspaceHttpGateway("");
  beforeEach(() => { fetchMock = jest.spyOn(globalThis, "fetch"); });
  it("sends exact note/revision using cookies without accepting role/owner fields", async () => {
    const note = { text: " note ", revision: 2, updatedAt: "2026-10-30" };
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ note }), { status: 200 }));
    expect(await gateway.saveNote("id", " note ", 1)).toEqual({ status: "ok", data: note });
    expect(fetchMock).toHaveBeenCalledWith("/api/bookings/id/private-note", expect.objectContaining({ credentials: "include", body: JSON.stringify({ text: " note ", revision: 1 }) }));
  });
  it.each([[409, "RB.BKG.11"], [422, "RB.INF.10"]])("maps integrity/conflict failure without arbitrary server text", async (status, code) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { code, message: "private diagnostic" } }), { status: status as number }));
    const result = await gateway.getNote("id"); expect(result.status).toBe("failed"); expect(JSON.stringify(result)).not.toContain("private diagnostic");
  });
});
