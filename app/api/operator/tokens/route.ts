import type { NextRequest } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import {
  createOperatorUserClientToken,
  listOperatorUserClientTokens,
  toSafeClientToken,
} from "@/lib/db/operator-user-client-tokens";
import { handleRouteError, jsonOk } from "@/lib/http/responses";
import { AddClientTokenSchema } from "@/lib/operator/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const clientTokens = await listOperatorUserClientTokens(user.id);

    return jsonOk({ clientTokens: clientTokens.map(toSafeClientToken) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const body = AddClientTokenSchema.parse(await request.json());
    const clientToken = await createOperatorUserClientToken({
      userId: user.id,
      clientToken: body.clientToken,
      clientTokenLabel: body.clientTokenLabel,
    });

    return jsonOk({ clientToken: toSafeClientToken(clientToken) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
