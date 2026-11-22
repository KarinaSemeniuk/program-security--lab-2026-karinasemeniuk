# Functional Requirements

Requirements are written to be unambiguous and independently
verifiable, per ISO/IEC/IEEE 29148.

## Authentication & accounts

- **FR-1.** The system shall allow a new user to register with a
  unique email address and a password satisfying the password policy
  defined in `guide/authentication.md`.
- **FR-2.** The system shall allow a registered user to sign in with
  their email and password.
- **FR-3.** The system shall terminate a user's session on sign-out
  and invalidate the associated access token.
- **FR-4.** The system shall reject a sign-in attempt with an
  incorrect password and return an error that does not reveal whether
  the supplied email is registered.

## Resource management (Admin)

- **FR-5.** The system shall allow an Admin to create a new resource
  with a name, a capacity, and a minimum booking slot duration.
- **FR-6.** The system shall allow an Admin to deactivate a resource;
  a deactivated resource shall no longer appear in the catalog of
  bookable resources, while its booking history is retained.
- **FR-7.** The system shall allow an Admin to view all bookings for a
  given resource within a specified time range.

## Booking (User)

- **FR-8.** The system shall allow a User to view the available time
  slots of a selected resource on a selected date.
- **FR-9.** The system shall allow a User to create a booking for a
  free slot, provided the requested duration is a multiple of the
  resource's minimum slot duration.
- **FR-10.** The system shall reject a booking request whose time
  interval overlaps an existing active booking of the same resource.
- **FR-11.** The system shall allow a User to cancel their own booking
  no later than 2 hours before its start time.
- **FR-12.** The system shall reject an attempt to cancel a booking
  that belongs to a different user.
- **FR-13.** The system shall display, for a signed-in User, the list
  of their active and past bookings.

## Guest access

- **FR-14.** The system shall allow a Guest to browse the list of
  active resources without exposing personal data of other users.

## Catalog/Booking implementation contract

- Role checks use the current unblocked account and active session. Admin inherits
  User operations. Guest may read active resources and anonymous availability.
- Persistence and slot alignment use UTC; UI supports IANA display zones. Timestamps must be
  canonical ISO UTC with milliseconds. Half-open intervals permit adjacent bookings.
- Resource names contain 1–100 visible characters, capacity is 1–1000, and slot
  length is a positive integer divisor of 1440. Identity and slot length remain immutable; descriptive updates follow FR-25–29.
- Booking duration is at most seven days, a whole multiple of the resource slot;
  start/end align to the UTC slot grid and start is strictly in the future.
- Admin booking-history queries span at most 31 days; user history is paginated
  (50 records/page) and restricted by server-resolved owner identity.
- User cancellation of CONFIRMED requires >=2 hours before start; Admin can cancel active
  bookings without that cutoff. Terminal statuses cannot be cancelled.
- A periodic completion job transitions ended CONFIRMED bookings to COMPLETED;
  cancellation and completion share row locking and domain transition guards.

## Private booking notes — development slice for labs 06–07

- FR-15: The booking owner can read/write a private note, including for historical
  bookings. Other users, including non-owner Admin, cannot read or modify it.
- FR-16: Notes preserve Unicode/whitespace, allow at most 2000 Unicode code points,
  and reject invalid Unicode/control characters except tab/CR/LF. Empty clears text.
- FR-17: Notes use optimistic revisions; a stale write must fail without overwriting
  a more recent version. Notes never appear in public availability or history DTOs.
- FR-18: Notes are encrypted server-side using AES-256-GCM, fresh 96-bit nonces and
  128-bit tags. AAD binds format, key ID, booking ID, owner ID and revision.
- FR-19: Failed authentication/decryption returns no plaintext and blocks read/write
  of the damaged record. Key rotation preserves readability of older records and
  provides explicit re-encryption; keys are separate from Git, DB and frontend.

- FR-20: The catalog UI supports name/location/equipment search and minimum-capacity filtering, with an explicit empty result and filter reset. Filtering never changes server access rules.

## Installation licensing — development slice for lab 08

- FR-21: RoomBook is a single-organization hosted service with a signed installation
  entitlement; this introduces no payments and does not change the source LICENSE.
- FR-22: RSA-PSS/SHA-256 signatures (RSA 3072) authorize product, installation UUID,
  license UUID, holder, validity window and named capabilities. Signing keys stay
  in issuer-only local secrets; the API verifies using a pinned public key.
- FR-23: New bookings, resource creation/editing/reactivation and private-note writes require the
  corresponding active signed capability. Reads, authentication, cancellation and
  resource deactivation remain available when entitlement expires or is invalid.
- FR-24: Only Admin may inspect safe installation capability/expiry status. Invalid
  signature, expired entitlement, wrong installation/product or missing capability
  fail closed for gated operations. Authorization checks remain independently required.

## Resource information and lifecycle extension

- FR-25: Guests see an active resource detail page with ROOM/DESK type, description, location and equipment. Inactive details return 404 publicly; Admin may read them.
- FR-26: Admin creates and edits name, capacity and descriptive information. Identity and minimum slot duration remain immutable after creation; existing bookings retain their times and status.
- FR-27: Descriptions allow 2000 Unicode code points, location 200, equipment up to 20 distinct labels of 1–60 characters. All are plain text.
- FR-28: Edit and reactivation require the observed resource revision. A stale revision returns 409 without a write. Deactivation advances revision on a state change.
- FR-29: Resource administration entitlement gates creation, editing and reactivation. Deactivation and reads remain available for recovery.

## Service scheduling and booking management

- FR-30: Availability accepts a civil date and IANA display time zone, defaults to UTC for older callers, and includes UTC-grid slots starting on that local day (long slots may end the next day) (including 23/25-hour DST days). UI labels local times with offsets; persistence remains UTC.
- FR-31: Admin sets a resource IANA time zone, seven weekly opening windows and up to 366 closed dates using resource revision checks. A 0/0 window means closed; closing 1440 means midnight. Existing bookings are honored and never silently cancelled. New placements recheck the current calendar under the resource lock.
- FR-32: Owner may move an active booking at least two hours before its original start; Admin may move an active future booking. Moving keeps the same resource, owner, ID and private note. Expected original timestamps prevent lost updates; target must pass creation rules. Failure preserves the original booking.
- FR-33: Personal booking history supports all/upcoming/past/cancelled filters with server-side pagination and matching totals.
- FR-34: Authenticated users change passwords after verifying the current password and current password policy; concurrent changes cannot overwrite each other. All sessions are revoked on success; the user signs in again. Users may revoke other sessions while keeping their current session.
- FR-35: Admin lists accounts and blocks/unblocks non-Admin accounts; blocking revokes their sessions without cancelling bookings. No role-changing endpoint is introduced; Admin cannot block self or another Admin.
