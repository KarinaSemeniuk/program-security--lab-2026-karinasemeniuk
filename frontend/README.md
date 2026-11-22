# RoomBook React registration

## Main source files

- src/EntryPoint/components/RegisterPage.tsx — form, accessible errors and success state.
- src/EntryPoint/components/PasswordStrengthMeter.tsx — local advisory strength feedback.
- src/Application/Identity/UseCase/RegisterUserUC.ts — client checks and gateway coordination.
- src/Infrastructure/Transport/RegistrationHttpGateway.ts — exact API request and safe public response.
- src/Infrastructure/Password/PasswordStrengthEstimator.ts — zxcvbn-ts numeric projection.
- src/EntryPoint/styles.css — responsive visual design.
- src/Framework/main.tsx — composition and React mounting.

## Run from the repository root

    npm --prefix frontend ci
    npm run typecheck:frontend
    npm run build:frontend
    npm run dev:frontend

The backend must run separately through npm start. Open http://127.0.0.1:5173.

## Build budget

The initial JavaScript bundle is capped at 250 kB uncompressed; CSS at 35 kB.
The pattern estimator and dictionaries load only after password entry and have
an explicit 1.8 MB lazy-chunk cap. Other asynchronous chunks keep a 500 kB cap.
The build fails if these budgets are exceeded.

The estimator is approximate. Its common/English dictionaries do not provide
comprehensive Ukrainian dictionary coverage. Credentials are not stored in
browser storage or sent to third-party estimation services.

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
