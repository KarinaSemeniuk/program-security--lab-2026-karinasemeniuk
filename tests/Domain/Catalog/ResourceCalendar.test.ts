import { ResourceCalendarVO } from "#domain/Catalog/ValueObject/ResourceCalendarVO";
import { ZonedCalendarService } from "#domain/Catalog/Service/ZonedCalendarService";
import { Resource } from "#domain/Catalog/Entity/Resource";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { SlotDurationVO } from "#domain/Catalog/ValueObject/SlotDurationVO";
import { ComputeAvailableSlotsService } from "#domain/Catalog/Service/ComputeAvailableSlotsService";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { InvalidResourceCalendarException } from "#domain/Catalog/Exception/InvalidResourceCalendarException";
const range=(a:string,b:string)=>new TimeRangeVO(a,b);
const weekly=()=>Array.from({length:7},()=>({open:540,close:1080}));
describe("domain.catalog.resource calendar",()=>{
  const dates=new ZonedCalendarService();
  it("resolves 23/25-hour DST days to precise UTC boundaries",()=>{
    expect(dates.day("2026-03-29","Europe/Kyiv").durationMs()).toBe(23*3600_000);
    expect(dates.day("2026-10-25","Europe/Kyiv").durationMs()).toBe(25*3600_000);
    expect(dates.day("2026-11-01","UTC").durationMs()).toBe(24*3600_000);
    expect(dates.day("2026-11-01","Asia/Kathmandu").getStart().toISOString()).toBe("2026-10-31T18:15:00.000Z");
  });
  it.each([()=>dates.day("2026-02-30","UTC"),()=>dates.day("2026-11-01","Invalid/Zone"),()=>dates.day("2011-12-30","Pacific/Apia"),()=>new ResourceCalendarVO("UTC",[]),()=>new ResourceCalendarVO("UTC",weekly(),["2026-02-30"]),()=>new ResourceCalendarVO("UTC",weekly(),["2026-11-01","2026-11-01"]),()=>new ResourceCalendarVO("UTC",[{open:600,close:500},...weekly().slice(1)])])("rejects invalid or missing civil configuration",invalid=>expect(invalid).toThrow(InvalidResourceCalendarException));
  it("honors half-open windows, closed days and holidays without mutating input",()=>{
    const hours=weekly();hours[0]={open:0,close:0};const closed=["2026-11-03"];
    const calendar=new ResourceCalendarVO("UTC",hours,closed);hours[1]={open:0,close:1440};closed.length=0;
    expect(calendar.allows(range("2026-11-02T09:00:00.000Z","2026-11-02T18:00:00.000Z"))).toBe(true);
    expect(calendar.allows(range("2026-11-02T08:30:00.000Z","2026-11-02T09:30:00.000Z"))).toBe(false);
    expect(calendar.allows(range("2026-11-02T17:30:00.000Z","2026-11-02T18:30:00.000Z"))).toBe(false);
    expect(calendar.allows(range("2026-11-01T10:00:00.000Z","2026-11-01T11:00:00.000Z"))).toBe(false);
    expect(calendar.allows(range("2026-11-03T10:00:00.000Z","2026-11-03T11:00:00.000Z"))).toBe(false);
    calendar.getWeekly()[1]={open:0,close:1440};calendar.getClosedDates().pop();expect(calendar.getWeekly()[1]!.open).toBe(540);expect(calendar.getClosedDates()).toHaveLength(1);
  });
  it("includes daily UTC-grid bookings in a non-UTC local day and checks spillover occupancy",()=>{
    const resource=new Resource(new ResourceIdVO("11111111-1111-4111-8111-111111111111"),"Room",4,new SlotDurationVO(1440));
    const day=dates.day("2026-11-02","Europe/Kyiv");const slots=new ComputeAvailableSlotsService().compute(resource,day,[],new Date("2026-10-01T00:00:00Z"));
    expect(slots).toHaveLength(1);expect(slots[0]!.startAt).toBe("2026-11-02T00:00:00.000Z");expect(slots[0]!.available).toBe(true);
    const occupied=[range("2026-11-02T23:00:00.000Z","2026-11-02T23:30:00.000Z")];expect(new ComputeAvailableSlotsService().compute(resource,day,occupied,new Date("2026-10-01T00:00:00Z"))[0]!.available).toBe(false);
  });
});
