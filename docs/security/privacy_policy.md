# Privacy Policy — RoomBook

| | |
|---|---|
| Name | Privacy Policy — RoomBook |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal (intended for future publication to end users) |
| Last updated | 2026-10-02 |
| Owner | Karina Semeniuk |
| Related documents | `security/security_policy.md`, `internal_spec/Identity/business_logic.md`, `specification/scope.md` |

> This document is maintained separately from `security/security_policy.md` because RoomBook is designed for multi-user operation: this policy may eventually be shown to end users directly (e.g. at registration), while the security policy remains an internal, non-public document.

## Purpose

This document defines which personal and other sensitive data RoomBook collects, why, where it is stored, who can access it, and how long it is kept. It formalizes the data-minimization principle: the system collects only what it needs to perform the functions described in `specification/scope.md`.

## Categories of Data

| Category | Fields | Source |
|---|---|---|
| Account data | Email address, password (stored only as a bcrypt hash) | Provided directly by the user at registration (FR-1). |
| Authorization data | Role (`USER` / `ADMIN`), account-blocked flag | Assigned by the system at registration; role changes are made directly by the project owner, not through a public API (`internal_spec/Identity/business_logic.md`). |
| Booking data | Resource booked, start/end time, booking status | Created by the user when making a booking (FR-9). |

**RoomBook explicitly does not collect:** payment information, physical addresses, phone numbers, government identifiers, or any data from users beyond what is listed above — consistent with payments being out of scope entirely (`specification/scope.md`).

## Purpose of Processing

- Email + password hash: authenticating the user (FR-2) and uniquely identifying their bookings.
- Role: enforcing authorization decisions (NFR-5) — e.g. restricting resource management to Admins.
- Booking data: fulfilling the core booking functionality (FR-8–FR-13) and allowing a user to see their own booking history.

No data is processed for advertising, profiling, or any purpose other than operating the features described in `specification/functional-requirements.md`.

## Storage

All data is stored in the project's own PostgreSQL database (see `architecture/data-model.md`); RoomBook does not use any third-party data-processing service at this stage.

## Access Control

- A user's own account data and booking history are visible only to that user and to an Admin (FR-13, FR-7).
- A Guest or another User never sees another user's email, password hash, or personal booking history — the public resource catalog (FR-14) exposes only resource information, never user-identifying data (`internal_spec/Booking/business_logic.md`: `ListActiveBookingsForResourceAQ` deliberately excludes `userId` for exactly this reason).
- Database access is limited to the backend application's own database role; no other component or person has direct database access outside local development.

## Data Sharing and Transfer

RoomBook does not share, sell, or transfer any user data to third parties or external services. There is currently no external integration (email provider, analytics, calendar sync — see `specification/scope.md`'s explicit exclusions) that would receive user data.

## Retention

- Account data is retained for as long as the account is not deactivated.
- Booking history is retained indefinitely at this stage, to support the "view past bookings" feature (FR-13) and administrative oversight (FR-7); this will be revisited if a retention-limit requirement is introduced.

## Deletion

- Account deactivation is implemented as a soft-delete pattern (`isBlocked` / an inactive flag), not immediate physical deletion, so that booking history remains attributable and consistent (`internal_spec/Identity/business_logic.md`).
- **Known gap:** there is currently no self-service "delete my account and data" endpoint. This is explicitly tracked here rather than assumed away; it would need to be added as a functional requirement before RoomBook could be considered compliant with a right-to-erasure expectation (e.g. under GDPR-style regimes), should the project ever handle real users' data outside a coursework context.

## Logging of Sensitive Data

Per `security/security_policy.md` §7, passwords (plaintext or hashed) and JWTs are never written to application logs. Booking data may appear in logs only as non-identifying references (e.g. a booking id), never alongside the associated user's email in the same log line unless strictly necessary for debugging, and never persisted beyond normal log retention.

## Encryption

- Passwords: hashed with bcrypt before storage; the plaintext password never reaches the database.
- Data in transit: intended to be served over HTTPS/TLS in any non-local environment (local development over plain HTTP is accepted, per the Exceptions in `security/security_policy.md`).
- Data at rest: encryption of the database at rest relies on the hosting/managed-database provider's own capability, if and when RoomBook is deployed beyond local development; the application layer does not implement its own at-rest encryption.

## User Rights

As a coursework project with no real end users yet, formal data-subject rights (access, correction, erasure, portability) are not implemented as user-facing features. This section is kept here deliberately, as a placeholder reflecting the known gap above, so that it is addressed before any real deployment rather than overlooked.

## Data Minimization

Registration collects only an email and a password — no name, phone number, or other profile field is requested unless a future functional requirement explicitly justifies it. Any new field proposed for collection is checked against this principle before being added to the `User` entity (`internal_spec/Identity/business_logic.md`).
