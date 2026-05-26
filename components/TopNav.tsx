export function TopNav() {
  return (
    <nav className="topbar" aria-label="主导航">
      <a className="brand" href="#top" aria-label="Roll 首页">
        <span className="brand-mark">R</span>
        <span>Roll</span>
      </a>
      <div className="nav-links">
        <a href="#why">Roll 是什么</a>
        <a href="#team">AI 助手</a>
        <a href="#case">落地场景</a>
      </div>
    </nav>
  );
}
