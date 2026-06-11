ALTER TABLE "operator_user_tokens"
  RENAME COLUMN "token_ciphertext" TO "client_token_ciphertext";

ALTER TABLE "operator_user_tokens"
  RENAME COLUMN "token_fingerprint" TO "client_token_fingerprint";

ALTER TABLE "operator_user_tokens"
  RENAME COLUMN "token_label" TO "client_token_label";

ALTER INDEX IF EXISTS "operator_user_tokens_user_fingerprint_unique"
  RENAME TO "operator_user_tokens_user_client_token_fingerprint_unique";
