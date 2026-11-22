# Getting Started

## Implemented slice

The backend currently provides GET /health and POST /api/auth/register.
The React client implements registration, sign-in, current-user profile and revocable sign-out. Catalog, booking and role/ownership controls are implemented.

## Prerequisites

- Node.js 22 and npm 10.
- PostgreSQL 16 with a roombook database and a non-superuser owning that database.
- TCP password authentication for the application role through SCRAM-SHA-256.

## Development

1. Install locked dependencies with npm ci.
2. Copy .env.example to .env and set DATABASE_URL using percent-encoded credentials.
   Keep .env local and excluded from Git.
3. Run npx --no-install prisma generate.
4. Apply committed migrations with npx --no-install prisma migrate deploy.
5. Run npm run typecheck, npm run test:types, npm test and npm run build.
6. Start the local API with npm start.

## Manual registration verification

Start a fresh API process, then run in another terminal:

    node labs/lab-04/check-registration.mjs

The script sends six local API requests: short password, invalid email, attempted
ADMIN injection, successful USER registration, duplicate email and attempt-limit
rejection. It creates one synthetic account under example.test and records public
results in labs/lab-04/registration-smoke-results.json. It does not save or print
the generated password. Restart the API before repeating the check to reset its
local attempt window.

Automated Jest tests mock persistence and do not contact PostgreSQL.

## React registration page (2026-10-30)

The frontend lives in its own npm package under frontend/. From the repository root:

    npm --prefix frontend ci
    npm run typecheck:frontend
    npm run build:frontend

Start the backend with npm start in one terminal, then npm run dev:frontend in
another. Open http://127.0.0.1:5173. Registration requests are proxied locally to
http://127.0.0.1:3000. Keep both processes running.

After a manual API smoke test exhausts the five-attempt window, restart the local
backend before using the form. UI validation itself sends no registration request.

## Authentication UI (2026-10-30)

The initial page is the public resource catalog. Use the sign-in button to authenticate. Switch to registration to create an account, then
sign in to see the current profile. Reload restores the cookie session. Logout
revokes it in PostgreSQL. Catalog, booking pages and Admin management are implemented; see docs/guide/access-control.md.

From the repository root: `npx prisma generate`, `npx prisma migrate deploy`,
`npm run build`, then `npm start`. JWT_SECRET must be configured privately in .env
(see docs/guide/configuration.md). In a second terminal run `npm run dev:frontend`
and open http://127.0.0.1:5173. Stop an older API you started using Ctrl+C before
starting the rebuilt API; do not start a second instance on the same port.

## Catalog and bookings

See `docs/guide/access-control.md` for the full access matrix, API, UTC scheduling,
setup, Admin provisioning and verification. Three sample resources were added
with the idempotent `npm run seed:catalog`; no default account/password exists.
After registration use `npm run admin:promote -- your-registered-email` locally
if you need to manage resources. No public role-escalation endpoint exists.

## Security/service development slices 06–09

The catalog supports name/capacity filtering. My bookings has lazy owner-only
private notes, stored with authenticated encryption and optimistic revisions.
Admin sees installation capabilities. Gated operations require a signed active
installation entitlement; read/cancel access survives expiry. Production builds
transform the pure client slot-selection module. Signed release manifests protect
build integrity/authenticity before distribution.

Fresh-environment setup after dependency installation: `npx prisma generate`,
`npm run build`, `npx prisma migrate deploy`, `npm run notes:init`,
`npm run license:init`, `npm run seed:catalog`, `npm run build:frontend`.
This workspace is already initialized; preserve .env and .secrets/.
Normal start remains npm start plus npm run dev:frontend in another terminal.

Guides: docs/guide/private-notes.md, licensing-and-release.md and
client-protection.md. Reports and standalone coursework experiments remain deferred.
