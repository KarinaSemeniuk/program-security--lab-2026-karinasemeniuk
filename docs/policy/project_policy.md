# Project Policy — RoomBook

| | |
|---|---|
| Name | Project Policy — RoomBook |
| Version | 0.1.0 |
| Status | Draft |
| Classification | Internal |
| Last updated | 2026-09-20 |
| Owner | Karina Semeniuk |

> This policy defines the mandatory code and architecture requirements for `RoomBook` — a responsive single-page web application for booking time-bound resources (meeting rooms, coworking desks), adapted for both mobile and desktop browsers. Key requirements: strictly typed OOP following SOLID, clean code, a layered architecture with enforced boundaries between layers, and mandatory test coverage.
>
> RoomBook does not process payments, does not integrate with external calendars, and does not ship native mobile clients — see `specification/scope.md` for the full boundary.

> Sections marked **(Optional)** are included depending on the type of change the project is undergoing; sections that do not apply are removed together with their entry in the table of contents.

## Policy Change Rules

- **No incidental changes** — this policy is never modified as a side effect of another task; changes are made only via a dedicated policy-update task.
- **Mandatory approval** — any change is agreed with the project owner beforehand.
- **Separate commit + version bump** — policy changes ship as a separate git commit prefixed `[POLICY]`, with the document version incremented.

## Table of Contents

1. Scope
2. Technologies
3. Fundamental Principles
4. Architecture & Structure
5. Domain Events Policy
6. Naming Policy
7. Documentation Comments Policy (TSDoc)
8. Exception Policy
9. NULL-less Policy
10. Testing Policy
11. Git Workflow
12. Development Documentation Policy
13. Anti-Patterns

## 1. Scope

This policy applies to `RoomBook` — all of its source code (`src/`) and tests (`tests/`), for both the backend (Node.js/TypeScript) and frontend (React/TypeScript) codebases. It is binding for anyone creating or modifying this code — developers and AI agents alike.

## 2. Technologies

### 2.1 Stack immutability rule

The technology stack listed below is **fixed** for this project. It is not a suggestion or a starting point to be adjusted casually as work progresses.

- **No silent substitution.** Swapping a listed technology for an alternative (a different ORM, a different HTTP framework, a different test runner, a different package manager) is never done as a side effect of implementing a feature or fixing a bug, and never decided unilaterally by whoever is writing code at the time — including an AI agent acting on a vague or ambiguous instruction.
- **A stack change is a policy change.** Adding, removing, or replacing an entry in §2.2 follows exactly the same procedure as any other change to this document (see "Policy Change Rules" above): it requires the project owner's prior approval, ships as its own commit prefixed `[POLICY]`, and bumps this document's version.
- **A stack change is never partial.** When a stack change is approved, the version recorded in §2.2 is updated *and* every other place that names or assumes that technology is updated in the same change: `architecture/`, `guide/configuration.md`, `guide/getting-started.md`, CI configuration, and `package.json`. A stack entry that disagrees between the policy and the actual `package.json` is a defect, not a documentation nuance.
- **Rationale is recorded, not just the decision.** The commit or PR introducing a stack change states *why* the previous choice was insufficient — a technology is replaced because it demonstrably fails a requirement, not because a newer alternative exists.

### 2.2 Stack specification

The versions below are the actual pinned versions for this project (see `package.json` for the exact resolved versions; this table is the human-readable source of truth and the two must never drift apart).

| Layer | Technology | Pinned version | Notes |
|---|---|---|---|
| Runtime | Node.js | 22 LTS | Backend execution environment. |
| Language | TypeScript | 5.6.x | `strict: true` in `tsconfig.json`; no exceptions. |
| Backend framework | Express | 4.21.x | Confined to `EntryPoint/` and `Infrastructure/Transport/`. |
| ORM | Prisma | 5.20.x | Confined to `Infrastructure/Persistence/`. |
| Database | PostgreSQL | 16.x | The only stateful component (see `architecture/deployment.md`). |
| Frontend framework | React | 18.3.x | SPA client. |
| Build tool | Vite | 5.4.x | Frontend build and dev server. |
| Routing (frontend) | React Router | 6.26.x | Client-side navigation. |
| Package manager | npm | 10.x | The only package manager used; no mixing with yarn/pnpm lockfiles. |
| Linting | ESLint | 9.x | Enforced in CI; no warnings allowed to merge. |
| Formatting | Prettier | 3.x | Enforced via a pre-commit hook and in CI. |
| Type checking | `tsc --noEmit` | — (bundled with TypeScript) | Run in CI as a separate, mandatory check. |
| Layer-boundary enforcement | `dependency-cruiser` | 16.x | Encodes the dependency direction from §4 as an enforced, CI-checked rule. |
| Test runner | Jest | 29.x | Unit and integration tests. |
| HTTP test client | Supertest | 7.x | Integration tests against the Express app. |
| Version control | Git | — | Hosted on GitHub. |

