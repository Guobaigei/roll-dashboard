const SUPPORTING_MODES = [
  {
    audience: "FOR GENERAL AGENTS",
    command: 'roll ask "查询本周招聘转化"',
    name: "Roll Ask",
    title: "智能能力入口",
    description:
      "让 Claude Code、Codex 等通用 Agent 用自然语言调用企业已经接入的专业能力，不必重新理解每个业务系统。",
    outcome: "一次接入，让不同 Agent 共享同一套企业能力。",
    accent: "blue",
  },
  {
    audience: "FOR BUSINESS SYSTEMS",
    command: "roll run <agent> <tool>",
    name: "Roll Run",
    title: "标准执行入口",
    description: "把明确、成熟的业务动作嵌入现有系统、脚本和自动化流程，获得稳定一致的执行结果。",
    outcome: "把验证过的 Agent 能力沉淀为可复用的业务动作。",
    accent: "green",
  },
] as const;

export function WaysToWorkSection() {
  return (
    <section className="ways-section" id="product" aria-labelledby="ways-title">
      <div className="ways-heading">
        <div>
          <p className="eyebrow">ONE ROLL, THREE WAYS TO WORK</p>
          <h2 id="ways-title" className="ways-main-title">
            一套企业能力，服务业务人员、AI Agent 与现有系统
          </h2>
        </div>
        <p className="ways-sub-title">
          Roll
          将企业已经拥有的系统、数据与专业能力连接起来，再根据使用者的不同，提供持续协作、自然语言调用和标准化执行三种入口。
        </p>
      </div>

      <div className="ways-layout">
        <article className="ways-primary-card">
          <div className="ways-card-topline">
            <span className="ways-audience">FOR BUSINESS TEAMS</span>
            <span className="ways-status">PRIMARY WORKSPACE</span>
          </div>
          <div className="ways-primary-copy">
            <div>
              <span className="ways-index">01</span>
              <h3>
                <strong>Roll Chat</strong>
                <span>企业目标工作台</span>
              </h3>
            </div>
            <p>
              业务人员只需说明最终目标。Roll 会持续协调专业
              Agent、处理过程变化，并在关键操作前请求确认，直到任务完成或明确说明阻塞原因。
            </p>
          </div>
          <ul className="ways-capability-row" aria-label="Roll Chat 核心能力">
            <li>多步骤持续推进</li>
            <li>关键操作可确认</li>
            <li>任务上下文可恢复</li>
          </ul>
          <div className="ways-command-line">
            <span className="ways-command-prompt">$</span>
            <code>roll chat</code>
            <small>把目标交给 Roll</small>
          </div>
        </article>

        <div className="ways-supporting-grid">
          {SUPPORTING_MODES.map((mode, index) => (
            <article className={`ways-secondary-card accent-${mode.accent}`} key={mode.name}>
              <div className="ways-card-topline">
                <span className="ways-audience">{mode.audience}</span>
                <span className="ways-index">0{index + 2}</span>
              </div>
              <h3>
                <strong>{mode.name}</strong>
                <span>{mode.title}</span>
              </h3>
              <p>{mode.description}</p>
              <div className="ways-secondary-outcome">{mode.outcome}</div>
              <div className="ways-command-line compact">
                <span className="ways-command-prompt">$</span>
                <code>{mode.command}</code>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
