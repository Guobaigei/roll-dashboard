import { z } from "zod";

import { PhoneSchema } from "@/lib/auth/schemas";

const optionalTrimmed = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const trimmedList = z.array(z.string().trim().min(1)).optional();
const jsonObject = z.custom<Record<string, unknown>>(
  (value) => typeof value === "object" && value !== null && !Array.isArray(value),
  "patch 必须是 JSON 对象",
);
const replyPolicyPatchReason = z.preprocess((value) => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "操作台策略配置更新";
}, z.string().min(1));

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

export const ValidateReplyPolicyPatchSchema = z
  .object({
    basePolicyVersion: z.string().trim().min(1, "缺少策略版本"),
    hypothesis: optionalTrimmed,
    patch: jsonObject,
  })
  .strict();

export const PatchReplyPolicySchema = z
  .object({
    basePolicyVersion: z.string().trim().min(1, "缺少策略版本"),
    reason: replyPolicyPatchReason,
    patch: jsonObject,
  })
  .strict();
