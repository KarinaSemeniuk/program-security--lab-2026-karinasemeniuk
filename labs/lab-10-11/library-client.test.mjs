import test from 'node:test';
import assert from 'node:assert/strict';
import { LibraryClient } from './library-client.mjs';

const reply = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
test('reuses token, refreshes before expiry and keeps secrets out of GETs', async () => {
  let now = 0, logins = 0;
  const requests = [];
  const client = new LibraryClient('http://127.0.0.1:8080', 'id', 'secret', async (url, options) => {
    requests.push({ url, options });
    return url.endsWith('/auth/token') ? reply({ access_token: 'token-' + ++logins, token_type: 'Bearer', expires_in: 30 }) : reply({ ok: true });
  }, () => now);
  await client.get('/whoami'); await client.get('/api/books');
  assert.equal(logins, 1);
  now = 26000; await client.get('/api/summary'); assert.equal(logins, 2);
  for (const r of requests.filter(r => !r.url.endsWith('/auth/token'))) {
    assert.equal(r.options.body, undefined); assert.match(r.options.headers.Authorization, /^Bearer token-/);
    assert.equal(r.options.redirect, 'error');
  }
});
test('retries a rejected session only once', async () => {
  let logins = 0, reads = 0;
  const client = new LibraryClient('http://localhost:8080', 'id', 'secret', async url => {
    if (url.endsWith('/auth/token')) { logins++; return reply({ access_token: 'x', token_type: 'Bearer', expires_in: 30 }); }
    reads++; return reply({}, 401);
  });
  await assert.rejects(client.get('/whoami'), /HTTP 401/); assert.equal(logins, 2); assert.equal(reads, 2);
});
test('rejects credentials, invalid token contracts and untrusted routes', async () => {
  const client = new LibraryClient('http://localhost:8080', 'id', 'secret', async () => reply({ access_token: 'x', expires_in: -1 }));
  await assert.rejects(client.get('/whoami'), /Authentication failed/);
  await assert.rejects(client.get('//evil.example'), /Unsupported/);
  assert.throws(() => new LibraryClient('http://example.com', 'id', 'secret'), /HTTPS/);
});
