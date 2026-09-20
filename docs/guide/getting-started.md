# Getting Started

## Prerequisites

- Node.js LTS
- PostgreSQL (local instance or Docker container)
- Git

## Setup

1. Clone the repository and install dependencies for both the backend
   and the frontend packages.
2. Copy the example environment file and fill in local values (see
   `configuration.md`).
3. Run database migrations via Prisma.
4. Start the backend in development mode.
5. Start the frontend dev server.

## Verifying the setup

Once both processes are running, opening the frontend in a browser
should show the resource catalog (FR-14) without requiring sign-in —
this is the quickest smoke test that the client and API are wired
together correctly.
