import { ISealedNoteRepository } from "#domain/Booking/OutsourceContract/ISealedNoteRepository";
import { PrismaSealedNoteRepository } from "#infrastructure/Persistence/PrismaSealedNoteRepository";
import { IRescheduleBookingRepository } from "#domain/Booking/OutsourceContract/IRescheduleBookingRepository";
import { IResourceCalendarRepository } from "#domain/Catalog/OutsourceContract/IResourceCalendarRepository";
import { INoteCipher } from "#domain/Booking/OutsourceContract/INoteCipher";
import { IBookingNoteRepository } from "#domain/Booking/OutsourceContract/IBookingNoteRepository";
import { PrismaBookingNoteRepository } from "#infrastructure/Persistence/PrismaBookingNoteRepository";
import { PrismaClient } from "@prisma/client";
import { IResourceManagementRepository } from "#domain/Catalog/OutsourceContract/IResourceManagementRepository";
import { IResourceRepository } from "#domain/Catalog/OutsourceContract/IResourceRepository";
import { IBookingRepository } from "#domain/Booking/OutsourceContract/IBookingRepository";
import { IBookingIdFactory } from "#domain/Booking/OutsourceContract/IBookingIdFactory";
import { IBookingEventDispatcher } from "#domain/Booking/OutsourceContract/IBookingEventDispatcher";
import { PrismaResourceRepository } from "#infrastructure/Persistence/PrismaResourceRepository";
import { PrismaBookingRepository } from "#infrastructure/Persistence/PrismaBookingRepository";
import { BookingPersistenceException } from "#infrastructure/Exception/BookingPersistenceException";
/** Owns the shared workspace pool; ORM types never escape Persistence. */
export class WorkspacePersistence {
  private readonly client: PrismaClient;
  /** Opaque ciphertext storage, independent of server note keys. */
  public readonly sealedNotes: ISealedNoteRepository;
  /** Resource calendar mutations. */
  public readonly calendars: IResourceCalendarRepository;
  /** Versioned Admin catalog mutations. */
  public readonly resourceManagement: IResourceManagementRepository;
  /** Domain catalog capability. */
  public readonly resources: IResourceRepository;
  /** Owner-only encrypted note capability. */
  public readonly notes: IBookingNoteRepository;
  /** Atomic interval editing capability. */
  public readonly bookingManagement: IRescheduleBookingRepository;
  /** Domain booking capability. */
  public readonly bookings: IBookingRepository;
  /** @param databaseUrl - Private connection URL. @param ids - UUID source. @param events - Post-commit dispatch. @throws BookingPersistenceException On client initialization failure. */
  public constructor(databaseUrl: string, ids: IBookingIdFactory, events: IBookingEventDispatcher, cipher: INoteCipher) {
    try {
      this.client = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
      this.sealedNotes = new PrismaSealedNoteRepository(this.client);
      this.notes = new PrismaBookingNoteRepository(this.client, cipher);
      const resourceAdapter = new PrismaResourceRepository(this.client);
      this.calendars = resourceAdapter; this.resources = resourceAdapter; this.resourceManagement = resourceAdapter;
      const bookingAdapter = new PrismaBookingRepository(this.client, ids, events);
      this.bookings = bookingAdapter; this.bookingManagement = bookingAdapter;
    } catch { throw new BookingPersistenceException(); }
  }
  /** Verifies workspace storage availability. @throws BookingPersistenceException On connection failure. */
  public async connect(): Promise<void> { try { await this.client.$connect(); } catch { throw new BookingPersistenceException(); } }
  /** Closes the shared pool. @throws BookingPersistenceException On shutdown failure. */
  public async disconnect(): Promise<void> { try { await this.client.$disconnect(); } catch { throw new BookingPersistenceException(); } }
}
