import { WorkspaceHttpGateway } from "#ui-infrastructure/Transport/WorkspaceHttpGateway";
const resource = { id: "r", name: "Кімната", capacity: 4, minSlotMinutes: 30, isActive: true, type: "ROOM" as const, description: "Опис", location: "Зона А", equipment: ["Wi-Fi"], revision: 2, timeZone:"Europe/Kyiv",weekly:Array.from({length:7},()=>({open:0,close:1440})),closedDates:[] };
describe("frontend.infrastructure.resource transport", () => {
  let fetchMock: jest.SpiedFunction<typeof fetch>;
  const gateway = new WorkspaceHttpGateway("");
  beforeEach(() => { fetchMock = jest.spyOn(globalThis, "fetch"); });
  it("validates the extended response and chooses the Admin detail route explicitly", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ resource }), { status: 200 }));
    expect(await gateway.resourceDetails("r", true)).toEqual({ status: "ok", data: resource });
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/resources/r", expect.objectContaining({ credentials: "include", method: "GET" }));
  });
  it.each([{...resource, revision:-1}, {...resource, type:"HOTEL"}, {...resource, equipment:[42]}, {...resource, revision:1.5}])("rejects malformed detail responses", async invalid => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({resource:invalid}), {status:200}));
    expect((await gateway.resourceDetails("r", false)).status).toBe("failed");
  });
  it("sends only metadata and the observed revision when updating", async () => {
    const { id, minSlotMinutes, isActive, revision, timeZone, weekly, closedDates, ...draft } = resource;
    fetchMock.mockResolvedValue(new Response(JSON.stringify({resource}), {status:200}));
    await gateway.updateResource(id, draft, revision);
    expect(fetchMock).toHaveBeenCalledWith("/api/resources/r/update", expect.objectContaining({ method:"POST", body:JSON.stringify({...draft, revision}) }));
  });
  it("maps stale-resource failures to an actionable message without server text", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({error:{code:"RB.CAT.5",message:"private failure"}}), {status:409}));
    const result = await gateway.reactivate("r", 1);
    expect(result).toMatchObject({status:"failed",message:expect.stringContaining("Перезавантажити дані")});
    expect(JSON.stringify(result)).not.toContain("private failure");
  });
});
