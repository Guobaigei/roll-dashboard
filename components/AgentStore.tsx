"use client";

import { useState } from "react";
import type { Agent } from "@/data/agents";

type AgentStoreProps = {
  agents: Agent[];
};

export function AgentStore({ agents }: AgentStoreProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id ?? "");
  const activeAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null;

  return (
    <section className="team-section" aria-labelledby="team-title">
      <span className="section-anchor" id="team" aria-hidden="true" />
      <div className="team-head">
        <div className="section-heading">
          <p className="eyebrow">AI 助手</p>
          <h2 id="team-title">招聘里的重复活，交给不同的 AI 助手。</h2>
          <p>
            你不需要知道它们怎么协作。只要交代目标，Roll 会安排合适的助手去看消息、
            写回复、查资料、同步团队。
          </p>
        </div>
        <div className="team-count">
          <strong>{agents.length}</strong>
          <span>类招聘助手</span>
        </div>
      </div>

      <div className="team-layout">
        <div className="worker-grid" aria-label="AI 助手列表">
          {agents.map((agent) => (
            <button
              className={`worker-card accent-${agent.accent} ${
                activeAgent?.id === agent.id ? "selected" : ""
              }`}
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              type="button"
            >
              <span className="worker-kicker">{agent.category}</span>
              <strong>{agent.roleName}</strong>
              <span>{agent.plainSummary}</span>
            </button>
          ))}
        </div>

        {activeAgent ? (
          <aside className={`worker-detail accent-${activeAgent.accent}`} aria-label="AI 助手详情">
            <div className="detail-status">
              <span>随时待命</span>
              <small>{activeAgent.category}</small>
            </div>
            <h3 className="detail-title">{activeAgent.roleName}</h3>
            <p className="detail-overview">{activeAgent.overview}</p>

            <div className="prompt-card">
              <span>你可以这样指挥它</span>
              <strong>{activeAgent.examplePrompt}</strong>
            </div>

            <div className="outcome-card">
              <span>它会交付什么</span>
              <p>{activeAgent.businessOutcome}</p>
            </div>

            <div className="role-tags">
              {activeAgent.tags.slice(0, 4).map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
