CREATE TABLE sealed_notes (
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL CHECK (revision > 0),
  key_id VARCHAR(32) NOT NULL,
  nonce VARCHAR(16) NOT NULL,
  envelope JSONB NOT NULL,
  PRIMARY KEY (booking_id, revision),
  UNIQUE (key_id, nonce)
);
