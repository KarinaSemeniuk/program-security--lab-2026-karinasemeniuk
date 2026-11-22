# Data Storage Structure

## Viewpoint

This view addresses how domain entities are persisted, for developers
and DBAs working on the schema.

## Core tables

| Table | Purpose | Key relationships |
|---|---|---|
| `users` | Accounts and roles (Identity context) | referenced by `bookings.user_id` |
| `resources` | Bookable assets (Catalog context) | referenced by `bookings.resource_id` |
| `bookings` | Reservations (Booking context) | references `users`, `resources` |

## Notes

- `bookings` enforces non-overlap for the same `resource_id` at the
  database level via an exclusion constraint on the `[start_at, end_at)`
  range, in addition to the application-level check in the Booking
  service — this is the concrete mechanism behind NFR-7 (atomicity).
- Soft-deletion is used for `users` and `resources` (an `is_active` /
  `is_blocked` flag) rather than physical deletion, to preserve
  historical booking data — see the relevant `internal_spec/*/business_logic.md`.

Full entity field lists live with each bounded context's business
logic document, to keep the data shape next to the rules that govern
it.

## Authentication sessions

POST /api/auth/login -> AuthenticationController -> SignInUserUC ->
AuthenticateUserService -> IAuthenticationRepository / IPasswordVerifier.
GetCurrentUserUC and SignOutUserUC use ITokenService / ISessionRepository.
Infrastructure adapters implement these Domain contracts; Framework composes them.
The sessions table has UUID id (JWT jti), user_id (users FK, cascading delete),
expires_at (TIMESTAMPTZ), and an expiry index. JWT strings are never stored.

## Resource and booking tables (2026-10-30)

resources: UUID PK, name VARCHAR(100), capacity, min_slot_minutes, is_active.
bookings: UUID PK, user_id/users FK, resource_id/resources FK, start_at/end_at
TIMESTAMPTZ(3), booking_status enum, created_at. Account/resource deletion is
restricted while history references them. Deactivation/cancellation retain rows.

CHECK guards positive capacity/slot duration and end > start. Partial GiST
bookings_no_overlap EXCLUDE (resource_id WITH =, tstzrange(start_at,end_at,'[)')
WITH &&) applies to PENDING/CONFIRMED. The btree_gist extension supplies UUID
operators. Supporting indexes cover user/start, resource/start and status/end.

## Encrypted private notes

booking_notes has booking_id PK/FK (cascade with booking), format_version, key_id,
nonce, ciphertext, tag, revision and updated_at. It stores no plaintext note or AES
key. Unique key_id/nonce plus format/size/check constraints guard the envelope.
Logical content revisions protect concurrent edits; key rotation preserves those
revisions/timestamps while replacing authenticated encryption material.
Installation entitlements and trust keys are files managed outside DB; release
manifests contain hashes/signatures, never secret material.

### Resource description extension

ResourceModel additionally stores type (resource_type ROOM/DESK, default ROOM), description (text, application limit 2000 code points), location (varchar 200), equipment (text array, up to 20 distinct labels) and revision (nonnegative integer, default 0). Migration 20261030000500_resource_details is additive and preserves booking foreign keys. Metadata editing and reactivation compare revision under the resource row lock.

### Calendar and movement fields

Migration 20261030000600_resource_calendar adds resources.time_zone, weekly JSONB (seven windows), closed_dates text array. Migration 20261030000700_booking_revision adds bookings.revision >= 0. Existing rows retain 24-hour access and revision 0. No ownership, note or booking foreign keys change. Password replacement and blocking reuse users/sessions in atomic transactions.
