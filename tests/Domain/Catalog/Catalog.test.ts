import { Resource } from "#domain/Catalog/Entity/Resource";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { SlotDurationVO } from "#domain/Catalog/ValueObject/SlotDurationVO";
import { InvalidResourceException } from "#domain/Catalog/Exception/InvalidResourceException";
import { ComputeAvailableSlotsService } from "#domain/Catalog/Service/ComputeAvailableSlotsService";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
const id = new ResourceIdVO("11111111-1111-4111-8111-111111111111");
describe("Catalog invariants", () => {
  it.each([0,-1,7,NaN,1.5,1441])("rejects invalid slot %p", value => expect(() => new SlotDurationVO(value)).toThrow(InvalidResourceException));
  it.each([1,5,30,90,1440])("accepts divisors %p", value => expect(new SlotDurationVO(value).getValue()).toBe(value));
  it.each([["",1],[" x",1],["x",0],["x",1001],["x",1.5],["x\n",1],["a".repeat(101),1]])("rejects invalid resource fields", (name, capacity) => {
    expect(() => new Resource(id, name as string, capacity as number, new SlotDurationVO(30))).toThrow(InvalidResourceException);
  });
  it("deactivates while preserving configuration and identity", () => {
    const resource = new Resource(id,"Кімната",4,new SlotDurationVO(30)); resource.deactivate();
    expect(resource.isActive()).toBe(false); expect(resource.getId()).toBe(id); expect(resource.getName()).toBe("Кімната");
  });
  it("computes anonymous slots with adjacent boundaries and past protection", () => {
    const resource = new Resource(id,"Кімната",4,new SlotDurationVO(30));
    const day = new TimeRangeVO("2026-11-01T00:00:00.000Z","2026-11-02T00:00:00.000Z");
    const occupied = [new TimeRangeVO("2026-11-01T01:00:00.000Z","2026-11-01T02:00:00.000Z")];
    const slots = new ComputeAvailableSlotsService().compute(resource,day,occupied,new Date("2026-11-01T00:00:00.000Z"));
    expect(slots).toHaveLength(48);
    expect(slots.slice(0,5).map(slot=>slot.available)).toEqual([false,true,false,false,true]);
    expect(Object.keys(slots[0]!)).toEqual(["startAt","endAt","available"]);
  });
});
