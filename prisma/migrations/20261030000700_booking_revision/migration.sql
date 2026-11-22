ALTER TABLE bookings ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bookings ADD CONSTRAINT booking_revision_nonnegative CHECK (revision >= 0);
