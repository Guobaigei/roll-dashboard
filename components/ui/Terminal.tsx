import type { ReactNode } from "react";

type TerminalProps = {
  title?: string;
  badge?: string;
  children: ReactNode;
  height?: string;
};

export function Terminal({
  title = "roll@command-center:~",
  badge = "STABLE SESSION",
  children,
  height = "180px",
}: TerminalProps) {
  return (
    <div className="ui-terminal">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="terminal-title">{title}</span>
        {badge && <span className="terminal-badge">{badge}</span>}
      </div>
      <div className="terminal-body" style={{ height }}>
        {children}
      </div>
    </div>
  );
}
