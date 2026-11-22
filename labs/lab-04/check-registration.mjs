import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";

const api = process.env.ROOMBOOK_API_URL ?? "http://127.0.0.1:3000";
const address = new URL(api);
assert.equal(address.protocol, "http:", "Для цієї перевірки потрібен локальний HTTP API.");
assert.equal(address.hostname, "127.0.0.1", "Перевірка призначена для локального RoomBook.");
const suffix = Date.now().toString(36) + randomBytes(3).toString("hex");
const email = "lab4-" + suffix + "@example.test";
const password = randomBytes(24).toString("base64url");
const checks = [];
let registered = null;

async function check(name, body, expected) {
  const response = await fetch(new URL("/api/auth/register", api), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  checks.push({ scenario: name, expected, actual: response.status });
  assert.equal(JSON.stringify(data).includes(password), false, "Пароль потрапив у відповідь.");
  assert.equal(response.status, expected,
    name + ": перед повторною перевіркою перезапусти API, щоб почати нове локальне вікно спроб.");
  return data;
}

await check("Короткий пароль", { email, password: "short" }, 400);
await check("Некоректний email", { email: "invalid", password }, 400);
await check("Спроба задати ADMIN", { email, password, role: "ADMIN" }, 400);
const result = await check("Успішна реєстрація", { email: email.toUpperCase(), password }, 201);
assert.deepEqual(Object.keys(result.user).sort(), ["createdAt", "email", "id", "role"]);
assert.equal(result.user.email, email);
assert.equal(result.user.role, "USER");
registered = result.user;
await check("Повторний email", { email, password }, 409);
await check("Перевищення ліміту", { email: "other-" + email, password }, 429);

console.table(checks);
console.log("Створений навчальний користувач:", registered.email);
console.log("UUID:", registered.id);
await writeFile(new URL("./registration-smoke-results.json", import.meta.url),
  JSON.stringify({ createdAt: new Date().toISOString(), checks, user: registered }, null, 2) + "\n");
console.log("Результати збережено в registration-smoke-results.json");
