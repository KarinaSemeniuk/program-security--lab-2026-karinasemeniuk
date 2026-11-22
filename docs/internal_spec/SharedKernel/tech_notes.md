# Tech Notes — SharedKernel

## Known limitations (by design, for the current release)

- CoreExceptionRegistry is now implemented for the concrete registration/HTTP failures listed in business_logic.md.

## Edge cases to keep in mind

- `TimeRangeVO`'s overlap predicate is deliberately strict (`<`, not `<=`) so that a booking ending at 10:00 and one starting at 10:00 do not count as overlapping — this is what makes back-to-back bookings possible. Any change to this predicate affects both `Booking`'s write-path check and `Catalog`'s availability computation simultaneously.

## Non-obvious decisions

- `AEntityIdVO` intentionally does not carry a context-specific type tag (e.g. distinguishing a `UserIdVO` from a `ResourceIdVO` at the value level beyond their class) — cross-context type-safety is achieved through TypeScript's nominal-ish class typing (each concrete subclass is a distinct type), not through a runtime discriminator, keeping the base class simple.

## Registration foundation review (2026-10-30)

- Reviewed consumers: Identity is implemented; Catalog and Booking have no program code yet.
- Enum SEGMENT members provide static registry metadata; numeric members are checked through IExceptionCodeRegistry and the abstract exception hierarchy.
- No speculative time-range or event implementation is included in this slice.

## Approved booking foundations (2026-10-30)

TimeRangeVO, ADomainEvent and AEventEntity were explicitly approved by the owner.
Invalid range syntax reuses the existing safe request-validation exception; no
Core code was reassigned. Booking events carry stable IDs and specific serializable
payload classes. No generic authorization state was added to SharedKernel.
