"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Agent } from "@/data/agents";
import { useClipboardFeedback } from "@/hooks/use-clipboard-feedback";
import versions from "../public/roll-versions.json";

type AgentStoreProps = {
  agents: Agent[];
  initialAgentId?: string;
};

const AGENT_VERSION_BY_ID = {
  "browser-use-agent": versions.browserUse,
  "smart-reply-agent": versions.smartReply,
  "reply-policy-tuner-agent": versions.replyPolicyTuner,
  "octopus-agent": versions.octopus,
} as const;

function getAgentVersionLabel(agentId: string) {
  const version = AGENT_VERSION_BY_ID[agentId as keyof typeof AGENT_VERSION_BY_ID];
  return version ? `v${version}` : null;
}

function replaceSelectedAgentInUrl(agentId: string) {
  const url = new URL(window.location.href);

  if (url.searchParams.get("agent") === agentId) {
    return;
  }

  url.searchParams.set("agent", agentId);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function AgentStore({ agents, initialAgentId }: AgentStoreProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(() =>
    initialAgentId && agents.some((agent) => agent.id === initialAgentId)
      ? initialAgentId
      : (agents[0]?.id ?? ""),
  );
  const { copiedKey, copy } = useClipboardFeedback();

  const activeAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null;
  const installCopyKey = activeAgent ? `${activeAgent.id}:install` : "";
  const runCopyKey = activeAgent ? `${activeAgent.id}:run` : "";

  const handleCopy = (cmd: string, key: string) => {
    void copy(cmd, key);
  };

  const handleSelectAgent = (agentId: string) => {
    setSelectedAgentId(agentId);
    replaceSelectedAgentInUrl(agentId);
  };

  return (
    <section className="marketplace-section" id="marketplace" aria-labelledby="marketplace-title">
      <span className="section-anchor" id="team" aria-hidden="true" />
      <div className="marketplace-head">
        <div className="section-heading">
          <p className="eyebrow">EXTENSION MARKETPLACE</p>
          <h2 id="marketplace-title" className="market-main-title">
            企业专业能力中心：按场景持续扩展
          </h2>
          <p className="market-sub-title">
            为 Roll 安装面向具体业务的专业
            Agent。每项能力独立运行、按需配置，并由指挥官在任务中统一调用。
          </p>
        </div>
        <div className="market-count-tag">
          <strong>{agents.length}</strong>
          <span>CAPABILITIES AVAILABLE</span>
        </div>
      </div>

      <div className="market-layout">
        {/* Left Grid Selection */}
        <section className="market-grid-list" aria-label="AI 助手列表">
          {agents.map((agent) => {
            const versionLabel = getAgentVersionLabel(agent.id);

            return (
              <Button
                variant="card"
                accent={agent.accent}
                active={activeAgent?.id === agent.id}
                aria-pressed={activeAgent?.id === agent.id}
                key={agent.id}
                onClick={() => handleSelectAgent(agent.id)}
              >
                <div className="market-card-kicker-row">
                  <span className="market-card-kicker">{agent.category}</span>
                  <span className="market-card-status-row">
                    <span className={`status-pill accent-${agent.accent}`}>AVAILABLE</span>
                    {versionLabel ? (
                      <span className={`version-pill accent-${agent.accent}`}>{versionLabel}</span>
                    ) : null}
                  </span>
                </div>
                <strong className="market-card-title">{agent.roleName}</strong>
                <span className="market-card-summary">{agent.plainSummary}</span>
              </Button>
            );
          })}
        </section>

        {/* Right Active Detail Panel */}
        {activeAgent ? (
          <aside
            className={`market-detail-aside accent-${activeAgent.accent}`}
            aria-label="AI 助手详情"
          >
            <div className="detail-status-row">
              <span className="detail-status-badge">READY TO INSTALL</span>
              <small className="detail-category">{activeAgent.category}</small>
            </div>
            <h3 className="detail-hero-title">{activeAgent.roleName}</h3>
            <p className="detail-overview-p">{activeAgent.overview}</p>

            {/* Installation Box */}
            <div className="market-terminal-box">
              <div className="box-tab">INSTALL_COMMAND</div>
              <div className="box-code-row">
                <span className="box-prompt">$</span>
                <code className="box-command">{activeAgent.installCommand}</code>
                <Button
                  variant="copy"
                  onClick={() => handleCopy(activeAgent.installCommand, installCopyKey)}
                >
                  {copiedKey === installCopyKey ? "COPIED" : "COPY"}
                </Button>
              </div>
            </div>

            {/* Run Box */}
            <div className="market-terminal-box">
              <div className="box-tab">EXECUTE_CLI</div>
              <div className="box-code-row">
                <span className="box-prompt">$</span>
                <code className="box-command">{activeAgent.runCommand}</code>
                <Button
                  variant="copy"
                  onClick={() => handleCopy(activeAgent.runCommand, runCopyKey)}
                >
                  {copiedKey === runCopyKey ? "COPIED" : "COPY"}
                </Button>
              </div>
            </div>

            <div className="outcome-box-row">
              <Card className="outcome-inner-card">
                <span className="outcome-tag">DELIVERABLES | 商业产出</span>
                <p className="outcome-desc-p">{activeAgent.businessOutcome}</p>
              </Card>
              <Card className="outcome-inner-card">
                <span className="outcome-tag">RUNTIME SPEC | 运行时规格</span>
                <p className="outcome-runtime-p">{activeAgent.runtimeDetails}</p>
              </Card>
            </div>

            <div className="detail-role-tags-grid">
              {activeAgent.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="capsule-tag">
                  {tag}
                </span>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
