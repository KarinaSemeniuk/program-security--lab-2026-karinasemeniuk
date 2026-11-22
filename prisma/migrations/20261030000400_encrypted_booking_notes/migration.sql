CREATE TABLE booking_notes (
 booking_id UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
 format_version INTEGER NOT NULL CHECK (format_version = 1),
 key_id VARCHAR(64) NOT NULL, nonce VARCHAR(24) NOT NULL,
 ciphertext TEXT NOT NULL, tag VARCHAR(32) NOT NULL,
 revision INTEGER NOT NULL CHECK (revision > 0), updated_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT booking_notes_key_id_nonce_key UNIQUE(key_id,nonce),
 CHECK (nonce ~ '^[a-f0-9]{24}$'), CHECK (tag ~ '^[a-f0-9]{32}$'),
 CHECK (length(ciphertext) <= 16000 AND ciphertext ~ '^([a-f0-9]{2})*$')
);
