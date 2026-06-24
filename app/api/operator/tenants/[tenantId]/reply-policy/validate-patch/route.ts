import type { NextRequest } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { handleRouteError, jsonOk } from "@/lib/http/responses";
import { validateAccessibleTenantReplyPolicyPatch } from "@/lib/operator/access";
import { ValidateReplyPolicyPatchSchema } from "@/lib/operator/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    tenantId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { tenantId } = await context.params;
    const body = ValidateReplyPolicyPatchSchema.parse(await request.json());
    const result = await validateAccessibleTenantReplyPolicyPatch(user, tenantId, body);

    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
