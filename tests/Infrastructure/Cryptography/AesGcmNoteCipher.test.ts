import { randomBytes, randomUUID } from "node:crypto";
import { AesGcmNoteCipher } from "#infrastructure/Cryptography/AesGcmNoteCipher";
import { NoteKeyring } from "#infrastructure/Cryptography/NoteKeyring";
import { NoteIntegrityException } from "#infrastructure/Exception/NoteIntegrityException";
import { NoteKeyConfigurationException } from "#infrastructure/Exception/NoteKeyConfigurationException";
describe("AES-GCM note protection", () => {
  const firstKey = randomBytes(32).toString("hex"); const nextKey = randomBytes(32).toString("hex");
  let ring = new NoteKeyring({ version: 1, activeId: "first", keys: { first: firstKey } });
  const cipher = new AesGcmNoteCipher(() => ring);
  const context = { bookingId: randomUUID(), ownerId: randomUUID(), revision: 1 };
  beforeEach(() => { ring = new NoteKeyring({ version: 1, activeId: "first", keys: { first: firstKey } }); });
  it.each(["", "\ufeffТочний початковий символ", "  План зустрічі\nПринести ноутбук 💻  ", "ї".repeat(2000)])("round-trips exact Unicode/whitespace without deterministic ciphertext", text => {
    const one = cipher.encrypt(text, context); const two = cipher.encrypt(text, context);
    expect(one.nonce).toHaveLength(24); expect(one.tag).toHaveLength(32); expect(one.nonce).not.toBe(two.nonce);
    expect(cipher.decrypt(one, context)).toBe(text); expect(JSON.stringify(one)).not.toContain("ноутбук");
  });
  it.each(["nonce", "ciphertext", "tag"] as const)("rejects a changed %s without returning plaintext", field => {
    const value = cipher.encrypt("Private synthetic note", context);
    const old = value[field]; const altered = (old[0] === "0" ? "1" : "0") + old.slice(1);
    expect(() => cipher.decrypt({ ...value, [field]: altered }, context)).toThrow(NoteIntegrityException);
  });
  it("binds owner, booking and revision, refusing cross-record copying", () => {
    const value = cipher.encrypt("Private", context);
    for (const changed of [{ ...context, ownerId: randomUUID() }, { ...context, bookingId: randomUUID() }, { ...context, revision: 2 }]) {
      expect(() => cipher.decrypt(value, changed)).toThrow(NoteIntegrityException);
    }
  });
  it("retains old-key reads and encrypts new writes with the active key", () => {
    const old = cipher.encrypt("Private", context);
    ring = new NoteKeyring({ version: 1, activeId: "second", keys: { first: firstKey, second: nextKey } });
    expect(cipher.decrypt(old, context)).toBe("Private");
    const next = cipher.encrypt(cipher.decrypt(old, context), context);
    expect(next.keyId).toBe("second"); expect(cipher.decrypt(next, context)).toBe("Private");
    expect(() => cipher.decrypt({ ...old, keyId: "second" }, context)).toThrow(NoteIntegrityException);
  });
  it.each([{ version: 2 }, { nonce: "00" }, { tag: "00" }, { ciphertext: "g0" }, { ciphertext: "a" }, { ciphertext: "00".repeat(8001) }])("rejects invalid envelopes", mutation => {
    expect(() => cipher.decrypt({ ...cipher.encrypt("x", context), ...mutation }, context)).toThrow(NoteIntegrityException);
  });
  it("fails safely when key material is missing", () => {
    const value = cipher.encrypt("x", context);
    expect(() => cipher.decrypt({ ...value, keyId: "missing" }, context)).toThrow(NoteKeyConfigurationException);
  });
});
