# Tech Notes — Booking

## Known limitations (by design, for the current release)

- Manual Admin approval of a booking (an actual `PENDING` waiting period) is not implemented — every booking auto-confirms. The `PENDING` status and the lifecycle table already model the approval step so it can be turned on later without a schema change; do not remove `PENDING` as "dead code."
- `BookingCancelledDE` does not carry a cancellation reason. Do not add a free-text `reason` field without a corresponding FR — it would be the kind of vague, unvalidated input the project's requirements style explicitly avoids (see `specification/functional-requirements.md`).

## Edge cases to keep in mind

- The 2-hour cancellation window (FR-11) is measured against `startAt` at the moment of the cancellation request, not at booking creation time — a booking created 10 minutes before its start is already outside the window and cannot be self-cancelled.
- `CompleteBookingService`'s scheduled job must not race with an in-flight `CancelBookingService` call for the same booking; both go through the same `status` transition guard, so a `CANCELLED` booking can never subsequently become `COMPLETED` even if the job runs during the cancellation request.
- The database exclusion constraint is the actual source of truth for non-overlap under concurrency; the application-level check in `CreateBookingDPolicy` exists to produce a clean `409` error instead of surfacing a raw constraint-violation error to the client — both must be kept in sync if the overlap rule ever changes.

## Non-obvious decisions

- `resourceId`'s active/slot-size checks are re-read from `Catalog` at creation time rather than denormalized onto `Booking`, specifically so a later change to a resource's configuration cannot retroactively make historical bookings look invalid.
