# Non-Functional Requirements

Each requirement below names a concrete, checkable condition rather
than a vague quality goal (e.g. "the interface must be user-friendly"
is deliberately avoided).

## Performance

- **NFR-1.** The API response time for listing a resource's available
  slots shall not exceed 500 ms with up to 10,000 stored bookings.

## Usability & responsiveness

- **NFR-2.** The interface shall render and remain fully usable on
  viewport widths from 360px (mobile) to 1920px (desktop), without
  horizontal page scrolling.
- **NFR-3.** Every interactive element (button, form field) shall have
  a minimum touch target of 44×44px on viewports up to 480px wide.

## Security

- **NFR-4.** User passwords shall be stored only as a salted hash
  (bcrypt or equivalent), never in plaintext.
- **NFR-5.** Access to resource-management operations (FR-5–FR-7)
  shall be restricted to users with the Admin role; a request without
  the required role shall receive HTTP 403.
- **NFR-6.** Every API input shall be validated for type, format and
  range on the server, independently of any client-side validation.

## Reliability

- **NFR-7.** Booking creation shall be atomic: two concurrent requests
  for the same slot shall never both succeed.

## Compatibility

- **NFR-8.** The client shall function correctly on the latest two
  major versions of Chrome, Firefox and Safari.

## Scalability

- **NFR-9.** The backend application layer shall be horizontally
  scalable without requiring changes to the database schema.
