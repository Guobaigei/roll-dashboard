"use client";

import { useMemo, useRef, useState } from "react";
import type { Agent } from "@/data/agents";
import { categories } from "@/data/agents";

type AgentStoreProps = {
  agents: Agent[];
};

function commandLabel(agent: Agent, copiedAgentId: string | null) {
  if (!agent.installCommand) {
    return "接入命令待补充";
  }

  return copiedAgentId === agent.id ? "已复制" : "一键接入";
}

export function AgentStore({ agents }: AgentStoreProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agents[0] ?? null);
  const [copiedAgentId, setCopiedAgentId] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const visibleAgents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return agents.filter((agent) => {
      const matchesCategory = category === "All" || agent.category === category;
      const haystack = [
        agent.name,
        agent.description,
        agent.overview,
        agent.category,
        agent.transport,
        agent.runtime,
        ...agent.tags,
        ...agent.tools,
        ...agent.requirements,
        ...agent.useCases,
      ]
        .join(" ")
        .toLowerCase();
      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [agents, category, query]);

  const activeAgent =
    visibleAgents.find((agent) => agent.id === selectedAgent?.id) ?? visibleAgents[0] ?? null;
  const copiedAgent = agents.find((agent) => agent.id === copiedAgentId) ?? null;

  function selectCategory(nextCategory: string) {
    setQuery("");
    setCategory(nextCategory);
    setSelectedAgent(
      agents.find((agent) => nextCategory === "All" || agent.category === nextCategory) ?? null,
    );
  }

  async function copyInstallCommand(agent: Agent) {
    if (!agent.installCommand) {
      return;
    }

    await navigator.clipboard.writeText(agent.installCommand);
    setCopiedAgentId(agent.id);
    if (copyTimerRef.current) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => setCopiedAgentId(null), 5200);
  }

  return (
    <section className="store" id="store" aria-labelledby="store-title">
      <div className="store-head">
        <div className="section-heading">
          <p className="eyebrow">Subagent Store</p>
          <h2 id="store-title">挑选一个子 Agent，接入 Roll 的指挥链。</h2>
          <p>
            卡片资料同步自本地 <code>SKILL.md</code>。安装命令后续补入
            <code>installCommand</code> 后，按钮会自动切换为复制接入命令。
          </p>
        </div>

        <div className="store-note">
          <span>{agents.length}</span>
          <p>首批内置 Agent</p>
        </div>
      </div>

      <div className="store-controls" aria-label="Agent filters">
        <label className="search-field">
          <span>搜索 Agent</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 飞书、BOSS、回复、Playwright..."
            type="search"
          />
        </label>

        <div className="category-tabs" aria-label="Agent categories">
          {categories.map((item) => (
            <button
              className={item === category ? "active" : ""}
              key={item}
              onClick={() => selectCategory(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="store-layout">
        <div className="agent-grid" aria-live="polite">
          {visibleAgents.length > 0 ? (
            visibleAgents.map((agent) => (
              <article
                className={`agent-card ${activeAgent?.id === agent.id ? "selected" : ""}`}
                key={agent.id}
              >
                <button
                  aria-label={`查看 ${agent.name} 详情`}
                  className="agent-card-button"
                  onClick={() => setSelectedAgent(agent)}
                  type="button"
                >
                  <span className="card-topline">
                    <span>{agent.category}</span>
                    <span>{agent.transport}</span>
                  </span>
                  <strong>{agent.name}</strong>
                  <span className="agent-highlight">{agent.highlight}</span>
                  <span className="agent-description">{agent.description}</span>
                  <span className="tag-row">
                    {agent.tags.slice(0, 4).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </span>
                </button>
                <button
                  className="copy-button"
                  disabled={!agent.installCommand}
                  onClick={() => void copyInstallCommand(agent)}
                  type="button"
                >
                  {commandLabel(agent, copiedAgentId)}
                </button>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <strong>没有匹配的 Agent</strong>
              <span>换一个更短的关键词，或点击右侧分类标签重新筛选。</span>
            </div>
          )}
        </div>

        <aside
          className={`agent-detail ${activeAgent ? "" : "empty-detail"}`}
          aria-label="Agent detail"
        >
          {activeAgent ? (
            <>
              <div className="detail-header">
                <p className="eyebrow">{activeAgent.category}</p>
                <h3>{activeAgent.name}</h3>
                <p>{activeAgent.overview}</p>
              </div>

              <div className="detail-command">
                <span>Install command</span>
                <code>{activeAgent.installCommand ?? "接入命令待补充"}</code>
              </div>

              <dl className="detail-spec">
                <div>
                  <dt>Runtime</dt>
                  <dd>{activeAgent.runtime}</dd>
                </div>
                <div>
                  <dt>Transport</dt>
                  <dd>{activeAgent.transport}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{activeAgent.status}</dd>
                </div>
              </dl>

              <div className="detail-section">
                <h4>适用场景</h4>
                <ul>
                  {activeAgent.useCases.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-section">
                <h4>边界条件</h4>
                <ul>
                  {activeAgent.boundaries.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-section compact">
                <h4>Tools</h4>
                <ul>
                  {activeAgent.tools.map((tool) => (
                    <li key={tool}>{tool}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-section compact">
                <h4>Requirements</h4>
                <ul>
                  {activeAgent.requirements.map((requirement) => (
                    <li key={requirement}>{requirement}</li>
                  ))}
                </ul>
              </div>

              <div className="detail-section workflow">
                <h4>典型工作流</h4>
                <ol>
                  {activeAgent.workflow.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              <a className="detail-link" href={activeAgent.docsUrl} rel="noreferrer" target="_blank">
                查看文档
              </a>
            </>
          ) : (
            <div className="detail-empty-state">
              <p className="eyebrow">No Match</p>
              <h3>没有可展示的详情。</h3>
              <p>清空搜索词，或选择一个分类查看对应 Agent。</p>
            </div>
          )}
        </aside>
      </div>

      {copiedAgent?.installCommand ? (
        <div className="copy-toast" role="status" aria-live="polite">
          <strong>{copiedAgent.name} 接入命令已复制</strong>
          <span>接下来打开终端 / 龙虾，粘贴并执行这条命令，然后运行 roll agent list 确认。</span>
          <code>{copiedAgent.installCommand}</code>
        </div>
      ) : null}
    </section>
  );
}
