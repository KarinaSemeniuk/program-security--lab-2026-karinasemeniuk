import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { readFile, writeFile } from "node:fs/promises";

async function findPassword(targetHash, algorithm, dictionary) {
  if (algorithm !== "SHA-256" && algorithm !== "bcrypt") {
    throw new Error("Невідомий алгоритм");
  }

  let attempts = 0;
  const start = performance.now();

  for (const candidate of dictionary) {
    attempts += 1;

    const matches = algorithm === "SHA-256"
      ? createHash("sha256").update(candidate, "utf8").digest("hex") === targetHash
      : await bcrypt.compare(candidate, targetHash);

    if (matches) {
      const elapsedMs = performance.now() - start;

      return {
        algorithm,
        found: true,
        password: candidate,
        attempts,
        elapsedMs,
      };
    }
  }

  return {
    algorithm,
    found: false,
    password: "",
    attempts,
    elapsedMs: performance.now() - start,
  };
}

const input = JSON.parse(await readFile(
  new URL("./hash-comparison-input.json", import.meta.url),
  "utf8",
));

console.log("Кількість кандидатів:", input.dictionary.length);
console.log("Вартість bcrypt:", bcrypt.getRounds(input.bcryptHash));
console.log("Виконується послідовний перебір...");

const sha256Result = await findPassword(
  input.sha256Hash,
  "SHA-256",
  input.dictionary,
);

const bcryptResult = await findPassword(
  input.bcryptHash,
  "bcrypt",
  input.dictionary,
);

const results = [sha256Result, bcryptResult];
const timeRatio = bcryptResult.elapsedMs / sha256Result.elapsedMs;

console.table(results.map((result) => ({
  "Алгоритм": result.algorithm,
  "Знайдено": result.found,
  "Пароль": result.password,
  "Спроб": result.attempts,
  "Час, мс": result.elapsedMs.toFixed(6),
})));

console.log(
  "Відношення часу bcrypt / SHA-256:",
  timeRatio.toFixed(1),
);

await writeFile(
  new URL("./hash-comparison-results.json", import.meta.url),
  JSON.stringify({
    createdAt: new Date().toISOString(),
    nodeVersion: process.version,
    candidateCount: input.dictionary.length,
    bcryptCost: bcrypt.getRounds(input.bcryptHash),
    results,
    timeRatio,
  }, null, 2) + "\n",
);

console.log("Результати збережено в hash-comparison-results.json");
