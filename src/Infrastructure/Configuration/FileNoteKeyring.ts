import { readFileSync, lstatSync, openSync, writeFileSync, fsyncSync, closeSync, renameSync, unlinkSync } from "node:fs";
import { randomBytes, randomUUID } from "node:crypto";
import { NoteKeyring } from "#infrastructure/Cryptography/NoteKeyring";
import { NoteKeyConfigurationException } from "#infrastructure/Exception/NoteKeyConfigurationException";
/** Private local key-file adapter; each operation observes an atomic fresh snapshot. */
export class FileNoteKeyring {
  /** @param path - Backend-only private key file, outside Git/frontend. */
  public constructor(private readonly path: string) {}
  private parse(): unknown {
    try {
      const info = lstatSync(this.path);
      if (!info.isFile() || info.isSymbolicLink() || info.size > 65536 || (info.mode & 0o077) !== 0 || info.uid !== process.getuid?.()) throw new NoteKeyConfigurationException();
      return JSON.parse(readFileSync(this.path, "utf8")) as unknown;
    } catch { throw new NoteKeyConfigurationException(); }
  }
  /** @returns Validated fresh private key snapshot. @throws NoteKeyConfigurationException On unsafe/unavailable file. */
  public load(): NoteKeyring { return new NoteKeyring(this.parse()); }
  /** Adds a random active key while retaining every old key. Caller must coordinate database rotation/writers.
   * @returns New non-secret key identifier. @throws NoteKeyConfigurationException On invalid file or failed atomic update.
   */
  public activateNewKey(): string {
    const value = this.parse(); new NoteKeyring(value);
    const record = value as { version: number; activeId: string; keys: Record<string, string> };
    if (Object.keys(record.keys).length >= 32) throw new NoteKeyConfigurationException();
    const temporary = this.path + ".tmp-" + randomUUID();
    let descriptor: number | undefined;
    try {
      const id = "k-" + randomBytes(12).toString("hex");
      const updated = { version: 1, activeId: id, keys: { ...record.keys, [id]: randomBytes(32).toString("hex") } };
      descriptor = openSync(temporary, "wx", 0o600);
      writeFileSync(descriptor, JSON.stringify(updated)); fsyncSync(descriptor); closeSync(descriptor); descriptor = undefined;
      renameSync(temporary, this.path); return id;
    } catch {
      if (descriptor !== undefined) try { closeSync(descriptor); } catch { /* Preserve safe error. */ }
      try { unlinkSync(temporary); } catch { /* Temporary may not exist. */ }
      throw new NoteKeyConfigurationException();
    }
  }
}
