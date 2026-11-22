# Module Dependencies (Backend)

## Viewpoint

This view describes the implemented backend dependencies under Project Policy.

## Layers

- EntryPoint accepts HTTP input and invokes Application use cases.
- Application coordinates Domain services and returns explicit public DTOs.
- Domain owns entities, value objects, policies, services and outward contracts.
- Infrastructure implements Domain's outward contracts for bcrypt, UUIDs and Prisma.
- Framework composes adapters and services, validates startup configuration and
  manages application shutdown. No other layer depends on Framework.

Express types occur in EntryPoint; Prisma types occur in Infrastructure/Persistence.
Domain and Application contain no imports of these libraries.

## Registration

POST /api/auth/register -> RegistrationController -> RegisterUserUC ->
RegisterUserService -> IUserRepository / IPasswordHasher / IUserIdFactory.

PrismaUserRepository, BcryptPasswordHasher and UuidUserIdFactory implement the
outward contracts. PasswordPolicyService receives a local blocklist loaded by
Infrastructure. The users.email unique index enforces the final uniqueness check.

## Import resolution

TypeScript paths and native Node package imports provide #domain, #application,
#infrastructure and #entrypoint aliases. Jest resolves these to the same source
directories. The compiled application requires no additional alias runtime.

## Frontend registration layers

frontend/src/EntryPoint contains React components and CSS. Application coordinates
the form command. Domain defines validation and outward capabilities.
Infrastructure implements JSON fetch and the local strength estimator.
Framework composes the public API adapter and mounts React.

The #ui-domain, #ui-application, #ui-infrastructure and #ui-entrypoint aliases
are resolved consistently by TypeScript, Vite and the isolated Jest suite.
Frontend code does not import backend persistence, configuration or secrets.

## Authentication sessions

POST /api/auth/login -> AuthenticationController -> SignInUserUC ->
AuthenticateUserService -> IAuthenticationRepository / IPasswordVerifier.
GetCurrentUserUC and SignOutUserUC use ITokenService / ISessionRepository.
Infrastructure adapters implement these Domain contracts; Framework composes them.
The sessions table has UUID id (JWT jti), user_id (users FK, cascading delete),
expires_at (TIMESTAMPTZ), and an expiry index. JWT strings are never stored.

## Catalog/Booking implementation

EntryPoint/WorkspaceController -> typed Catalog/Booking/BookingCatalog use cases
-> Domain aggregates/services/policies/outward contracts. Application/BookingCatalog
owns cross-context orchestration; Catalog Domain never depends on Booking.

WorkspacePersistence owns a shared Prisma pool inside Infrastructure/Persistence.
PrismaResourceRepository and PrismaBookingRepository implement Domain contracts.
Framework composes contracts and schedules CompleteBookingService; Prisma types
remain inside Persistence. React WorkspacePage invokes WorkspaceUC; cookie JSON
transport remains in frontend Infrastructure. No backend DTO implementation is
imported by frontend code.

## Cryptography, licensing and client build

Booking note use cases depend on Domain note/cipher outward contracts. Persistence
checks immutable owner references, locks writes and invokes Node/OpenSSL cipher
adapters in Infrastructure. FileNoteKeyring supplies fresh private key snapshots.
Cross-context Licensing wrappers guard existing typed operation contracts; original
user/owner/Admin checks remain independent. FileInstallationLicense verifies bytes
before Domain claim/policy decisions. Framework alone composes these adapters.

Client build-only transformation targets BookingSelectionService via the existing
TypeScript compiler and Vite. No runtime cryptographic keys enter the SPA. Separate
issuer/release CLI programs are not imported by API request handlers.
