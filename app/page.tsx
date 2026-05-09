import { AgentStore } from "@/components/AgentStore";
import { agents } from "@/data/agents";

const painPoints = [
  {
    label: "不用换入口",
    title: "不管你是用微信、飞书... 智能招聘都能跟着走。",
    body: "Roll 把招聘助手接到使用者原本顺手的聊天软件里，不需要为了用 AI 招聘再切到另一套系统。",
  },
  {
    label: "消息堆积",
    title: "候选人问得快，人工回复跟不上。",
    body: "排班、薪资、门店位置、岗位要求反复被问，回复慢了就容易错过合适的人。",
  },
  {
    label: "重复操作",
    title: "筛选、打招呼、回复问题，都是高频但容易被延误的动作。",
    body: "看消息、点开资料、判断是否合适、写回复、同步团队，每一步都不难，但加起来很耗人。",
  },
  {
    label: "经验难复制",
    title: "优秀招聘顾问的判断，很难稳定复制给每个人。",
    body: "新人不知道怎么回，老手没有时间逐条看，团队很难把好的沟通经验变成统一动作。",
  },
];

const workflowSteps = [
  {
    step: "01",
    title: "你在聊天里交代一句",
    body: "在飞书、微信、钉钉里说清楚要做什么，不需要打开新的复杂后台。",
  },
  {
    step: "02",
    title: "Roll 听懂招聘目标",
    body: "它判断你是要看消息、筛候选人、写回复，还是把进展同步给团队。",
  },
  {
    step: "03",
    title: "AI 助手分头干活",
    body: "有的去招聘网站看消息，有的结合岗位写回复，有的补齐资料，有的同步团队。",
  },
  {
    step: "04",
    title: "报名结果回到你面前",
    body: "你看到的是已帮你报名了多少人、报名人的姓名和关键信息，而不是一堆过程记录。",
  },
];

const caseSteps = [
  "你在常用聊天软件里说：帮我处理今天的候选人消息。",
  "Roll 去招聘网站查看新消息，找出更值得优先跟进的人。",
  "它结合岗位信息和候选人问题，生成自然、统一、可直接使用的回复。",
  "进一步跟进候选人，直到报名面试，将结果汇报给你。",
];

const trustItems = [
  "可接入飞书、微信、钉钉等聊天软件",
  "可连接 BOSS、鱼泡等招聘网站",
  "可按需要增加 AI 助手",
];

export default function Home() {
  return (
    <main>
      <nav className="topbar" aria-label="主导航">
        <a className="brand" href="#top" aria-label="Roll 首页">
          <span className="brand-mark">R</span>
          <span>Roll</span>
        </a>
        <div className="nav-links">
          <a href="#how">工作方式</a>
          <a href="#team">AI 助手</a>
          <a href="#case">落地场景</a>
        </div>
      </nav>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <div className="hero-interface" aria-hidden="true">
          <div className="command-shell">
            <div className="shell-top">
              <span>Roll 招聘助手</span>
              <strong>执行中</strong>
            </div>
            <div className="live-route">
              <span>正在处理</span>
              <p>聊天指令 / 招聘消息 / 候选人筛选 / 团队同步</p>
            </div>
            <div className="chat-card user-card">
              <span>你</span>
              <p>
                帮我使用 roll 回复下今天 BOSS / 鱼泡 的候选人消息，并把进展同步到我。
                <i />
              </p>
            </div>
            <div className="roll-brain">
              <div>
                <span>Roll 正在安排工作</span>
                <strong>已拆成 4 件事，逐项推进</strong>
              </div>
              <div className="brain-stream">
                <span>打开浏览器</span>
                <span>看未读消息</span>
                <span>生成智能回复</span>
                <span>汇报进展</span>
              </div>
              <div className="pulse-ring" />
            </div>
            <div className="dispatch-grid">
              <div className="task-card active">
                <span>01</span>
                <strong>操控浏览器</strong>
                <p>打开 BOSS / 鱼泡 招聘网站</p>
                <div className="task-progress">
                  <i />
                </div>
              </div>
              <div className="task-card">
                <span>02</span>
                <strong>看未读消息</strong>
                <p>打开候选人列表查看未读消息</p>
                <div className="task-progress">
                  <i />
                </div>
              </div>
              <div className="task-card">
                <span>03</span>
                <strong>生成智能回复</strong>
                <p>根据未读消息依据岗位信息生成智能回复</p>
                <div className="task-progress">
                  <i />
                </div>
              </div>
              <div className="task-card done">
                <span>04</span>
                <strong>汇报进展</strong>
                <p>向我汇报招聘进度</p>
                <div className="task-progress">
                  <i />
                </div>
              </div>
            </div>
            <div className="result-card">
              <span>结果回传</span>
              <p>已沟通 12 位候选人，5 位候选人已报名面试。</p>
              <div className="result-stream">
                <span>候选人 A 已报名面试</span>
                <span>候选人 B 已沟通</span>
                <span>候选人 C 有新意向岗位</span>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-copy">
          <p className="eyebrow">AI 招聘助手</p>
          <h1 id="hero-title">
            <span>体验 AI 带来的</span>
            <span>智能招聘</span>
            <span>更快一步。</span>
          </h1>
          <p className="hero-slogan">超级大脑统筹，专业助手执行，给你一个灵工招聘的行家。</p>
          <p className="hero-body">
            在飞书、微信、钉钉里说一句，Roll 就能帮你看消息、筛候选人、写回复、同步团队。
            不用换系统，也不用反复打开招聘网站。
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#how">
              看看怎么工作
            </a>
            <a className="secondary-action" href="#team">
              它能帮我做什么
            </a>
          </div>
        </div>
      </section>

      <section className="pain-section" aria-labelledby="pain-title">
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

      <section className="workflow-section" id="how" aria-labelledby="workflow-title">
        <div className="section-heading centered">
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

      <AgentStore agents={agents} />

      <section className="case-section" id="case" aria-labelledby="case-title">
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

      <section className="trust-section" aria-label="可信底座">
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

      <footer className="footer">
        <span>Roll</span>
        <p>常用聊天里的 AI 招聘助手</p>
      </footer>
    </main>
  );
}
