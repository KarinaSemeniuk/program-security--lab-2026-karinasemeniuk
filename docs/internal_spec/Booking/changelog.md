# Changelog — Booking

Append-only. Newest entry on top.

## [2026-09-20] Initial business logic documented
- Documented the `Booking` aggregate, its full status lifecycle, and the creation/cancellation policies.
- Established the non-overlap invariant as enforced both in `CreateBookingDPolicy` and via a database-level exclusion constraint.
- Documented `ListActiveBookingsForResourceAQ` as the sanctioned read path for `Catalog`, deliberately excluding `userId` from its result.
