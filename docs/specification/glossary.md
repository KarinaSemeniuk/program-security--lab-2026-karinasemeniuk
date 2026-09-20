# Glossary

| Term | Definition |
|---|---|
| Resource | A bookable asset with a fixed capacity and a minimum bookable time slot (e.g. a meeting room). |
| Booking | A reservation of a Resource by a User for a specific time interval. |
| Slot | The smallest bookable unit of time for a given Resource, defined by `minSlotMinutes`. |
| Bounded context | An explicit boundary within which a domain model and its terms have one, consistent meaning (per Domain-Driven Design). |
| Active resource | A Resource with `isActive = true`, eligible for new bookings. |
| Confirmed booking | A booking that has passed all validation and occupies its slot exclusively. |
