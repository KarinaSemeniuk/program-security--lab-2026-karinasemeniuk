# Catalog and Booking access control

Implemented lab-05 application slice. Model: RBAC for Guest/User/Admin combined
with booking ownership and time/state attributes. Public registration always
creates USER; ADMIN is provisioned only by an explicit local command. No role
can be supplied through API request JSON.

| Operation | Guest | User | Admin |
|---|---|---|---|
| Active catalog and anonymous availability | Yes | Yes | Yes |
| Inactive catalog | No | No | Yes |
| Create/edit/deactivate/reactivate resource | No | No | Yes |
| Create booking | No | Own account | Own account |
| My bookings | No | Own history only | Own history only |
| Resource booking history | No | No | Selected resource and bounded range |
| Cancel active booking | No | Owner, CONFIRMED >=2 hours before start | Any owner, no time cutoff |
| Cancel CANCELLED/COMPLETED booking | No | No | No |

PENDING cancellation has no cutoff; current creation immediately confirms in the
same transaction, so API-created bookings do not remain PENDING.

Every protected request resolves JWT, PostgreSQL session, current user status and
role through GetCurrentUserUC. Controller constructs typed intents with that
actor. Request bodies never determine actor identity. Application gates Admin
operations; locked booking aggregates enforce ownership, cutoff and lifecycle.
Buttons are convenience controls, never the authorization mechanism.

## HTTP contracts

All mutations use POST, exact configured Origin, application/json, at most 32 KiB
uncompressed JSON; cross-site Fetch Metadata is rejected. Responses are no-store.
Identifiers are UUID v4. Queries reject unexpected fields and array values.

| Method/path | Input | Result |
|---|---|---|
| GET /api/resources | No query | Active resource DTOs, no user data |
| GET /api/admin/resources | Admin session | Includes inactive resources |
| POST /api/resources | name, capacity, minSlotMinutes | 201 resource |
| POST /api/resources/:id/deactivate | {} | Inactive resource; history retained |
| GET /api/resources/:id/availability | date=YYYY-MM-DD | Anonymous UTC slot boundaries/available |
| POST /api/bookings | resourceId, startAt, endAt | 201 confirmed booking for current account |
| GET /api/bookings/mine | Optional zero-based page | Own bookings and total |
| POST /api/bookings/:id/cancel | {} | Cancelled booking |
| GET /api/resources/:id/bookings | startAt, endAt, optional page | Admin history and total |

startAt/endAt are canonical ISO UTC timestamps with milliseconds (e.g.
2026-11-03T12:00:00.000Z). Intervals are half-open. Slot sizes divide 1440 minutes;
starts align to that UTC grid; duration is a whole multiple, at most seven days.
Admin history spans at most 31 days. History pages contain at most 50 records.
Slot display uses the selected IANA zone and numeric UTC offsets. Availability queries accept timeZone (default UTC) and resolve local DST boundaries. Admin history date bounds remain explicitly UTC.

Creation allows at most 10 attempts/minute/direct IP, Retry-After: 60 on 429.
X-Forwarded-For is ignored; the limiter is bounded to 5000 tracked addresses.
A shared limiter is required before multi-instance public deployment.

## Atomicity and lifecycle

Placement locks the resource, reloads active/configuration state, rechecks occupied
intervals using CreateBookingDPolicy and persists confirmation in one transaction.
The PostgreSQL bookings_no_overlap exclusion constraint is the final defense,
including against SQL writes bypassing the application. Adjacent intervals are valid.
Resource deactivation takes the same row lock, giving a defined ordering with creation.

Cancellation and periodic completion lock booking rows. The internal completion
service runs on startup and every minute, at most 100 bookings per batch, skipping
locked rows. CANCELLED cannot become COMPLETED and terminal states cannot reopen.
At larger volumes completion can lag across several batches; reads do not mutate
status. UI displays active and historical bookings with pagination.

Booking queues Placed/StatusChanged/Cancelled events. Persistence drains events
only after commit. There are no downstream subscribers in this release; the explicit
no-subscriber dispatcher is not a durable audit log. Completion emits no events.

## Setup and local administration

PostgreSQL 16 needs btree_gist, supplied on Fedora by postgresql16-contrib:

```bash
sudo dnf install postgresql16-contrib
```

From the repository root:

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed:catalog
npm run build
npm start
```

In another terminal, from the same root: `npm run dev:frontend`.
The sample catalog is idempotent and preserves any existing deactivation or edits.
There are no seeded accounts and no default administrator password.

Register your own account, then explicitly provision its Admin role locally:

```bash
npm run admin:promote -- your-registered-email
```

The command only updates an existing active account; it never resets passwords or
creates an account. Refresh the browser after changing role. Do not expose this
command through the public API. Existing users were not promoted automatically.

## Verification

`npm test` runs isolated tests without real network calls.
`npm run check:workspace` is a separate manual PostgreSQL/API check: it owns port
3106, creates synthetic users/resources/bookings, checks role/owner/state/time
rules, concurrent placement, direct SQL overlap rejection, active-session checks,
CSRF, pagination input and booking rate limits, then removes its fixtures and
stops only its own server. It refuses an occupied port.

Reports and the course's standalone experiments remain deferred by user request.

`npm run check:availability` is an optional single-request NFR-1 local smoke check.
It requires an already running local API (default http://127.0.0.1:3000;
ROOMBOOK_QA_API can select another loopback HTTP port), creates 10,000 synthetic
bookings in its own resource, measures availability and removes its fixtures.
The measured sample in this environment was 52.6 ms for 48 slots; this is not a
concurrent-user load guarantee.

## Resource detail and management extension

- `GET /api/resources/:id`: public active detail; inactive/missing returns 404.
- `GET /api/admin/resources/:id`: Admin detail, including inactive resources.
- `POST /api/resources`: original name/capacity/minSlotMinutes contract remains supported; extended creation adds exactly type/description/location/equipment.
- `POST /api/resources/:id/update`: Admin, exact name/capacity/type/description/location/equipment/revision JSON.
- `POST /api/resources/:id/reactivate`: Admin, exact revision JSON.
- Both new mutations require resource-admin entitlement, same-origin cookie/CSRF rules and a current observed version; stale writes return RB.CAT.5 / 409. Deactivation remains available without entitlement.
- Workspace JSON limit is now 32 KiB so maximal Unicode metadata fields fit together; registration/authentication limits are unchanged. Fields are plain text, not HTML. Slot size and ID cannot be edited.
