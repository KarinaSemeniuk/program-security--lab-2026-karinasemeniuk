# Threat Model — RoomBook

| | |
|---|---|
| Name | Threat Model — RoomBook |
| Version | 0.1.0 |
| Status | Draft |
| Last updated | 2026-10-02 |
| Owner | Karina Semeniuk |
| Related documents | `architecture/overview.md`, `security/security_policy.md`, `specification/non-functional-requirements.md` |

## Scope

This single, project-wide threat model covers the SPA client, the API server, the PostgreSQL database, and the two data flows between them (client ↔ API, API ↔ database), matching the system's size as described in `architecture/overview.md`. One combined model is used rather than one per module, per the Lab 3 guidance for a project of this scale; it will be split per bounded context only if the system's complexity grows enough to warrant it.

Out of scope for this model:
- The security of the operating system, network, or physical hardware of wherever the application is eventually hosted — this is the hosting provider's responsibility, not RoomBook's own design.
- The internal implementation of third-party libraries (Express, Prisma, React) — only how RoomBook uses them is considered.
- Browser-internal security mechanisms (the sandboxing of the browser itself) beyond what the SPA's own code can influence.

## System Overview

RoomBook consists of a React SPA client, an Express API server with PostgreSQL session state, and a PostgreSQL database accessed through Prisma — see `architecture/overview.md` for the full component diagram. The client and the API communicate over HTTPS/JSON; authentication is via a signed JWT attached to each request. The API is the only component with direct database access.

### DFD elements

| ID | DFD Type | Name |
|---|---|---|
| E1 | External Interactor | End User (Guest / User / Admin, via browser) |
| P1 | Process | SPA Client (React) |
| P2 | Process | API Server (Express) |
| D1 | Data Store | PostgreSQL Database |
| F1 | Data Flow | SPA Client → API Server (HTTPS/JSON, JWT) |
| F2 | Data Flow | API Server → Database (SQL via Prisma) |
| TB1 | Trust Boundary | Public Internet / API Server |
| TB2 | Trust Boundary | API Server / Database |

### Relationships

