import { InteractiveCLI } from "./InteractiveCLI";

export function HeroSection() {
  return (
    <section className="hero-section" id="top" aria-labelledby="hero-title">
      <div className="hero-grid-layout">
        {/* Left Copy Panel */}
        <div className="hero-copy-panel">
          <p className="eyebrow">INTRODUCING ROLL COMMANDER</p>
          <h1 id="hero-title" className="hero-main-title">
            <span>面向灵工招聘的</span>
            <span className="gradient-highlight">高并发 AI 编排内核</span>
          </h1>
          <p className="hero-slogan">
            超级大脑统筹，专业子 Agent 执行，打造坚不可摧的招聘自动化防线。
          </p>

          <div className="hero-commercial-values">
            <div className="value-item">
              <span className="value-bullet">❯</span>
              <p>
                <strong>无侵入私域接驳</strong>
                ：不强行改写系统。由外部 IM 工具（如飞书等）联动触发，一句话流式调度本地 Chrome
                隔离用户配置执行，数据完全不出本地。
              </p>
            </div>
            <div className="value-item">
              <span className="value-bullet">❯</span>
              <p>
                <strong>硬核物理防封</strong>
                ：行为仿真级抗风控接管与滑块告警中断机制，高并发多账号隔离运行，业务稳定率提升
                300%。
              </p>
            </div>
            <div className="value-item">
              <span className="value-bullet">❯</span>
              <p>
                <strong>Reply Authority 话术过签</strong>
                ：自动关联云端企业知识，杜绝低级回复事故，新人招人效率等同 3 年老猎头。
              </p>
            </div>
          </div>

          <div className="hero-actions-row">
            <a className="primary-action-btn" href="#marketplace">
              进入 AGENT 市场
            </a>
            <a className="secondary-action-btn" href="#architecture">
              了解架构体系
            </a>
          </div>

          <div className="skill-download-box">
            <div className="skill-header">
              <span className="skill-download-tag">ORCHESTRATOR_INTEGRATION | 集成中台</span>
              <span className="skill-version-tag">STABLE_V0.9.0</span>
            </div>
            <p className="skill-download-text">
              <strong>双向编排协同</strong>：将 Roll
              内核作为技能热插拔注入到飞书、微信机器人、Cursor 或是 Claude Code 中。
            </p>
            <div className="skill-action-row">
              <a
                href="/openclaw-roll-core-skill-latest.zip"
                download
                className="skill-action-btn-link"
              >
                <span className="btn-icon">↓</span>
                <span className="btn-text">PULL LATEST SKILL (.ZIP)</span>
              </a>
              <div className="skill-meta-specs">
                <span>SIZE: ~21 KB</span>
                <span>SHA-256: VERIFIED</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Interactive Onboarding Terminal */}
        <div className="hero-terminal-panel">
          <div className="terminal-onboarding-caption">
            <span className="onboarding-indicator" />
            <span>PROGRESSIVE_CLI_ONBOARDING | 快速部署引导</span>
          </div>
          <InteractiveCLI />
        </div>
      </div>
    </section>
  );
}