### 2.3 What is explicitly not part of the stack

To prevent ambiguity from creeping in through omission, the following are explicitly **out**, and introducing any of them requires the same stack-change procedure as above:

- Any ORM other than Prisma (e.g. TypeORM, Sequelize, Drizzle).
- Any state-management library on the frontend beyond React's built-in state/hooks (e.g. Redux, MobX, Zustand) unless a documented need arises.
- Any CSS framework or component library not already agreed (plain CSS/CSS Modules is the default; adopting e.g. Tailwind or MUI is a stack change).
- Any authentication provider or library beyond a self-issued JWT (e.g. Auth0, Passport strategies beyond what is already in use).
- Any additional backend runtime or language (no Python/Go microservices "on the side").

## 3. Fundamental Principles

- **Layer separation.** Mixing the infrastructure (transport/persistence) layer, the business-logic layer, and the framework layer is strictly forbidden. Each layer is isolated and does not leak into another.
- **DDD for business logic.** Business logic is implemented following DDD to the extent it is practical for the project's size.
- **No foreign logic.** RoomBook does not contain business logic belonging to systems that consume or integrate with it — that logic stays on their side.
- **The framework does not penetrate Domain/Application.** Express is confined to `EntryPoint/` and `Infrastructure/Transport/`; `Domain/` and `Application/` contain no Express-specific types or imports.
- **Strictly typed OOP, SOLID, clean code.** `any` is forbidden outside of narrowly justified, commented exceptions.
- **The policy is non-negotiable.** No circumstance is a legitimate reason to deviate from this policy. Any drift from it must be corrected immediately.

## 4. Architecture & Structure

The project is split into isolated layers; calls flow strictly top-down — lower layers never depend on upper ones.

Global `src/` structure (backend):

```
src/
├── EntryPoint/          # Presentation layer: Express routers, controllers, request/response mapping
├── Application/         # orchestration: use cases (CQRS — Command / Query)
├── Domain/              # business logic: RoomBook's business entities, DDD-style
├── Infrastructure/      # infrastructure layer: transport, persistence, external services
└── Framework/           # optional framework wiring (DI, Express app bootstrap, config loading)
```

Dependency direction:

```
EntryPoint → Application → Domain ←[contracts]→ Infrastructure
Framework  → (optional wrapper; nothing depends on it)
```

### Domain

`Domain/` is split into **bounded contexts** — each one self-contained and holding everything relevant to its business area.

A bounded context is a **broad but cohesive feature area**: it may cover several closely related resources/entities, and direct references between entities within one context are expected and normal. It is a mistake to split a set of resources that reference each other at varying depth (sometimes a minified reference, sometimes a fully embedded model) into separate contexts — such resources belong to one context. Cross-context coupling is allowed only through **stable** references (a minified id + name), never through variable-depth embedding.

Bounded context skeleton:

```
Domain/[BoundedContext]/
├── Entity/
├── ValueObject/
├── Enum/
├── Exception/
├── OutsourceContract/   # contracts outward, to Infrastructure (ACL / dependency inversion) — mandatory
├── Service/             # domain services
├── Policy/              # optional
├── Event/                # optional
└── Contract/             # internal contracts of the context — optional
```

RoomBook's contexts: `Identity`, `Catalog`, `Booking` (see `internal_spec/contexts_registry.md`).

**Homogeneous directories.** A directory holds elements of one kind. When an element's folder would mix kinds, non-primary kinds go into fixed subdirectories: base abstractions — `Abstracts/`; registries — `Registry/`; internal contracts — `Contract/`. E.g. `Exception/` holds concrete exceptions, `Exception/Abstracts/` holds the context's base exception, `Exception/Registry/` holds its code registry.

