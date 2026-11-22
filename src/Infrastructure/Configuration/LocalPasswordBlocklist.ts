import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BlocklistLoadingException } from "#infrastructure/Exception/BlocklistLoadingException";

/** Loads a bounded, local list of complete unacceptable password values. */
export class LocalPasswordBlocklist {
  /**
   * Reads configuration without contacting external services.
   * @param filePath - UTF-8 JSON array path relative to the project root or absolute.
   * @returns A validated snapshot of configured complete password values.
   * @throws BlocklistLoadingException If configuration is missing or invalid.
   */
  public load(filePath: string): ReadonlySet<string> {
    try {
      const bytes = readFileSync(resolve(filePath));
      if (bytes.byteLength > 1_000_000) throw new BlocklistLoadingException();
      const parsed: unknown = JSON.parse(bytes.toString("utf8"));
      if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 20_000 ||
          !parsed.every((value: unknown) => typeof value === "string" && value.length <= 144)) {
        throw new BlocklistLoadingException();
      }
      return new Set<string>(parsed as string[]);
    } catch { throw new BlocklistLoadingException(); }
  }
}
