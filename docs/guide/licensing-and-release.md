# Installation entitlement and signed releases

Application implementation for lab 08; the separate OpenSSL license.json/.sig
experiment and coursework report remain deferred. Source-code LICENSE is unchanged.
The model is a single-organization hosted service (SaaS) with provider-managed
installation entitlements; there are no payments or commercial billing features.

## Installation capabilities

A signed entitlement grants booking, private-notes and/or resource-admin capabilities.
These gate new bookings, note writes and resource creation respectively. Ordinary
user/owner/Admin authorization still applies. Existing data reads, authentication,
cancellation and resource deactivation remain available even when entitlement fails.
Admin sees safe activation/expiry/capability status through GET /api/admin/service.
A User cannot inspect that endpoint.

Signed claims contain productId=roombook, installationId, licenseId, holder,
issuedAt, notBefore, expiresAt and unique known capabilities. A single JSON envelope
stores canonical base64 payload bytes and signature, making updates atomic at the
artifact-file level. The API verifies exact bytes before decoding JSON and checking
product, local installation binding, validity and capability. Signature scheme is
RSA-PSS/SHA-256, RSA 3072, digest-length salt. Other algorithms/schemes are rejected.
No browser claim or client-side license check grants a protected operation.

Default paths:
- data/installation-license.json: non-secret signed artifact.
- data/license-public.pem: deployment-pinned public verification key.
- ROOMBOOK_INSTALLATION_ID in backend .env: installation binding.
- .secrets/license-issuer-private.pem: issuer CLI only, not read by API.

`npm run license:init` creates missing local development issuer/binding/artifact,
or preserves an existing artifact. This workspace already has a valid one-year
local development entitlement with all three capabilities. No account was promoted
and no password was created by licensing initialization.

Explicit issuance example:

    npm run license:issue -- --holder "Local development" --days 365 --features booking,private-notes,resource-admin

Issue only from the trusted issuer environment. For deployment distribute the
signed artifact and pinned public key; keep the issuer private key outside the
API runtime/package. Artifact renewal is read on subsequent requests; installation
binding changes require appropriate configuration/restart. Public-key replacement
is a trust-root change, not an untrusted license input.

Failure codes: LIC.1 invalid signature/claims/binding; LIC.2 inactive window;
LIC.3 capability absent. Gated mutations return safe 403. Admin status fails closed
without revealing signing material. Licensing cannot constrain an administrator
who can replace the entire server implementation/trust configuration or control
the server clock; that environment is trusted in this model.

## Release authenticity and file integrity

The release inventory covers exact files under dist/ and frontend/dist/. Each is
hashed with SHA-256. A separate release RSA-3072 key signs the manifest with
RSA-PSS/SHA-256. Verification checks signature before paths, rejects path traversal,
symlinks, duplicate/unlisted files, inventory differences and changed content.

`npm run release:sign` signs already built artifacts and verifies the result.
`npm run release:verify` verifies before packaging/deployment. Rebuild requires
re-signing. Generated artifacts/release-manifest.json is ignored by Git; the release
public key is data/release-public.pem, private key remains under .secrets/ and is
never distributed. Pin the trusted public key through the trusted deployment path;
an attacker-supplied replacement key is not an authenticity reference.

`npm run check:release-integrity` tests valid, modified-file, modified-signature and
unlisted-file cases using temporary fixtures. `npm run check:license` uses temporary
signed licenses/keys and an isolated API on 3110, checking invalid/expired/wrong-
installation/feature-disabled cases without touching the real installation artifact.
`npm run check:build-secrets` checks generated files locally against configured
private values and PEM markers without displaying any secret material.
