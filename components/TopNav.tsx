export function TopNav() {
  return (
    <nav className="topbar" aria-label="主导航">
      <a className="brand" href="#top" aria-label="Roll 首页">
        <span className="brand-mark">R</span>
        <span className="brand-text">Roll Agent</span>
      </a>
      <div className="nav-links">
        <a href="#top" className="nav-item">
          01. CLI_ONBOARDING
        </a>
        <a href="#architecture" className="nav-item">
          02. ARCHITECTURE
        </a>
        <a href="#marketplace" className="nav-item">
          03. MARKETPLACE
        </a>
      </div>
    </nav>
  );
}
