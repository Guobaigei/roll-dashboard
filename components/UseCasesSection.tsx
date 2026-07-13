import type { ReactNode } from "react";

type UseCaseSignalType = "talent" | "insight" | "incident" | "integration";

function UseCaseSignal({ type }: { type: UseCaseSignalType }) {
  let symbol: ReactNode;

  switch (type) {
    case "talent":
      symbol = (
        <>
          <rect x="3" y="7" width="18" height="10" rx="1" />
          <path d="m4 8 8 6 8-6" />
          <path d="M47 5h20l-7 8v6h-6v-6Z" />
          <circle cx="97" cy="8" r="3" />
          <path d="M89 19c1-4 3.7-6 8-6s7 2 8 6" />
        </>
      );
      break;
    case "insight":
      symbol = (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8m-4-4v8" />
          <ellipse cx="58" cy="7" rx="10" ry="3" />
          <path d="M48 7v10c0 1.7 4.5 3 10 3s10-1.3 10-3V7m-20 5c0 1.7 4.5 3 10 3s10-1.3 10-3" />
          <path d="M88 19V9m7 10V5m7 14v-7m5 7H85" />
        </>
      );
      break;
    case "incident":
      symbol = (
        <>
          <path d="m12 3 10 17H2Z" />
          <path d="M12 8v5" />
          <circle cx="12" cy="16" r="0.6" className="use-case-flow-fill" />
          <circle cx="58" cy="12" r="10" />
          <path d="m53 12 3 3 7-7" />
          <rect x="87" y="3" width="20" height="18" rx="1" />
          <path d="m92 12 3 3 7-7" />
        </>
      );
      break;
    case "integration":
      symbol = (
        <>
          <rect x="2" y="4" width="8" height="8" rx="1" />
          <rect x="14" y="12" width="8" height="8" rx="1" />
          <path d="m58 3 10 6v6l-10 6-10-6V9Z" />
          <path d="M87 12h8m0 0 7-7m-7 7 7 7" />
          <circle cx="104" cy="4" r="2" />
          <circle cx="104" cy="20" r="2" />
        </>
      );
      break;
  }

  return (
    <span className="use-case-flow">
      <svg viewBox="0 0 112 24" fill="none" focusable="false" aria-hidden="true">
        <path className="use-case-flow-rail" d="M22 12h24m23 0h17" />
        <g className="use-case-flow-symbol">{symbol}</g>
        <g className="use-case-flow-signal">
          <circle cx="24" cy="12" r="1.7" />
        </g>
      </svg>
    </span>
  );
}

const USE_CASES = [
  {
    id: "01",
    title: "人才运营自动化",
    goal: "把消息处理、候选人筛选、企业回复和团队通知串成一条持续运行的业务流程。",
    action: "Roll 根据任务进度协调浏览器、智能回复与团队通知能力，在需要人工判断或确认时暂停等待。",
    outcome: "减少重复操作，让跨平台招聘动作保持一致并可持续推进。",
    accent: "orange",
    signal: "talent",
  },
  {
    id: "02",
    title: "企业数据即时洞察",
    goal: "让业务人员直接询问品牌、项目和经营数据，不再反复排队等待临时取数。",
    action: "Roll 将业务问题交给数据 Agent，在权限范围内完成查询校验、执行和结果解释。",
    outcome: "缩短从问题到答案的路径，同时保留查询边界与执行记录。",
    accent: "teal",
    signal: "insight",
  },
  {
    id: "03",
    title: "运营异常协同处置",
    goal: "让系统告警、经营异常和客户升级事项从发现、判断到处置持续推进，不停留在一条通知或一张工单。",
    action:
      "Roll 汇总业务上下文，协调数据查询、工单、通知与执行能力；遇到高风险操作时请求人工确认，随后继续推进流程。",
    outcome: "缩短异常响应与跨团队交接路径，让每一次处置都有记录、有责任、有结果。",
    accent: "purple",
    signal: "incident",
  },
  {
    id: "04",
    title: "企业专属流程接入",
    goal: "把内部系统和成熟 SOP 转换为业务人员、AI Agent 与自动化流程都能使用的能力。",
    action: "企业可以将现有能力封装为专业 Agent，再通过 Roll 统一连接、组合和调用。",
    outcome: "一次建设、多处复用，在不推倒现有系统的前提下持续扩展智能化覆盖面。",
    accent: "blue",
    signal: "integration",
  },
] as const;

export function UseCasesSection() {
  return (
    <section className="use-cases-section" id="use-cases" aria-labelledby="use-cases-title">
      <div className="use-cases-heading">
        <div>
          <p className="eyebrow">ENTERPRISE USE CASES</p>
          <h2 id="use-cases-title" className="use-cases-main-title">
            从单点能力，到真正跑通的企业流程
          </h2>
        </div>
        <p>
          Roll 不限定企业使用哪一种
          Agent，而是围绕业务目标组织现有能力。从人才运营、经营分析到异常处置，企业既可以组合现成能力，也可以接入自己的系统与流程。
        </p>
      </div>

      <div className="use-cases-grid">
        {USE_CASES.map((useCase) => (
          <article className={`use-case-card accent-${useCase.accent}`} key={useCase.id}>
            <div className="use-case-card-head">
              <span className="use-case-index">CASE_{useCase.id}</span>
              <UseCaseSignal type={useCase.signal} />
            </div>
            <h3>{useCase.title}</h3>
            <dl>
              <div>
                <dt>BUSINESS GOAL</dt>
                <dd>{useCase.goal}</dd>
              </div>
              <div>
                <dt>ROLL IN ACTION</dt>
                <dd>{useCase.action}</dd>
              </div>
              <div className="use-case-outcome">
                <dt>BUSINESS OUTCOME</dt>
                <dd>{useCase.outcome}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
