import { requireCurrentUser } from "@/lib/auth/current-user";
import { toSafeUser } from "@/lib/db/operator-users";
import { handleRouteError, jsonOk } from "@/lib/http/responses";

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
