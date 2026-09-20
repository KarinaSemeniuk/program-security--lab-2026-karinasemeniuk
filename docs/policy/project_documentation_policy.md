# Documentation Policy

## Location

All project documentation lives inside the repository, under `docs/`, next to the source code. This lets documentation use the same version-control mechanisms as code: change history, authorship, diffs, and traceability between a documentation change and the code change that motivated it.

## Structure

```
docs/
├── guide/                          # practical, task-oriented guides for contributors
├── specification/                  # scope, functional & non-functional requirements (ISO/IEC/IEEE 29148)
├── architecture/                   # architecture description, by viewpoint (ISO/IEC/IEEE 42010)
├── internal_spec/                  # domain model & business logic, by bounded context
│   ├── contexts_registry.md        # entry point: map of all bounded contexts
│   └── [Context]/
│       ├── business_logic.md
│       ├── changelog.md
│       └── tech_notes.md
├── policy/                         # this file and project_policy.md
├── testing/                        # testing strategy
├── CHANGELOG.md                    # project-wide changelog
└── README.md
```

## `internal_spec/contexts_registry.md`

The single entry point into the domain map: a full list of bounded contexts with a short description, responsibility boundary, exception-registry segment token, status, and dependencies for each. Anyone new to the codebase starts here.

## `internal_spec/[Context]/business_logic.md`

Describes the **stable conceptual content** of a bounded context: purpose, Aggregate Roots, key invariants, key domain elements, explicit boundaries ("NOT here: ..."), cross-context dependencies. Always reflects the context's current state — stale content is treated as a defect, not a formatting issue.

## `internal_spec/[Context]/changelog.md`

A chronological, **append-only** log of the context's significant changes. New entries go on top. Entry format:

```
## [YYYY-MM-DD] Short title
- What changed and why, in a short bullet list.
```

## `internal_spec/[Context]/tech_notes.md`

Everything a developer or an AI agent should know before working in the context, beyond what the code and `business_logic.md` already express: tech debt, known issues, non-obvious decisions and their rationale, edge cases.

## Keeping documentation current

- Documentation is not written once, after implementation is done — it changes together with the project.
- A requirement change is recorded in `specification/` before it is implemented (Specification-Driven Development).
- A business-rule change is recorded in the relevant `internal_spec/[Context]/business_logic.md` before the corresponding code changes, with a matching entry added to that context's `changelog.md`.
- An architectural decision change (a new external dependency, a change to the layering) is reflected in `architecture/` in the same pull request as the code that makes the change.

## Ownership

Whoever creates a bounded context creates its three documentation files. Whoever changes a context: adds a `changelog.md` entry, reviews and, if needed, updates `business_logic.md`, and records any new tech debt or resolved issue in `tech_notes.md`.

## Commits

- Documentation-only changes are committed separately from code changes, using the `[DOCS]` prefix.
- Every notable documentation change is also added as an entry in the project-wide `CHANGELOG.md`.

## Consistency check

Before merging into `main`, the author confirms that:
- requirements in `specification/` do not contradict the business logic described in `internal_spec/`;
- the architecture described in `architecture/` is capable of supporting the stated requirements;
- `policy/project_policy.md` matches the technologies actually in use.

## Style

As concise as possible, in lists, but exhaustive: no insignificant detail, but nothing important left out either.
