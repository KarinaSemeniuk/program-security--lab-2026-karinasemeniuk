import bcrypt from "bcrypt";
import { randomInt } from "node:crypto";
import { writeFile } from "node:fs/promises";

const cost = 12;
const original = "2026_КБЗІ-23-2_Семенюк_8_";
const originalBytes = Buffer.byteLength(original, "utf8");
const base = original + "_".repeat(72 - originalBytes);

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const suffix = Array.from(
  { length: 10 },
  () => alphabet[randomInt(alphabet.length)],
).join("");

const variants = [
  { id: 1, description: "Базовий рядок", value: base },
  { id: 2, description: 'Базовий + "1"', value: base + "1" },
  { id: 3, description: "Базовий + 10 символів", value: base + suffix },
  { id: 4, description: "Базовий без останнього _", value: base.slice(0, -1) },
];

console.log("Експеримент bcrypt: обмеження 72 байти");
console.log("Параметр вартості:", cost);
console.log("Випадковий суфікс:", suffix);

for (const variant of variants) {
  variant.bytes = Buffer.byteLength(variant.value, "utf8");
  // Числовий параметр змушує bcrypt генерувати нову сіль.
  variant.hash = await bcrypt.hash(variant.value, cost);

  console.log(`\nРядок ${variant.id}: ${variant.description}`);
  console.log("Значення:", variant.value);
  console.log("Розмір:", variant.bytes, "байтів");
  console.log(`Хеш ${variant.id}:`, variant.hash);
}

const checks = [];
const table = [];

for (const candidate of variants) {
  const row = { "Рядок": candidate.id };

  for (const target of variants) {
    const matches = await bcrypt.compare(candidate.value, target.hash);

    checks.push({
      stringId: candidate.id,
      hashId: target.id,
      matches,
    });

    row[`Хеш ${target.id}`] = matches;
  }

  table.push(row);
}

console.log("\nРезультати всіх 16 перевірок:");
console.table(table);

const output = new URL("./bcrypt-limit-results.json", import.meta.url);

await writeFile(
  output,
  JSON.stringify({
    createdAt: new Date().toISOString(),
    nodeVersion: process.version,
    cost,
    original,
    originalBytes,
    suffix,
    variants,
    checks,
  }, null, 2) + "\n",
);

console.log("Результати збережено в bcrypt-limit-results.json");