Contract distinction: `OutsourceContract/` — interfaces the context requires from Infrastructure (implemented in Infrastructure, injected via DI); `Contract/` — internal interfaces of the context itself.

**SharedKernel** — the shared core for all bounded contexts:

```
Domain/SharedKernel/
├── Abstracts/      # base abstractions inherited across all contexts
├── Contract/       # fundamental interfaces mandatory for all contexts
├── ValueObject/    # shared VOs / primitives used in more than one context
├── Enum/           # enums shared across several contexts
└── Exception/      # optional: CoreExceptionRegistry, ACoreException, core exceptions
```

Only genuinely cross-context elements belong in SharedKernel — elements used in (or fundamental to) more than one context. It is not a dumping ground for arbitrary logic and must not grow unchecked. Adding a new element to SharedKernel requires prior approval from the owner; the kernel's actual contents and their specifics are documented in `internal_spec/SharedKernel/business_logic.md`, kept in sync with the code, without requiring a policy change.

### Infrastructure

The infrastructure layer: technical periphery (transport, persistence, external services); this is where a context's `OutsourceContract`s are implemented.

```
Infrastructure/
├── Transport/     # thin wrappers around external libraries (JWT signing, password hashing) — as needed
├── Persistence/   # Prisma-backed repositories — as needed
├── Auth/          # authentication adapters — as needed
└── Exception/     # infrastructure exceptions
```

Additional folders are added as needed.

### Application

A thin orchestration layer (use cases), free of business rules; implements CQRS. Grouped by bounded context, mirroring `Domain/`.

```
Application/[BoundedContext]/
├── UseCase/       # use cases — orchestrate Domain + Infrastructure
├── Command/       # Application Commands — mutation intents, a use case's argument
├── Query/         # Application Queries — read intents, a use case's argument
├── Dto/           # DTOs (input/output data)
└── Exception/     # Application-level exceptions
```

Cross-context orchestration goes into a separate module named after both contexts in alphabetical order with no separator (e.g. `BookingCatalog/`); its internal shape is the same.

### EntryPoint (Presentation)

The top layer for this application. Express routers and controllers accept input, translate it into an Application Command/Query, invoke the corresponding use case, and shape the HTTP response — no business logic lives here, and no use case signature is re-declared or duplicated.

### Framework layer (Optional)

An optional wrapper layer that embeds the project into its framework (DI container setup, Express app bootstrap, configuration loading). Its internal structure is free-form, shaped by need. Nothing depends on it.

## 5. Domain Events Policy

*For contexts whose entities publish domain events — currently `Booking`.*

Each Domain Event (DE) consists of: an **event UUID**, the **source entity's UUID**, a **timestamp**, a **payload** (a separate DED object), an **event name** (a string identifier from the module/context's event registry), and a **schema version** (for deserialization compatibility).

- A concrete DE extends `ADomainEvent` and declares `getEventName()` (from the registry) and `getEventDataClass()`. A static factory `.withData(...)` is recommended to encapsulate DED creation.
- **DED** (Domain Event Data) — a separate `readonly` class for a specific event's payload; responsible for its own serialization/deserialization.
- **Event registry** — analogous to the exception registry: a TypeScript enum in the context's `Domain` layer, whose values are string identifiers of the form `<Context>.<Event>`.
- An entity that publishes events uses an event queue (a mixin/base method from SharedKernel): `triggerEvent()`, `pullEvents()`; deduplicated by semantic key within a single call.
- **Lifecycle:** the entity queues an event internally → the use case persists the entity via its repository → Infrastructure calls `pullEvents()` after persistence and dispatches each event → listeners receive events and trigger the corresponding downstream commands.
- **Protection against recursive event chains** is an architectural design responsibility, not a runtime mechanism; correctness is verified by tests.

## 6. Naming Policy

**General:**

- Classes, interfaces, abstract classes, enums — `PascalCase`.
- Methods, variables, parameters — `camelCase`; constants — `UPPER_SNAKE_CASE`.
- One exported class/type per file; file name matches the exported symbol; directories — `PascalCase` for `Domain`/`Application`/`Infrastructure` subtrees, `kebab-case` for everything else.

