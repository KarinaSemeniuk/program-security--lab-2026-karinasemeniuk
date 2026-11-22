import { CreateBookingAC } from "#application/BookingCatalog/Command/CreateBookingAC";
import { BookingDTO } from "#application/Booking/Dto/BookingDTO";
import { IResourceRepository } from "#domain/Catalog/OutsourceContract/IResourceRepository";
import { IBookingRepository } from "#domain/Booking/OutsourceContract/IBookingRepository";
import { CreateBookingService } from "#domain/Booking/Service/CreateBookingService";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { ResourceNotFoundException } from "#domain/Catalog/Exception/ResourceNotFoundException";
/** Cross-context creation orchestration; persistence revalidates under lock. */
export class CreateBookingUC {
  /** @param resources - Catalog configuration. @param bookings - Atomic persistence. @param service - Domain creation. */
  public constructor(private readonly resources: IResourceRepository, private readonly bookings: IBookingRepository, private readonly service: CreateBookingService) {}
  /** @param command - Server-resolved actor and interval. @returns Persisted booking. @throws ARoomBookException On validation/conflict/storage failure. */
  public async execute(command: CreateBookingAC): Promise<BookingDTO> {
    const id = new ResourceIdVO(command.resourceId).getValue();
    const resource = await this.resources.find(id); if (!resource) throw new ResourceNotFoundException();
    const range = new TimeRangeVO(command.startAt, command.endAt);
    const occupied = await this.bookings.occupied(id, range);
    const booking = this.service.create(command.actor.id, { id, name: resource.getName(), isActive: resource.isActive(), minSlotMinutes: resource.getSlot().getValue(), isOpen: resource.getCalendar().allows(range) }, range, occupied, new Date());
    await this.bookings.place(booking); return new BookingDTO(booking, resource.getName());
  }
}
