import { z } from "zod";

export const PhoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+\-\s()]{5,32}$/, "请输入有效手机号")
  .transform((value) => value.replace(/\s+/g, ""));

export const RegisterSchema = z
  .object({
    phone: PhoneSchema,
    password: z.string().min(8, "密码至少需要 8 位"),
    bossUsername: z.string().trim().min(1, "请输入 Boss 的用户名"),
  })
  .strict();

export const LoginSchema = z
  .object({
    phone: PhoneSchema,
    password: z.string().min(1, "请输入密码"),
  })
  .strict();
