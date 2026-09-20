# Authentication

## Flow

1. A client submits credentials to the sign-in endpoint (FR-2).
2. On success, the server issues a signed access token containing the
   user's `id` and `role` as claims.
3. The client attaches the token to subsequent requests via the
   `Authorization: Bearer <token>` header.
4. The server verifies the token's signature and expiry on every
   request; it does not consult session state (see
   `architecture/context-diagram.md`).

## Failure cases

| Scenario | Response |
|---|---|
| Missing or malformed token | 401 Unauthorized |
| Valid token, insufficient role | 403 Forbidden |
| Wrong password | 401 Unauthorized, without revealing whether the email exists (FR-4) |
