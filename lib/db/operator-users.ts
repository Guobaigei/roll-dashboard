import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { OperatorUserRow } from "@/lib/db/types";
import { AppError } from "@/lib/http/errors";
import { isUuid } from "@/lib/validation/uuid";

type CreateOperatorUserInput = {
  phone: string;
  passwordHash: string;
  bossPlatform: string;
  bossUsername: string;
};

type UpdateOperatorUserInput = {
  phone: string;
  passwordHash?: string;
  bossPlatform: string;
  bossUsername: string;
};

type PrismaOperatorUser = {
  id: string;
  phone: string;
  passwordHash: string;
  bossPlatform: string;
  bossUsername: string;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeUser(row: PrismaOperatorUser): OperatorUserRow {
  return {
    id: row.id,
    phone: row.phone,
    password_hash: row.passwordHash,
    boss_platform: row.bossPlatform,
    boss_username: row.bossUsername,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function findOperatorUserByPhone(phone: string) {
  try {
    const user = await prisma.operatorUser.findUnique({
      where: { phone },
    });

    return user ? normalizeUser(user) : null;
  } catch {
    throw new AppError(500, "DATABASE_ERROR", "查询用户失败");
  }
}

export async function findOperatorUserById(id: string) {
  if (!isUuid(id)) {
    return null;
  }

  try {
    const user = await prisma.operatorUser.findUnique({
      where: { id },
    });

    return user ? normalizeUser(user) : null;
  } catch (error) {
    console.error("[operator-user] failed to query user by id", {
      code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
      name: error instanceof Error ? error.name : typeof error,
    });
    throw new AppError(500, "DATABASE_ERROR", "查询用户失败");
  }
}

export async function createOperatorUser(input: CreateOperatorUserInput) {
  try {
    const user = await prisma.operatorUser.create({
      data: {
        phone: input.phone,
        passwordHash: input.passwordHash,
        bossPlatform: input.bossPlatform,
        bossUsername: input.bossUsername,
      },
    });

    return normalizeUser(user);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, "CONFLICT", "手机号或 Boss 用户名已注册");
    }

    throw new AppError(500, "DATABASE_ERROR", "创建用户失败");
  }
}

export async function updateOperatorUser(id: string, input: UpdateOperatorUserInput) {
  try {
    const user = await prisma.operatorUser.update({
      where: { id },
      data: {
        phone: input.phone,
        bossPlatform: input.bossPlatform,
        bossUsername: input.bossUsername,
        ...(input.passwordHash ? { passwordHash: input.passwordHash } : {}),
      },
    });

    return normalizeUser(user);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, "CONFLICT", "手机号或 Boss 用户名已被使用");
    }

    throw new AppError(500, "DATABASE_ERROR", "更新用户失败");
  }
}

export function toSafeUser(user: OperatorUserRow) {
  return {
    id: user.id,
    phone: user.phone,
    bossPlatform: user.boss_platform,
    bossUsername: user.boss_username,
    createdAt: user.created_at,
  };
}

export type SafeOperatorUser = ReturnType<typeof toSafeUser>;
