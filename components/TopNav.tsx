import type { SafeOperatorUser } from "@/lib/db/operator-users";

type TopNavProps = {
  user?: SafeOperatorUser | null;
};

export function TopNav({ user }: TopNavProps) {
  return (
    <nav className="topbar" aria-label="主导航">
      <a className="brand" href="#top" aria-label="Roll 首页">
        <span className="brand-mark">R</span>
        <span className="brand-text">Roll Agent</span>
      </a>
      <div className="nav-right">
        <div className="nav-links">
          <a href="#product" className="nav-item">
            01. PRODUCT
          </a>
          <a href="#architecture" className="nav-item">
            02. ARCHITECTURE
          </a>
          <a href="#use-cases" className="nav-item">
            03. USE_CASES
          </a>
          <a href="#marketplace" className="nav-item">
            04. AGENTS
          </a>
        </div>
        {user ? (
          <div className="nav-session">
            <span className="nav-session-user" title={user.bossUsername}>
              {user.bossUsername}
            </span>
            <a className="nav-login-link nav-operator-link" href="/operator">
              进入后台
            </a>
          </div>
        ) : (
          <a className="nav-login-link" href="/login">
            登录
          </a>
        )}
      </div>
    </nav>
  );
}
