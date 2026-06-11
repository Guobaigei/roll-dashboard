import { requireCurrentUser } from "@/lib/auth/current-user";
import { deleteOperatorUserClientToken } from "@/lib/db/operator-user-client-tokens";
import { handleRouteError, jsonOk } from "@/lib/http/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    tokenId: string;
  }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { tokenId } = await context.params;

    await deleteOperatorUserClientToken(user.id, tokenId);

    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
