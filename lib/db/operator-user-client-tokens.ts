import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { OperatorUserClientTokenRow } from "@/lib/db/types";
import { AppError, ForbiddenError } from "@/lib/http/errors";
import {
  decryptClientToken,
  encryptClientToken,
  fingerprintClientToken,
  formatClientTokenFingerprint,
} from "@/lib/security/client-token-vault";
import { isUuid } from "@/lib/validation/uuid";

type PrismaOperatorUserClientToken = {
  id: string;
  userId: string;
  clientTokenCiphertext: string;
  clientTokenFingerprint: string;
  clientTokenLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateUserClientTokenInput = {
  userId: string;
  clientToken: string;
  clientTokenLabel?: string;
};

function normalizeClientToken(row: PrismaOperatorUserClientToken): OperatorUserClientTokenRow {
  return {
    id: row.id,
    user_id: row.userId,
    client_token_ciphertext: row.clientTokenCiphertext,
    client_token_fingerprint: row.clientTokenFingerprint,
    client_token_label: row.clientTokenLabel,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createOperatorUserClientToken(input: CreateUserClientTokenInput) {
  const clientTokenCiphertext = encryptClientToken(input.clientToken);
  const clientTokenFingerprint = fingerprintClientToken(input.clientToken);

  try {
    const clientToken = await prisma.operatorUserClientToken.create({
      data: {
        userId: input.userId,
        clientTokenCiphertext,
        clientTokenFingerprint,
        clientTokenLabel: input.clientTokenLabel ?? null,
      },
    });

    return normalizeClientToken(clientToken);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, "CONFLICT", "该客户端令牌已添加");
    }

    console.error("[operator-token] failed to create client token", {
      code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
      name: error instanceof Error ? error.name : typeof error,
    });
    throw new AppError(500, "DATABASE_ERROR", "保存客户端令牌失败");
  }
}

export async function listOperatorUserClientTokens(userId: string) {
  try {
    const clientTokens = await prisma.operatorUserClientToken.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return clientTokens.map(normalizeClientToken);
  } catch {
    throw new AppError(500, "DATABASE_ERROR", "查询客户端令牌失败");
  }
}

export async function deleteOperatorUserClientToken(userId: string, clientTokenId: string) {
  if (!isUuid(clientTokenId)) {
    throw new ForbiddenError("无权删除该客户端令牌");
  }

  try {
    const result = await prisma.operatorUserClientToken.deleteMany({
      where: {
        id: clientTokenId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new ForbiddenError("无权删除该客户端令牌");
    }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error;
    }

    throw new AppError(500, "DATABASE_ERROR", "删除客户端令牌失败");
  }
}

export async function decryptOperatorUserClientTokens(userId: string) {
  const clientTokens = await listOperatorUserClientTokens(userId);
  return clientTokens.map((clientToken) => ({
    ...clientToken,
    clientToken: decryptClientToken(clientToken.client_token_ciphertext),
  }));
}

export function toSafeClientToken(clientToken: OperatorUserClientTokenRow) {
  return {
    id: clientToken.id,
    clientTokenLabel: clientToken.client_token_label,
    fingerprint: formatClientTokenFingerprint(clientToken.client_token_fingerprint),
    createdAt: clientToken.created_at,
  };
}
