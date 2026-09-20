# Tech Notes — SharedKernel

## Known limitations (by design, for the current release)

- `CoreExceptionRegistry` (segment `CORE`) does not exist yet — per `policy/project_policy.md` §8, it is created only once the first genuinely core-level exception (belonging to no context) is needed. Do not create it speculatively.

## Edge cases to keep in mind

- `TimeRangeVO`'s overlap predicate is deliberately strict (`<`, not `<=`) so that a booking ending at 10:00 and one starting at 10:00 do not count as overlapping — this is what makes back-to-back bookings possible. Any change to this predicate affects both `Booking`'s write-path check and `Catalog`'s availability computation simultaneously.

## Non-obvious decisions

- `AEntityIdVO` intentionally does not carry a context-specific type tag (e.g. distinguishing a `UserIdVO` from a `ResourceIdVO` at the value level beyond their class) — cross-context type-safety is achieved through TypeScript's nominal-ish class typing (each concrete subclass is a distinct type), not through a runtime discriminator, keeping the base class simple.
