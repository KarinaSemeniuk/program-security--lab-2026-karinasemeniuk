import { FileHashChain } from "#infrastructure/Audit/FileHashChain";
import { AuditIntegrityException } from "#infrastructure/Exception/AuditIntegrityException";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
describe("FileHashChain", () => {
 let dir: string, path: string;
 beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "rb-chain-")); path = join(dir, "ledger.jsonl"); });
 afterEach(() => rmSync(dir, { recursive: true, force: true }));
 it("persists a linked history and returns detached blocks", () => {
  const chain = new FileHashChain(path); const one = chain.append({ operation: "genesis" }); one.data.operation = "changed";
  const two = chain.append({ operation: "booking" }); expect(two.previousHash).toBe(one.hash);
  expect(chain.verify()).toBe(true); expect(new FileHashChain(path).checkpoint()).toEqual(chain.checkpoint());
 });
 it("detects a changed old record on the running object and on reopen", () => {
  const chain = new FileHashChain(path);chain.append({ operation: "genesis" });chain.append({ operation: "booking" });
  writeFileSync(path, readFileSync(path, "utf8").replace('"genesis"', '"altered"'));
  expect(chain.verify()).toBe(false);expect(() => chain.append({ operation: "next" })).toThrow(AuditIntegrityException);
  expect(() => new FileHashChain(path)).toThrow(AuditIntegrityException);
 });
 it("detects truncation relative to the in-memory checkpoint", () => {
  const chain = new FileHashChain(path);chain.append({ operation: "genesis" });chain.append({ operation: "booking" });
  writeFileSync(path,readFileSync(path,"utf8").split("\n")[0]+"\n");expect(chain.verify()).toBe(false);
  expect(new FileHashChain(path).checkpoint()).not.toEqual(chain.checkpoint());
 });
 it("rejects reordered blocks", () => {
  const chain = new FileHashChain(path);chain.append({ operation: "genesis" });chain.append({ operation: "booking" });
  writeFileSync(path,readFileSync(path,"utf8").trim().split("\n").reverse().join("\n")+"\n");
  expect(() => new FileHashChain(path)).toThrow(AuditIntegrityException);
 });
});
