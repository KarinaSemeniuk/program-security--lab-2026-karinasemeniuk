// Local operator view; reads rotated JSONL files without opening a public metrics endpoint.
import { readFileSync } from 'node:fs';
const path = process.env.AUDIT_LOG_PATH || 'var/log/audit.jsonl';
try {
  const since = Date.now() - 60000;
  const events = readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  const recent = events.filter(e => Date.parse(e.time) >= since && e.event === 'http.completed');
  const durations = recent.map(e => e.durationMs).sort((a,b) => a-b);
  console.log(JSON.stringify({ windowSeconds: 60, requests: recent.length,
    failedLogins: recent.filter(e => e.route === '/login' && e.status === 401).length,
    serverErrors: recent.filter(e => e.status >= 500).length,
    p95DurationMs: durations.length ? durations[Math.ceil(durations.length * .95) - 1] : null,
    thresholdAlerts: events.filter(e => Date.parse(e.time) >= since && e.event === 'monitor.threshold').length }, null, 2));
} catch { console.error('Audit journal cannot be read or contains invalid records.'); process.exitCode = 1; }
