import { z } from "zod";

import { PhoneSchema } from "@/lib/auth/schemas";

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const trimmedList = z.array(z.string().trim().min(1)).optional();

const RecruiterBindingSchema = z
  .object({
    platform: z.literal("zhipin").default("zhipin"),
    username: z.string().trim().min(1, "请输入 Boss 的用户名"),
    accountId: optionalTrimmed,
  })
  .strict();

export const AddClientTokenSchema = z
  .object({
    clientToken: z.string().trim().min(1, "请输入客户端令牌"),
    clientTokenLabel: optionalTrimmed,
  })
  .strict();

export const UpdateOperatorAccountSchema = z
  .object({
    phone: PhoneSchema,
    bossPlatform: z.literal("zhipin").default("zhipin"),
    bossUsername: z.string().trim().min(1, "请输入 Boss 的用户名"),
    password: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(8, "密码至少需要 8 位").optional(),
    ),
  })
  .strict();

export const UpdateTenantConfigSchema = z
  .object({
    baseManifestRevision: optionalTrimmed,
    displayName: optionalTrimmed,
    bindings: z
      .object({
        zhipinRecruiters: z.array(RecruiterBindingSchema).default([]),
      })
      .strict()
      .optional(),
    syncParams: z
      .object({
        brandAliasList: trimmedList,
        cityNames: trimmedList,
        preferredDefaultBrandName: optionalTrimmed,
      })
      .strict()
      .optional(),
  })
  .strict();
