# Testing Strategy

## Levels

| Level | Tooling | Scope |
|---|---|---|
| Unit | Jest | Individual service-layer functions: business rules from `internal_spec/` (overlap detection, state transitions, role checks) tested in isolation from HTTP and the database. |
| Integration | Jest + Supertest | HTTP endpoint contracts exercised with persistence and external-service adapters mocked, verifying status codes and response shapes match `specification/functional-requirements.md` and Project Policy section 10. |
| Manual / exploratory | — | Responsive layout checks (NFR-2, NFR-3) across viewport sizes, performed before each release. |

## Coverage expectations

Every functional requirement (FR-1 … FR-14) has at least one
integration test asserting both its success path and its documented
rejection path (e.g. FR-10's overlap rejection, FR-12's ownership
check).

## Test data

Automated tests use isolated in-memory doubles and mocks for external
dependencies. Manual PostgreSQL checks use the local development database.

## Naming

Test files mirror the source file they cover, suffixed with
`.test.ts` (e.g. `PasswordPolicyService.ts` → `PasswordPolicyService.test.ts`),
placed under `tests/` in the equivalent path to `src/`.

## Open development dependency finding (2026-10-30)

- npm audit reports seven low-severity dependency entries originating from deepmerge 4.3.1 in the Jest development dependency chain.
- Advisory: https://github.com/advisories/GHSA-gcqx-w48m-w2h4. No patched version is listed as of this review.
- Keep test configuration trusted and review this open finding before the PR and when an upstream patch becomes available. Production dependency audits are checked separately.

## Registration verification (2026-10-30)

- Domain tests cover identifier, email, role, hash and aggregate invariants;
  password failures, normalized duplicates and persistence races.
- Application tests verify command forwarding and public DTO field selection.
- EntryPoint unit tests cover malformed input, privilege-field injection,
  attempt windows and safe error classification.
- Infrastructure tests cover actual local bcrypt verification and wrapped
  failures; Prisma and filesystem operations are mocked.
- The separate manual script in labs/lab-04/check-registration.mjs exercises the
  running local API and creates one synthetic development account. It is not
  included in the isolated Jest suite.

## Frontend registration checks

Frontend tests live in frontend/tests and mirror its source layers. Root Jest
runs backend and frontend tests together. Fetch responses are mocked; the local
strength estimator is exercised directly without external requests.

Browser verification covers empty submissions, password feedback, mismatched
confirmation, server rejection and successful creation. The UI package build
and the frontend dependency audit are checked separately.

## Authentication validation

Jest tests mock persistence/HTTP and make no network calls. Authentication tests
cover credential errors, blocked/deleted users, session rotation, replay after
logout, revocation/storage failure, JWT signature/issuer/audience/expiry/profile,
configuration, strict HTTP input/cookies and typed frontend transport outcomes.

The separate manual command `node --env-file=.env labs/lab-04/check-authentication.mjs`
uses real local PostgreSQL and an isolated API on port 3104; it refuses an occupied
port, creates one synthetic account, cleans it up with cascading sessions and
stops only its own server. It checks CSRF, safe responses, cookie flags, expiry,
blocking, revoked-token replay and rate limits. It is not part of `npm test`.

## Catalog/Booking validation

Unit tests cover resource bounds/divisors, immutable half-open intervals,
availability privacy/boundaries, creation rules, cancellation cutoff/ownership,
terminal states, completion, event serialization/deduplication, Admin application
gates, owner-scoped queries, post-commit event dispatch/rollback and safe frontend
transport errors. Jest remains isolated with mocked storage/network.

The explicit `npm run check:workspace` uses real local PostgreSQL and a private
API server, checks concurrent requests and direct SQL exclusion as well as access
rules, then removes only its own fixtures. Browser QA covers catalog, date and
duration selection, booking/history/cancellation, Admin UI and responsive width.

## Development slices 06–09

Isolated tests cover Unicode note invariants, owner access, revisions, encryption
round trips, nonce freshness, ciphertext/tag/nonce/context corruption, retained-key
reads and safe key-file loading. RSA tests cover claims, signature scheme, validity,
installation binding, missing capability and application gate independence.

Separate local checks: check:notes (including 206-note rotation and failure recovery
when no pre-existing notes are present), check:license (temporary artifacts),
check:client-protection (2560 original/transformed scenarios), check:release-integrity
(valid/changed/unlisted artifacts) and check:build-secrets (private local scan).
These are implementation checks; deferred standalone course experiments are not
reported as completed. Browser QA verifies search/empty results and private-note
Unicode save/close behavior using only a synthetic owner/booking fixture.
