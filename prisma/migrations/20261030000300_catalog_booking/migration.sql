CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TYPE booking_status AS ENUM ('PENDING','CONFIRMED','CANCELLED','COMPLETED');
CREATE TABLE resources (
 id UUID PRIMARY KEY, name VARCHAR(100) NOT NULL CHECK (length(btrim(name)) > 0),
 capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 1000),
 min_slot_minutes INTEGER NOT NULL CHECK (min_slot_minutes > 0 AND 1440 % min_slot_minutes = 0),
 is_active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE bookings (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE RESTRICT,
 start_at TIMESTAMPTZ(3) NOT NULL, end_at TIMESTAMPTZ(3) NOT NULL,
 status booking_status NOT NULL DEFAULT 'PENDING', created_at TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT bookings_valid_range CHECK (end_at > start_at),
 CONSTRAINT bookings_no_overlap EXCLUDE USING gist
 (resource_id WITH =, tstzrange(start_at, end_at, '[)') WITH &&)
 WHERE (status IN ('PENDING','CONFIRMED'))
);
CREATE INDEX bookings_user_id_start_at_idx ON bookings(user_id,start_at);
CREATE INDEX bookings_resource_id_start_at_idx ON bookings(resource_id,start_at);
CREATE INDEX bookings_status_end_at_idx ON bookings(status,end_at);
