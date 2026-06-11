import type { NextRequest } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { RegisterSchema } from "@/lib/auth/schemas";
import { setSessionCookie } from "@/lib/auth/session";
import { createOperatorUser, findOperatorUserByPhone, toSafeUser } from "@/lib/db/operator-users";
import { AppError } from "@/lib/http/errors";
import { handleRouteError, jsonOk } from "@/lib/http/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = RegisterSchema.parse(await request.json());
    const existingUser = await findOperatorUserByPhone(body.phone);
    if (existingUser) {
      throw new AppError(409, "CONFLICT", "该手机号已注册");
    }

    const passwordHash = await hashPassword(body.password);
    const user = await createOperatorUser({
      phone: body.phone,
      passwordHash,
      bossPlatform: "zhipin",
      bossUsername: body.bossUsername,
    });

    await setSessionCookie(user.id);

    return jsonOk({ user: toSafeUser(user) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
