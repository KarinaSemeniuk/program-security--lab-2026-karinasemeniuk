CREATE TABLE "sessions" (
  "id" UUID NOT NULL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires_at" TIMESTAMPTZ(3) NOT NULL
);
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");
