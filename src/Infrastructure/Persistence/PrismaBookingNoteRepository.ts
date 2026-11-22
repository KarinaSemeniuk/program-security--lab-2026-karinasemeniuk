import { PrismaClient, type BookingNoteModel } from "@prisma/client";
import { IBookingNoteRepository } from "#domain/Booking/OutsourceContract/IBookingNoteRepository";
import { INoteCipher } from "#domain/Booking/OutsourceContract/INoteCipher";
import { BookingNoteVO } from "#domain/Booking/ValueObject/BookingNoteVO";
import { PrivateBookingNote } from "#domain/Booking/Contract/PrivateBookingNote";
import { EncryptedNote } from "#domain/Booking/Contract/EncryptedNote";
import { BookingNotFoundException } from "#domain/Booking/Exception/BookingNotFoundException";
import { BookingAccessDeniedException } from "#domain/Booking/Exception/BookingAccessDeniedException";
import { BookingNoteConflictException } from "#domain/Booking/Exception/BookingNoteConflictException";
import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { NotePersistenceException } from "#infrastructure/Exception/NotePersistenceException";
/** Owner checks, optimistic revision and encryption occur before plaintext can leave persistence. */
export class PrismaBookingNoteRepository implements IBookingNoteRepository {
  /** @param client - Framework-owned workspace pool. @param cipher - Authenticated encryption adapter. */
  public constructor(private readonly client: PrismaClient, private readonly cipher: INoteCipher) {}
  private envelope(row: BookingNoteModel): EncryptedNote { return { version: row.formatVersion, keyId: row.keyId, nonce: row.nonce, ciphertext: row.ciphertext, tag: row.tag }; }
  private failure(error: unknown): never { if (error instanceof ARoomBookException) throw error; throw new NotePersistenceException(); }
  /** @param bookingId - UUID. @param ownerId - Current authenticated account. @returns Authenticated private note. @throws ARoomBookException On denied/missing/integrity/storage failure. */
  public async read(bookingId: string, ownerId: string): Promise<PrivateBookingNote> {
    try {
      const booking = await this.client.bookingModel.findUnique({ where: { id: bookingId }, select: { userId: true } });
      if (!booking) throw new BookingNotFoundException();
      if (booking.userId !== ownerId) throw new BookingAccessDeniedException();
      const row = await this.client.bookingNoteModel.findUnique({ where: { bookingId } });
      if (!row) return { text: "", revision: 0, updatedAt: "" };
      const text = this.cipher.decrypt(this.envelope(row), { bookingId, ownerId: booking.userId, revision: row.revision });
      return { text: new BookingNoteVO(text).getValue(), revision: row.revision, updatedAt: row.updatedAt.toISOString() };
    } catch (error: unknown) { this.failure(error); }
  }
  /** @param bookingId - UUID. @param ownerId - Current account. @param note - Valid exact note. @param revision - Observed version. @returns New note version. @throws ARoomBookException On access/conflict/integrity/storage failure. */
  public async save(bookingId: string, ownerId: string, note: BookingNoteVO, revision: number): Promise<PrivateBookingNote> {
    try { return await this.client.$transaction(async tx => {
      // Shared transaction lock coordinates writers with exclusive key rotation.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock_shared(7256001)::text`;
      await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${bookingId}::uuid FOR UPDATE`;
      const booking = await tx.bookingModel.findUnique({ where: { id: bookingId }, select: { userId: true } });
      if (!booking) throw new BookingNotFoundException();
      if (booking.userId !== ownerId) throw new BookingAccessDeniedException();
      const previous = await tx.bookingNoteModel.findUnique({ where: { bookingId } });
      if ((previous?.revision ?? 0) !== revision) throw new BookingNoteConflictException();
      if (previous) this.cipher.decrypt(this.envelope(previous), { bookingId, ownerId: booking.userId, revision });
      const next = revision + 1;
      const encrypted = this.cipher.encrypt(note.getValue(), { bookingId, ownerId: booking.userId, revision: next });
      const data = { formatVersion: encrypted.version, keyId: encrypted.keyId, nonce: encrypted.nonce,
        ciphertext: encrypted.ciphertext, tag: encrypted.tag, revision: next };
      const row = await tx.bookingNoteModel.upsert({ where: { bookingId }, create: { bookingId, ...data }, update: data });
      return { text: note.getValue(), revision: row.revision, updatedAt: row.updatedAt.toISOString() };
    }); } catch (error: unknown) { this.failure(error); }
  }
}
