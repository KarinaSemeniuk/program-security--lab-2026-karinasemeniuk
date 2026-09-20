# Tech Notes — Catalog

## Known limitations (by design, for the current release)

- There is no resource editing beyond creation and deactivation (no "update capacity/name" operation yet). Add it as a new FR before implementing it, not silently.

## Edge cases to keep in mind

- `minSlotMinutes` must evenly divide 1440; reject anything else at creation time rather than allowing slots that never align to a full day boundary.
- `ComputeAvailableSlotsService` must treat `Booking`'s intervals as half-open (`[startAt, endAt)`, per `SharedKernel`'s `TimeRangeVO`) — an off-by-one here silently allows or blocks a slot incorrectly at the exact boundary.

## Non-obvious decisions

- Availability is computed on read, not cached/denormalized, for the current data volume (NFR-1 allows up to 500ms at 10,000 bookings without needing a cache). Revisit if that budget stops being met.
