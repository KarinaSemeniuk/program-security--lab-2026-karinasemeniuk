# Client/Server Interaction

- React SPA calls the JSON REST API. Persistence is accessible only to the server.
- Sign-in issues a 15-minute HS256 JWT in a host-only HttpOnly SameSite=Strict
  cookie scoped to /api. Secure is required outside local loopback HTTP development.
- The browser sends cookies with credentials included; tokens are never returned
  in JSON or placed in browser storage. Bearer authentication is not supported.
- PostgreSQL stores active session UUIDs (JWT jti), account UUIDs and expiry, never
  full tokens. Every protected request verifies signature, issuer, audience,
  expiry, active session and current unblocked account. Roles are reloaded.
- Logout deletes the session before clearing the cookie. Database failure returns
  an error; it cannot be reported as successful logout. Expired/invalid tokens
  may be cleared idempotently. Login rotates an existing valid cookie session.
- Server instances share PostgreSQL session state; no sticky sessions are needed.
  The current local rate limiter still requires replacement before multi-instance use.
- Cookie-authenticated mutations require the exact configured Origin and a JSON
  body, reject cross-site Fetch Metadata and apply body limits. CORS permits only
  the configured origin and credentials. SameSite is an additional CSRF control.
- Errors: { "error": { "code": "...", "message": "..." } }. Authentication
  responses and failures use Cache-Control: no-store.
