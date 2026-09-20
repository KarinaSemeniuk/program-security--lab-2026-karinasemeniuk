# Architecture Overview

> **Technology stack.** The exact, pinned technology stack (with versions) is the single source of truth in `policy/project_policy.md` §2.2. This document assumes that stack and does not restate version numbers — if something below appears to use a different technology than §2.2, the policy wins and this document is out of date and must be corrected.

This description follows ISO/IEC/IEEE 42010: the system is presented
through several viewpoints, each answering a distinct architectural
concern for a distinct stakeholder. It does not mandate a specific
notation — the views below combine short diagrams with prose, which is
sufficient to communicate the decisions unambiguously.

## Component structure

```
┌──────────────────────┐        HTTPS / JSON        ┌────────────────────────┐
│   Client (SPA)         │ ─────────────────────────▶│   API Server            │
│   React + Vite          │◀───────────────────────── │   Node.js + Express     │
└──────────────────────┘                            └───────────┬────────────┘
                                                                  │ SQL (Prisma ORM)
                                                                  ▼
                                                      ┌────────────────────────┐
                                                      │   PostgreSQL             │
                                                      └────────────────────────┘
```

The client and the API server are deployed independently and interact
exclusively over a documented REST API; the client never accesses the
database directly.

See also:
- [`context-diagram.md`](./context-diagram.md) — client/server interaction and authentication flow.
- [`data-model.md`](./data-model.md) — data storage structure.
- [`deployment.md`](./deployment.md) — how components are deployed.
- [`module-dependencies.md`](./module-dependencies.md) — internal backend layering.
