# Changelog — Identity

## 2026-10-30 — Service functionality

Added resource-local calendars and IANA viewing, atomic versioned booking movement/history filters, password replacement/session revocation and guarded Admin account blocking. Existing bookings/notes are retained. See functional requirements FR-30–35 and guide/service-functionality.md.

## [2026-10-30] Cookie authentication and revocable sessions
- Added sign-in, current-user and sign-out API/UI with uniform credential errors.
- Added PostgreSQL active-session migration; logout invalidates replayed tokens.
- Reconciled FR-3 with cookie/JWT architecture, CSRF controls and session checks.
- Added isolated tests and an explicit local PostgreSQL smoke check.

Append-only. Newest entry on top.

## [2026-10-30] React registration interface
- Added the layered client form, local password feedback and explicit API outcome handling.
- Added isolated frontend validation, use-case, transport and estimator tests.

## [2026-10-30] Registration API implemented
- Implemented registration across EntryPoint, Application, Domain and Infrastructure.
- Added bcrypt cost-12 persistence, canonical email uniqueness and public-data projection.
- Added mocked adapter tests and a separate manual local API verification script.

## [2026-10-30] Password policy validation implemented
- Added PasswordPolicyService and typed validation feedback for FR-1.
- Enforced 15 Unicode code points, a 72-byte UTF-8 maximum and a configured whole-password blocklist.
- Added unit tests for ASCII, Cyrillic, emoji, whitespace, invalid Unicode and blocklist behavior.

## [2026-09-20] Initial business logic documented
- Documented the `User` aggregate, its invariants, and the registration/authentication/blocking operations.
- Established that `role` can never be set to `ADMIN` through a public API path.
