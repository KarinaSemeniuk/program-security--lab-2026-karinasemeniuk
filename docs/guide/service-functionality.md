# Service functionality

## Viewing time and opening rules

Select the viewing IANA zone in the workspace. Times include numeric UTC offsets, distinguishing repeated DST hours. A civil day may have 23/25 hours. UTC storage and original slot alignment are preserved. Slots are assigned to the display day containing their start; long slots can finish on the following day. Admin booking-history date fields remain explicitly UTC.

Admin → Керування → Години роботи й закриті дати sets resource-local timeZone, Sunday-first weekly windows and closedDates. 0/0 disables a day; 1440 denotes midnight. Split overnight hours across adjacent weekdays. Existing bookings remain valid; new placement/movement checks the current calendar under lock. Resource revision protects against concurrent descriptive/calendar edits.

## Movement and history

Мої бронювання filters upcoming/current, past, cancelled or all. Filters and totals are applied before 50-entry pagination. Перенести бронювання loads current availability for the same resource. Select a start and duration, then confirm. Original ID, owner, private note and status are retained. Failure never cancels the old booking. User active-booking movement requires >=2 hours before original start; Admin can move future active bookings with no two-hour cutoff. Started or terminal bookings cannot move. Stale interval revision returns 409.

## Accounts

Обліковий запис changes a known password using the existing exact-value policy. Verify the current password and repeat the new one; success revokes every session, requiring a fresh login. Завершити інші сеанси preserves the current session. Admin → Користувачі provides bounded email search and block/unblock confirmation. Admin/self targets cannot be blocked. Blocking revokes sessions without cancelling reservations; unblocking requires a fresh login and never revives old tokens. Role promotion remains local CLI only.

## HTTP additions

All POST routes keep existing exact-Origin, JSON and cookie protections. Server identity never comes from JSON. Workspace JSON is bounded at 32 KiB; password changes are additionally limited to five attempts/account/minute.

| Route | Exact input | Access |
|---|---|---|
| GET /api/resources/:id/availability | date, optional timeZone (default UTC) | Public active resources |
| POST /api/resources/:id/calendar | timeZone, weekly[{open,close}] ×7, closedDates[], revision | Admin + resource-admin entitlement |
| POST /api/bookings/:id/reschedule | startAt, endAt, revision | Owner/Admin + booking entitlement |
| GET /api/bookings/mine | page, filter=all/upcoming/past/cancelled | Current account only |
| POST /api/account/password | currentPassword, newPassword | Current account + current password |
| POST /api/account/sessions/revoke-others | {} | Current account |
| GET /api/admin/accounts | page, search | Admin |
| POST /api/admin/accounts/:id/block | blocked:boolean | Admin; non-Admin target only |

Safe additions: CAT.6 invalid calendar /400, BKG.12 closed interval /409, BKG.13 stale movement /409, IDN.12 denied account administration /403, IDN.13 credential conflict /409, IDN.14 missing account /404, IDN.15 wrong current password /400. Codes carry the RB. prefix.

## Verification

Run npm run check:service after npm run build with PostgreSQL available and migrations applied. It starts its own isolated-port API, verifies calendars/DST/movement/note preservation/account revocation/role guards and cleans only its own fixtures. Jest remains isolated from real network/database.
