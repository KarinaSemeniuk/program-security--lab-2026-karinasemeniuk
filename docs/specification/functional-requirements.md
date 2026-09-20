# Functional Requirements

Requirements are written to be unambiguous and independently
verifiable, per ISO/IEC/IEEE 29148.

## Authentication & accounts

- **FR-1.** The system shall allow a new user to register with an
  email address and a password of at least 8 characters containing at
  least one digit.
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
