import type { NextRequest } from "next/server";

import { requireCurrentUser } from "@/lib/auth/current-user";
import { handleRouteError, jsonOk } from "@/lib/http/responses";
import { getAccessibleTenantDetail, patchAccessibleTenant } from "@/lib/operator/access";
import { UpdateTenantConfigSchema } from "@/lib/operator/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    tenantId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { tenantId } = await context.params;
    const result = await getAccessibleTenantDetail(user, tenantId);

    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { tenantId } = await context.params;
    const body = UpdateTenantConfigSchema.parse(await request.json());
    const result = await patchAccessibleTenant(user, tenantId, body);

    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
