import { ListBookingsForResourceAQ } from "#application/BookingCatalog/Query/ListBookingsForResourceAQ";
import { BookingDTO } from "#application/Booking/Dto/BookingDTO";
import { IBookingRepository } from "#domain/Booking/OutsourceContract/IBookingRepository";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { BookingAccessDeniedException } from "#domain/Booking/Exception/BookingAccessDeniedException";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Admin-only resource history, including inactive resources. */
export class ListBookingsForResourceUC {
  /** @param bookings - Persistence. */
  public constructor(private readonly bookings: IBookingRepository) {}
  /** @param query - Current admin and bounded range. @returns History page. @throws ARoomBookException On denied/invalid/storage failure. */
  public async execute(query: ListBookingsForResourceAQ): Promise<{ bookings: BookingDTO[]; total: number }> {
    if (query.actor.role !== "ADMIN") throw new BookingAccessDeniedException();
    const id = new ResourceIdVO(query.resourceId).getValue(); const range = new TimeRangeVO(query.startAt, query.endAt);
    if (range.durationMs() > 31 * 86400_000 || !Number.isInteger(query.page) || query.page < 0 || query.page > 10000) throw new InvalidRequestBodyException();
    const result = await this.bookings.forResource(id, range, query.page);
    return { bookings: result.bookings.map(booking => new BookingDTO(booking, result.resourceNames[booking.getResourceId()] ?? "")), total: result.total };
  }
}
