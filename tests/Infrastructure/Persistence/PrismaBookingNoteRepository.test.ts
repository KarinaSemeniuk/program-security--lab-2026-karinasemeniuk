import { PrismaClient } from "@prisma/client";
import { PrismaBookingNoteRepository } from "#infrastructure/Persistence/PrismaBookingNoteRepository";
import { BookingNoteVO } from "#domain/Booking/ValueObject/BookingNoteVO";
import { BookingAccessDeniedException } from "#domain/Booking/Exception/BookingAccessDeniedException";
import { BookingNoteConflictException } from "#domain/Booking/Exception/BookingNoteConflictException";
import { NoteIntegrityException } from "#infrastructure/Exception/NoteIntegrityException";
import { NotePersistenceException } from "#infrastructure/Exception/NotePersistenceException";
import { randomUUID } from "node:crypto";
describe("Encrypted note repository", () => {
  const owner = randomUUID(), id = randomUUID();
  const cipher = { encrypt: jest.fn(), decrypt: jest.fn() };
  const tx = { $queryRaw: jest.fn(), bookingModel: { findUnique: jest.fn() }, bookingNoteModel: { findUnique: jest.fn(), upsert: jest.fn() } };
  const client = { ...tx, $transaction: jest.fn() };
  const repository = new PrismaBookingNoteRepository(client as unknown as PrismaClient, cipher);
  const value = { bookingId: id, formatVersion: 1, keyId: "key", nonce: "00".repeat(12), ciphertext: "abcd", tag: "00".repeat(16), revision: 1, updatedAt: new Date() };
  beforeEach(() => {
    tx.bookingModel.findUnique.mockReset().mockResolvedValue({ userId: owner });
    tx.bookingNoteModel.findUnique.mockReset().mockResolvedValue(null);
    tx.bookingNoteModel.upsert.mockReset().mockResolvedValue(value);
    client.$transaction.mockReset().mockImplementation(async (callback: (scope: typeof tx) => Promise<unknown>) => callback(tx));
    cipher.encrypt.mockReset().mockReturnValue({ version: 1, keyId: "key", nonce: value.nonce, ciphertext: value.ciphertext, tag: value.tag });
    cipher.decrypt.mockReset().mockReturnValue("note");
  });
  it("returns an absent note without decrypting", async () => {
    expect(await repository.read(id, owner)).toEqual({ text: "", revision: 0, updatedAt: "" }); expect(cipher.decrypt).not.toHaveBeenCalled();
  });
  it("never decrypts before ownership is confirmed, including a non-owner admin identity", async () => {
    await expect(repository.read(id, randomUUID())).rejects.toThrow(BookingAccessDeniedException);
    await expect(repository.save(id, randomUUID(), new BookingNoteVO("x"), 0)).rejects.toThrow(BookingAccessDeniedException);
    expect(cipher.decrypt).not.toHaveBeenCalled(); expect(cipher.encrypt).not.toHaveBeenCalled();
  });
  it("stores only authenticated envelope data", async () => {
    const result = await repository.save(id, owner, new BookingNoteVO("private note"), 0);
    expect(result.revision).toBe(1); expect(cipher.encrypt).toHaveBeenCalledWith("private note", { bookingId: id, ownerId: owner, revision: 1 });
    expect(JSON.stringify(tx.bookingNoteModel.upsert.mock.calls)).not.toContain("private note");
  });
  it("rejects a stale writer and refuses to overwrite damaged ciphertext", async () => {
    tx.bookingNoteModel.findUnique.mockResolvedValue(value);
    await expect(repository.save(id, owner, new BookingNoteVO("x"), 0)).rejects.toThrow(BookingNoteConflictException);
    cipher.decrypt.mockImplementation(() => { throw new NoteIntegrityException(); });
    await expect(repository.read(id, owner)).rejects.toThrow(NoteIntegrityException);
    await expect(repository.save(id, owner, new BookingNoteVO("x"), 1)).rejects.toThrow(NoteIntegrityException);
    expect(tx.bookingNoteModel.upsert).not.toHaveBeenCalled();
  });
  it("wraps unknown storage errors", async () => {
    tx.bookingModel.findUnique.mockRejectedValue(new Error("private details"));
    await expect(repository.read(id, owner)).rejects.toThrow(NotePersistenceException);
  });
});
