import { PrismaClient } from "@prisma/client";
import { PrismaSessionRepository } from "#infrastructure/Persistence/PrismaSessionRepository";
import { UserPersistenceReadException } from "#infrastructure/Exception/UserPersistenceReadException";
import { UserPersistenceWriteException } from "#infrastructure/Exception/UserPersistenceWriteException";

jest.mock("@prisma/client", () => ({ PrismaClient: jest.fn() }));
describe("PrismaSessionRepository", () => {
  const client = { $transaction: jest.fn(), $disconnect: jest.fn(), sessionModel: { create: jest.fn(), deleteMany: jest.fn(), count: jest.fn() } };
  const claims = { userId: "00000000-0000-4000-8000-000000000001", sessionId: "00000000-0000-4000-8000-000000000002", expiresAt: new Date(Date.now() + 900_000) };
  let repository: PrismaSessionRepository;
  beforeEach(() => {
    jest.mocked(PrismaClient).mockImplementation(() => client as unknown as PrismaClient);
    client.$transaction.mockReset().mockResolvedValue([]);
    client.$disconnect.mockReset().mockResolvedValue(undefined);
    client.sessionModel.create.mockReset(); client.sessionModel.deleteMany.mockReset();
    client.sessionModel.count.mockReset().mockResolvedValue(1);
    repository = new PrismaSessionRepository("postgresql://mock/unit_test");
  });
  it("persists only identifiers and expiry and cleans expired sessions", async () => {
    await repository.create(claims);
    expect(client.sessionModel.create).toHaveBeenCalledWith({ data: { id: claims.sessionId, userId: claims.userId, expiresAt: claims.expiresAt } });
    expect(client.sessionModel.deleteMany).toHaveBeenCalledWith({ where: { expiresAt: { lte: expect.any(Date) } } });
  });
  it("binds validity to the exact session, user and expiry", async () => {
    expect(await repository.isActive(claims)).toBe(true);
    expect(client.sessionModel.count).toHaveBeenCalledWith({ where: { id: claims.sessionId, userId: claims.userId, expiresAt: { equals: claims.expiresAt, gt: expect.any(Date) } } });
    client.sessionModel.count.mockResolvedValue(0);
    expect(await repository.isActive(claims)).toBe(false);
  });
  it("revokes only the selected account session", async () => {
    await repository.revoke(claims);
    expect(client.sessionModel.deleteMany).toHaveBeenCalledWith({ where: { id: claims.sessionId, userId: claims.userId } });
  });
  it("wraps storage, lookup and revocation failures", async () => {
    client.$transaction.mockRejectedValue(new Error("private"));
    await expect(repository.create(claims)).rejects.toThrow(UserPersistenceWriteException);
    client.sessionModel.count.mockRejectedValue(new Error("private"));
    await expect(repository.isActive(claims)).rejects.toThrow(UserPersistenceReadException);
    client.sessionModel.deleteMany.mockRejectedValue(new Error("private"));
    await expect(repository.revoke(claims)).rejects.toThrow(UserPersistenceWriteException);
  });
});
