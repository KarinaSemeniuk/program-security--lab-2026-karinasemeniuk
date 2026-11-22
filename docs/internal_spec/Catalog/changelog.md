# Changelog — Catalog

## 2026-10-30 — Service functionality

Added resource-local calendars and IANA viewing, atomic versioned booking movement/history filters, password replacement/session revocation and guarded Admin account blocking. Existing bookings/notes are retained. See functional requirements FR-30–35 and guide/service-functionality.md.

## 2026-10-30 — Resource information and lifecycle

Added public active/Admin inactive detail views, ROOM/DESK metadata, revision-checked Admin edits and reactivation. Slot size is immutable; existing bookings and history are retained. Resource-admin entitlement gates the new mutations. Additive migration 20261030000500_resource_details.

## [2026-10-30] Catalog and Booking implementation
- Implement resource catalog, transactional booking lifecycle and server access rules.
- Add UTC half-open intervals and event foundations approved by the owner in chat.
- Preserve history, enforce overlap in PostgreSQL and verify negative access cases.

Append-only. Newest entry on top.

## [2026-09-20] Initial business logic documented
- Documented the `Resource` aggregate and its invariants.
- Clarified that availability computation reads `Booking` data through a query interface, not a direct join, to preserve the one-way context dependency.
