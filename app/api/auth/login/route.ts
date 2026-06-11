import type { NextRequest } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import { LoginSchema } from "@/lib/auth/schemas";
import { setSessionCookie } from "@/lib/auth/session";
import { findOperatorUserByPhone, toSafeUser } from "@/lib/db/operator-users";
import { UnauthorizedError } from "@/lib/http/errors";
import { handleRouteError, jsonOk } from "@/lib/http/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = LoginSchema.parse(await request.json());
    const user = await findOperatorUserByPhone(body.phone);

    if (!user) {
      throw new UnauthorizedError("手机号或密码错误");
    }

    const validPassword = await verifyPassword(user.password_hash, body.password);
    if (!validPassword) {
      throw new UnauthorizedError("手机号或密码错误");
    }

    await setSessionCookie(user.id);

    return jsonOk({ user: toSafeUser(user) });
  } catch (error) {
    return handleRouteError(error);
  }
}
