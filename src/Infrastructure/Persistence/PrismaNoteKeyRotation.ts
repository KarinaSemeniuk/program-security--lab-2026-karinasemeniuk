import { PrismaClient } from "@prisma/client";
import { FileNoteKeyring } from "#infrastructure/Configuration/FileNoteKeyring";
import { AesGcmNoteCipher } from "#infrastructure/Cryptography/AesGcmNoteCipher";
import { ARoomBookException } from "#domain/SharedKernel/Exception/Abstracts/ARoomBookException";
import { NotePersistenceException } from "#infrastructure/Exception/NotePersistenceException";
/** Coordinated local rotation; old keys remain available even if the DB transaction rolls back. */
export class PrismaNoteKeyRotation {
  private readonly client: PrismaClient;
  /** @param databaseUrl - Private connection URL. @param keys - Atomic shared local key source. @throws NotePersistenceException On client failure. */
  public constructor(databaseUrl: string, private readonly keys: FileNoteKeyring) {
    try { this.client = new PrismaClient({ datasources: { db: { url: databaseUrl } } }); }
    catch { throw new NotePersistenceException(); }
  }
  /** @param resume - Re-encrypt under the current active key instead of adding another key. @returns Safe key ID and processed count. @throws ARoomBookException On key/integrity/storage failure, retaining old keys for recovery. */
  public async rotate(resume = false): Promise<{ activeId: string; processed: number }> {
    const cipher = new AesGcmNoteCipher(() => this.keys.load());
    try { return await this.client.$transaction(async tx => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(7256001)::text`;
      const activeId = resume ? this.keys.load().activeId : this.keys.activateNewKey();
      let processed = 0; let cursor: string | undefined;
      for (;;) {
        const rows = await tx.bookingNoteModel.findMany({ where: { keyId: { not: activeId }, ...(cursor ? { bookingId: { gt: cursor } } : {}) }, orderBy: { bookingId: "asc" },
          take: 100, include: { booking: { select: { userId: true } } } });
        if (!rows.length) break;
        for (const row of rows) {
          const context = { bookingId: row.bookingId, ownerId: row.booking.userId, revision: row.revision };
          const text = cipher.decrypt({ version: row.formatVersion, keyId: row.keyId, nonce: row.nonce, ciphertext: row.ciphertext, tag: row.tag }, context);
          const value = cipher.encrypt(text, context);
          await tx.bookingNoteModel.update({ where: { bookingId: row.bookingId }, data: {
            formatVersion: value.version, keyId: value.keyId, nonce: value.nonce, ciphertext: value.ciphertext, tag: value.tag, updatedAt: row.updatedAt,
          } }); processed++;
        }
        cursor = rows[rows.length - 1]!.bookingId;
      }
      return { activeId, processed };
    }, { maxWait: 30_000, timeout: 120_000 }); }
    catch (error: unknown) { if (error instanceof ARoomBookException) throw error; throw new NotePersistenceException(); }
    finally { await this.client.$disconnect().catch(() => undefined); }
  }
}
