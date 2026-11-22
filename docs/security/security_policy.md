# Security Policy — RoomBook

| | |
|---|---|
| Name | Security Policy — RoomBook |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal |
| Last updated | 2026-10-02 |
| Owner | Karina Semeniuk |
| Related documents | `policy/project_policy.md`, `security/privacy_policy.md`, `security/threat_model.md`, `specification/non-functional-requirements.md` |

## Table of Contents

1. Purpose
2. Scope
3. Roles and Responsibilities
4. Security Principles
5. Secure Development Environment
6. Software Protection
7. Secure Implementation
8. Security Verification
9. Vulnerability Management
10. Privacy Policy
11. Exceptions
12. Related Documents
13. Final Provisions

## 1. Purpose

This policy establishes the mandatory rules for the secure development of RoomBook, aimed at reducing the number of vulnerabilities, protecting source code, secrets and user data, and ensuring a controlled response to identified security issues.

It complements `policy/project_policy.md` (which governs code quality, architecture and process in general) by focusing specifically on security. Concrete, testable security-relevant conditions are tracked as non-functional requirements in `specification/non-functional-requirements.md` (NFR-4, NFR-5, NFR-6); this policy defines the rules and process that make those requirements achievable and verifiable, and is informed by the threats identified in `security/threat_model.md`.

This policy applies to all stages of the system's lifecycle currently in scope for the course project: development, documentation, and — once the application is actually deployed beyond local development — operation.

## 2. Scope

This policy applies to:

- All source code in `src/` (backend: Node.js/Express/Prisma; frontend: React).
- Automated tests in `tests/`.
- Configuration files and environment-variable definitions (`.env.example`, `prisma/schema.prisma`, build/dev-server config).
- CI configuration, once introduced (GitHub Actions or equivalent).
- The `docs/security/` documentation itself.

It is mandatory for anyone creating or modifying these artifacts — the project owner, any future collaborator, and AI agents used to assist with implementation.

**Explicitly out of scope:**
- The underlying operating system and network hardening of the machine or managed service hosting the application — this is the responsibility of whichever hosting/PaaS provider is eventually used, not of RoomBook's own codebase.
- Physical security of any hardware.
- The internal implementation of third-party libraries themselves (only how RoomBook selects, pins, and uses them is in scope — see §5).

## 3. Roles and Responsibilities

For a solo-developed course project, roles are formally defined even though currently held by one person, so the policy remains correct once collaborators (e.g. a course instructor added as a repository contributor) are involved.

| Role | Responsibility |
|---|---|
| Project owner | Approves this policy and any exception to it; approves the addition of new external dependencies with security implications. |
| Developer | Implements changes in accordance with this policy; runs local checks (lint, type-check, tests) before pushing. |
| Reviewer | Reviews security-sensitive changes (authentication, authorization, cryptography, secret handling) before they are merged. In the current solo-development phase, the author performs a deliberate self-review pass against this policy's §7 and §8 for such changes; this is revisited once a second contributor is added. |
| AI agent | Implements code under this policy and `policy/project_policy.md`. An AI agent does not independently decide to weaken, skip, or work around a security control (input validation, authentication, authorization, secret handling) to satisfy an ambiguous instruction — it implements the control as specified, or flags the ambiguity instead of guessing a weaker interpretation. |

## 4. Security Principles

- **Least privilege.** A JWT carries only the claims needed to authorize a request (`id`, `role`); the database user Prisma connects with has only the privileges the application actually needs (no superuser connection string).
- **Deny by default.** An API route not explicitly granted to a role is inaccessible to it — authorization middleware defaults to rejecting, not to allowing, an unrecognized or unmatched case.
- **Secure by default.** A fresh `.env` with placeholder values must never start the application successfully against a real database — see §5 on secret handling. CORS defaults to the single configured frontend origin, never to `*`.
- **Defense in depth.** The booking-overlap invariant (FR-10 / NFR-7) is enforced both in application code and as a database-level exclusion constraint, so a bug in one layer does not by itself break the guarantee.
- **Fail securely.** On an unhandled error, the API returns a generic `500` with no internal detail (see `guide/error-handling.md`) rather than defaulting to verbose output.
- **Minimize attack surface.** The system uses platform/library cryptographic primitives, PostgreSQL session revocation, and does not implement file uploads — functionality is not added without a corresponding functional requirement (see `policy/project_policy.md` §2.3 on what is explicitly not part of the stack).
- **No secrets in source code.** Passwords, API keys, the JWT signing secret and the database connection string are never committed to the repository, in any form, including in test fixtures or example data.

