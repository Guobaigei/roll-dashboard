import { InteractiveCLI } from "./InteractiveCLI";

export function HeroSection() {
  return (
    <section className="hero-section" id="top" aria-labelledby="hero-title">
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
            <a className="primary-action-btn" href="#quickstart">
              2 分钟快速部署
            </a>
            <a className="secondary-action-btn" href="#use-cases">
              查看企业应用场景
            </a>
          </div>
        </div>

        {/* Right Interactive Onboarding Terminal */}
        <div className="hero-terminal-panel" id="quickstart">
          <div className="terminal-onboarding-caption">
            <span className="onboarding-indicator" />
            <span>ENTERPRISE_AGENT_ONBOARDING | 企业快速部署</span>
          </div>
          <InteractiveCLI />
        </div>
      </div>
    </section>
  );
}
