import versions from "../public/roll-versions.json";

type SkillArchiveMetadata = {
  sha256?: string | null;
  sha256Short?: string | null;
  sizeLabel?: string | null;
};

type RollVersionManifest = typeof versions & {
  skillArchive?: SkillArchiveMetadata;
};

export function AgentIntegrationSection() {
  const manifest = versions as RollVersionManifest;
  const archive = manifest.skillArchive;
  const sizeLabel = archive?.sizeLabel ?? "UNAVAILABLE";
  const sha256Label = archive?.sha256Short ?? "UNAVAILABLE";

  return (
    <section className="integration-section" id="integration" aria-labelledby="integration-title">
      <div className="integration-layout">
        <div className="integration-copy">
          <p className="eyebrow">BRING ROLL INTO YOUR AGENT</p>
          <h2 id="integration-title">让现有 AI Agent 直接获得企业执行能力</h2>
          <p className="integration-lead">
            已经在使用 Claude Code、Codex 或其他支持 SKILL.md 与命令执行的通用 Agent？将 Roll 作为
            SKILL 接入，即可复用已经连接的专业 Agent、业务系统与标准执行流程。
          </p>

          <div className="integration-value-list">
            <div>
              <span>01</span>
              <p>
                <strong>复用企业能力</strong>
                无需为每个通用 Agent 重复对接内部系统。
              </p>
            </div>
            <div>
              <span>02</span>
              <p>
                <strong>按场景选择入口</strong>
                自然语言任务交给 <code>roll ask</code>，明确动作交给 <code>roll run</code>。
              </p>
            </div>
            <div>
              <span>03</span>
              <p>
                <strong>持续扩展</strong>
                Roll 新增的专业 Agent 能力可以继续被现有 AI 工作台复用。
              </p>
            </div>
          </div>
        </div>

        <aside className="integration-download-panel" aria-label="Roll Core Skill 下载">
          <div className="integration-panel-head">
            <span>ROLL_CORE_SKILL</span>
            <span className="skill-version-tag">STABLE_V{manifest.core}</span>
          </div>

          <div className="integration-command-stack">
            <div>
              <span>NATURAL LANGUAGE</span>
              <code>roll ask &quot;帮我完成这项业务任务&quot; --json</code>
            </div>
            <div>
              <span>STANDARD ACTION</span>
              <code>roll run &lt;agent&gt; &lt;tool&gt; --json</code>
            </div>
          </div>

          <div className="integration-download-action">
            <div>
              <strong>OpenClaw / Agent Skill Archive</strong>
              <span>将 Roll 能力说明与调用入口安装到现有 Agent</span>
            </div>
            <a
              href="/openclaw-roll-core-skill-latest.zip"
              download
              className="skill-action-btn-link"
            >
              <span className="btn-icon">↓</span>
              <span className="btn-text">PULL ROLL SKILL (.ZIP)</span>
            </a>
          </div>

          <div className="integration-file-meta">
            <span>SIZE: {sizeLabel}</span>
            <span title={archive?.sha256 ? `SHA-256: ${archive.sha256}` : undefined}>
              SHA-256: {sha256Label}
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}
