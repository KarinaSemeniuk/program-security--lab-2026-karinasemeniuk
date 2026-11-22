/** REST client for the supplied teaching server; credentials stay in memory. */
export class LibraryClient {
  #token = '';
  #expiresAt = 0;
  constructor(base, clientId, clientSecret, transport = fetch, clock = Date.now) {
    const url = new URL(base);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
        (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) {
      throw new Error('Use HTTPS or an explicit loopback teaching server.');
    }
    this.base = url.origin; this.clientId = clientId; this.clientSecret = clientSecret;
    this.transport = transport; this.clock = clock;
  }
  async #json(path, options) {
    const transport = this.transport;
    const response = await transport(this.base + path, {
      ...options, redirect: 'error', signal: AbortSignal.timeout(8000), cache: 'no-store',
    });
    const data = await response.json();
    return { response, data };
  }
  async authenticate() {
    this.#token = ''; this.#expiresAt = 0;
    const { response, data } = await this.#json('/auth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: this.clientId, client_secret: this.clientSecret }),
    });
    if (!response.ok || data.token_type !== 'Bearer' || typeof data.access_token !== 'string' ||
        !data.access_token || !Number.isSafeInteger(data.expires_in) || data.expires_in < 1) {
      throw new Error('Authentication failed or the token response is invalid.');
    }
    this.#token = data.access_token;
    this.#expiresAt = this.clock() + data.expires_in * 1000;
  }
  async get(path) {
    if (!/^\/(whoami|api\/(books(?:\/[A-Za-z0-9_-]+)?|loans|summary))$/.test(path)) {
      throw new Error('Unsupported protected route.');
    }
    if (!this.#token || this.clock() >= this.#expiresAt - 5000) await this.authenticate();
    for (let attempt = 0; attempt < 2; attempt++) {
      const { response, data } = await this.#json(path, { headers: { Authorization: 'Bearer ' + this.#token } });
      if (response.status === 401 && attempt === 0) { await this.authenticate(); continue; }
      if (!response.ok) throw new Error('The library request failed with HTTP ' + response.status + '.');
      return data;
    }
  }
  async overview() {
    // Authenticate once before issuing parallel protected reads.
    if (!this.#token || this.clock() >= this.#expiresAt - 5000) await this.authenticate();
    const [reader, books, loans, summary] = await Promise.all(
      ['/whoami', '/api/books', '/api/loans', '/api/summary'].map(path => this.get(path)));
    return { reader, books, loans, summary };
  }
  clear() { this.#token = ''; this.#expiresAt = 0; this.clientSecret = ''; }
}

if (typeof process !== 'undefined' && process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const id = process.env.LIBRARY_CLIENT_ID;
  const secret = process.env.LIBRARY_CLIENT_SECRET;
  if (!id || !secret) { console.error('Set LIBRARY_CLIENT_ID and LIBRARY_CLIENT_SECRET.'); process.exitCode = 1; }
  else {
    const client = new LibraryClient(process.env.LIBRARY_BASE_URL || 'http://127.0.0.1:8080', id, secret);
    try { console.log(JSON.stringify(await client.overview(), null, 2)); }
    catch { console.error('Unable to retrieve library data. Check the local server and credentials.'); process.exitCode = 1; }
    finally { client.clear(); }
  }
}