**Prefixes / suffixes:**

| Kind | Convention | Example |
|---|---|---|
| Interface | prefix `I` | `IUserRepository` |
| Abstract class | prefix `A` | `AValueObject`, `AEntityIdVO` |
| Entity / Aggregate Root | no suffix | `User`, `Booking` |
| Value Object | suffix `VO` | `EmailVO`, `BookingStatusVO` |
| Enum | no suffix | `BookingStatus`, `UserRole` |
| Domain Service | suffix `Service` | `BookingCreationService` |
| Domain Policy | suffix `DPolicy` | `CancelBookingDPolicy` |
| Domain Event | suffix `DE` | `BookingCancelledDE` |
| Use Case | suffix `UC` | `CreateBookingUC` |
| Application Command | suffix `AC` | `CreateBookingAC` |
| Application Query | suffix `AQ` | `ListAvailableSlotsAQ` |
| DTO | suffix `DTO` | `BookingDTO` |
| Exception | suffix `Exception` | `BookingSlotUnavailableException` |
| Exception Registry | suffix `ExceptionRegistry` | `BookingExceptionRegistry`, `InfrastructureExceptionRegistry`, `CoreExceptionRegistry` |
| Base exception | prefix `A` + suffix `Exception` | `ABookingException`, `AInfrastructureException`, `ACoreException` |

**Imports:** external classes/interfaces/enums are imported via `import { ... } from '...'` at the top of the file; use path aliases (`@domain/...`, `@application/...`, `@infrastructure/...`) configured in `tsconfig.json` rather than long relative paths; naming collisions are resolved via `as` aliases, kept short and logical; `any` is not an acceptable substitute for a missing import.

**Directories:** `PascalCase` inside `Domain`/`Application`/`Infrastructure`, matching the kind of element they hold; `OutsourceContract/` is a fixed name.

## 7. Documentation Comments Policy (TSDoc)

TSDoc comments are mandatory for **every** exported method and property. A missing comment is an error. Principle: a comment explains purpose and constraints, not what the code already says.

**A method's comment includes:**

- `@param` — for every parameter, with a precise description of its purpose and constraints, not just its type (the type itself comes from the TypeScript signature).
- `@returns` — what is returned and under what condition.
- `@throws` — for every exception the method can throw, directly or indirectly.
- A concise description of the method's purpose — what it does and why (business context, not a restatement of the code).

**A class/interface/enum comment includes:**

- A concise description of what the element represents and what role it plays.

**For `Entity` / `Aggregate Root` / `Value Object`**, the class comment additionally lists the key **invariants** — the business rules and constraints the element upholds.

**Example:**

```ts
/**
 * User entity. Represents a platform account holder.
 *
 * Invariants:
 * - Email is always a valid, normalized address.
 * - Status transitions follow the allowed state machine.
 */
export class User {
  /**
   * Blocks the user according to the allowed transition rules.
   *
   * @param policy - Policy enforcing the blocking rules.
   * @throws InvalidStatusTransitionException If the user cannot be blocked from its current status.
   */
  block(policy: BlockUserDPolicy): void { /* ... */ }
}
```

## 8. Exception Policy

All RoomBook exceptions extend the base abstraction `ARoomBookException` from `SharedKernel` (which implements `IRoomBookException`). Using any other base class for an exception is forbidden. Third-party and system errors (libraries, Prisma, the runtime) must be caught and wrapped in the corresponding internal exception before they leave the layer that produced them.

### Exception code structure

Every exception is identified by a hierarchical code:

```
<PREFIX>.<Segment>.<code>
```

- **`<PREFIX>`** — the global prefix for all RoomBook error codes: `RB`. Its single source of truth is `SharedKernel`.
- **`<Segment>`** — the exception's origin; each registry declares its own segment: a bounded context uses its segment token from the contexts registry, **one per context**; infrastructure uses `INF`; everything else and `SharedKernel` itself use `CORE`.
- **`<code>`** — a numeric code, unique within its registry.

Examples: `RB.IDN.1`, `RB.CAT.2`, `RB.BKG.1`, `RB.INF.4`, `RB.CORE.2`. The combination uniquely identifies any exception and is safe to return in API responses and logs without exposing internal detail.

