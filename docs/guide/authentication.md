# Authentication

## Flow (implemented)

1. POST /api/auth/login accepts exactly email and password JSON strings.
2. The server normalizes email, checks bcrypt credentials and blocked status,
   persists a session, then issues a 900-second JWT through a host-only
   HttpOnly SameSite=Strict cookie (Path=/api, Secure outside loopback HTTP dev).
3. The browser sends credentials automatically; fetch uses credentials: include.
   No Authorization/Bearer header or browser-storage token is used.
4. GET /api/auth/me verifies HS256 signature, issuer, audience, expiry, active
   PostgreSQL session and the current unblocked account, returning a safe user DTO.
5. POST /api/auth/logout accepts {} JSON, deletes the current session and clears
   its cookie. Replaying the previous credential fails. Logout is idempotent for
   invalid/expired/already-revoked cookies. Other device sessions remain active.
6. Session expiry requires a new sign-in; there is no refresh token.

Mutations require the configured exact Origin and application/json, reject
cross-site Fetch Metadata, compressed bodies and bodies over 8 KiB. Login allows
10 attempts per direct address per minute (429, Retry-After: 60). Forwarded
addresses are not trusted. Authentication responses/errors are no-store.

Missing accounts use a dummy bcrypt comparison at cost 12. Unknown email, wrong
password and blocked account return the same 401 RB.IDN.10; malformed shape is
400. Missing/invalid/expired/revoked sessions return 401 RB.IDN.11. Infrastructure
failures do not masquerade as wrong credentials or successful logout.

The session table stores jti, user ID and expiry, never the complete token.
Expired records are removed during successful session creation. Local bounded
rate limiting remains unsuitable for multi-instance deployment.

## Failure cases

| Scenario | Response |
|---|---|
| Missing or malformed token | 401 Unauthorized |
| Valid token, insufficient role | 403 Forbidden |
| Wrong password | 401 Unauthorized, without revealing whether the email exists (FR-4) |

## Password policy

- Passwords contain at least 15 Unicode code points.
- The UTF-8 representation must not exceed 72 bytes.
- Spaces and Unicode characters are supported.
- No digit, uppercase-letter or special-character requirement is imposed.
- Passwords are not trimmed, lower-cased or silently truncated.
- Registration rejects complete passwords found in the configured
  blocklist of common or compromised passwords.
- Length and blocklist checks are enforced on the server.
- The registration form displays advisory strength feedback:
  weak, normal or strong. The estimate considers predictable patterns,
  not merely character classes, and runs locally in the browser.
- Passwords are hashed with bcrypt at cost 12 and a fresh random salt.

## Registration endpoint (implemented)

POST /api/auth/register accepts JSON with exactly two string fields: email and
password. On success it returns 201 and a user object containing id, canonical
email, role USER and createdAt. Credentials and hashes are excluded.

An account is created without automatically signing in. Sign-in is a separate action through the login form. FR-3 is enforced by the
PostgreSQL active-session allowlist.

Registration uses an 8 KiB JSON limit, rejects compressed bodies and applies five
attempts per direct client address in 15 minutes. Proxy headers are not trusted.
The limiter is bounded and local to one process; a multi-instance deployment
requires a shared limiter before public operation.

The bundled password blocklist is a limited coursework starter list. It does not
claim complete breach coverage. PASSWORD_BLOCKLIST_PATH selects a replacement.

## Registration form (2026-10-30)

- React presents email, password and exact confirmation, plus a show/hide control.
- Client feedback checks Unicode code points, UTF-8 byte size and confirmation.
  The backend still applies its own validation and configured blocklist.
- The approximate weak/normal/strong indicator uses the local zxcvbn-ts estimator
  with common and English dictionaries, keyboard graphs and account-related terms.
  It does not claim comprehensive Ukrainian dictionary coverage.
- The estimator returns only a numeric score to UI state. The complete library
  result contains the password and is never retained, logged or sent externally.
- Password and confirmation fields are cleared after successful registration.
  They are not stored in localStorage, sessionStorage or URLs.
- The API receives only email and password. A safe public success panel displays
  the backend's canonical email. Confirmation and role are not submitted.
