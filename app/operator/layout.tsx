import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { OperatorShell } from "@/components/operator/OperatorShell";
import { getCurrentUser } from "@/lib/auth/current-user";
import { toSafeUser } from "@/lib/db/operator-users";

export const dynamic = "force-dynamic";

export default async function OperatorLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <OperatorShell user={toSafeUser(user)}>{children}</OperatorShell>;
}
