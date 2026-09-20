# Changelog — SharedKernel

Append-only. Newest entry on top.

## [2026-09-20] Initial business logic documented
- Documented `AEntityIdVO` and `TimeRangeVO` as the two currently shared elements.
- Fixed the overlap predicate for `TimeRangeVO` as the single project-wide definition of "overlap", to prevent it being reimplemented inconsistently in `Booking` and `Catalog`.
