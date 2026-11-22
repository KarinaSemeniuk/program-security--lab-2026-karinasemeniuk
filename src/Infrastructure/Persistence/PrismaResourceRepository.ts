import { ResourceCalendarMapper } from "#infrastructure/Persistence/ResourceCalendarMapper";
import { ResourceCalendarVO } from "#domain/Catalog/ValueObject/ResourceCalendarVO";
import { PrismaClient, type ResourceModel } from "@prisma/client";
import { CreateResourceService } from "#domain/Catalog/Service/CreateResourceService";
import { Resource } from "#domain/Catalog/Entity/Resource";
import { ResourceIdVO } from "#domain/Catalog/ValueObject/ResourceIdVO";
import { SlotDurationVO } from "#domain/Catalog/ValueObject/SlotDurationVO";
import { IResourceRepository } from "#domain/Catalog/OutsourceContract/IResourceRepository";
import { ResourceNotFoundException } from "#domain/Catalog/Exception/ResourceNotFoundException";
import { CatalogPersistenceException } from "#infrastructure/Exception/CatalogPersistenceException";
import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { BookingIdFactory } from "#infrastructure/Auth/BookingIdFactory";
import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
import { ResourceType } from "#domain/Catalog/Enum/ResourceType";
import { IResourceManagementRepository } from "#domain/Catalog/OutsourceContract/IResourceManagementRepository";
/** Catalog adapter; resource locks serialize deactivation against booking placement. */
export class PrismaResourceRepository implements IResourceRepository, IResourceManagementRepository {
  /** @param client - Pool owned and closed by Framework. */
  public constructor(private readonly client: PrismaClient) {}
  private map(row: ResourceModel): Resource { return new Resource(new ResourceIdVO(row.id), row.name, row.capacity, new SlotDurationVO(row.minSlotMinutes), row.isActive, new ResourceDetailsVO(row.type as ResourceType, row.description, row.location, row.equipment), row.revision, new ResourceCalendarMapper().map(row)); }
  /** @param includeInactive - Admin-only. @returns Resource aggregates. @throws CatalogPersistenceException On storage failure. */
  public async list(includeInactive: boolean): Promise<Resource[]> {
    try { return (await this.client.resourceModel.findMany({ where: includeInactive ? {} : { isActive: true }, orderBy: [{ name: "asc" }, { id: "asc" }] })).map(row => this.map(row)); }
    catch { throw new CatalogPersistenceException(); }
  }
  /** @param id - UUID. @returns Resource or absence. @throws CatalogPersistenceException On storage failure. */
  public async find(id: string): Promise<Resource | undefined> {
    try { const row = await this.client.resourceModel.findUnique({ where: { id } }); return row ? this.map(row) : undefined; }
    catch { throw new CatalogPersistenceException(); }
  }
  /** @param name - Display name. @param capacity - Capacity. @param details - Optional validated resource description. @param minSlotMinutes - Slot size. @returns Persisted aggregate. @throws ARoomBookException On input/storage failure. */
  public async create(name: string, capacity: number, minSlotMinutes: number, details = new ResourceDetailsVO()): Promise<Resource> {
    const resource = new CreateResourceService().create(new ResourceIdVO(new BookingIdFactory().next()), name, capacity, minSlotMinutes);
    const created = new Resource(resource.getId(), resource.getName(), capacity, resource.getSlot(), true, details);
    try { await this.client.resourceModel.create({ data: { id: resource.getId().getValue(), name: resource.getName(), capacity, minSlotMinutes, type: details.getType(), description: details.getDescription(), location: details.getLocation(), equipment: details.getEquipment() } }); return created; }
    catch { throw new CatalogPersistenceException(); }
  }
  /** @param id - UUID. @returns Deactivated resource. @throws ARoomBookException On missing/storage failure. */
  public async deactivate(id: string): Promise<Resource> {
    try { return await this.client.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM resources WHERE id = ${id}::uuid FOR UPDATE`;
      const row = await tx.resourceModel.findUnique({ where: { id } });
      if (!row) throw new ResourceNotFoundException();
      const resource = this.map(row); resource.deactivate();
      await tx.resourceModel.update({ where: { id }, data: { isActive: false, revision: resource.getRevision() } }); return resource;
    }); } catch (error: unknown) { if (error instanceof ARoomBookException) throw error; throw new CatalogPersistenceException(); }
  }
  /** @param id - UUID. @param calendar - Valid rules. @param revision - Observed version. @returns Updated resource. @throws ARoomBookException On conflict or storage failure. */
  public setCalendar(id: string, calendar: ResourceCalendarVO, revision: number): Promise<Resource> { return this.change(id, resource => resource.setCalendar(calendar, revision)); }
  private async change(id: string, action: (resource: Resource) => void): Promise<Resource> {
    try { return await this.client.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM resources WHERE id = ${id}::uuid FOR UPDATE`;
      const row = await tx.resourceModel.findUnique({ where: { id } });
      if (!row) throw new ResourceNotFoundException();
      const resource = this.map(row); action(resource); const details = resource.getDetails();
      await tx.resourceModel.update({ where: { id }, data: { name: resource.getName(), capacity: resource.getCapacity(), type: details.getType(), description: details.getDescription(), location: details.getLocation(), equipment: details.getEquipment(), isActive: resource.isActive(), revision: resource.getRevision(), timeZone: resource.getCalendar().getTimeZone(), weekly: resource.getCalendar().getWeekly().map(day => ({...day})), closedDates: resource.getCalendar().getClosedDates() } });
      return resource;
    }); } catch (error: unknown) { if (error instanceof ARoomBookException) throw error; throw new CatalogPersistenceException(); }
  }
  /** @param id - UUID. @param name - Display name. @param capacity - Occupants. @param details - Validated information. @param revision - Observed version. @returns Updated aggregate. @throws ARoomBookException On missing/stale/storage failure. */
  public update(id: string, name: string, capacity: number, details: ResourceDetailsVO, revision: number): Promise<Resource> {
    return this.change(id, resource => resource.update(name, capacity, details, revision));
  }
  /** @param id - UUID. @param revision - Observed version. @returns Active aggregate. @throws ARoomBookException On missing/stale/storage failure. */
  public reactivate(id: string, revision: number): Promise<Resource> { return this.change(id, resource => resource.reactivate(revision)); }
}
