# Configuration

> See `policy/project_policy.md` §2.2 for the exact, pinned technology stack this configuration assumes. Do not upgrade or swap a tool referenced below without going through the stack-change procedure in §2.1.

Configuration is provided via environment variables, never hard-coded
in source (see `policy/project_policy.md`).

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection string. |
| `JWT_SECRET` | Backend | Required random hex signing key, at least 64 hex characters; never log it. |
| `JWT_EXPIRES_IN` | Backend | Optional compatibility setting; only 900 seconds is accepted. |
| `CORS_ORIGIN` | Backend | Exactly one allowed frontend origin. |
| `VITE_API_BASE_URL` | Frontend | Base URL of the API the client talks to. |

None of the above are committed to the repository; each environment
keeps its own `.env` file, excluded via `.gitignore`.

## Registration configuration

| Variable | Default | Purpose |
|---|---|---|
| PORT | 3000 | Local API port |
| CORS_ORIGIN | http://127.0.0.1:5173 | Single allowed frontend origin |
| PASSWORD_BLOCKLIST_PATH | data/password-blocklist.json | Local JSON array of complete blocked values |

DATABASE_URL is required and must contain non-placeholder credentials. Optional
values left blank use the defaults above. JWT_SECRET is required for the authentication slice. npm start loads the local .env through Node 22.

## Frontend configuration

frontend/.env.example documents VITE_API_BASE_URL, a public API base only. Leave
it blank for the local /api proxy. Never put backend secrets into VITE_ variables.

The dev server defaults to 127.0.0.1:5173 and proxies to 127.0.0.1:3000.
ROOMBOOK_UI_PORT and ROOMBOOK_API_TARGET can select isolated local QA ports.
Proxy targets must use HTTP on localhost/127.0.0.1 with no credentials.

The frontend has its own root, strict filesystem allow-list, local-only listener,
no production source maps and development security headers. Backend .env files
are outside the frontend source tree.

## Authentication configuration

The local JWT_SECRET was initialized privately in .env; it is excluded from Git.
For a fresh environment, generate a random 32-byte key and store it privately in
JWT_SECRET as 64 hexadecimal characters. Never place it in VITE_ variables.
Changing the key invalidates all existing tokens. No fallback/default key exists.
JWT_EXPIRES_IN may be omitted or set to 900; other lifetimes are rejected.
Secure cookies are automatic for HTTPS origins. HTTP is permitted only for
loopback development; NODE_ENV=production requires an HTTPS frontend origin.
A public deployment must terminate TLS and keep the API behind its trusted proxy.

Apply schema changes with `npx prisma migrate deploy`; run `npx prisma generate`
after updating the schema. Migration 20261030000200_identity_sessions adds the
active-session table without rewriting user accounts.

## Catalog/Booking prerequisites

PostgreSQL 16 requires its contrib btree_gist extension (`postgresql16-contrib`
on Fedora). Apply migration 20261030000300_catalog_booking. The earlier local
attempt failed before creating objects because contrib was absent; after package
installation it was marked rolled back and applied successfully. No database or
users were reset. New environments should simply run prisma migrate deploy.

## Private notes and installation entitlement

NOTE_KEYRING_PATH defaults to .secrets/note-keys.json, owner-owned 0600. It contains
random private AES keys and must never enter frontend/DB/Git or a release package.
ROOMBOOK_INSTALLATION_ID binds the signed entitlement. LICENSE_PATH defaults to
data/installation-license.json; LICENSE_PUBLIC_KEY_PATH to data/license-public.pem.
LICENSE_ISSUER_PRIVATE_KEY_PATH is issuer CLI only (.secrets/license-issuer-private.pem);
API verification never reads it. Release signing uses another private key in .secrets/.
None of these paths/secret contents belongs in VITE_ variables. See the security guides.
