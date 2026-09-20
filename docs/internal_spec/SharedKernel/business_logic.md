# ====== SharedKernel BUSINESS LOGIC ======

## Purpose

`SharedKernel` owns:
- Base abstractions inherited by every bounded context (`AEntityIdVO`, `AValueObject`, `ARoomBookException`).
- Fundamental contracts every context's elements must implement (`IEntity`, `IValueObject`, `IRoomBookException`).
- Value Objects and enums genuinely used by more than one context (`TimeRangeVO`).
- The top-level exception registry (`CoreExceptionRegistry`) for exceptions belonging to none of the domain contexts.

**NOT here:**
- Anything specific to one context's business rules, even if it looks reusable in the abstract — see "Bloated SharedKernel" in `policy/project_policy.md` §13. If only `Booking` uses it today, it stays in `Booking` until a second context actually needs it.

## Entities

SharedKernel defines no entities of its own — only the base abstraction (`AEntity`) that concrete contexts' entities extend. There is nothing to instantiate directly.

## Value Objects

| Value Object | Description | Invariants |
|---|---|---|
| `AEntityIdVO` *(abstract base)* | Base class for every entity identifier VO in the project (`UserIdVO`, `ResourceIdVO`, `BookingIdVO` all extend it). | - Immutable.<br>- Wraps and validates a UUID v4 string; concrete subclasses add no further validation. |
| `TimeRangeVO` | Represents a half-open time interval `[startAt, endAt)`; used by both `Booking` and `Catalog`. | - Immutable.<br>- `endAt` is strictly after `startAt`.<br>- Two `TimeRangeVO`s are considered overlapping if and only if `a.startAt < b.endAt && b.startAt < a.endAt` — this exact predicate is the single source of truth for "overlap" across the project; it is not reimplemented ad hoc in `Booking` or `Catalog`. |

## Domain Policies

SharedKernel defines no policies of its own; `IDomainPolicy` (if introduced) would live here as a contract only, not as logic.

## Domain Services

SharedKernel defines no services of its own.

## Domain Events

SharedKernel defines the base `ADomainEvent` abstraction and the entity event-queue mixin (`triggerEvent()` / `pullEvents()`, per `policy/project_policy.md` §5), but no concrete events — those belong to the context that raises them.

## Application Commands & Queries

Not applicable — SharedKernel has no Application layer of its own; its abstractions are consumed by every context's Application layer.

## Infrastructure

### Shared error envelope

Every API error response uses one shape, defined once and consumed by all contexts' `EntryPoint` controllers:

```json
{
  "error": {
    "code": "RB.BKG.1",
    "message": "The requested time slot overlaps an existing booking."
  }
}
```

### Shared authorization check

A single Express middleware resolves the caller's role from the access token and enforces it, rather than each context re-implementing the check — see `guide/authentication.md`.

## Change policy

Because a change here affects every context that depends on it, any modification to `SharedKernel` requires reviewing all known consumers (currently: `Identity`, `Catalog`, `Booking`) before merging, and is called out explicitly in the project-wide `CHANGELOG.md`, in addition to this context's own `changelog.md`.
