# Changelog — Booking

## 2026-10-30 — Service functionality

Added resource-local calendars and IANA viewing, atomic versioned booking movement/history filters, password replacement/session revocation and guarded Admin account blocking. Existing bookings/notes are retained. See functional requirements FR-30–35 and guide/service-functionality.md.

## [2026-10-30] Private authenticated notes
- Add owner-only notes, exact Unicode validation and optimistic revisions.
- Encrypt with AES-256-GCM; reject corruption, cross-record substitution and stale writes.
- Add coordinated retained-key rotation and rollback/recovery verification.

## [2026-10-30] Catalog and Booking implementation
- Implement resource catalog, transactional booking lifecycle and server access rules.
- Add UTC half-open intervals and event foundations approved by the owner in chat.
- Preserve history, enforce overlap in PostgreSQL and verify negative access cases.

Append-only. Newest entry on top.

## [2026-09-20] Initial business logic documented
- Documented the `Booking` aggregate, its full status lifecycle, and the creation/cancellation policies.
- Established the non-overlap invariant as enforced both in `CreateBookingDPolicy` and via a database-level exclusion constraint.
- Documented `ListActiveBookingsForResourceAQ` as the sanctioned read path for `Catalog`, deliberately excluding `userId` from its result.
