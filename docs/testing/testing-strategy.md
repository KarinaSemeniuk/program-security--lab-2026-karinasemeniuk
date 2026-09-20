# Testing Strategy

## Levels

| Level | Tooling | Scope |
|---|---|---|
| Unit | Jest | Individual service-layer functions: business rules from `internal_spec/` (overlap detection, state transitions, role checks) tested in isolation from HTTP and the database. |
| Integration | Jest + Supertest | API endpoints exercised end-to-end against a test database, verifying status codes and response shapes match `specification/functional-requirements.md`. |
| Manual / exploratory | — | Responsive layout checks (NFR-2, NFR-3) across viewport sizes, performed before each release. |

## Coverage expectations

Every functional requirement (FR-1 … FR-14) has at least one
integration test asserting both its success path and its documented
rejection path (e.g. FR-10's overlap rejection, FR-12's ownership
check).

## Test data

Tests run against a dedicated test database, reset between test runs,
never against staging or production data.

## Naming

Test files mirror the source file they cover, suffixed with
`.test.ts` (e.g. `booking-service.ts` → `booking-service.test.ts`),
placed under `tests/` in the equivalent path to `src/`.
