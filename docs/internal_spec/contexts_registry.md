# Bounded Contexts Registry

Entry point into RoomBook's domain model. Every bounded context is registered here with its responsibility, its exception-registry segment token (see `policy/project_policy.md` §8), its status, and its dependencies on other contexts.

| Context | Responsibility | Segment | Status | Depends on |
|---|---|---|---|---|
| [Identity](./Identity/business_logic.md) | User accounts, authentication, roles | `IDN` | Active | — |
| [Catalog](./Catalog/business_logic.md) | Bookable resources and their availability rules | `CAT` | Active | — |
| [Booking](./Booking/business_logic.md) | Reservation lifecycle and conflict rules | `BKG` | Active | Identity, Catalog |
| [SharedKernel](./SharedKernel/business_logic.md) | Concepts and abstractions shared by more than one context | `CORE` | Active | — (depended upon by all) |

## Context relationships

```
Identity ──┐
           │ (userId, stable reference)
           ▼
        Booking ──────▶ Catalog
                 (resourceId, stable reference)
```

`Booking` is the only context that depends on others; it references `Identity` and `Catalog` exclusively through stable identifiers (id + display name), never through embedded models of variable depth (see `policy/project_policy.md` §4). Neither `Identity` nor `Catalog` is aware that `Booking` exists — the dependency is deliberately one-way.

## Adding a new context

1. Create `internal_spec/[Context]/` with `business_logic.md`, `changelog.md`, `tech_notes.md`.
2. Assign it a unique three-letter segment token and add a row to the table above.
3. Add the corresponding `Domain/[Context]/` and `Application/[Context]/` folders per `policy/project_policy.md` §4.
4. Update the relationship diagram above if the new context depends on, or is depended on by, an existing one.
