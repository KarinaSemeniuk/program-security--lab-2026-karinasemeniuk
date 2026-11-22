# Licensing

Owns signed installation capability/validity decisions. Segment LIC. It does not
own user roles, booking rules, billing, payments or the legal source-code LICENSE.

InstallationLicense is immutable, validates product/installation UUIDs and canonical
validity bounds, accepts only known unique LicenseFeature values. Infrastructure
verifies RSA-PSS bytes before Domain parses claims. Cross-context application
wrappers enforce entitlements while preserving each original use case's independent
access/ownership rules. GetServiceLicenseUC is Admin-only and exposes a safe summary.

Failures: 1 invalid signature/claims/binding, 2 outside validity window, 3 missing
capability. No new SharedKernel type is required. See guide/licensing-and-release.md.
