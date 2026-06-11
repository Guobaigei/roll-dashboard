import { clearSessionCookie } from "@/lib/auth/session";
import { handleRouteError, jsonOk } from "@/lib/http/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await clearSessionCookie();
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
