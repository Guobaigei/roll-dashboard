import { requireCurrentUser } from "@/lib/auth/current-user";
import { handleRouteError, jsonOk } from "@/lib/http/responses";
import { listAccessibleTenantBrandSyncRuns } from "@/lib/operator/access";

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
    const result = await listAccessibleTenantBrandSyncRuns(user, tenantId);

    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
