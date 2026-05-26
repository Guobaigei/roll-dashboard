import { painPoints } from "@/data/page-content";

export function PainSection() {
  return (
    <section className="pain-section below-fold" aria-labelledby="pain-title">
      <span className="section-anchor" id="why" aria-hidden="true" />
      <div className="section-heading">
        <p className="eyebrow">为什么需要 Roll</p>
        <h2 id="pain-title">不是再多一个招聘后台，而是把重复工作交给 AI。</h2>
        <p>Roll 把常用聊天软件、招聘网站和业务资料连起来，把人的经历从琐碎中解放出来。</p>
      </div>
      <div className="pain-grid">
        {painPoints.map((item) => (
          <article key={item.label}>
            <span>{item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
