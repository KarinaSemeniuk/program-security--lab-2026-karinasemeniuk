# ====== Booking BUSINESS LOGIC ======

## Purpose

`Booking` owns:
- The reservation lifecycle: creating, confirming, cancelling and completing a reservation.
- The rule that no two active bookings of the same resource may overlap.
- Enforcing the cancellation-window rule for User-initiated cancellations.

**NOT here:**
- Whether the referenced user exists or is blocked — `Booking` reads a stable `userId` reference and trusts `Identity`'s current state at the moment of the check; it does not duplicate `Identity`'s own validation.
- Whether the referenced resource is active or what its slot size is — `Booking` reads these from `Catalog` at creation time rather than caching them on the `Booking` entity itself, so a later change to a resource's configuration never silently invalidates a past booking's recorded interval.

## Entities

| Entity | Basic Fields | Description | Invariants |
|---|---|---|---|
| `Booking` *(Aggregate Root)* | id, userId, resourceId, timeRange (startAt, endAt), status, createdAt | The sole aggregate of this context; represents one reservation. | - `id` is immutable once assigned.<br>- `userId` and `resourceId` are immutable once assigned — a booking cannot be reassigned to a different user or resource.<br>- `timeRange` is immutable once the booking is `CONFIRMED`; cancelling and re-booking is modeled as cancel + create, not as an edit.<br>- `status` changes only via the transitions in "Status Lifecycle" below.<br>- A newly created `Booking` always starts in status `PENDING`. |

## Status Lifecycle

- A `Booking` always starts in `PENDING` immediately after passing creation validation (see "Creation rules" below).

Allowed transitions:

| From | Self-initiated (User, owner only) | System/Admin-initiated |
|---|---|---|
| `PENDING` | — | → `CONFIRMED` (automatic, same transaction as creation in the current release) |
| `PENDING` | → `CANCELLED` | → `CANCELLED` (Admin, no time restriction) |
| `CONFIRMED` | → `CANCELLED` (only ≥ 2 hours before `startAt`) | → `CANCELLED` (Admin, no time restriction), → `COMPLETED` (automatic, once `endAt` has passed) |
| `CANCELLED` | — (terminal) | — (terminal) |
| `COMPLETED` | — (terminal) | — (terminal) |

- In the current release every booking that passes creation validation is confirmed automatically within the same transaction — manual approval by an Admin is a possible future extension, not implemented now. This is why the table shows `PENDING → CONFIRMED` as system-initiated rather than something a User triggers.
- `COMPLETED` is set by a scheduled check comparing `endAt` to the current time, not by any user action.
- Any transition not listed above (e.g. `COMPLETED → CONFIRMED`, `CANCELLED → CONFIRMED`) must be rejected by `CancelBookingDPolicy` / the relevant service regardless of caller, including Admin.

## Creation Flow

*How a new `Booking` comes into existence, end to end.*

- The caller (a `User`) submits a `resourceId` and a `timeRange`.
- `CreateBookingService` validates, in order:
  1. The resource (read from `Catalog`) is active.
  2. `timeRange`'s duration is a multiple of the resource's `minSlotMinutes`.
  3. `timeRange.startAt` is in the future.
  4. No existing `Booking` of the same `resourceId`, in status `PENDING` or `CONFIRMED`, overlaps `timeRange` — checked atomically via a database-level exclusion constraint in addition to the application check, so two concurrent requests for the same slot can never both succeed.
- On success, a `Booking` is created in `PENDING` and immediately transitioned to `CONFIRMED` within the same transaction.

**Boundary:** everything above belongs to `Booking`. Computing *which* slots are free for display purposes (before a request is even submitted) is `Catalog`'s `ComputeAvailableSlotsService`, which itself queries `Booking`'s active intervals — the two operations use the same overlap logic but live in different contexts for different reasons (display vs. write-path enforcement).

## Value Objects

| Value Object | Description | Invariants |
|---|---|---|
| `BookingIdVO` | Typed identifier for `Booking`, extends `AEntityIdVO` from `SharedKernel`. | - Immutable.<br>- UUID validity guaranteed by the base class. |
| `TimeRangeVO` *(SharedKernel)* | Represents `[startAt, endAt)` as a single value; used by both `Booking` and `Catalog`. | - Immutable.<br>- `endAt` is strictly after `startAt`.<br>- The interval is half-open: `endAt` itself is not part of the interval, so back-to-back bookings never overlap. |
| `BookingStatusVO` | Wraps the `BookingStatus` enum (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`). | - Immutable.<br>- Value validity inherited from the enum. |

## Domain Policies

| Domain Policy | Description |
|---|---|
| `CreateBookingDPolicy` | Encodes the four creation rules listed under "Creation Flow"; the single place all four checks are combined so `CreateBookingService` stays a thin caller of this policy. |
| `CancelBookingDPolicy` | Validates a cancellation request: the caller is the owner (or Admin) and, for a User-initiated cancellation, that `startAt` is at least 2 hours away. Encodes exactly the "Self-initiated" column of the Status Lifecycle table. |

## Domain Services

| Domain Service | Operation |
|---|---|
| `CreateBookingService` | Applies `CreateBookingDPolicy`; on success, creates the `Booking` and transitions it `PENDING → CONFIRMED` within one transaction. Emits `BookingPlacedDE`. |
| `CancelBookingService` | Applies `CancelBookingDPolicy`; transitions the `Booking` to `CANCELLED`. Emits `BookingCancelledDE`. |
| `CompleteBookingService` *(internal — no UC)* | Invoked by a scheduled job, not by a use case directly; transitions bookings past their `endAt` to `COMPLETED`. Emits no event in the current release (nothing currently listens for completion). |

## Domain Events

Triggered only on meaningful state changes, not on every field write. Payloads never carry another user's personal data — only stable identifiers.

| Event | Carries | Notes |
|---|---|---|
| `BookingPlacedDE` | booking id, userId, resourceId, timeRange | |
| `BookingStatusChangedDE` | booking id, old status, new status | Emitted alongside the more specific events below, for any listener that only cares about status transitions in general. |
| `BookingCancelledDE` | booking id, cancelledBy (userId or "admin") | No cancellation reason is captured in the current release; add a `reason` field to the DED only alongside a corresponding FR, not speculatively. |

## Application Commands & Queries

**Commands (`AC`):**

| Area | Commands |
|---|---|
| Booking lifecycle | `CreateBookingAC`, `CancelBookingAC` |

**Queries (`AQ`):**

| Query | Purpose |
|---|---|
| `ListMyBookingsAQ` | Returns the active and past bookings of the requesting User. |
| `ListBookingsForResourceAQ` | Admin-only; returns all bookings for a given resource within a time range. |
| `ListActiveBookingsForResourceAQ` | Internal query consumed by `Catalog`'s `ComputeAvailableSlotsService`; returns only `resourceId`, `timeRange` and `status` — never `userId`, so `Catalog` never sees who booked what. |

## Infrastructure

### Models

- `BookingModel` (Prisma) — maps 1:1 to the `Booking` entity; the `(resourceId, timeRange)` combination carries a PostgreSQL exclusion constraint (`EXCLUDE USING gist`) enforcing non-overlap at the database level, as the concrete mechanism behind NFR-7.

### Async

- `CompleteBookingService` runs on a scheduler (e.g. a periodic job every few minutes), not synchronously on read, since a booking's completion is not time-critical to the millisecond.
