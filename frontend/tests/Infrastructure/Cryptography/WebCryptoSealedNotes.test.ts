import { webcrypto } from "node:crypto";
import { WebCryptoSealedNotes } from "#ui-infrastructure/Cryptography/WebCryptoSealedNotes";
Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
describe("WebCryptoSealedNotes", () => {
 const cipher = new WebCryptoSealedNotes(), owner = "owner", booking = "booking";
 it("decrypts Unicode on an independent endpoint with the exported key", async () => {
   const key = cipher.createKey(), text = "План зустрічі — обговорити 8 питань 🗓️";
   const envelope = await cipher.seal(key, text, owner, booking, 1);
   expect(JSON.stringify(envelope)).not.toContain(text);
   expect(await new WebCryptoSealedNotes().open(key, envelope, owner, booking)).toBe(text);
 });
 it("uses a fresh nonce for the same plaintext and key", async () => {
   const key = cipher.createKey(); const a = await cipher.seal(key, "text", owner, booking, 1), b = await cipher.seal(key, "text", owner, booking, 1);
   expect(a.nonce).not.toBe(b.nonce); expect(a.ciphertext).not.toBe(b.ciphertext);
 });
 it("rejects a different key and mismatched recipient bindings", async () => {
   const key = cipher.createKey(), envelope = await cipher.seal(key, "private", owner, booking, 1);
   await expect(cipher.open(cipher.createKey(), envelope, owner, booking)).rejects.toThrow();
   await expect(cipher.open(key, envelope, "other", booking)).rejects.toThrow();
   await expect(cipher.open(key, envelope, owner, "other")).rejects.toThrow();
 });
 it("authenticates the ciphertext and revision", async () => {
   const key = cipher.createKey(), envelope = await cipher.seal(key, "private", owner, booking, 1);
   await expect(cipher.open(key, { ...envelope, revision: 2 }, owner, booking)).rejects.toThrow();
   const first = envelope.ciphertext[0] === "A" ? "B" : "A";
   await expect(cipher.open(key, { ...envelope, ciphertext: first + envelope.ciphertext.slice(1) }, owner, booking)).rejects.toThrow();
 });
 it("handles an empty note and rejects oversized text or malformed keys", async () => {
   const key = cipher.createKey(), envelope = await cipher.seal(key, "", owner, booking, 1);
   expect(await cipher.open(key, envelope, owner, booking)).toBe("");
   await expect(cipher.seal(key, "x".repeat(2001), owner, booking, 1)).rejects.toThrow();
   await expect(cipher.seal("invalid", "text", owner, booking, 1)).rejects.toThrow();
 });
});
