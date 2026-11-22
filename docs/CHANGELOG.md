# Changelog

## 2026-10-30 — Service functionality

Resource calendars/local time, guarded booking movement/history filters, account password/session controls and Admin blocking. Additive migrations 006/007 preserve existing data. Standalone lab experiments/reports remain deferred.

## 2026-10-30 — Resource information and lifecycle

Added public active/Admin inactive detail views, ROOM/DESK metadata, revision-checked Admin edits and reactivation. Slot size is immutable; existing bookings and history are retained. Resource-admin entitlement gates the new mutations. Additive migration 20261030000500_resource_details.

## [2026-10-30] Service development for labs 06–09
- Add owner-only encrypted notes, optimistic edits and retained-key rotation/recovery.
- Add catalog name/capacity filtering and explicit empty results.
- Add Licensing context, signed installation capabilities and safe Admin status.
- Add separately signed build inventories and local secret-artifact checks.
- Add build-only client selection transformation with execution-equivalence checks.
- Keep standalone course experiments and reports deferred; no housing/payment scope expansion.

## [2026-10-30] Catalog, bookings and access control
- Implement public catalog/availability, own bookings and Admin resource/history UI.
- Add role, ownership, cutoff, CSRF and rate-limit controls plus atomic PostgreSQL exclusion.
- Add owner-approved TimeRangeVO/event foundations and scheduled booking completion.
- Add idempotent sample catalog and explicit local Admin provisioning commands.
- Reports and standalone coursework experiments remain deferred by user request.

## [2026-10-30] Cookie authentication and revocable sessions
- Added sign-in, current-user and sign-out API/UI with uniform credential errors.
- Added PostgreSQL active-session migration; logout invalidates replayed tokens.
- Reconciled FR-3 with cookie/JWT architecture, CSRF controls and session checks.
- Added isolated tests and an explicit local PostgreSQL smoke check.

All notable changes to the project and its documentation are recorded
here, most recent first.

## [Unreleased]

### Added — Security documentation
- Security policy covering roles, secure development environment, secure
  implementation rules, verification, and vulnerability management
  (`security/security_policy.md`).
- Standalone privacy policy, kept separate in anticipation of future
  multi-user, public-facing use (`security/privacy_policy.md`).
- STRIDE-based threat model, including a threat actor model and an
  identified-gaps section feeding back into the specification
  (`security/threat_model.md`).
- NFR-10 (rate limiting), added to `specification/non-functional-requirements.md`
  as a direct result of the threat model's Denial-of-Service findings.

### Added — Documentation baseline
- Project scope and boundaries (`specification/scope.md`).
- Functional requirements FR-1 … FR-14 (`specification/functional-requirements.md`).
- Non-functional requirements NFR-1 … NFR-9 (`specification/non-functional-requirements.md`).
- Architecture description across five viewpoints (`architecture/`).
- Domain model and business logic for the Identity, Catalog and Booking
  bounded contexts (`internal_spec/`).
- Project policy and documentation policy (`policy/`).
- Testing strategy (`testing/testing-strategy.md`).
