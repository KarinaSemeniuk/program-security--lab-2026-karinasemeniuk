# Tech Notes — Identity

## Known limitations (by design, for the current release)

- There is no self-service password reset flow yet; FR coverage for this will be added when the requirement is prioritized, and this note removed once it lands.
- `role` escalation to `ADMIN` has no API path at all — it is done directly against the database. This is intentional for the current scope (see `business_logic.md`), not an oversight; do not "fix" it by adding an endpoint without a corresponding requirement and security review.

## Edge cases to keep in mind

- Email comparison for uniqueness must happen on the normalized (lower-cased) form — two registrations differing only by case must be rejected as duplicates.
- `isBlocked = true` does not cascade to existing bookings; a blocked user's future bookings remain valid until separately cancelled by an Admin (this is `Booking`'s rule, not `Identity`'s — cross-referenced here so it isn't missed when touching blocking logic).

## Non-obvious decisions

- `AuthenticateUserService` returns the authenticated `User` or an Identity exception, rather than issuing a token itself, specifically to keep JWT concerns out of `Domain` — token issuance is an `Infrastructure/Auth` responsibility invoked by the `SignInUserUC` use case, not by the domain service.

## Password validation (2026-10-30)

- PasswordPolicyService returns typed expected validation failures; registration callers map rejected results to the appropriate application/domain exceptions.
- It snapshots a required blocklist supplied by its caller. Production blocklist loading belongs to Infrastructure/configuration wiring.
- Matching uses the complete submitted value. Passwords are not trimmed or lower-cased.
- Lone UTF-16 surrogates are rejected to prevent UTF-8 replacement from making distinct inputs equivalent.
- UI strength feedback is a separate frontend concern.

## Registration adapters (2026-10-30)

- The local blocklist loader is now implemented in Infrastructure/Configuration.
  The supplied list is a small coursework starter list of common complete values,
  not a comprehensive breach corpus. Replace or extend it through
  PASSWORD_BLOCKLIST_PATH as requirements evolve.
- The whole password is matched exactly. Neither hashing nor registration trims
  or lower-cases passwords; email canonicalization remains separate.
- Public registration accepts only email and password. Unknown fields are rejected.
  Role, identifier, blocked state and timestamps are assigned by the server.
- Password hashes are available to Identity's adapters, but never included in
  UserDTO or API logs. Registration creates an account without issuing a session.
- Identity code allocations: 1 invalid email, 2 short password, 3 long password,
  4 blocklisted password, 5 invalid password Unicode, 6 duplicate email,
  7 invalid stored hash, 8 invalid role, 9 invalid creation time.
- Import aliases use Node's native package imports (#domain, #application,
  #infrastructure, #entrypoint), matched by TypeScript paths and Jest mappings.

## React registration slice (2026-10-30)

The frontend registration workflow is now composed in frontend/src/Framework.
Expected API outcomes are represented as typed data, while the backend retains
its existing exception hierarchy. The frontend uses safe predefined messages
for known backend codes and never renders arbitrary technical response text.

The browser estimator recognizes common/English patterns and keyboard graphs.
Its approximate score is advisory and is not a server acceptance threshold.

## Authentication session decisions (2026-10-30)

- FR-3 supersedes the original client-only logout limitation. The old stateless
  Bearer description has been replaced with cookies and PostgreSQL sessions.
- IDN codes 10 = uniform invalid credentials, 11 = unauthenticated session.
- The session repository currently owns a separate Prisma pool, closed on shutdown.
- PostgreSQL expiry cleanup runs on successful login; a scheduled cleanup can be
  added for larger deployments. Revoked records are deleted immediately.
- The application has no refresh-token, password-reset or MFA flow. MFA remains
  optional course work. Blocking is checked using current records but has no API.
- The shared rate-limit exception retains its registration default Retry-After;
  login explicitly overrides that response header to 60 seconds.

## Credential and block races

Password compare-and-swap and all-session revocation share one transaction. Login performs a post-session-creation read comparing the exact hash and unblocked state against its verified snapshot; on mismatch it revokes the issued identifier and returns no token. Password-change route allows five attempts per account/minute and uses existing same-origin POST controls. No password/hash is included in results or logs. Wrong current password is RB.IDN.15/400; conflicts RB.IDN.13/409; account administration denial RB.IDN.12/403; missing account RB.IDN.14/404.

Self-service recovery by email remains deferred; this block changes a known password, not a forgotten one. Targeting Admin is denied under lock; promotion remains the existing explicit local CLI operation. Admin directory selects safe columns and never returns credential hashes.
