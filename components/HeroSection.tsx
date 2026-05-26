export function HeroSection() {
  return (
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
  );
}
