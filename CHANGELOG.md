# RoomBook changelog

## 2026-10-30 — Service functionality

Resource calendars/local time, guarded booking movement/history filters, account password/session controls and Admin blocking. Additive migrations 006/007 preserve existing data. Standalone lab experiments/reports remain deferred.

## [2026-10-30] Resource details and management
- Add ROOM/DESK descriptions, location and equipment, full detail pages, and extended catalog search.
- Add Admin metadata editing and reactivation with revision checks; preserve booking history and immutable grid.
- Apply additive migration 20261030000500_resource_details and add repeatable check:resources verification.

## [2026-10-30] Service development for labs 06–09
- Add owner-only encrypted notes, optimistic edits and retained-key rotation/recovery.
- Add catalog name/capacity filtering and explicit empty results.
- Add Licensing context, signed installation capabilities and safe Admin status.
- Add separately signed build inventories and local secret-artifact checks.
- Add build-only client selection transformation with execution-equivalence checks.
- Keep standalone course experiments and reports deferred; no housing/payment scope expansion.

## [2026-10-30] Catalog, bookings and access control
- Implement public catalog/availability, own bookings and Admin resource/history UI.
- Add role, ownership, cutoff, CSRF and rate-limit controls plus atomic PostgreSQL exclusion.
- Add owner-approved TimeRangeVO/event foundations and scheduled booking completion.
- Add idempotent sample catalog and explicit local Admin provisioning commands.
- Reports and standalone coursework experiments remain deferred by user request.

## [2026-10-30] Cookie authentication and revocable sessions
- Added sign-in, current-user and sign-out API/UI with uniform credential errors.
- Added PostgreSQL active-session migration; logout invalidates replayed tokens.
- Reconciled FR-3 with cookie/JWT architecture, CSRF controls and session checks.
- Added isolated tests and an explicit local PostgreSQL smoke check.

## 2026-10-30 — Registration slice

- Added the layered registration API and bcrypt-protected account persistence.
- Implemented the shared exception/value-object foundations used by Identity.
- Reviewed SharedKernel consumers: Identity, Catalog and Booking.
- Added unit tests using mocked persistence, plus a manual local API check.
