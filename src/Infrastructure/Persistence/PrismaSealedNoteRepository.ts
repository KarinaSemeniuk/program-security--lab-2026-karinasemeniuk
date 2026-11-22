import { PrismaClient } from "@prisma/client";
import { ISealedNoteRepository } from "#domain/Booking/OutsourceContract/ISealedNoteRepository";
import { SealedNote } from "#domain/Booking/Contract/SealedNote";
import { BookingNotFoundException } from "#domain/Booking/Exception/BookingNotFoundException";
import { BookingAccessDeniedException } from "#domain/Booking/Exception/BookingAccessDeniedException";
import { BookingNoteConflictException } from "#domain/Booking/Exception/BookingNoteConflictException";
import { NotePersistenceException } from "#infrastructure/Exception/NotePersistenceException";
import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
/** A row lock serializes revisions; the append-only envelope history also prevents nonce reuse. */
export class PrismaSealedNoteRepository implements ISealedNoteRepository {
  /** @param client - Framework-owned Prisma connection. */
  public constructor(private readonly client: PrismaClient) {}
  private fail(error: unknown): never { if (error instanceof ARoomBookException) throw error; throw new NotePersistenceException(); }
  private async owner(client: Pick<PrismaClient, "bookingModel">, id: string, owner: string): Promise<void> {
    const booking = await client.bookingModel.findUnique({ where: { id }, select: { userId: true } });
    if (!booking) throw new BookingNotFoundException();
    if (booking.userId !== owner) throw new BookingAccessDeniedException();
  }
  /** @param id - Booking UUID. @param owner - Verified actor. @returns Latest opaque envelope. @throws ARoomBookException On access/storage failure. */
  public async read(id: string, owner: string): Promise<SealedNote | null> {
    try {
      await this.owner(this.client, id, owner);
      const rows = await this.client.$queryRaw<{ envelope: SealedNote }[]>`SELECT envelope FROM sealed_notes WHERE booking_id = ${id}::uuid ORDER BY revision DESC LIMIT 1`;
      return rows[0]?.envelope ?? null;
    } catch (error: unknown) { this.fail(error); }
  }
  /** @param note - Validated ciphertext. @param previousRevision - Last observed revision. @returns Persisted ciphertext. @throws ARoomBookException On denied/conflict/storage failure. */
  public async save(note: SealedNote, previousRevision: number): Promise<SealedNote> {
    try { return await this.client.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM bookings WHERE id = ${note.bookingId}::uuid FOR UPDATE`;
      await this.owner(tx, note.bookingId, note.ownerId);
      const rows = await tx.$queryRaw<{ revision: number }[]>`SELECT revision FROM sealed_notes WHERE booking_id = ${note.bookingId}::uuid ORDER BY revision DESC LIMIT 1`;
      if ((rows[0]?.revision ?? 0) !== previousRevision) throw new BookingNoteConflictException();
      const used = await tx.$queryRaw<{ revision: number }[]>`SELECT revision FROM sealed_notes WHERE key_id = ${note.keyId} AND nonce = ${note.nonce} LIMIT 1`;
      if (used.length) throw new BookingNoteConflictException();
      await tx.$executeRaw`INSERT INTO sealed_notes (booking_id, revision, key_id, nonce, envelope) VALUES (${note.bookingId}::uuid, ${note.revision}, ${note.keyId}, ${note.nonce}, ${JSON.stringify(note)}::jsonb)`;
      return note;
    }); } catch (error: unknown) { this.fail(error); }
  }
}
