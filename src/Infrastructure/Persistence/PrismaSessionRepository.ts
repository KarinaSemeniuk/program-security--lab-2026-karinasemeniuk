import { PrismaClient } from "@prisma/client";
import { AccessToken } from "#domain/Identity/Contract/AccessToken";
import { ISessionRepository } from "#domain/Identity/OutsourceContract/ISessionRepository";
import { UserPersistenceReadException } from "#infrastructure/Exception/UserPersistenceReadException";
import { UserPersistenceWriteException } from "#infrastructure/Exception/UserPersistenceWriteException";
/** PostgreSQL session allowlist; stores identifiers, never full JWTs. */
export class PrismaSessionRepository implements ISessionRepository {
  private readonly client: PrismaClient;
  /** @param databaseUrl - Private connection string. @throws UserPersistenceWriteException If initialization fails. */
  public constructor(databaseUrl: string) {
    try { this.client = new PrismaClient({ datasources: { db: { url: databaseUrl } } }); }
    catch { throw new UserPersistenceWriteException(); }
  }
  /** @param session - Newly signed token identity. @throws UserPersistenceWriteException If storage fails. */
  public async create(session: AccessToken): Promise<void> {
    try {
      await this.client.$transaction([
        this.client.sessionModel.deleteMany({ where: { expiresAt: { lte: new Date() } } }),
        this.client.sessionModel.create({ data: { id: session.sessionId, userId: session.userId, expiresAt: session.expiresAt } }),
      ]);
    } catch { throw new UserPersistenceWriteException(); }
  }
  /** @param session - Verified token. @returns Whether the exact session is active. @throws UserPersistenceReadException If lookup fails. */
  public async isActive(session: AccessToken): Promise<boolean> {
    try { return await this.client.sessionModel.count({ where: { id: session.sessionId, userId: session.userId,
      expiresAt: { equals: session.expiresAt, gt: new Date() } } }) === 1; }
    catch { throw new UserPersistenceReadException(); }
  }
  /** @param session - Verified token. @throws UserPersistenceWriteException If revocation fails. */
  public async revoke(session: AccessToken): Promise<void> {
    try { await this.client.sessionModel.deleteMany({ where: { id: session.sessionId, userId: session.userId } }); }
    catch { throw new UserPersistenceWriteException(); }
  }
  /** Releases the dedicated pool. @throws UserPersistenceWriteException If shutdown fails. */
  public async disconnect(): Promise<void> {
    try { await this.client.$disconnect(); } catch { throw new UserPersistenceWriteException(); }
  }
}
