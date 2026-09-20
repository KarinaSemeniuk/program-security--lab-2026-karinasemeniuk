# Client/Server Interaction

## Viewpoint

This view addresses how the client and the backend communicate, for
developers implementing either side.

## Description

- The client is a single-page application. All navigation happens
  client-side; the server exposes a stateless JSON REST API.
- Authentication uses a signed access token (JWT). After a successful
  sign-in (FR-2), the client stores the token and attaches it to every
  subsequent request via the `Authorization: Bearer <token>` header.
- The server does not keep session state in memory or in the database
  beyond the user record itself — every request is authorized
  independently based on the token's claims (role, user id). This
  statelessness is what makes NFR-9 (horizontal scalability) possible.
- Errors follow a consistent shape: `{ "error": { "code": "...", "message": "..." } }`,
  with HTTP status codes assigned per `policy/project_policy.md`.
