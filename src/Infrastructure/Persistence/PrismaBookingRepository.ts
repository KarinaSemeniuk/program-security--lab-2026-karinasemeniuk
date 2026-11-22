import { ResourceCalendarMapper } from "#infrastructure/Persistence/ResourceCalendarMapper";
import { PrismaClient, Prisma, type BookingModel } from "@prisma/client";
import { Booking } from "#domain/Booking/Entity/Booking";
import { BookingIdVO } from "#domain/Booking/ValueObject/BookingIdVO";
import { BookingStatus } from "#domain/Booking/Enum/BookingStatus";
import { IBookingRepository } from "#domain/Booking/OutsourceContract/IBookingRepository";
import { IBookingEventDispatcher } from "#domain/Booking/OutsourceContract/IBookingEventDispatcher";
import { IBookingIdFactory } from "#domain/Booking/OutsourceContract/IBookingIdFactory";
import { CreateBookingDPolicy } from "#domain/Booking/Policy/CreateBookingDPolicy";
import { TimeRangeVO } from "#domain/SharedKernel/ValueObject/TimeRangeVO";
import { ResourceNotFoundException } from "#domain/Catalog/Exception/ResourceNotFoundException";
import { BookingNotFoundException } from "#domain/Booking/Exception/BookingNotFoundException";
import { BookingSlotUnavailableException } from "#domain/Booking/Exception/BookingSlotUnavailableException";
import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { BookingPersistenceException } from "#infrastructure/Exception/BookingPersistenceException";
/** PostgreSQL transactions enforce overlap, lifecycle races and resource deactivation ordering. */
export class PrismaBookingRepository implements IBookingRepository {
  /** @param client - Framework-owned pool. @param ids - Event UUID factory. @param events - Post-commit dispatch boundary. */
  public constructor(private readonly client: PrismaClient, private readonly ids: IBookingIdFactory, private readonly events: IBookingEventDispatcher) {}
  private map(row: BookingModel): Booking {
    return Booking.restore(new BookingIdVO(row.id), row.userId, row.resourceId,
      new TimeRangeVO(row.startAt.toISOString(), row.endAt.toISOString()), row.status as BookingStatus, row.createdAt.toISOString(), row.revision);
  }
  private failure(error: unknown): never {
    if (error instanceof ARoomBookException) throw error;
    // Prisma raw/constraint errors differ by driver path; only the named overlap
    // constraint or PostgreSQL exclusion code is classified as a domain conflict.
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.meta?.code === "23P01" || JSON.stringify(error.meta ?? {}).includes("bookings_no_overlap"))) throw new BookingSlotUnavailableException();
    throw new BookingPersistenceException();
  }
  /** @param booking - Confirmed aggregate. @throws ARoomBookException On locked validation/overlap/storage failure. */
  public async place(booking: Booking): Promise<void> {
    try {
      await this.client.$transaction(async tx => {
        const resourceId = booking.getResourceId(); const range = booking.getRange();
        await tx.$queryRaw`SELECT id FROM resources WHERE id = ${resourceId}::uuid FOR UPDATE`;
        const resource = await tx.resourceModel.findUnique({ where: { id: resourceId } });
        if (!resource) throw new ResourceNotFoundException();
        const occupied = await tx.bookingModel.findMany({ where: { resourceId, status: { in: ["PENDING", "CONFIRMED"] },
          startAt: { lt: range.getEnd() }, endAt: { gt: range.getStart() } }, select: { startAt: true, endAt: true } });
        new CreateBookingDPolicy().assert({...resource, isOpen: new ResourceCalendarMapper().map(resource).allows(range)}, range, occupied.map(row => new TimeRangeVO(row.startAt.toISOString(), row.endAt.toISOString())), new Date());
        await tx.bookingModel.create({ data: { id: booking.getId().getValue(), userId: booking.getUserId(), resourceId,
          startAt: range.getStart(), endAt: range.getEnd(), status: booking.getStatus(), createdAt: new Date(booking.getCreatedAt()) } });
      });
    } catch (error: unknown) { this.failure(error); }
    this.events.dispatch(booking.pullEvents());
  }
  /** @param id - UUID. @param actorId - Session identity. @param admin - Current role. @param range - Target interval. @param revision - Observed version. @returns Moved aggregate. @throws ARoomBookException On denied, invalid, stale or storage failure. */
  public async reschedule(id:string,actorId:string,admin:boolean,range:TimeRangeVO,revision:number):Promise<Booking> {
    let booking:Booking;
    try { booking = await this.client.$transaction(async tx => {
      const initial = await tx.bookingModel.findUnique({where:{id}}); if (!initial) throw new BookingNotFoundException();
      const resourceId = initial.resourceId;
      // Consistent order: resource first, then booking; cancellation never waits on resource.
      await tx.$queryRaw`SELECT id FROM resources WHERE id = ${resourceId}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${id}::uuid FOR UPDATE`;
      const row = await tx.bookingModel.findUnique({where:{id}}); if (!row) throw new BookingNotFoundException();
      const resource = await tx.resourceModel.findUnique({where:{id:resourceId}}); if (!resource) throw new ResourceNotFoundException();
      const occupied = await tx.bookingModel.findMany({where:{id:{not:id},resourceId,status:{in:["PENDING","CONFIRMED"]},startAt:{lt:range.getEnd()},endAt:{gt:range.getStart()}},select:{startAt:true,endAt:true}});
      const entity = this.map(row); entity.reschedule(actorId,admin,revision,range,{...resource,isOpen:new ResourceCalendarMapper().map(resource).allows(range)},occupied.map(other=>new TimeRangeVO(other.startAt.toISOString(),other.endAt.toISOString())),this.ids,new Date());
      await tx.bookingModel.update({where:{id},data:{startAt:range.getStart(),endAt:range.getEnd(),revision:entity.getRevision()}}); return entity;
    }); } catch(error:unknown) { this.failure(error); }
    this.events.dispatch(booking.pullEvents()); return booking;
  }
  /** @param id - UUID. @param actorId - Current account. @param admin - Current role. @returns Cancelled aggregate. @throws ARoomBookException On denied/terminal/storage failure. */
  public async cancel(id: string, actorId: string, admin: boolean): Promise<Booking> {
    let booking: Booking;
    try { booking = await this.client.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${id}::uuid FOR UPDATE`;
      const row = await tx.bookingModel.findUnique({ where: { id } });
      if (!row) throw new BookingNotFoundException();
      const entity = this.map(row); entity.cancel(actorId, admin, this.ids, new Date());
      await tx.bookingModel.update({ where: { id }, data: { status: entity.getStatus() } }); return entity;
    }); } catch (error: unknown) { this.failure(error); }
    this.events.dispatch(booking.pullEvents()); return booking;
  }
  /** @param userId - Owner ID. @param page - Zero-based page. @returns Own history. @throws BookingPersistenceException On read failure. */
  public async mine(userId: string, page: number, filter: "all"|"upcoming"|"past"|"cancelled" = "all"): Promise<{ bookings: Booking[]; total: number; resourceNames: Record<string, string> }> {
    const now = new Date(); const extra:Prisma.BookingModelWhereInput = filter==="upcoming" ? {status:{in:["PENDING","CONFIRMED"]},endAt:{gt:now}} : filter==="past" ? {status:{not:"CANCELLED"},endAt:{lte:now}} : filter==="cancelled" ? {status:"CANCELLED"} : {};
    return this.list({userId,...extra},page,filter==="upcoming");
  }
  /** @param resourceId - UUID. @param range - Date bounds. @param page - Zero-based page. @returns All matching history for admin. @throws BookingPersistenceException On read failure. */
  public async forResource(resourceId: string, range: TimeRangeVO, page: number): Promise<{ bookings: Booking[]; total: number; resourceNames: Record<string, string> }> {
    return this.list({ resourceId, startAt: { lt: range.getEnd() }, endAt: { gt: range.getStart() } }, page);
  }
  private async list(where: Prisma.BookingModelWhereInput, page: number, ascending = false): Promise<{ bookings: Booking[]; total: number; resourceNames: Record<string, string> }> {
    try {
      const [rows, total] = await this.client.$transaction([
        this.client.bookingModel.findMany({ where, orderBy: [{ startAt: ascending ? "asc" : "desc" }, { id: "asc" }], take: 50, skip: page * 50, include: { resource: { select: { name: true } } } }),
        this.client.bookingModel.count({ where }),
      ]);
      return { bookings: rows.map(row => this.map(row)), total, resourceNames: Object.fromEntries(rows.map(row => [row.resourceId, row.resource.name])) };
    } catch { throw new BookingPersistenceException(); }
  }
  /** @param resourceId - UUID. @param range - Query interval. @returns Anonymous occupied ranges. @throws BookingPersistenceException On read failure. */
  public async occupied(resourceId: string, range: TimeRangeVO): Promise<TimeRangeVO[]> {
    try { return (await this.client.bookingModel.findMany({ where: { resourceId, status: { in: ["PENDING", "CONFIRMED"] },
      startAt: { lt: range.getEnd() }, endAt: { gt: range.getStart() } }, select: { startAt: true, endAt: true } }))
      .map(row => new TimeRangeVO(row.startAt.toISOString(), row.endAt.toISOString())); }
    catch { throw new BookingPersistenceException(); }
  }
  /** @returns Count completed in one bounded scheduler batch. @throws BookingPersistenceException On storage failure. */
  public async completeEnded(): Promise<number> {
    try { return await this.client.$transaction(async tx => {
      const rows = await tx.$queryRaw<BookingModel[]>`SELECT id, user_id AS "userId", resource_id AS "resourceId", start_at AS "startAt", end_at AS "endAt", status, created_at AS "createdAt" FROM bookings WHERE status = 'CONFIRMED' AND end_at <= NOW() ORDER BY end_at LIMIT 100 FOR UPDATE SKIP LOCKED`;
      let count = 0;
      for (const row of rows) {
        const booking = this.map(row);
        if (booking.complete(new Date())) { await tx.bookingModel.update({ where: { id: row.id }, data: { status: booking.getStatus() } }); count++; }
      }
      return count;
    }); } catch { throw new BookingPersistenceException(); }
  }
}
