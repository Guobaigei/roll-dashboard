import "server-only";

import { getSessionFromCookies } from "@/lib/auth/session";
import { findOperatorUserById } from "@/lib/db/operator-users";
import type { OperatorUserRow } from "@/lib/db/types";
import { UnauthorizedError } from "@/lib/http/errors";

export async function getCurrentUser(): Promise<OperatorUserRow | null> {
  try {
    const session = await getSessionFromCookies();
    if (!session) {
      return null;
    }

    return findOperatorUserById(session.userId);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return null;
    }

    throw error;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }

  return user;
}
