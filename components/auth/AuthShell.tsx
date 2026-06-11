import Link from "next/link";
import type { ReactNode } from "react";

import { InteractiveGridBackground } from "@/components/ui/InteractiveGridBackground";

type AuthShellProps = {
  children: ReactNode;
  eyebrow: string;
  title: string;
  copy: string;
  mode: "login" | "register";
};

const modeMeta = {
  login: {
    label: "SESSION_GATE",
    command: "roll auth login --scope operator",
    metrics: ["HTTPONLY_COOKIE", "ARGON2_VERIFY", "OPERATOR_READY"],
  },
  register: {
    label: "OPERATOR_SETUP",
    command: "roll auth register --boss-platform zhipin",
    metrics: ["PHONE_UNIQUE", "BOSS_BINDING", "SESSION_ISSUED"],
  },
};

export function AuthShell({ children, eyebrow, title, copy, mode }: AuthShellProps) {
  const meta = modeMeta[mode];

  return (
    <main className="auth-main">
      <InteractiveGridBackground />
      <section className="auth-shell" aria-labelledby="auth-title">
        <div className="auth-copy-panel">
          <Link className="auth-brand" href="/" aria-label="返回 Roll 首页">
            <span className="brand-mark">R</span>
            <span>Roll Agent</span>
          </Link>

          <div className="auth-copy-content">
            <p className="eyebrow">{eyebrow}</p>
            <h1 id="auth-title">{title}</h1>
            <p>{copy}</p>
          </div>

          <div className="auth-terminal-card" aria-hidden="true">
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <span className="terminal-title">{meta.label}</span>
              <span className="terminal-badge">SECURE</span>
            </div>
            <div className="auth-terminal-body">
              <div>
                <span className="prompt">$</span>
                <code>{meta.command}</code>
              </div>
              {meta.metrics.map((metric) => (
                <div key={metric}>
                  <span className="auth-signal" />
                  <code>{metric}</code>
                  <strong>PASS</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="auth-form-panel">{children}</div>
      </section>
    </main>
  );
}
