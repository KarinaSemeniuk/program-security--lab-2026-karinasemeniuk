import bcrypt from "bcrypt";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";

const password = "pass: Семенюк";
const cost = 12;

const dictionary = [
  "123456",
  "password",
  "qwerty",
  "admin",
  "12345678",
  "roomBook",
  "RoomBook2026",
  "Karina",
  "karina2026",
  "Semeniuk",
  "semeniuk",
  "Семенюк",
  "pass: semeniuk",
  "pass: Semeniuk",
  "pass: Каріна",
  "pass: Семенюк1",
  "pass: Семенюк2026",
  "pass:Семенюк",
  "Pass: Семенюк",
  password,
];

const sha256Hash = createHash("sha256")
  .update(password, "utf8")
  .digest("hex");

const bcryptHash = await bcrypt.hash(password, cost);

const data = {
  createdAt: new Date().toISOString(),
  nodeVersion: process.version,
  password,
  cost,
  dictionary,
  sha256Hash,
  bcryptHash,
};

await writeFile(
  new URL("./hash-comparison-input.json", import.meta.url),
  JSON.stringify(data, null, 2) + "\n",
);

console.log("Навчальний пароль:", password);
console.log("Кількість кандидатів:", dictionary.length);
console.log("Кандидат №20:", dictionary.at(-1));
console.log("Хеш №5 — SHA-256:", sha256Hash);
console.log("Хеш №6 — bcrypt:", bcryptHash);
console.log("Вартість bcrypt:", cost);
console.log("Дані збережено в hash-comparison-input.json");
