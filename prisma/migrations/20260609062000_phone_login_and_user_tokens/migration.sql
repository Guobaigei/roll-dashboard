ALTER TABLE "operator_users"
  ADD COLUMN IF NOT EXISTS "phone" text;

UPDATE "operator_users"
SET "phone" = COALESCE("phone", "email")
WHERE "phone" IS NULL
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'operator_users'
      AND column_name = 'email'
  );

ALTER TABLE "operator_users"
  ALTER COLUMN "phone" SET NOT NULL;

ALTER TABLE "operator_users"
  DROP CONSTRAINT IF EXISTS "operator_users_email_key";

DROP INDEX IF EXISTS "operator_users_client_boss_username_unique";

ALTER TABLE "operator_users"
  DROP COLUMN IF EXISTS "email",
  DROP COLUMN IF EXISTS "client_id",
  DROP COLUMN IF EXISTS "client_name";

CREATE UNIQUE INDEX IF NOT EXISTS "operator_users_boss_username_unique"
  ON "operator_users" ("boss_platform", "boss_username");

CREATE TABLE IF NOT EXISTS "operator_user_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "operator_users"("id") ON DELETE CASCADE,
  "token_ciphertext" text NOT NULL,
  "token_fingerprint" text NOT NULL,
  "token_label" text,
  "client_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "operator_user_tokens_user_fingerprint_unique"
  ON "operator_user_tokens" ("user_id", "token_fingerprint");

CREATE INDEX IF NOT EXISTS "operator_user_tokens_user_id_idx"
  ON "operator_user_tokens" ("user_id");