## 5. Secure Development Environment

- **Repository access.** The repository is hosted on GitHub; access is controlled through GitHub's own permission model (owner + explicitly invited collaborators, e.g. the course instructor as per the Lab 1 instructions).
- **Developer authentication.** All Git operations against the remote use SSH key authentication (see Lab 1); passwords over HTTPS are not used for Git operations.
- **Branch rules.** `main` is intended to always be in a working, reviewable state. Direct force-pushes to `main` are avoided; once a second contributor joins the project, branch protection requiring a pull request before merging into `main` will be enabled.
- **Secrets.** Local configuration lives in a `.env` file, excluded via `.gitignore`; a checked-in `.env.example` documents variable *names* only, never real values (see `guide/configuration.md`).
- **Dependencies.** A new dependency is added only when there is a concrete need (`policy/project_policy.md` §2.1/§2.3); before adding it, its license and `npm audit` output are checked for known vulnerabilities.
- **Static analysis.** `eslint`, `tsc --noEmit`, and `dependency-cruiser` run locally and are intended to run in CI before a change is merged (`policy/project_policy.md` §11).
- **AI agents.** An AI agent assisting with implementation operates under this policy and `policy/project_policy.md`; it is given the relevant `specification/` and `internal_spec/` documents as context rather than being asked to invent security-relevant behavior from an unspecified prompt.

## 6. Software Protection

- **Source code access** is limited to the repository owner and explicitly invited collaborators; the repository's visibility (public or private) is set per the Lab 1 instructions.
- **Critical branch protection** (`main`) is strengthened (required PR review) as soon as the project has more than one active contributor.
- **No secrets in artifacts.** Private keys, access tokens, database credentials and passwords are not included in the repository, in build output, or in logs.
- **Backups.** The local development database is not currently backed up — this is an accepted, explicit gap for a coursework project with no production data at stake (see §11, Exceptions). If RoomBook is ever deployed with real user data, the hosting provider's managed backup feature for PostgreSQL is a prerequisite, not an afterthought.
- **Build artifacts.** The frontend production build (`dist/`) and any server bundle are generated by a controlled build command (`npm run build`), not hand-edited, and do not embed secrets — only `VITE_`-prefixed, non-sensitive configuration is ever bundled into client-side code (see `guide/configuration.md`).

## 7. Secure Implementation

- **Validation and sanitization.** Every external input (API request body, query parameters, path parameters) is treated as untrusted and validated for type, format and range on the server, independently of any client-side validation (NFR-6).
- **Authentication.** Implemented via a signed JWT issued on successful sign-in; passwords are never compared or stored in plaintext.
- **Authorization.** Every protected operation checks the caller's role server-side via shared middleware (`policy/project_policy.md`, SharedKernel's "Shared authorization check"); the client's claim about its own role is never trusted.
- **Session management.** JWTs expire after 900 seconds and are carried in HttpOnly SameSite=Strict cookies. PostgreSQL active-session checks enforce logout revocation and current blocked status; cookie mutations require a trusted Origin. See `guide/authentication.md`.
- **Cryptography.** Password hashing uses bcrypt; JWT signing uses a well-maintained library (e.g. `jsonwebtoken`) with a secret of adequate length read from the environment. RoomBook does not implement its own cryptographic primitives under any circumstance.
- **Error handling.** Internal errors never leak stack traces, SQL statements, or other implementation detail in an API response (`guide/error-handling.md`).
- **Logging.** Passwords (plaintext or hashed), JWTs, and full request bodies of authentication endpoints are never written to logs.
- **Secure defaults.** CORS is restricted to the configured frontend origin(s); there is no wildcard origin in any environment.
- **Database.** All queries go through Prisma's parameterized query builder; no raw, string-concatenated SQL is used, which rules out classic SQL injection by construction rather than by discipline alone.
- **File handling.** Not applicable — RoomBook does not currently accept file uploads.

## 8. Security Verification

- Every change is expected to pass the full Jest test suite, `eslint`, and `tsc --noEmit` before being merged (`policy/project_policy.md` §11).
- Changes touching authentication, authorization, cryptography, or secret handling receive a dedicated, deliberate review pass against this document's §7, even during the solo-development phase.
- `npm audit` is run before adding a new dependency and periodically thereafter; a known **critical** vulnerability in a dependency blocks a release until it is fixed or a risk is formally accepted through the Exceptions process (§11 below).
- Negative-path testing is required alongside the happy path for every functional requirement, per `policy/project_policy.md` §10 and `testing/testing-strategy.md` — this includes authorization-failure cases (e.g. a `USER` calling an `ADMIN`-only endpoint must receive `403`, and this must be asserted by a test, not assumed).

