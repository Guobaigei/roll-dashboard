import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

import { ConfigError } from "@/lib/http/errors";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;

function getEncryptionKey() {
  let raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw && process.env.NODE_ENV !== "production" && existsSync(".env.local")) {
    loadEnvFile(".env.local");
    raw = process.env.TOKEN_ENCRYPTION_KEY;
  }

  if (!raw) {
    throw new ConfigError("缺少 TOKEN_ENCRYPTION_KEY 配置");
  }

  const key = Buffer.from(raw, "base64");
  if (key.byteLength !== 32) {
    throw new ConfigError("TOKEN_ENCRYPTION_KEY 必须是 32 字节 base64 字符串");
  }

  return key;
}

export function encryptClientToken(clientToken: string) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(clientToken, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

export function decryptClientToken(encryptedClientToken: string) {
  const [ivPart, tagPart, ciphertextPart] = encryptedClientToken.split(".");
  if (!ivPart || !tagPart || !ciphertextPart) {
    throw new ConfigError("保存的客户端令牌密文格式无效");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

export function fingerprintClientToken(clientToken: string) {
  return createHash("sha256").update(clientToken).digest("hex");
}

export function formatClientTokenFingerprint(fingerprint: string) {
  return fingerprint.slice(0, 8);
}
