import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { AuditIntegrityException } from "#infrastructure/Exception/AuditIntegrityException";
import { AuditPersistenceException } from "#infrastructure/Exception/AuditPersistenceException";

type Block = { index: number; time: string; data: Record<string, string | number>; previousHash: string; hash: string };
/** Single-writer local SHA-256 journal. An external trusted head is needed to detect full-history replacement. */
export class FileHashChain {
  private blocks: Block[];
  /** @param path - Local JSONL ledger. @throws AuditIntegrityException For an invalid existing chain. @throws AuditPersistenceException If storage is unavailable. */
  public constructor(private readonly path: string) {
    try {
      mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
      this.blocks = existsSync(path) ? readFileSync(path, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line) as Block) : [];
    } catch { throw new AuditPersistenceException(); }
    if (!this.verify()) throw new AuditIntegrityException();
  }
  private hash(block: Omit<Block, "hash">): string {
    const data = Object.fromEntries(Object.entries(block.data).sort(([a], [b]) => a.localeCompare(b, "en")));
    return createHash("sha256").update(JSON.stringify({ index: block.index, time: block.time, data, previousHash: block.previousHash })).digest("hex");
  }
  /** @returns Whether all block digests and links match their persisted order. */
  public verify(): boolean {
    try {
      const persisted: Block[] = existsSync(this.path) ? readFileSync(this.path, "utf8").trim().split("\n").filter(Boolean).map(line => JSON.parse(line) as Block) : [];
      if (persisted.length !== this.blocks.length) return false;
      return persisted.every((block, i) => block.index === i && typeof block.time === "string" &&
        typeof block.data === "object" && block.data !== null && !Array.isArray(block.data) &&
        Object.values(block.data).every(v => typeof v === "string" || typeof v === "number" && Number.isFinite(v)) &&
        block.previousHash === (i ? persisted[i - 1]!.hash : "0".repeat(64)) && block.hash === this.hash(block) && block.hash === this.blocks[i]!.hash);
    } catch { return false; }
  }
  /** @param data - Non-secret event metadata. @returns Newly linked block. @throws AuditPersistenceException On append failure. */
  public append(data: Record<string, string | number>): Block {
    if (!this.verify()) throw new AuditIntegrityException();
    const block = { index: this.blocks.length, time: new Date().toISOString(), data: { ...data }, previousHash: this.blocks.at(-1)?.hash ?? "0".repeat(64), hash: "" };
    block.hash = this.hash(block);
    try { appendFileSync(this.path, JSON.stringify(block) + "\n", { mode: 0o600 }); }
    catch { throw new AuditPersistenceException(); }
    this.blocks.push(block); return { ...block, data: { ...block.data } };
  }
  /** @returns Public checkpoint for separate trusted storage. */
  public checkpoint(): { blocks: number; head: string } { return { blocks: this.blocks.length, head: this.blocks.at(-1)?.hash ?? "0".repeat(64) }; }
}
