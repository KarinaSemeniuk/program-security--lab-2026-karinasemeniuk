// Explicit local integration smoke check; separate from isolated Jest tests.
// Run: node --env-file=.env labs/lab-04/check-authentication.mjs
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
const port = Number(process.env.ROOMBOOK_AUTH_QA_PORT || '3104');
const origin = 'http://127.0.0.1:5204';
const base = `http://127.0.0.1:${port}`;
const db = new PrismaClient();
const email = `qa-session-${randomUUID()}@example.test`;
const password = 'Quiet room for навчання 2026';
const checks = [];
let child;
let accountId;
async function request(path, status, body, cookie, extra = {}) {
  const response = await fetch(base + '/api/auth/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Origin: origin, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(cookie ? { Cookie: cookie } : {}), ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  assert.equal(response.status, status, `${path}: unexpected status ${response.status}`);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  checks.push({ path, status });
  return response;
}
try {
  // Check before spawning; never attach to or terminate a pre-existing server.
  const net = await import('node:net');
  await new Promise((resolve, reject) => {
    const probe = net.createServer(); probe.once('error', reject);
    probe.listen(port, '127.0.0.1', () => probe.close(resolve));
  });
  child = spawn(process.execPath, ['--env-file=.env', 'dist/Framework/main.js'], {
    env: { ...process.env, PORT: String(port), CORS_ORIGIN: origin }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    if (child.exitCode !== null) throw new Error('QA server exited during startup');
    try { if ((await fetch(base + '/health')).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'QA listener did not start');
  await request('me', 401);
  await request('login', 403, { email, password }, '', { Origin: 'http://evil.example' });
  await request('login', 403, { email, password }, '', { Origin: '' });
  await request('login', 403, { email, password }, '', { 'Sec-Fetch-Site': 'cross-site' });
  await request('login', 400, { email, password, role: 'ADMIN' });
  const register = await request('register', 201, { email, password });
  accountId = (await register.json()).user.id;
  const wrong = await request('login', 401, { email, password: 'wrong password' });
  const missing = await request('login', 401, { email: 'nobody-' + email, password });
  assert.deepEqual(await wrong.json(), await missing.json());
  const response = await request('login', 200, { email: email.toUpperCase(), password });
  const setCookie = response.headers.get('set-cookie');
  assert.ok(setCookie && /HttpOnly/.test(setCookie) && /SameSite=Strict/.test(setCookie) && /Path=\/api/.test(setCookie));
  const cookie = setCookie.split(';')[0];
  const user = (await response.json()).user;
  assert.deepEqual(Object.keys(user).sort(), ['createdAt', 'email', 'id', 'role']);
  await request('me', 200, undefined, cookie);
  await request('me', 401, undefined, cookie.slice(0, -10) + 'aaaaaaaaaa');
  const expired = jwt.sign({ sub: accountId, jti: randomUUID(), iat: Math.floor(Date.now()/1000)-901,
    exp: Math.floor(Date.now()/1000)-1 }, process.env.JWT_SECRET,
    { algorithm: 'HS256', issuer: 'roombook', audience: 'roombook-web' });
  await request('me', 401, undefined, 'roombook_session=' + expired);
  await db.userModel.update({ where: { id: accountId }, data: { isBlocked: true } });
  await request('me', 401, undefined, cookie);
  await request('login', 401, { email, password });
  await db.userModel.update({ where: { id: accountId }, data: { isBlocked: false } });
  const logout = await request('logout', 204, {}, cookie);
  assert.match(logout.headers.get('set-cookie') || '', /Expires=Thu, 01 Jan 1970/);
  await request('me', 401, undefined, cookie); // Replay the captured credential after revocation.
  await request('logout', 204, {}, cookie);
  await request('logout', 204, {});
  // Exhaust remaining login attempts, including incorrect ones; forwarded IP cannot bypass it.
  let limited = false;
  for (let i = 0; i < 12; i++) {
    const res = await fetch(base + '/api/auth/login', { method: 'POST', headers: {
      Origin: origin, 'Content-Type': 'application/json', 'X-Forwarded-For': `192.0.2.${i}`,
    }, body: JSON.stringify({ email, password: 'wrong' }) });
    if (res.status === 429) { assert.equal(res.headers.get('retry-after'), '60'); limited = true; break; }
    assert.equal(res.status, 401);
  }
  assert.ok(limited, 'login rate limit was not enforced');
  checks.push({ path: 'login/forwarded-address-limit', status: 429 });
  console.log(JSON.stringify({ result: 'passed', checks, syntheticAccountRemoved: true }, null, 2));
} finally {
  if (accountId) await db.userModel.deleteMany({ where: { id: accountId } });
  else await db.userModel.deleteMany({ where: { email } });
  await db.$disconnect();
  if (child && child.exitCode === null) { child.kill('SIGINT'); await once(child, 'exit'); }
}
