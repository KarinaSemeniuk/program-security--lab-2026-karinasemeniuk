# Project Scope

## Purpose

RoomBook allows members of an organization to discover, reserve and
manage time-bound access to shared resources — meeting rooms and
coworking desks — through a responsive web application.

## In scope

- User registration and authentication.
- Resource catalog management (create, edit, deactivate a resource).
- Viewing resource availability for a given time range.
- Creating, viewing and cancelling bookings.
- Administrative oversight of bookings across all resources.

## Out of scope

| Excluded capability | Rationale |
|---|---|
| Payment processing | Resource usage is not billed in the current business model. |
| External calendar sync (Google Calendar, Outlook) | Not required for the initial release; considered for a later iteration. |
| Native mobile applications | A responsive web SPA covers both mobile and desktop without a separate codebase. |
| Multi-tenancy | The system serves a single organization and a single resource catalog. |

## External systems

The system does not currently integrate with any external service.
All persisted data (accounts, resources, bookings) is owned and
managed within the system's own database.

## User roles

| Role | Capabilities |
|---|---|
| Guest | Browse the resource catalog and general availability; no personal data of other users is exposed. |
| User | Everything a Guest can do, plus creating and cancelling their own bookings. |
| Admin | Everything a User can do, plus managing the resource catalog and any booking in the system. |

Clearly bounding the system this way keeps the initial implementation
focused and gives later security work (authorization, threat modeling)
a stable surface to reason about.
