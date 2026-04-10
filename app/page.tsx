import { AgentStore } from "@/components/AgentStore";
import { agents } from "@/data/agents";

const heroImage = "/hero.jpg";

const quickStart = [
  "git clone https://github.com/steveoon/roll-agent.git",
  "cd roll-agent && pnpm install",
  "pnpm dev -- config init",
  'pnpm dev -- ask "帮我查看boss直聘上有多少未读消息"',
];

const layers = [
  {
    label: "描述层",
    title: "Agent Skills",
    body: "SKILL.md 告诉指挥官“我是谁、我能做什么”。",
  },
  {
    label: "运行时层",
    title: "MCP",
    body: "实际调用子 Agent 的通信协议，兼容 stdio 本地子进程和 HTTP 远程服务。",
  },
  {
    label: "LLM 解耦",
    title: "Sampling",
    body: "子 Agent 通过 MCP Sampling 回调指挥官的 LLM Engine，不需要自己管理模型密钥。",
  },
];

const recentUpdates = [
  "roll ask 两阶段调用：先路由到 agent + tool，再按目标 tool 的 inputSchema 提取参数。",
  "tool-runtime 统一参数提取、preflight 校验、错误分类和用户提示。",
  "roll run 支持 --input-json / --input-file，适合复杂对象和批量 payload。",
  "roll chat 当前是 experimental 骨架，不做多步编排。",
  "smart-reply-agent 从 Duliday pull 品牌数据，模型升级为 meta + brands[] + stores[] + positions[]。",
];

const registryCommands = [
  {
    label: "本地目录 / Git 仓库",
    title: "开发态或源码接入",
    body: "你已经拿到 Agent 源码目录，或对方给的是 Git URL。Roll 会解析 SKILL.md，并在本地注册这个 Agent。",
    command: "roll agent add <path|url>",
  },
  {
    label: "npm 包",
    title: "普通用户优先选这个",
    body: "Agent 已经发布成可安装包时使用。官网商店的一键接入命令会优先用这种方式。",
    command: "roll agent install <package>",
  },
  {
    label: "远程 MCP 服务",
    title: "接入已经部署好的服务",
    body: "Agent 不在本机运行，而是由外部服务提供 streamable-http MCP endpoint，需要显式填写名称和描述。",
    command: 'roll agent add --remote https://example.com/mcp --name remote-agent --description "远程 Agent"',
  },
];

export default function Home() {
  return (
    <main>
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#top" aria-label="Roll Agent home">
          花卷 Roll
        </a>
        <div className="nav-links">
          <a href="#architecture">架构</a>
          <a href="#quickstart">开始</a>
          <a href="#store">商店</a>
        </div>
      </nav>

      <section className="hero" id="top" aria-labelledby="hero-title">
        <img src={heroImage} alt="Developer working with code on an iMac" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">Roll Agent</p>
          <h1 id="hero-title">
            <span>指挥官调度，</span>
            <span>MCP 接入。</span>
          </h1>
          <p>
            Roll 是轻量级 Agent 编排系统。roll-core 负责 LLM 基座、Agent 发现/调度和 CLI
            交互，子 Agent 通过 MCP 协议接入。
          </p>
          <div className="hero-actions">
            <a href="#store">浏览 Subagent</a>
            <a href="#quickstart">快速开始</a>
          </div>
        </div>
        <div className="hero-console" aria-label="Roll ask command">
          <span>roll ask</span>
          <code>"帮我查看boss直聘上有多少未读消息"</code>
        </div>
      </section>

      <section className="product-strip" aria-label="Roll highlights">
        <div>
          <span>环境要求</span>
          <strong>Node.js 22.6+</strong>
        </div>
        <div>
          <span>包管理</span>
          <strong>pnpm 10+</strong>
        </div>
        <div>
          <span>路由</span>
          <strong>声明式 / LLM 智能</strong>
        </div>
        <div>
          <span>Provider</span>
          <strong>Anthropic / OpenAI / DeepSeek / Qwen</strong>
        </div>
      </section>

      <section className="intro-section">
        <div className="section-heading centered">
          <p className="eyebrow">Core Idea</p>
          <h2>把“描述”和“运行时”拆开。</h2>
          <p>
            SKILL.md 负责让 Roll 识别 Agent 能力，MCP 负责真正调用工具。
            子 Agent 可以是任意语言实现的本地子进程，也可以是远程服务。
          </p>
        </div>
      </section>

      <section className="architecture" id="architecture" aria-labelledby="architecture-title">
        <div className="section-heading">
          <p className="eyebrow">Architecture</p>
          <h2 id="architecture-title">roll-core 是指挥官，Agent 是可替换的执行单元。</h2>
        </div>

        <div className="system-map" aria-label="Roll architecture map">
          <div className="system-node user-node">用户 CLI</div>
          <div className="system-node core-node">
            <strong>roll-core</strong>
            <span>Agent Registry</span>
            <span>Router</span>
            <span>Runtime Manifest</span>
            <span>MCP Client Manager</span>
            <span>LLM Engine</span>
          </div>
          <div className="transport-row">
            <div className="system-node">stdio 本地子进程</div>
            <div className="system-node">HTTP 远程服务</div>
          </div>
        </div>

        <div className="architecture-grid">
          {layers.map((item) => (
            <article key={item.title}>
              <small>{item.label}</small>
              <span>{item.title}</span>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="updates-section" aria-labelledby="updates-title">
        <div className="section-heading">
          <p className="eyebrow">Recent Updates</p>
          <h2 id="updates-title">更可靠的路由，更明确的输入。</h2>
        </div>
        <div className="update-list">
          {recentUpdates.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>

      <section className="quickstart" id="quickstart" aria-labelledby="quickstart-title">
        <div className="section-heading">
          <p className="eyebrow">Quick Start</p>
          <h2 id="quickstart-title">从源码安装，到自然语言调用。</h2>
          <p>
            README 中的开发模式使用 Node.js Type Stripping 直接运行 TypeScript。
            上线后的 Agent 接入命令后续会补到商店数据里。
          </p>
        </div>
        <div className="terminal" aria-label="Quick start terminal">
          <div className="terminal-bar">
            <span />
            <span />
            <span />
          </div>
          {quickStart.map((line) => (
            <code key={line}>
              <span>$</span> {line}
            </code>
          ))}
        </div>
      </section>

      <section className="command-section" aria-labelledby="commands-title">
        <div className="section-heading centered">
          <p className="eyebrow">Register</p>
          <h2 id="commands-title">本地目录、npm 包、远程 MCP 服务，走不同入口。</h2>
          <p>先看 Agent 的交付形态，再复制对应命令。</p>
        </div>
        <div className="command-grid">
          {registryCommands.map((item) => (
            <article className="command-card" key={item.command}>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <code>{item.command}</code>
            </article>
          ))}
        </div>
      </section>

      <AgentStore agents={agents} />

      <footer className="footer">
        <span>Roll Agent</span>
        <a href="https://github.com/steveoon/roll-agent" rel="noreferrer" target="_blank">
          GitHub
        </a>
      </footer>
    </main>
  );
}
