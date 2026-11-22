# ====== Identity BUSINESS LOGIC ======

## Purpose

`Identity` owns:
- User accounts: registration and the credentials used to authenticate them.
- Authentication: verifying credentials and issuing an access token.
- Authorization data: the role that governs what a user may do elsewhere in the system.

**NOT here:**
- What a role is *allowed to do* in another context — e.g. "only Admin may deactivate a resource" is enforced in `Catalog`/`Booking`'s own services, which read the role but do not own it.
- Booking history or any resource-related data — that belongs to `Booking` and `Catalog`, referenced only by `userId`.

## Entities

| Entity | Basic Fields | Description | Invariants |
|---|---|---|---|
| `User` *(Aggregate Root)* | id, email, passwordHash, role, isBlocked, createdAt | The account aggregate of this context; represents one account holder. | - `id` is immutable once assigned.<br>- `email` is unique across all users and normalized (lower-cased) before comparison.<br>- `passwordHash` is never the plaintext password and is never exposed outside `Identity`.<br>- A newly created `User` always starts with `role = USER` and `isBlocked = false`.<br>- `role` cannot be escalated to `ADMIN` through any public registration or profile-update path. |

## Value Objects

| Value Object | Description | Invariants |
|---|---|---|
| `UserIdVO` | Typed identifier for `User`, extends `AEntityIdVO` from `SharedKernel`. | - Immutable.<br>- UUID validity is guaranteed by the base class, not re-implemented here. |
| `EmailVO` | Represents a validated, normalized email address. | - Immutable.<br>- Validated against RFC 5322 format on construction; normalized to lower-case. |
| `UserRoleVO` | Wraps the `UserRole` enum (`USER`, `ADMIN`) as a typed VO rather than a raw enum. | - Immutable.<br>- Value validity is inherited from the enum, not re-implemented. |

## Domain Policies

| Domain Policy | Description |
|---|---|
| `BlockUserDPolicy` | Validates that a `User` may transition to `isBlocked = true`; currently unconditional (any active user can be blocked), kept as an explicit policy so future conditions (e.g. "cannot block the last remaining Admin") have a single place to live. |

## Domain Services

| Domain Service | Operation |
|---|---|
| `PasswordPolicyService` | Checks password length, valid Unicode and a configured whole-password blocklist; returns typed policy feedback without altering the submitted value. |
| `RegisterUserService` | Validates email uniqueness and password strength, hashes the password, and creates a `User` with `role = USER`. Emits no domain event in the current release. |
| `AuthenticateUserService` | Verifies a supplied password against the stored hash; does not issue the token itself (that is an Infrastructure/Auth concern) — it returns the active User or a uniform credential failure. |
| `BlockUserService` | Applies `BlockUserDPolicy` and sets `isBlocked = true`. Admin-only; enforced by the calling use case, not by this service. |

## Domain Events

Identity does not currently publish domain events. If a future requirement needs other contexts to react to account changes (e.g. cancelling a blocked user's bookings automatically), a `UserBlockedDE` will be introduced here first, per `policy/project_policy.md` §5.

## Application Commands & Queries

**Commands (`AC`):**

| Area | Commands |
|---|---|
| Registration | `RegisterUserAC` |
| Session | `SignInUserAC`, `SignOutUserAC` |
| Administration | `BlockUserAC` |

**Queries (`AQ`):**

| Query | Purpose |
|---|---|
| `GetCurrentUserAQ` | Returns the profile of the currently authenticated user (id, email, role) — never the password hash. |

## Infrastructure

### Models

- `UserModel` (Prisma) — maps 1:1 to the `User` entity; `passwordHash` stored as a bcrypt hash, never returned by any query used outside `Identity`'s own repository.

### Auth

- Password hashing: bcrypt, via `Infrastructure/Auth/PasswordHasher`, implementing an `OutsourceContract` declared in `Domain/Identity/OutsourceContract/`.
- Token issuance/verification: JWT, via `Infrastructure/Auth/TokenService`, also behind an `OutsourceContract` — `Domain/Identity` never imports a JWT library directly.

## Registration implementation (2026-10-30)

- Implemented: User, typed value objects, PasswordPolicyService, RegisterUserService,
  RegisterUserAC, RegisterUserUC and the safe UserDTO projection.
- EmailVO supports the RFC 5322 ASCII dot-atom mailbox profile with a DNS name
  containing at least two labels. Quoted local parts, domain literals and
  internationalized local parts are outside the current registration contract.
- BcryptPasswordHasher, UuidUserIdFactory and PrismaUserRepository implement the
  outward contracts. The public endpoint is POST /api/auth/register.
- Expected password-policy failures are converted into specific Identity
  exceptions. The database unique index resolves concurrent email registrations.
- The React registration form is implemented in frontend/. Sign-in, current-user
  resolution and sign-out are implemented. Administration/blocking endpoints remain planned.

## Authentication implementation (2026-10-30)

- AuthenticateUserService owns canonical email lookup, exact password acceptance
  (non-empty valid Unicode, at most 72 UTF-8 bytes), bcrypt verification and
  blocked-account rejection. Existing credentials do not reapply registration
  blocklists or new-password minimums at login.
- SignInUserUC issues and persists a new session, revoking an existing valid cookie
  session on successful login. GetCurrentUserUC reloads account status and role;
  SignOutUserUC revokes only the current session. Public results use UserDTO.
- IAuthenticationRepository, IPasswordVerifier, ITokenService and ISessionRepository
  are Domain outward contracts implemented by Infrastructure; Express stays in
  EntryPoint, JWT library and Prisma stay in Infrastructure.
- Sessions contain immutable account/session UUIDs and expiry; the presence of
  an unexpired exact record permits access. Delete revokes. User deletion cascades.
- BcryptPasswordVerifier, JwtTokenService (jsonwebtoken 9.0.2) and
  PrismaSessionRepository are composed by Framework. No new SharedKernel types.
- React shows login, registration and profile; it restores sessions after reload,
  refreshes account state on focus/each minute, and retains the profile on a failed
  logout so revocation is never falsely presented as complete.

## Account settings and Admin access management

ChangePasswordUC reauthenticates the session account with the exact current password, then ChangePasswordService applies the existing 15-code-point/72-UTF-8-byte/blocklist policy and bcrypt 12. Persistence compares the verified stored hash before update and revokes all sessions in the same transaction. A concurrent replacement fails rather than overwriting. Sign-in rechecks account credential snapshot after session creation to close the old-password verification versus revocation race.

RevokeOtherSessionsUC retains the verified current session ID and revokes other sessions for that account. ManageAccountsUC requires current Admin for a safe 50-entry page/search and block/unblock operations. ManageAccountDPolicy prevents targeting self or any Admin. Blocking takes the target user lock and revokes all target sessions atomically without cancelling bookings. Unblocking never revives old sessions; a new login is required. There is no role-changing HTTP path.
