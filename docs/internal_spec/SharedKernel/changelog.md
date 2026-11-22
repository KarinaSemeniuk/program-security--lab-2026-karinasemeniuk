# Changelog — SharedKernel

## [2026-10-30] Catalog and Booking implementation
- Implement resource catalog, transactional booking lifecycle and server access rules.
- Add UTC half-open intervals and event foundations approved by the owner in chat.
- Preserve history, enforce overlap in PostgreSQL and verify negative access cases.

Append-only. Newest entry on top.

## [2026-10-30] Registration foundations implemented
- Implemented the documented value-object/entity contracts and UUID base.
- Implemented the exception hierarchy and concrete Core registry required by HTTP registration.
- Reviewed Identity and the documented Catalog/Booking consumers.

## [2026-09-20] Initial business logic documented
- Documented `AEntityIdVO` and `TimeRangeVO` as the two currently shared elements.
- Fixed the overlap predicate for `TimeRangeVO` as the single project-wide definition of "overlap", to prevent it being reimplemented inconsistently in `Booking` and `Catalog`.
