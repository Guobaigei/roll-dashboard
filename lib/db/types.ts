export type OperatorUserRow = {
  id: string;
  phone: string;
  password_hash: string;
  boss_platform: string;
  boss_username: string;
  created_at: string;
  updated_at: string;
};

export type OperatorUserClientTokenRow = {
  id: string;
  user_id: string;
  client_token_ciphertext: string;
  client_token_fingerprint: string;
  client_token_label: string | null;
  created_at: string;
  updated_at: string;
};
