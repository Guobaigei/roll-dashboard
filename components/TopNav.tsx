import { homepageNavigation } from "@/data/homepage-navigation";
import type { SafeOperatorUser } from "@/lib/db/operator-users";
import { MobileNavigation } from "./MobileNavigation";

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
          {homepageNavigation.map((item) => (
            <a href={item.href} className="nav-item" key={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <MobileNavigation />
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
