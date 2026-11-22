import { SealedNoteVO } from "#domain/Booking/ValueObject/SealedNoteVO";
import { InvalidRequestBodyException } from "#domain/SharedKernel/Exception/InvalidRequestBodyException";
describe("SealedNoteVO", () => {
 const valid = { version: 1, algorithm: "AES-256-GCM", keyId: "a".repeat(32), ownerId: "o", bookingId: "b", revision: 1, nonce: "a".repeat(16), ciphertext: "a".repeat(24) };
 it("accepts a bound, size-limited envelope and returns a copy", () => {
   const note = new SealedNoteVO(valid, "b", "o", 1); const copy = note.getValue(); copy.keyId = "x";
   expect(note.getValue().keyId).toBe(valid.keyId);
 });
 it.each([null, {}, {...valid, key: "secret"}, {...valid, ownerId: "other"}, {...valid, bookingId: "other"}, {...valid, revision: 2}, {...valid, nonce: "bad"}, {...valid, ciphertext: "a".repeat(11004)}, {...valid, algorithm: "AES-CBC"}])("rejects invalid shape or binding %p", value => {
   expect(() => new SealedNoteVO(value, "b", "o", 1)).toThrow(InvalidRequestBodyException);
 });
});
