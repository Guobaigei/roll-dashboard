CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "operator_users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "client_id" text NOT NULL,
  "client_name" text,
  "boss_platform" text NOT NULL DEFAULT 'zhipin',
  "boss_username" text NOT NULL,
  "boss_account_id" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "operator_users_client_boss_username_unique"
  ON "operator_users" ("client_id", "boss_platform", "boss_username");
