# Tech Notes — Identity

## Known limitations (by design, for the current release)

- There is no self-service password reset flow yet; FR coverage for this will be added when the requirement is prioritized, and this note removed once it lands.
- `role` escalation to `ADMIN` has no API path at all — it is done directly against the database. This is intentional for the current scope (see `business_logic.md`), not an oversight; do not "fix" it by adding an endpoint without a corresponding requirement and security review.

## Edge cases to keep in mind

- Email comparison for uniqueness must happen on the normalized (lower-cased) form — two registrations differing only by case must be rejected as duplicates.
- `isBlocked = true` does not cascade to existing bookings; a blocked user's future bookings remain valid until separately cancelled by an Admin (this is `Booking`'s rule, not `Identity`'s — cross-referenced here so it isn't missed when touching blocking logic).

## Non-obvious decisions

- `AuthenticateUserService` returns a boolean + the `User`, rather than issuing a token itself, specifically to keep JWT concerns out of `Domain` — token issuance is an `Infrastructure/Auth` responsibility invoked by the `SignInUserUC` use case, not by the domain service.
