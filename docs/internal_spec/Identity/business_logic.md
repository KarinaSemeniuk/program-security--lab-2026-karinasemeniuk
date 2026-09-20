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
| `User` *(Aggregate Root)* | id, email, passwordHash, role, isBlocked, createdAt | The sole aggregate of this context; represents one account holder. | - `id` is immutable once assigned.<br>- `email` is unique across all users and normalized (lower-cased) before comparison.<br>- `passwordHash` is never the plaintext password and is never exposed outside `Identity`.<br>- A newly created `User` always starts with `role = USER` and `isBlocked = false`.<br>- `role` cannot be escalated to `ADMIN` through any public registration or profile-update path. |

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
| `RegisterUserService` | Validates email uniqueness and password strength, hashes the password, and creates a `User` with `role = USER`. Emits no domain event in the current release. |
| `AuthenticateUserService` | Verifies a supplied password against the stored hash; does not issue the token itself (that is an Infrastructure/Auth concern) — it returns whether the credentials are valid and the `User` to authenticate. |
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
