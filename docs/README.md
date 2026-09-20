# RoomBook — Project Documentation

RoomBook is a responsive single-page web application for booking
time-bound resources (meeting rooms, coworking desks). This directory
contains the full project documentation, maintained alongside the
codebase per ISO/IEC/IEEE 15289 (documented information elements) and
kept in sync with the implementation as required by ISO/IEC/IEEE 12207.

## Directory structure

| Path | Purpose |
|------|---------|
| `guide/` | Practical guides for developers working on or integrating with the system. |
| `specification/` | Scope, functional and non-functional requirements (ISO/IEC/IEEE 29148). |
| `architecture/` | Architecture description across multiple viewpoints (ISO/IEC/IEEE 42010). |
| `internal_spec/` | Domain model and business logic, organized by bounded context. |
| `policy/` | Binding project policies: engineering rules (`project_policy.md`, including the pinned technology stack) and documentation rules (`project_documentation_policy.md`). |
| `testing/` | Testing strategy and conventions. |
| `CHANGELOG.md` | Log of significant changes to the system and its documentation. |

## Reading order for a new contributor

1. `policy/project_policy.md` — the rules you are expected to follow, including the pinned technology stack (§2) and the layered/DDD architecture (§4).
2. `specification/scope.md` — what the system is and is not responsible for.
3. `architecture/overview.md` — how the system is put together.
4. `internal_spec/contexts_registry.md` — the domain model, by bounded context.

## Maintenance principle

Documentation is not a deliverable produced after implementation is
finished — it evolves with the project. A change to a requirement is
recorded in `specification/` before it is implemented (Specification-
Driven Development); a change to a business rule is recorded in the
relevant `internal_spec/[Context]/business_logic.md`, with a matching
entry in that context's `changelog.md`, before the code changes.
Documentation-only commits use the `[DOCS]` prefix. A change to the
technology stack itself follows the stricter procedure in
`policy/project_policy.md` §2.1 — it is never incidental.
