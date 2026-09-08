import { InteractiveCLI } from "./InteractiveCLI";
import { LiquidMetalLink } from "./ui/LiquidMetalLink";
import { NebulaBackground } from "./ui/NebulaBackground";

export function HeroSection() {
  return (
    <section className="hero-section" id="top" aria-labelledby="hero-title">
      <NebulaBackground />
      <div className="hero-grid-layout">
        {/* Left Copy Panel */}
        <div className="hero-copy-panel">
          <p className="eyebrow">ENTERPRISE AGENT INTELLIGENCE</p>
          <h1 id="hero-title" className="hero-main-title">
            <span>把企业业务能力</span>
            <span className="gradient-highlight">连接成可执行的 Agent 智能系统</span>
          </h1>
          <p className="hero-slogan">
            Roll 让业务人员、通用 AI Agent
            与现有系统共享同一套专业能力：理解目标、协调执行、确认关键操作，并持续推进到结果。
          </p>

          <div className="hero-commercial-values">
            <div className="value-item">
              <span className="value-bullet">❯</span>
              <p>
                <strong>持续推进，不止回答</strong>
                ：围绕最终目标组织多个专业 Agent，处理过程变化，并在失败时继续寻找可行路径。
              </p>
            </div>
            <div className="value-item">
              <span className="value-bullet">❯</span>
              <p>
                <strong>连接现有业务，无需推倒重来</strong>
                ：把企业已有的系统、数据与流程逐步接入 Roll，一次建设，可被人员、Agent
                和自动化流程共同复用。
              </p>
            </div>
            <div className="value-item">
              <span className="value-bullet">❯</span>
              <p>
                <strong>关键操作始终可控</strong>
                ：执行前可确认、运行中可中断、任务可恢复，让企业自动化既能持续推进，也保留必要的人为控制。
              </p>
            </div>
          </div>

          <div className="hero-actions-row">
            <LiquidMetalLink href="#quickstart">安装 Roll</LiquidMetalLink>
            <a className="tideform-outline-link" href="#use-cases">
              <span>查看企业应用场景</span>
              <svg viewBox="0 0 21 9" aria-hidden="true">
                <path d="M0 4.5h18M14.5 1.2 18.3 4.5l-3.8 3.3" />
              </svg>
            </a>
          </div>
          <p className="hero-install-note">支持 macOS、Linux 和 Windows</p>
        </div>

        {/* Right Interactive Onboarding Terminal */}
        <div className="hero-terminal-panel" id="quickstart">
          <div className="terminal-onboarding-caption">
            <span className="onboarding-indicator" />
            <span>GET STARTED WITH ROLL | 安装与开始使用</span>
          </div>
          <InteractiveCLI />
        </div>
      </div>
    </section>
  );
}
