import { ListMyBookingsAQ } from "#application/Booking/Query/ListMyBookingsAQ";
import { BookingDTO } from "#application/Booking/Dto/BookingDTO";
import { IBookingRepository } from "#domain/Booking/OutsourceContract/IBookingRepository";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
/** Owner-scoped history query. */
export class ListMyBookingsUC {
  /** @param bookings - Persistence. */
  public constructor(private readonly bookings: IBookingRepository) {}
  /** @param query - Server actor and page. @returns Own page and count. @throws ARoomBookException On invalid/storage failure. */
  public async execute(query: ListMyBookingsAQ): Promise<{ bookings: BookingDTO[]; total: number }> {
    if (!Number.isInteger(query.page) || query.page < 0 || query.page > 10000) throw new InvalidRequestBodyException();
    if (!["all","upcoming","past","cancelled"].includes(query.filter)) throw new InvalidRequestBodyException();
    const result = query.filter === "all" ? await this.bookings.mine(query.actor.id,query.page) : await this.bookings.mine(query.actor.id, query.page, query.filter as "upcoming"|"past"|"cancelled");
    return { bookings: result.bookings.map(booking => new BookingDTO(booking, result.resourceNames[booking.getResourceId()] ?? "")), total: result.total };
  }
}
