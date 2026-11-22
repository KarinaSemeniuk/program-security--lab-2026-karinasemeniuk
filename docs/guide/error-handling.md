# Error Handling

All API errors use a safe error envelope with an immutable project code:

    { "error": { "code": "RB.IDN.2", "message": "..." } }

| HTTP status | Registration example |
|---|---|
| 400 | Invalid JSON, unexpected fields, invalid email or unacceptable password |
| 403 | Request Origin differs from the configured frontend origin |
| 404 | Route is not implemented |
| 409 | Canonical email is already registered, including a concurrent insert |
| 413 | JSON body exceeds its route limit (authentication 8 KiB; workspace 32 KiB) |
| 415 | Unsupported media type, charset or compressed request body |
| 429 | More than five registration attempts per direct client in 15 minutes |
| 500 | Internal hashing or request-handling failure |
| 503 | Account persistence is unavailable |

Infrastructure wraps external errors before they cross its boundary. The HTTP
error responder exposes only the project code and public message. Stack traces,
database details, request bodies, passwords and hashes are never returned or logged.

Numeric exception allocations are documented in Identity/SharedKernel and are
never reassigned. The RB prefix has one source of truth in ARoomBookException.

## Authentication failures

- RB.IDN.10 / 401: uniform invalid credentials (unknown email, wrong password, blocked account).
- RB.IDN.11 / 401: missing, invalid, expired or revoked session, deleted or blocked user.
- Login RB.CORE.9 / 429 uses Retry-After: 60; registration retains 900 seconds.
- PostgreSQL/session failures remain safe infrastructure errors, never successful logout.
- Authentication successes and errors carry Cache-Control: no-store.

## Catalog and Booking allocations

CAT: 1 invalid resource (400), 2 missing/inactive public resource (404),
3 denied resource administration (403).
BKG: 1 reserved invalid range allocation (400; shared range parser currently uses
CORE.1), 2 overlapping booking (409), 3 inactive resource (409), 4 invalid grid or
duration (400), 5 nonfuture start (400), 6 missing booking (404), 7 access denied
(403), 8 expired cancellation window (409), 9 terminal/invalid transition (409).
INF: 7 catalog persistence, 8 booking persistence (503). Allocations are immutable.

## Notes and installation entitlements

BKG.10 invalid note -> 400; BKG.11 stale revision -> 409. INF.9 protection failure
-> 503; INF.10 failed note authentication -> 422 with no plaintext; INF.11 key
configuration -> 503; INF.12 note persistence -> 503. LIC.1/2/3 invalid/inactive/
missing-capability entitlements -> 403. Safe predefined UI messages never render
raw diagnostics or secret material from responses.

Resource metadata validation returns RB.CAT.4 / 400; stale resource edits or reactivation return RB.CAT.5 / 409. The editor offers explicit reload before retrying.
