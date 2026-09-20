# Configuration

> See `policy/project_policy.md` §2.2 for the exact, pinned technology stack this configuration assumes. Do not upgrade or swap a tool referenced below without going through the stack-change procedure in §2.1.

Configuration is provided via environment variables, never hard-coded
in source (see `policy/project_policy.md`).

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection string. |
| `JWT_SECRET` | Backend | Signing key for access tokens. |
| `JWT_EXPIRES_IN` | Backend | Access token lifetime. |
| `CORS_ORIGIN` | Backend | Allowed origin(s) for the frontend. |
| `VITE_API_BASE_URL` | Frontend | Base URL of the API the client talks to. |

None of the above are committed to the repository; each environment
keeps its own `.env` file, excluded via `.gitignore`.
