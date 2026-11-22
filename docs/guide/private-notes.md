# Private booking notes: confidentiality and integrity

Implemented application slice for labs 06–07 (FR-15–FR-19). The course's standalone
CTR/XOR, SHA-256/HMAC/GCM experiments and reports remain deferred.

## Product and access

The owner opens a note lazily from My bookings. Whitespace/Unicode are preserved;
limit 2000 Unicode code points, no lone surrogates or control characters except
CR/LF/tab. Empty text clears content. Notes also work for historical bookings.
A non-owner Admin cannot read or modify them. Public availability, owner history
and Admin history never include note text or encrypted envelopes.

GET /api/bookings/:id/private-note returns {note:{text,revision,updatedAt}}.
Absent note returns empty text, revision 0, empty timestamp. POST to the same path
accepts exactly {text,revision}. Actor identity comes from the current session.
Write entitlement and owner authorization are independent. Expired installation
entitlements do not block owner reads.

Both routes are no-store; writes retain exact Origin/JSON/size controls. The editor
keeps plaintext only in transient component memory, clears it when closed, and
unmounts on logout. It does not use browser storage, URLs or logs. A stale edit
returns 409; UI retains the draft and requires an explicit reload of current data.

## Cryptographic format

Node 22/OpenSSL supplies AES-256-GCM; no primitive is implemented by RoomBook.
Each encryption allocates a fresh 12-byte random nonce and 16-byte tag. The table
stores format version, non-secret key ID, nonce/ciphertext/tag hex, logical revision
and update time. A unique (key_id,nonce) constraint additionally rejects reuse.

AAD is unambiguous JSON array [RoomBook,booking-private-note,1,keyId,bookingId,
ownerId,revision]. It is verified together with ciphertext; copying to a different
booking/owner or changing revision fails. The adapter releases plaintext only
following successful final tag verification. Failed integrity returns 422
RB.INF.10, no plaintext; writes cannot overwrite a damaged existing record.
Missing keys/configuration return sanitized 503 rather than corrupting data.

This protects confidentiality/integrity against a database-only reader/modifier.
It does not hide data from an attacker controlling the API process or its keys,
and does not detect restoration of an entire authentic old DB snapshot. Independent
trusted audit/anti-rollback storage is outside this implementation.

## Keys and rotation

Default private file: .secrets/note-keys.json (directory 0700, owner-owned file 0600).
NOTE_KEYRING_PATH selects a backend-only location. File schema: version, activeId,
keys mapping opaque IDs to random 32-byte hex keys, at most 32 entries. There is
no default/fallback key. Files are ignored by Git and outside frontend's allowed
source root. Never copy key material into VITE_ values, DB, artifacts or logs.

`npm run notes:init` validates an existing key file or creates the initial private
file without displaying secrets. It requires built backend files. Initialization
has already been performed in this workspace; do not delete/recreate existing keys.

`npm run notes:rotate` adds a new active key atomically, retains old keys and
re-encrypts stored notes. API cipher operations read fresh key snapshots. Shared
transaction advisory locks on note writes coordinate with rotation's exclusive
lock, so a writer cannot add an old-key row during re-encryption. Owner/revision
bindings and logical updatedAt/revision are preserved. Notes are processed in
keyset batches of 100 inside one transaction (120-second maintenance timeout).

If a record fails integrity, DB updates roll back; the new key file retains both
new and old keys. Resolve the corrupted data from a trusted source and use
`npm run notes:rotate -- --resume`. Resume targets the current active key without
adding another key. Never delete old keys as an error-recovery shortcut.

This local deployment coordinates processes sharing the same key file and DB.
Separately replicated key files require explicit deployment coordination; unlimited
key retention, KMS integration and very large resumable multi-transaction rotation
are not implemented. Back up DB and key files together securely outside Git before
real-user deployment; losing keys loses access to encrypted notes.

## Mechanism choices for lab 07

- Private note content/context: AES-GCM, which supplies confidentiality and integrity.
  Adding a second HMAC to that same envelope would duplicate authentication.
- Access token claims: existing library-issued HS256 JWT, plus server session checks.
- Build artifacts: SHA-256 inventory authenticated by a separate RSA-PSS release
  signature. A checksum beside a file without a trusted signature is not treated
  as proof of its origin. See licensing-and-release.md.

`npm run check:notes` is explicit local API/PostgreSQL QA outside Jest. It uses a
private temporary key file and synthetic fixtures on port 3108, checks ownership,
conflicts, corruption, missing session and fresh-key reads. When no pre-existing
notes are present it checks rotation/recovery on 206 synthetic notes; otherwise
that shared-table rotation section is explicitly skipped. It never substitutes
its temporary key file for the real installation key file and cleans up fixtures.
