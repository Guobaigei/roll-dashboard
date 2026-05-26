import { caseSteps } from "@/data/page-content";

export function CaseSection() {
  return (
    <section className="case-section below-fold" aria-labelledby="case-title">
      <span className="section-anchor" id="case" aria-hidden="true" />
      <div className="section-heading">
        <p className="eyebrow">落地场景</p>
        <h2 id="case-title">先从灵工招聘开始，把候选人跟进交给 Roll。</h2>
        <p>
          招聘人员继续在熟悉的聊天软件里发消息。Roll 会去招聘网站看候选人消息、
          生成回复建议、协助打招呼，并把进展同步回团队。
        </p>
      </div>
      <div className="case-layout">
        <div className="case-phone" aria-hidden="true">
          <div className="phone-header">
            <span>AI 招聘助手</span>
            <strong>12 条消息</strong>
          </div>
          <div className="message-list">
            <p>候选人 A：今天可以面试吗？</p>
            <p>候选人 B：门店离我多远？</p>
            <p>候选人 C：兼职薪资怎么算？</p>
          </div>
          <div className="phone-input">让 Roll 帮我处理下今天的候选人消息</div>
        </div>
        <ol className="case-steps">
          {caseSteps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
