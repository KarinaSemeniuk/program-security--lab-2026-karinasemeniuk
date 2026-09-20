# Changelog — Identity

Append-only. Newest entry on top.

## [2026-09-20] Initial business logic documented
- Documented the `User` aggregate, its invariants, and the registration/authentication/blocking operations.
- Established that `role` can never be set to `ADMIN` through a public API path.
