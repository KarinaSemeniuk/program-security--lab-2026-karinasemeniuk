# Module Dependencies (Backend)

## Viewpoint

This view addresses internal backend layering, for developers adding
or reviewing backend code.

## Layering

```
routes/  →  controllers/  →  services/ (business logic)  →  repositories/ (Prisma)  →  database
```

## Rules

- A layer may only call the layer directly below it; `controllers`
  never call `repositories/` directly, and `routes` never contain
  business logic.
- Business rules described in `internal_spec/*/business_logic.md` are
  implemented exclusively in `services/`, so they can be unit-tested
  without an HTTP layer or a real database.
- Each bounded context (`identity`, `catalog`, `booking`) owns its own
  `service` and `repository`; cross-context calls go through a
  service's public interface, never through another context's
  repository.
