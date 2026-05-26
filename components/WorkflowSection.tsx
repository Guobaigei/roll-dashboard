import { workflowSteps } from "@/data/page-content";

export function WorkflowSection() {
  return (
    <section className="workflow-section below-fold" aria-labelledby="workflow-title">
      <span className="section-anchor" id="how" aria-hidden="true" />
      <div className="section-heading">
        <p className="eyebrow">它怎么帮你</p>
        <h2 id="workflow-title">从一句话到招聘闭环，Roll 负责把中间的活做完。</h2>
      </div>
      <div className="workflow-rail">
        {workflowSteps.map((item) => (
          <article key={item.step}>
            <span>{item.step}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
