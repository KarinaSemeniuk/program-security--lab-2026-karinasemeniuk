# Client analysis and build protection

Application and coursework experiments for lab 09. Appendix A, personal programs,
equivalence checks and pdb transcripts are stored in labs/lab-09/experiments/.

## Analysis and chosen boundary

The SPA contains resource/time displays, input feedback and slot selection. These
can be inspected and modified in a browser. No password hashing key, note key,
JWT secret or issuer private key is present in frontend sources/builds. Critical
ownership/role/session/license/overlap rules execute on the server, independently
of the client. Obfuscation does not change that trust boundary.

BookingSelectionService is a small pure client component that derives a contiguous
selection from availability. It is useful to inspect because a modified client can
submit a different interval; server policies, transactions and exclusion still
reject invalid requests. This module is the explicit protected target, rather than
obfuscating React or the large password dictionaries indiscriminately.

## Production transformation

Vite build applies frontend/tools/client-protection.mjs only to that module:
- Rename local symbols using TypeScript's symbol resolution, preserving public contracts.
- Replace runtime strings with an encoded UTF-16 table and lookup. The fixed XOR
  mask is encoding/obfuscation, not a cryptographic secret or encryption scheme.
- Replace straight-line method bodies with a state/switch dispatcher; hoisted local
  bindings preserve lifetime across dispatcher iterations. Cases are reordered.

Development source stays readable. Production also uses Vite's existing minifier
and disables frontend source maps. Transformation uses the already pinned TypeScript
compiler; no new library or technology-policy change was introduced. There is no
anti-debugger code, dynamic eval or protection that disables browser accessibility.

## Verification and limits

`npm run check:client-protection` executes original and transformed pure modules
against 2560 scenarios, including gaps, unavailable slots, invalid indices, fractional
sizes and NaN. It verifies output equivalence, not impossibility of reverse engineering.
Normal unit tests cover selection behavior; production frontend build proves that the
transform integrates with the real bundle. Server negative tests remain authoritative
for access/security. Static analysis now has renamed locals, indirect strings and
non-linear source order; a debugger can still recover their execution and values.

Protecting this one module increases analysis effort modestly; it does not make a
browser-delivered program secret. The standalone exercise additionally demonstrates encrypted print blocks, opaque
predicates and indirect calls. These toy techniques are not added to the SPA.

Measured transpiled target-module size: 1651 bytes before and 2656 after transformation. This is not the size of the entire SPA.

## Coursework verification

The three supplied Appendix A versions match on five inputs (15 runs). The personal
plain/obfuscated programs match on 32 inputs (64 runs). Python pdb sessions locate
the reference comparison and recover the decrypted print block at runtime in both
advanced examples. sys.settrace records actual dispatcher paths and line events;
these counts are not estimates of reverse-engineering time. See experiments/README.md
and experiments/analysis-results.json. The personal control includes its required
trailing underscore; it is an educational value, not an account password.
