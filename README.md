# RoomBook

Course project for software security: room and workspace booking.

## Current implementation

- Layered backend: EntryPoint, Application, Domain, Infrastructure and Framework.
- PostgreSQL users, sessions, resources and bookings with an exclusion constraint.
- Password validation, bcrypt cost-12 hashing and USER registration.
- Authentication, public catalog/availability, private bookings and Admin resource/history API.
- Unit tests and separate manual local API verification.

React registration, sign-in, current-user profile and revocable sign-out are implemented. Catalog, availability, own bookings and Admin resource/history operations are implemented.

## Run locally

Use Node.js 22, npm 10 and PostgreSQL 16. See docs/guide/getting-started.md for
database configuration, migrations and local secrets.

    npm ci
    npx --no-install prisma generate
    npx --no-install prisma migrate deploy
    npm run typecheck
    npm run test:types
    npm test
    npm run build
    npm start

The local API listens on http://127.0.0.1:3000 by default.

## Documentation and labs

- docs/policy/project_policy.md — fixed stack and engineering rules.
- docs/internal_spec — domain contracts and invariants.
- docs/guide — setup, configuration, authentication and error handling.
- labs/lab-04 — password-hashing experiments and actual verification results.

## React interface

    npm --prefix frontend ci
    npm run typecheck:frontend
    npm run build:frontend

Run npm start for the backend, and npm run dev:frontend in a second terminal.
Open http://127.0.0.1:5173 to register an account through the React form.

React 18.3.1, TypeScript 5.6.3 and the approved Vite 6.4.5 are pinned in
frontend/package.json. Backend dependencies remain in the root npm package.

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

## Resource details and management

Catalog resources now include type, description, location and equipment. Open «Докладніше про простір» for the full page. Admin can edit descriptive information and reactivate inactive resources from «Керування». Edits use revisions to prevent lost updates; identity and scheduling step remain immutable. Existing bookings keep their times and status.

`npm run check:resources` runs an explicit local API/PostgreSQL check on isolated temporary fixtures and removes them afterwards. Apply migrations with `npx prisma migrate deploy` before running against another checkout.

## Service functionality

Resource opening hours/closed dates, IANA local-time viewing, versioned booking movement, filtered personal history, password changes/other-session revocation, and Admin account blocking are implemented. See `docs/guide/service-functionality.md`. `npm run check:service` checks the real local API/PostgreSQL on temporary fixtures and removes them afterwards.

## Лабораторні 10–16

- [Модель довіри і мережевий доступ](docs/guide/client-server-security.md)
- [Логування і моніторинг](docs/guide/logging-monitoring.md)
- [Наскрізні нотатки і перевірка історії](docs/guide/end-to-end-notes.md)
- [Резервування та локальний реліз](docs/guide/backup-release-support.md)

Версія 0.2.0 додає клієнтські AES-GCM нотатки, SHA-256 журнал подій, структуроване логування й відтворювані процедури резервування та відновлення. Початкова локальна конфігурація та ключі не входять у дистрибутив.
