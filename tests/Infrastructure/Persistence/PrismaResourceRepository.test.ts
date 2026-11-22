import { PrismaClient } from "@prisma/client";
import { PrismaResourceRepository } from "#infrastructure/Persistence/PrismaResourceRepository";
import { ResourceDetailsVO } from "#domain/Catalog/ValueObject/ResourceDetailsVO";
import { ResourceConflictException } from "#domain/Catalog/Exception/ResourceConflictException";
import { ResourceNotFoundException } from "#domain/Catalog/Exception/ResourceNotFoundException";
import { CatalogPersistenceException } from "#infrastructure/Exception/CatalogPersistenceException";
describe("infrastructure.persistence.resource versioned locks", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const row = { id, name: "Room", capacity: 4, minSlotMinutes: 30, isActive: false, type: "ROOM", description: "", location: "", equipment: [], revision: 2 };
  const tx = { $queryRaw: jest.fn(), resourceModel: { findUnique: jest.fn(), update: jest.fn() } };
  const transaction = jest.fn();
  const repository = new PrismaResourceRepository({ $transaction: transaction } as unknown as PrismaClient);
  beforeEach(() => { tx.$queryRaw.mockReset(); tx.resourceModel.findUnique.mockReset().mockResolvedValue(row); tx.resourceModel.update.mockReset(); transaction.mockReset().mockImplementation(async (callback: (value: typeof tx) => Promise<unknown>) => callback(tx)); });
  it("locks before reading and persists one increment without schedule fields", async () => {
    const result = await repository.update(id, "Updated", 2, new ResourceDetailsVO(), 2);
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.resourceModel.findUnique.mock.invocationCallOrder[0]!);
    expect(result.getRevision()).toBe(3);
    const data: Record<string, unknown> = tx.resourceModel.update.mock.calls[0]![0].data;
    expect(data).toMatchObject({ name: "Updated", capacity: 2, revision: 3, isActive: false });
    expect(data).not.toHaveProperty("minSlotMinutes"); expect(data).not.toHaveProperty("id");
  });
  it("rejects stale updates/reactivation without writes", async () => {
    await expect(repository.update(id, "New", 2, new ResourceDetailsVO(), 1)).rejects.toThrow(ResourceConflictException);
    await expect(repository.reactivate(id, 1)).rejects.toThrow(ResourceConflictException);
    expect(tx.resourceModel.update).not.toHaveBeenCalled();
  });
  it("reactivates a stored inactive resource with the next version", async () => {
    expect((await repository.reactivate(id, 2)).isActive()).toBe(true);
    expect(tx.resourceModel.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ isActive: true, revision: 3 }) }));
  });
  it("preserves safe failures and wraps foreign storage errors", async () => {
    tx.resourceModel.findUnique.mockResolvedValue(undefined);
    await expect(repository.reactivate(id, 2)).rejects.toThrow(ResourceNotFoundException);
    transaction.mockRejectedValue(new Error("private storage details"));
    await expect(repository.reactivate(id, 2)).rejects.toThrow(CatalogPersistenceException);
  });
});
