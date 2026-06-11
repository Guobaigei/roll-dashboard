import { KeyRound } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/operator/LogoutButton";
import { OperatorSideNav } from "@/components/operator/OperatorSideNav";
import { InteractiveGridBackground } from "@/components/ui/InteractiveGridBackground";
import type { SafeOperatorUser } from "@/lib/db/operator-users";

export function OperatorShell({ children, user }: { children: ReactNode; user: SafeOperatorUser }) {
  return (
    <main className="operator-main">
      <InteractiveGridBackground />
      <nav className="operator-topbar" aria-label="后台导航">
        <Link className="auth-brand" href="/">
          <span className="brand-mark">R</span>
          <span>Roll Operator</span>
        </Link>
        <div className="operator-topbar-actions">
          <span>{user.bossUsername}</span>
          <LogoutButton />
        </div>
      </nav>

      <div className="operator-app-shell">
        <aside className="operator-sidebar">
          <div className="operator-user-card">
            <KeyRound size={18} />
            <span>
              <strong>{user.phone}</strong>
              <small>
                {user.bossPlatform}:{user.bossUsername}
              </small>
            </span>
          </div>
          <OperatorSideNav />
        </aside>
        <div className="operator-content">{children}</div>
      </div>
    </main>
  );
}