## 9. Vulnerability Management

- **Reporting.** For the current coursework scope, vulnerabilities are identified through self-review, `npm audit`, and testing rather than external disclosure, since the repository has no public user base yet. If the project is ever exposed publicly with real users, a disclosure channel (e.g. a `SECURITY.md` with a contact address) will be added — tracked as a gap, not silently deferred.
- **Registration.** Each confirmed vulnerability is logged as a GitHub Issue tagged `security`, recording the affected component, impact, and severity.
- **Classification.** Severity is assessed informally as Critical / High / Medium / Low based on exploitability and impact (e.g. an authentication bypass is Critical; a verbose error message leaking a library version is Low).
- **Resolution and re-verification.** A fix is accompanied by a regression test reproducing the original issue; the issue is closed only once that test passes.
- **Root cause follow-up.** If a vulnerability stems from a systemic gap (e.g. a missing class of input validation, not just one missed field), `policy/project_policy.md`, `security/threat_model.md`, or `specification/non-functional-requirements.md` are updated accordingly, per the maintenance principle in `docs/README.md`.

## 10. Privacy Policy

RoomBook is designed for eventual multi-user operation, so its privacy rules are maintained as a standalone document rather than a section of this policy: see [`security/privacy_policy.md`](./privacy_policy.md). This keeps the option open to publish the privacy policy itself to end users later (e.g. during account registration) independently of this internal, non-public security policy.

## 11. Exceptions

- **Grounds.** A deviation from this policy is permitted only when a documented, concrete constraint makes full compliance impractical at the current project stage (e.g. "Secure Development Environment" lacking CI, since no CI pipeline has been set up yet in this coursework context).
- **Approval.** Each exception is approved by the project owner and recorded in this section (or in the related document it concerns) with a short justification.
- **Duration.** No exception is indefinite; it is re-reviewed whenever the related constraint changes (e.g. once CI is introduced, the corresponding exception below is removed, not left stale).

**Currently accepted exceptions:**

| Exception | Justification | Compensating measure | Review trigger |
|---|---|---|---|
| No CI pipeline enforcing checks automatically yet | Coursework project at an early stage; checks are run locally instead | Developer runs `eslint`, `tsc --noEmit`, and the full test suite locally before every push | Introducing GitHub Actions (or equivalent) |
| No database backups | No production data; local development database only | Database can be recreated from migrations with no data-loss impact | Any real deployment with user-entered data |
| Previous lack of token revocation — resolved 2026-10-30 | PostgreSQL active sessions enforce FR-3 | Current-session logout and 900-second expiry | Revoke-all-sessions remains future work |

## 12. Related Documents

- `policy/project_policy.md` — engineering rules, including the pinned technology stack this policy assumes.
- `specification/non-functional-requirements.md` — the concrete, testable security-relevant requirements (NFR-4–NFR-6) this policy exists to make achievable.
- `security/privacy_policy.md` — data handling rules.
- `security/threat_model.md` — the STRIDE-based analysis this policy's controls are intended to address.

Any change to the system's architecture or technology stack triggers a review of this policy for continued accuracy, per `policy/project_policy.md` §2.1.

## 13. Final Provisions

This policy takes effect upon approval by the project owner. It is reviewed after any significant change to the architecture, the threat model, the technology stack, or the development process, and at minimum once per course module that introduces new security-relevant functionality. Changes to this policy are committed separately with the `[POLICY]` prefix and a version bump, following the same rule as `policy/project_policy.md`. In case of a conflict between this policy and another project document, the stricter constraint applies until the documents are reconciled.

## Implemented cryptographic/service controls (2026-10-30)

Node/OpenSSL AES-GCM protects private notes with context-bound authentication,
separate owner-only key files and coordinated rotation. RSA-PSS/SHA-256 protects
installation capability artifacts and separately keyed SHA-256 release inventories.
No secret material is embedded in frontend/builds. Client transformation is an
analysis-cost measure, never an authorization or cryptographic boundary.
The local coursework deployment still requires operational backup, key custody,
TLS and shared rate limiting before real-user multi-instance production use.
