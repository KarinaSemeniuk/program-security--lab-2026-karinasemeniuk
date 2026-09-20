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
