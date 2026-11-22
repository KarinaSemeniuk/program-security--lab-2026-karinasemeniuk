# Non-Functional Requirements

Each requirement below names a concrete, checkable condition rather
than a vague quality goal (e.g. "the interface must be user-friendly"
is deliberately avoided).

## Performance

- **NFR-1.** The API response time for listing a resource's available
  slots shall not exceed 500 ms with up to 10,000 stored bookings.

## Usability & responsiveness

- **NFR-2.** The interface shall render and remain fully usable on
  viewport widths from 360px (mobile) to 1920px (desktop), without
  horizontal page scrolling.
- **NFR-3.** Every interactive element (button, form field) shall have
  a minimum touch target of 44×44px on viewports up to 480px wide.

## Security

- **NFR-4.** User passwords shall be stored only as a salted hash
  (bcrypt or equivalent), never in plaintext.
- **NFR-5.** Access to resource-management operations (FR-5–FR-7)
  shall be restricted to users with the Admin role; a request without
  the required role shall receive HTTP 403.
- **NFR-6.** Every API input shall be validated for type, format and
  range on the server, independently of any client-side validation.

## Reliability

- **NFR-7.** Booking creation shall be atomic: two concurrent requests
  for the same slot shall never both succeed.

## Compatibility

- **NFR-8.** The client shall function correctly on the latest two
  major versions of Chrome, Firefox and Safari.

## Scalability

- **NFR-9.** The backend application layer shall be horizontally
  scalable without requiring changes to the database schema.

## Availability

- **NFR-10.** The sign-in endpoint and the booking-creation endpoint
  shall enforce a rate limit of no more than 10 requests per minute
  per IP address, returning HTTP 429 when exceeded. *(Identified as a
  gap by `security/threat_model.md` — Denial-of-Service entries for
  `F1`, `D1` and `P2` — and recorded here before implementation, per
  Specification-Driven Development.)*

## Registration controls — REGISTRATION-SECURITY

- Registration requests shall contain at most 8 KiB of JSON and shall not use
  compressed request bodies.
- Registration shall permit at most five attempts from one direct client address
  in a 15-minute window and return HTTP 429 on further attempts.
- The local coursework implementation shall bound address tracking to 5000
  entries. Shared rate limiting is required before a multi-instance deployment.
- Browser requests shall be restricted to the exact configured frontend origin;
  client-supplied proxy headers shall not change the registration quota identity.

## Authentication sessions — AUTHENTICATION-SECURITY

- Sign-in accepts exactly email and password strings, at most 8 KiB uncompressed
  JSON; at most ten attempts per minute per direct client address.
- Invalid credentials (including unknown and blocked accounts) return the same 401.
- The access token expires after 900 seconds; no refresh token is issued.
- JWT cookies are HttpOnly, SameSite=Strict, host-only, Path=/api; Secure outside
  loopback HTTP development. Browser storage never receives the credential.
- Protected requests check PostgreSQL session state and current account status.
  Logout revokes the current session across server instances before succeeding.
- Cookie-authenticated mutations require an exact trusted Origin and JSON.
