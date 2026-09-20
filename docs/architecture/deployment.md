# Deployment View

## Viewpoint

This view addresses how the system is deployed and operated, for
whoever provisions and runs it.

## Components

- **Backend** — a stateless Node.js process (or container image),
  horizontally scalable behind a load balancer (supports NFR-9).
- **Frontend** — a static build produced by Vite, served from a static
  host or CDN, independent of the backend's deployment lifecycle.
- **Database** — a managed PostgreSQL instance (or container for local
  development), the only stateful component.

## Environments

| Environment | Purpose |
|---|---|
| Local | Development, run via `docker-compose` for Postgres + backend. |
| Staging | Pre-production verification. |
| Production | Live traffic. |

Configuration differences between environments (database URL, JWT
secret, allowed CORS origins) are provided via environment variables,
never hard-coded — see `policy/project_policy.md`.
