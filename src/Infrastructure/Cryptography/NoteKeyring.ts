import { NoteKeyConfigurationException } from "#infrastructure/Exception/NoteKeyConfigurationException";
/** Validated private key snapshot; never serialize this object or its buffers. */
export class NoteKeyring {
  private readonly keys = new Map<string, Buffer>();
  /** Non-secret active key identifier. */
  public readonly activeId: string;
  /** @param value - Private parsed key file. @throws NoteKeyConfigurationException On malformed/unsafe configuration. */
  public constructor(value: unknown) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) throw new NoteKeyConfigurationException();
    const record = value as Record<string, unknown>;
    if (Object.keys(record).length !== 3 || record.version !== 1 || typeof record.activeId !== "string" ||
        typeof record.keys !== "object" || record.keys === null || Array.isArray(record.keys)) throw new NoteKeyConfigurationException();
    const entries = Object.entries(record.keys);
    if (!entries.length || entries.length > 32) throw new NoteKeyConfigurationException();
    const used = new Set<string>();
    for (const [id, key] of entries) {
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id) || typeof key !== "string" || !/^[a-f0-9]{64}$/i.test(key) || used.has(key.toLowerCase())) throw new NoteKeyConfigurationException();
      used.add(key.toLowerCase()); this.keys.set(id, Buffer.from(key, "hex"));
    }
    if (!this.keys.has(record.activeId)) throw new NoteKeyConfigurationException();
    this.activeId = record.activeId;
  }
  /** @param id - Non-secret selector. @returns Defensive private key copy. @throws NoteKeyConfigurationException When the required key is unavailable. */
  public key(id: string): Buffer {
    const key = this.keys.get(id); if (!key) throw new NoteKeyConfigurationException(); return Buffer.from(key);
  }
}
