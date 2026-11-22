import { SavePrivateNoteUC } from "#application/Booking/UseCase/SavePrivateNoteUC";
import { SavePrivateNoteAC } from "#application/Booking/Command/SavePrivateNoteAC";
import { GetPrivateNoteUC } from "#application/Booking/UseCase/GetPrivateNoteUC";
import { GetPrivateNoteAQ } from "#application/Booking/Query/GetPrivateNoteAQ";
import { UserRole } from "#domain/Identity/Enum/UserRole";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
import { randomUUID } from "node:crypto";
describe("Private note application", () => {
  const actor = { id: randomUUID(), email: "u@example.test", role: UserRole.Admin, createdAt: "2026-10-30" };
  const notes = { read: jest.fn(), save: jest.fn() }; const id = randomUUID();
  beforeEach(() => { notes.read.mockReset(); notes.save.mockReset(); });
  it("passes only server actor identity, with no admin ownership bypass", async () => {
    await new GetPrivateNoteUC(notes).execute(new GetPrivateNoteAQ(actor, id)); expect(notes.read).toHaveBeenCalledWith(id, actor.id);
    await new SavePrivateNoteUC(notes).execute(new SavePrivateNoteAC(actor, id, " note ", 2));
    expect(notes.save.mock.calls[0]![1]).toBe(actor.id); expect(notes.save.mock.calls[0]![2].getValue()).toBe(" note ");
  });
  it.each([-1, 0.5, NaN, 2147483647])("rejects invalid revision", async revision => {
    expect(() => new SavePrivateNoteUC(notes).execute(new SavePrivateNoteAC(actor, id, "x", revision))).toThrow(InvalidRequestBodyException);
    expect(notes.save).not.toHaveBeenCalled();
  });
});
