# Changelog

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
