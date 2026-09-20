# Changelog — Catalog

Append-only. Newest entry on top.

## [2026-09-20] Initial business logic documented
- Documented the `Resource` aggregate and its invariants.
- Clarified that availability computation reads `Booking` data through a query interface, not a direct join, to preserve the one-way context dependency.
