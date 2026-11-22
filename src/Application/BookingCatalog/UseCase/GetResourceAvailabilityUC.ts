import { ZonedCalendarService } from "#domain/Catalog/Service/ZonedCalendarService";
import { GetResourceAvailabilityAQ } from "#application/BookingCatalog/Query/GetResourceAvailabilityAQ";
import { IResourceRepository } from "#domain/Catalog/OutsourceContract/IResourceRepository";
import { IBookingRepository } from "#domain/Booking/OutsourceContract/IBookingRepository";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { ComputeAvailableSlotsService } from "#domain/Catalog/Service/ComputeAvailableSlotsService";
import { ResourceNotFoundException } from "#domain/Catalog/Exception/ResourceNotFoundException";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Cross-context read joins only anonymous intervals with Catalog configuration. */
export class GetResourceAvailabilityUC {
  /** @param resources - Catalog. @param bookings - Anonymous interval query. */
  public constructor(private readonly resources: IResourceRepository, private readonly bookings: IBookingRepository) {}
  /** @param query - Resource UUID, civil YYYY-MM-DD and IANA display zone. @returns Anonymous availability grid. @throws ARoomBookException On invalid/missing/storage failure. */
  public async execute(query: GetResourceAvailabilityAQ): Promise<{ startAt: string; endAt: string; available: boolean }[]> {
    try { new ZonedCalendarService().assertDate(query.date); } catch { throw new InvalidRequestBodyException(); }
    const range = new ZonedCalendarService().day(query.date, query.timeZone);
    const resource = await this.resources.find(new ResourceIdVO(query.resourceId).getValue());
    if (!resource || !resource.isActive()) throw new ResourceNotFoundException();
    return new ComputeAvailableSlotsService().compute(resource, range, await this.bookings.occupied(query.resourceId, new TimeRangeVO(range.getStart().toISOString(),new Date(range.getEnd().getTime()+resource.getSlot().getValue()*60_000).toISOString())), new Date());
  }
}
