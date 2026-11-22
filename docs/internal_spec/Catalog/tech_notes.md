# Tech Notes — Catalog

## Known limitations (by design, for the current release)

- Resource editing now covers name, capacity and descriptive metadata; identity and minimum slot duration remain immutable. See the resource information extension in functional-requirements.md.

## Edge cases to keep in mind

- `minSlotMinutes` must evenly divide 1440; reject anything else at creation time rather than allowing slots that never align to a full day boundary.
- `ComputeAvailableSlotsService` must treat `Booking`'s intervals as half-open (`[startAt, endAt)`, per `SharedKernel`'s `TimeRangeVO`) — an off-by-one here silently allows or blocks a slot incorrectly at the exact boundary.

## Non-obvious decisions

- Availability is computed on read, not cached/denormalized, for the current data volume (NFR-1 allows up to 500ms at 10,000 bookings without needing a cache). Revisit if that budget stops being met.

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

## Descriptive information and concurrency

ResourceDetailsVO owns Unicode/code-point limits and plain-text fields; React renders text without HTML interpretation. Equipment is copied defensively and duplicate labels are rejected case-insensitively. New columns default to empty values/ROOM/revision 0; known sample IDs get metadata once during migration. Seed upserts never overwrite existing rows.

PrismaResourceRepository implements IResourceRepository and the narrower IResourceManagementRepository. Update/reactivate/deactivate serialize on the same resource FOR UPDATE lock as booking placement. Version comparison happens under the lock. Deactivation increments only on a state change. Reactivating an already active current version is idempotent. Metadata edits increment once, including a same-value edit. Public details hide inactive resources; Admin queries check the current session role. New failures RB.CAT.4 (400) and RB.CAT.5 (409) are immutable allocations.

The editor keeps a snapshot and does not refresh after a failed save. Explicit reload discards unsaved fields; successful mutations reload the catalog. Minimum slot duration is immutable to avoid invalidating future booking boundaries. Capacity changes describe the space; bookings do not hold a participant count. Historical labels reflect the resource's current name.

Calendar/default migration preserves 24-hour access on all weekdays for existing resources. Resource zone defaults to Europe/Kyiv. Viewer zone defaults to the browser zone; old API calls remain UTC. DST uses runtime ICU/IANA rules; maintain Node/OS time-zone data. UTC-grid alignment is preserved for existing bookings, including zones with fractional offsets. No SharedKernel additions or dependencies were introduced.
