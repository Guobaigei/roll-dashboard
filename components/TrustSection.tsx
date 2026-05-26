import { trustItems } from "@/data/page-content";

export function TrustSection() {
  return (
    <section className="trust-section below-fold" aria-label="可信底座">
      <div className="trust-copy">
        <p className="eyebrow">能力支持</p>
        <h2>对使用者很简单，对企业流程足够开放。</h2>
        <p>让团队继续用熟悉的聊天软件，把候选人沟通、筛选和同步交给 Roll 持续推进。</p>
        <a className="trust-action" href="#team">
          查看 AI 助手
        </a>
      </div>
      <div className="trust-tags">
        {trustItems.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </section>
  );
}
