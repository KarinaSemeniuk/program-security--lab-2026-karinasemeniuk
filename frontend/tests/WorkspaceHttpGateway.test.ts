import { WorkspaceHttpGateway } from "#ui-infrastructure/Transport/WorkspaceHttpGateway";
describe("workspace transport",()=>{
 let fetchMock:jest.SpiedFunction<typeof fetch>;
 beforeEach(()=>{fetchMock=jest.spyOn(globalThis,"fetch");});
 const gateway=new WorkspaceHttpGateway("");
 it("uses only explicit creation fields and cookie credentials",async()=>{
  fetchMock.mockResolvedValue(new Response(JSON.stringify({booking:{id:"b",resourceId:"r",resourceName:"Кімната",userId:"u",startAt:"s",endAt:"e",status:"CONFIRMED",createdAt:"c"}}),{status:201}));
  expect((await gateway.book("r","s","e")).status).toBe("ok");
  expect(fetchMock).toHaveBeenCalledWith("/api/bookings",expect.objectContaining({credentials:"include",body:JSON.stringify({resourceId:"r",startAt:"s",endAt:"e"})}));
 });
 it.each([[401,"Сеанс"],[403,"Недостатньо"],[429,"Забагато"]])("maps access/rate failure %p safely",async(status,fragment)=>{
  fetchMock.mockResolvedValue(new Response(JSON.stringify({error:{message:"private database password"}}),{status:status as number}));
  const result=await gateway.mine(0);expect(result).toMatchObject({status:"failed",message:expect.stringContaining(fragment as string)});
  expect(JSON.stringify(result)).not.toContain("private");
 });
 it("rejects malformed public data",async()=>{
  fetchMock.mockResolvedValue(new Response(JSON.stringify({resources:[{passwordHash:"private"}]}),{status:200}));
  expect((await gateway.resources(false)).status).toBe("failed");
 });
 it("reports network failure without leaking details",async()=>{
  fetchMock.mockRejectedValue(new Error("private network detail"));
  expect(await gateway.resources(false)).toMatchObject({status:"failed",unauthorized:false});
 });
});
