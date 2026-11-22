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

## Implementation notes (2026-10-30)

- PostgreSQL btree_gist supports the partial GiST exclusion constraint for UUID
  resource equality and overlapping timestamptz ranges. Migration requires the
  matching PostgreSQL 16 contrib package on Fedora.
- Resource locks serialize deactivation/placement. Booking row locks serialize
  cancellation/completion; scheduler uses FOR UPDATE SKIP LOCKED in batches of 100.
- Event delivery is post-commit with no subscribers; it is not a durable audit log.
  Adding listeners later requires a delivery/retry design (e.g. transactional outbox).
- UTC dates are explicit in UI/API; timezone conversion and opening-hours calendars
  are not implemented. The UI selects contiguous slots within one displayed day;
  the API permits intervals up to seven days.
- Sample catalog creation preserves existing rows. Admin provisioning is an explicit
  local command, not a public registration parameter or hidden default account.

## Owner-only private notes (2026-10-30)

FR-15–FR-19 introduce a separate private note, not a cancellation-reason field.
BookingNoteVO validates exact text. IBookingNoteRepository/INoteCipher are outward
contracts; read/save use cases use the authenticated owner, without an Admin bypass.
The separate booking_notes table never enters public/history DTOs. AES-GCM binds
booking, owner, revision and format/key ID; failed authentication yields no plaintext
and blocks overwrites. See guide/private-notes.md for keys, rotation and threat limits.