- `E1 End User` interacts with `P1 SPA Client` through the browser.
- `P1 SPA Client` sends requests to `P2 API Server` via `F1`, which crosses `TB1` — the boundary between the untrusted public internet and the application's own backend.
- `P2 API Server` reads and writes data in `D1 Database` via `F2`, which crosses `TB2` — the boundary between the application process and its persistence layer.
- `P1 SPA Client` itself is treated as running in an untrusted environment (the end user's browser), since its code, though served by RoomBook, executes outside RoomBook's control once delivered.

## Threat Actor Model

| Actor | Access level | Initial privileges | Capabilities | Available interfaces | Constraints |
|---|---|---|---|---|---|
| Unauthenticated external user | Public internet | None (Guest) | Can browse the public resource catalog (FR-14); can attempt to register or sign in; can send arbitrary HTTP requests to any public endpoint. | Public REST API, SPA client | No valid JWT; blocked by authentication middleware from any protected endpoint. |
| Authenticated User (legitimate or with stolen credentials) | Valid JWT, `role = USER` | All User-level operations (FR-8–FR-13) | May attempt to access or modify another user's booking (IDOR-style attempts), or probe Admin-only endpoints for missing authorization checks. | Full REST API as a User | Bound by server-side authorization checks (NFR-5), assuming they are correctly implemented everywhere. |
| Malicious or compromised Admin | Valid JWT, `role = ADMIN` | All Admin-level operations, including managing the resource catalog and any user's bookings | Can deactivate resources, view and cancel any booking; an insider-threat scenario rather than an external attacker. | Full REST API as an Admin | Only mitigated by logging/audit (currently limited — see Gaps below) and by the smaller pool of people who could hold this role. |
| Network-level attacker (on-path / MITM) | Between `P1` and `P2`, or between `P2` and `D1` | None by default | If TLS is absent or misconfigured, can intercept or modify traffic in `F1`/`F2`. | Network layer, not the application's own interfaces | Mitigated by enforcing HTTPS/TLS in any non-local environment (`security/security_policy.md` §7). |
| Compromised dependency (supply-chain) | Runs with the full privileges of the Node.js process | Whatever the compromised package can execute at install- or run-time | Could exfiltrate the JWT secret, database credentials, or user data directly from the running process. | No external interface — executes inside `P2` | Mitigated only by dependency vetting and `npm audit` (`security/security_policy.md` §5, §8); not fully preventable. |

## STRIDE Analysis

Canonical STRIDE ↔ DFD element-type mapping (per Lab 3 theory):

| DFD Element | S | T | R | I | D | E |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| External Interactor | ✓ | | ✓ | | | |
| Data Flow | | ✓ | | ✓ | ✓ | |
| Data Store | | ✓ | | ✓ | ✓ | |
| Process | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Only relevant categories are filled in per element below.

| Element | S | T | R | I | D | E |
|---|---|---|---|---|---|---|
| **E1 End User** *(External Interactor)* | An attacker can act as a legitimate user by using stolen credentials or a stolen/leaked JWT. | — | A user could deny having made or cancelled a booking, if the system does not retain enough information to attribute the action unambiguously (current `Booking` status history has no explicit per-transition actor/timestamp log beyond `createdAt`). | — | — | — |
| **F1 SPA Client → API Server** *(Data Flow)* | — | A request could be modified in transit if TLS is absent or misconfigured (e.g. a booking's `resourceId` or `timeRange` altered before reaching the server). | — | The JWT or booking details could be intercepted on an unencrypted connection. | A flood of requests (e.g. repeated `CreateBookingAC` calls) could exhaust API server resources. | — |
| **F2 API Server → Database** *(Data Flow)* | — | Query parameters constructed unsafely could allow unauthorized data modification (mitigated by Prisma's parameterized queries — see `security/security_policy.md` §7 — but recorded here as the threat the control addresses). | — | A compromised or misconfigured connection could expose data in transit between the API and the database. | A connection-pool exhaustion (e.g. from a request flood, see F1) could make the database flow unavailable to legitimate requests. | — |
| **D1 PostgreSQL Database** *(Data Store)* | — | Data (e.g. a `Booking`'s status or a `User`'s role) could be altered without authorization if database credentials are compromised. | — | Unauthorized access could expose email addresses, password hashes, or booking history. | The database could be made unavailable through resource exhaustion (connection flooding) or a corrupted migration. | — |
| **P1 SPA Client** *(Process)* | An attacker could spoof the legitimate client by serving a modified copy of the SPA from another origin (e.g. phishing). | Malicious script injection (XSS) into the client could alter its behavior or exfiltrate data. | A client-side action is not independently auditable — the server-side log is the only trustworthy record of what actually happened. | A JWT stored insecurely in the browser (e.g. in `localStorage`) could be exfiltrated via an XSS vulnerability. | — | — |
| **P2 API Server** *(Process)* | An attacker could forge requests claiming to be a different user if JWT verification is misconfigured (e.g. accepting an unsigned or weakly-signed token). | Malformed input could corrupt internal state if server-side validation (NFR-6) is incomplete for some endpoint. | Without sufficient audit logging, a critical operation (e.g. an Admin cancelling another user's booking) cannot be unambiguously attributed after the fact. | A broken authorization check could let the API return booking or account data belonging to a different user (an IDOR vulnerability). | A large volume of requests (e.g. repeated sign-in attempts, or `CreateBookingAC` calls) could exhaust API server resources — no rate limiting is currently implemented. | A missing or incorrect role check on an Admin-only route (FR-5–FR-7) could let a `USER`-role caller perform a privileged operation. |

> As noted in the Lab 3 theory, STRIDE categories are not mutually exclusive — several rows above (e.g. the F1 flood and the P2 resource-exhaustion entries) describe the same underlying weakness (no rate limiting) surfacing as Denial of Service at more than one element.

## Identified Gaps and Follow-up

The following gaps surfaced directly from this analysis and are tracked here rather than silently assumed to be handled elsewhere:

1. **No rate limiting** on authentication or booking-creation endpoints (contributes to D at `F1`, `D1`, and `P2`). Not yet reflected as a non-functional requirement — should be added to `specification/non-functional-requirements.md` before implementation, per Specification-Driven Development.
2. **No explicit audit trail** for status-changing actions beyond `Booking.createdAt` (contributes to R at `E1` and `P2`). A candidate future addition: a `BookingStatusChangedDE`-driven audit log (the event already exists conceptually in `internal_spec/Booking/business_logic.md`; it is simply not yet persisted as a queryable log).
3. **JWT storage — resolved 2026-10-30:** host-only HttpOnly SameSite=Strict cookies; Secure for HTTPS. Cookie-authenticated mutations require exact Origin and JSON. XSS can still invoke actions within an authenticated page.
4. **Token revocation — resolved 2026-10-30:** PostgreSQL sessions are checked on every protected request; logout deletes the active session before succeeding.

These gaps feed back into `specification/non-functional-requirements.md` and `security/security_policy.md` as they are addressed, per the consistency-check rule in `policy/project_documentation_policy.md`.

## Authentication control update (2026-10-30)

Login now has a bounded local 10/minute/direct-IP limiter. Registration remains
5/15 minutes. Booking endpoints and their limiter remain unimplemented. Shared
rate limiting is still required before multi-instance deployment. Current profile
is the only protected application endpoint; Catalog/Booking authorization is
planned for lab 05. Revoke-all-sessions and durable security audit are future work.

## Catalog/Booking control update (2026-10-30)

Owner-only history/cancellation, Admin-only resource mutations/history and current
session/role resolution mitigate IDOR/role escalation. Exact input contracts reject
injected userId/status/role fields. Cookie mutations enforce trusted Origin and
JSON. Resource locks plus PostgreSQL exclusion prevent double-booking races.
Booking creation enforces 10/minute/direct-IP attempts. Rate limiting is still
process-local and domain event delivery is not an audit log. Local SQL operators
remain trusted; privileged direct database writes are outside API authorization.

## Notes, entitlements and release controls (2026-10-30)

Database-only disclosure of private notes is mitigated by AES-GCM keys outside DB.
Owner binding prevents non-owner/Admin reads; authenticated context/revision prevents
cross-record copying and stale API overwrites. Tag failure releases no plaintext.
Full authentic database rollback and API/OS compromise are outside this protection.

Signed installation claims are checked server-side against a configured RSA trust
key and local binding; copying a signed license to another binding, expiry, altered
payloads and absent capabilities fail closed. The server clock/trust configuration
is privileged. Separately signed release inventories detect tampering/unlisted files
before deployment. Build-only client obfuscation raises inspection cost but cannot
protect secrets placed in a browser; none are placed there.
