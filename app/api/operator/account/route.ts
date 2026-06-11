import type { NextRequest } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { hashPassword } from "@/lib/auth/password";
import { toSafeUser, updateOperatorUser } from "@/lib/db/operator-users";
import { handleRouteError, jsonOk } from "@/lib/http/responses";
import { UpdateOperatorAccountSchema } from "@/lib/operator/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return jsonOk({ user: toSafeUser(user) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireCurrentUser();
    const body = UpdateOperatorAccountSchema.parse(await request.json());
    const passwordHash = body.password ? await hashPassword(body.password) : undefined;
    const user = await updateOperatorUser(currentUser.id, {
      phone: body.phone,
      passwordHash,
      bossPlatform: body.bossPlatform,
      bossUsername: body.bossUsername,
    });

    return jsonOk({ user: toSafeUser(user) });
  } catch (error) {
    return handleRouteError(error);
  }
}
