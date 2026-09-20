# ====== Catalog BUSINESS LOGIC ======

## Purpose

`Catalog` owns:
- The set of resources that can be booked (meeting rooms, coworking desks).
- The rules that govern whether a resource currently accepts new bookings.
- Computing a resource's free/busy slots for a given date, as a read-side building block that `Booking` and the API consume.

**NOT here:**
- Whether a specific time slot is actually taken — that is `Booking`'s data; `Catalog` only exposes the resource's own configuration (capacity, minimum slot length, active/inactive), and availability computation cross-references `Booking`'s data through a query, not by owning it.
- Who is allowed to create or deactivate a resource — the role check is Identity's data, enforced by the calling use case.

## Entities

| Entity | Basic Fields | Description | Invariants |
|---|---|---|---|
| `Resource` *(Aggregate Root)* | id, name, capacity, minSlotMinutes, isActive | The sole aggregate of this context; represents one bookable asset. | - `id` is immutable once assigned.<br>- `capacity` is a positive integer.<br>- `minSlotMinutes` is a positive integer and a divisor of 1440 (so slots align to whole days).<br>- Deactivating (`isActive = false`) never deletes the record; historical bookings against it remain valid. |

## Value Objects

| Value Object | Description | Invariants |
|---|---|---|
| `ResourceIdVO` | Typed identifier for `Resource`, extends `AEntityIdVO` from `SharedKernel`. | - Immutable.<br>- UUID validity guaranteed by the base class. |
| `SlotDurationVO` | Represents `minSlotMinutes` as a typed value rather than a raw number. | - Immutable.<br>- Strictly positive; must evenly divide 1440. |

## Domain Policies

| Domain Policy | Description |
|---|---|
| `DeactivateResourceDPolicy` | Validates that a `Resource` may be deactivated; currently unconditional — kept explicit so a future rule (e.g. "cannot deactivate a resource with bookings in the next 24 hours") has a single place to live. |

## Domain Services

| Domain Service | Operation |
|---|---|
| `CreateResourceService` | Validates `capacity` and `minSlotMinutes`, creates a `Resource` with `isActive = true`. |
| `DeactivateResourceService` | Applies `DeactivateResourceDPolicy` and sets `isActive = false`. |
| `ComputeAvailableSlotsService` | Given a `Resource` and a date, returns the list of free slots by combining the resource's `minSlotMinutes` with the set of occupied intervals obtained from `Booking` via a stable, minified query (never an embedded `Booking` model). |

## Domain Events

`Catalog` does not currently publish domain events; resource lifecycle changes are read directly by `Booking`'s creation-time validation rather than reacted to asynchronously.

## Application Commands & Queries

**Commands (`AC`):**

| Area | Commands |
|---|---|
| Resource management | `CreateResourceAC`, `DeactivateResourceAC` |

**Queries (`AQ`):**

| Query | Purpose |
|---|---|
| `ListActiveResourcesAQ` | Returns the catalog of currently bookable resources; available to Guest, User and Admin. |
| `GetResourceAvailabilityAQ` | Returns the free/busy slots of one resource for a given date. |

## Infrastructure

### Models

- `ResourceModel` (Prisma) — maps 1:1 to the `Resource` entity.

### Notes

Availability computation reads from `Booking`'s repository through `Booking`'s own query interface (`ListActiveBookingsForResourceAQ`), not through a direct table join owned by `Catalog` — this keeps the one-way dependency from `Booking` to `Catalog` (see `contexts_registry.md`) from becoming circular in the implementation even though the read direction is naturally reversed here.