Codes are **immutable once assigned**: an assigned code is never edited, reassigned, or reused after removal. Codes only increment within their registry; a removed code stays reserved forever. When an exception is removed, its registry entry is not deleted but marked deprecated via a TSDoc `@deprecated` tag, and its numeric value is never reused.

### Exception registries

- **Context registry** — one per bounded context; lives in `Domain/[Context]/Exception/Registry/`, serves exceptions of that context in both `Domain` and `Application`. Segment — the context's segment token. The context's base exception lives in `Exception/Abstracts/`.
- **Infrastructure registry** — one for the whole `Infrastructure` layer; lives in `Infrastructure/Exception/Registry/` (base in `Exception/Abstracts/`). Segment — `INF`.
- **Top-level registry** — a single `CoreExceptionRegistry`; lives in `SharedKernel`, serves exceptions of the kernel itself and anything that belongs to no context and no infrastructure module. Segment — `CORE`. **Optional / deferred**: created only once the first core-level exception exists.

Each registry is a TypeScript enum implementing `IExceptionCodeRegistry`: it declares its segment (a static `SEGMENT` property) and numeric members. Creating a new exception means adding a new member to the relevant registry.

Each registry has a corresponding base exception abstraction (`A[Context]Exception`; `AInfrastructureException`; `ACoreException`) that extends `ARoomBookException`, is tied to its registry, and declares an abstract `getCodeEnum()`.

### A concrete exception

Extends its registry's base abstraction, declares a static message, and implements `getCodeEnum()` returning the matching registry member.

```ts
// Context registry
export enum BookingExceptionRegistry {
  BookingSlotUnavailable = 1,
  BookingCancellationWindowExpired = 2,
}
BookingExceptionRegistry.SEGMENT = 'BKG' as const;

// Concrete exception
export class BookingSlotUnavailableException extends ABookingException {
  protected message = 'The requested time slot overlaps an existing booking.';

  protected getCodeEnum(): BookingExceptionRegistry {
    return BookingExceptionRegistry.BookingSlotUnavailable;
  }
}
```

### Wrapping external exceptions

Third-party and system errors arising in any layer must be caught and wrapped into the corresponding internal exception before propagating upward. Letting a foreign error escape a layer unwrapped is forbidden. Internal RoomBook exceptions passing through additional layers do not need to be re-wrapped.

## 9. NULL-less Policy

Physical `null`/`undefined` should be minimized in business logic; represent absence explicitly through a typed null-object / reference pattern or a default value, rather than using `null`/`undefined` as a meaningful business state. This is a recommendation, not an absolute prohibition: where avoiding `null` would needlessly complicate the code, it is allowed, ideally with a short justification comment. This does not apply to empty arrays or collections.

## 10. Testing Policy

### Tooling

Jest is the primary framework, with Supertest for HTTP-level integration tests. External dependencies (the database, third-party services) are mocked; **no real network calls occur in tests**. Tests do not boot the Express application's full DI/config wiring unless explicitly testing that wiring.

### Test structure

`tests/` mirrors the structure of `src/` — by layer and by bounded context. Every tested element has a corresponding test file. Elements with many scenarios (an Entity, a large VO) get their own directory of logically grouped test files.

### Unit-test priority

Unit tests are prioritized wherever possible: fast, no external dependencies, the backbone of coverage. Every test, unit or integration, covers both valid scenarios and deliberately invalid ones (bad formats, invariant violations), asserting that the specific expected exception is thrown.

### Coverage by layer

- **Domain:** unit only; maximum coverage — every public method of every element.
- **Application:** unit only; use-case scenarios for each Command/Query — success paths and expected failure paths.
- **Infrastructure:** unit where possible (mappings, conversions); for external-system interaction — integration tests against a **mocked** transport (no real network), asserting request correctness (method, headers, body) and response/error handling.

### Grouping tests

Each test file uses nested `describe` blocks that mirror the element's path in the source structure, from general to specific:

```ts
describe('domain', () => {
  describe('booking.domain', () => {
    describe('booking.domain.entity', () => {
      describe('Booking', () => {
        it('rejects a duration that is not a multiple of the minimum slot', () => { /* ... */ });
      });
    });
  });
});
```

