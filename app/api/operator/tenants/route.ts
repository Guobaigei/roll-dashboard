import { requireCurrentUser } from "@/lib/auth/current-user";
import { handleRouteError, jsonOk } from "@/lib/http/responses";
import { getAccessibleTenantsForUser } from "@/lib/operator/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const result = await getAccessibleTenantsForUser(user);

    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
