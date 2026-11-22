import { mkdtempSync, writeFileSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { FileNoteKeyring } from "#infrastructure/Configuration/FileNoteKeyring";
import { NoteKeyConfigurationException } from "#infrastructure/Exception/NoteKeyConfigurationException";
describe("Private key file", () => {
  let directory: string; let path: string;
  beforeEach(() => { directory = mkdtempSync(join(tmpdir(), "roombook-unit-keys-")); path = join(directory, "keys.json"); });
  afterEach(() => { rmSync(directory, { recursive: true, force: true }); });
  const key = (): string => randomBytes(32).toString("hex");
  const write = (value: unknown): void => writeFileSync(path, JSON.stringify(value), { mode: 0o600 });
  it("rotates atomically without losing the original key", () => {
    const original = key(); write({ version: 1, activeId: "first", keys: { first: original } });
    const source = new FileNoteKeyring(path); const next = source.activateNewKey(); const ring = source.load();
    expect(ring.activeId).toBe(next); expect(ring.key("first").toString("hex")).toBe(original);
    expect(ring.key(next).toString("hex")).not.toBe(original);
    const buffer = ring.key("first"); buffer.fill(0); expect(ring.key("first").toString("hex")).toBe(original);
  });
  it("rejects group/world-readable key material", () => {
    write({ version: 1, activeId: "a", keys: { a: key() } }); chmodSync(path, 0o644);
    expect(() => new FileNoteKeyring(path).load()).toThrow(NoteKeyConfigurationException);
  });
  it.each([null, {}, { version: 2, activeId: "a", keys: {} }, { version: 1, activeId: "a", keys: { a: "weak" } },
    { version: 1, activeId: "missing", keys: { a: "00".repeat(32) } }])("rejects malformed config", value => {
      write(value); expect(() => new FileNoteKeyring(path).load()).toThrow(NoteKeyConfigurationException);
    });
});