## 11. Git Workflow

### Branches

| Branch | Purpose |
|---|---|
| `main` | Primary branch; production-ready state |
| `develop` | Planned sprint work; synced with `main` once per sprint |
| Task branches | Individual branches per task; deleted after merge |

Planned changes go through PRs into `develop`; hotfixes go through PRs directly into `main`.

### Commit messages

```
[type] short summary
```

| Type | Description |
|---|---|
| `INIT` | Initial project setup |
| `DEV-XXX` | Feature development; `XXX` is the task-tracker ticket number, if any |
| `FIX-XXX` | Bug fix; `XXX` is the ticket number, if any |
| `DOCS` | Documentation |
| `SEC` | Security-related change |
| `POLICY` | A change to this policy document |
| `RELEASE` | A release |

### Versioning

The version is bumped before each deploy/release using semantic versioning (`MAJOR.MINOR.PATCH`): major — breaking architectural changes; minor — significant feature releases; patch — fixes between minor releases.

### CI checks

Every PR into `develop` or `main` is checked: `eslint`, `tsc --noEmit`, `dependency-cruiser` (layer boundaries), the full Jest suite. Any warning or failure automatically blocks the PR.

## 12. Development Documentation Policy

An up-to-date knowledge base lives next to the code. Documentation is a full deliverable; outdated or missing documentation is treated as a defect. The full structure and rules for this are defined in `policy/project_documentation_policy.md`; the essentials:

```
docs/
├── internal_spec/
│   ├── contexts_registry.md          # mandatory registry of all bounded contexts
│   └── [Context]/
│       ├── business_logic.md
│       ├── changelog.md
│       └── tech_notes.md
```

- **`business_logic.md`** always reflects the context's current state: purpose, Aggregate Roots, key invariants, key domain elements, explicit boundaries ("NOT here: ..."), cross-context dependencies.
- **`changelog.md`** is append-only; new entries go on top.
- **`tech_notes.md`** captures everything a developer or AI agent should know before working in the context beyond what the code and `business_logic.md` already say: tech debt, known issues, non-obvious decisions and their rationale, edge cases.

Whoever changes a context: adds a `changelog.md` entry, reviews and updates `business_logic.md` if needed, and records any new tech debt or resolved issue in `tech_notes.md`. Whoever creates a context creates its documentation files.

## 13. Anti-Patterns

| # | Anti-pattern | Description |
|---|---|---|
| 1 | Layer leakage | Business logic inside `Infrastructure`/`EntryPoint`, Express/Prisma types inside `Domain`. |
| 2 | Foreign logic in the project | Business rules of consuming systems implemented inside RoomBook instead of on their side. |
| 3 | Bypassing Infrastructure | `Domain`/`Application` talking to an external system directly instead of via `Infrastructure` through an `OutsourceContract`. |
| 4 | Domain → Infrastructure | `Domain` depending directly on `Infrastructure` instead of inverting the dependency via `OutsourceContract`. |
| 5 | Leaking foreign exceptions | Raw Prisma/library errors escaping a layer unwrapped. |
| 6 | Vague exception | A generic `SomethingWentWrongException` instead of a precise exception for the specific case. |
| 7 | Mutating an exception code | Editing or reusing an assigned code/prefix instead of incrementing and marking `@deprecated`. |
| 8 | Fat Application layer | Business rules leaking into the thin orchestration layer instead of living in `Domain`. |
| 9 | God bounded context | One context absorbing **unrelated** business areas. A broad-but-cohesive context (many closely related resources) is *not* this — it is the intended shape. |
| 10 | Bloated SharedKernel | Context-specific things placed in `SharedKernel` instead of their own context. |
| 11 | Mandatory framework | The Domain/Application core becoming inoperable without Express instead of framework code staying confined to `EntryPoint`/`Framework`. |
| 12 | Restating code / missing comment | A TSDoc comment that repeats the code, or is missing, instead of describing purpose / invariants / `@throws`. |
| 13 | Happy-path-only tests | No negative scenarios, or real network calls inside tests. |
| 14 | Mixed directory | Dumping heterogeneous elements (concrete classes, abstractions, registries, contracts) into one directory instead of homogeneous subdirectories (`Abstracts/`, `Registry/`, `Contract/`). |
