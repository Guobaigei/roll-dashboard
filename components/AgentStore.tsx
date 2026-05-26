"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useClipboardFeedback } from "@/components/useClipboardFeedback";
import type { Agent } from "@/data/agents";

type AgentStoreProps = {
  agents: Agent[];
};

export function AgentStore({ agents }: AgentStoreProps) {
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id ?? "");
  const { copiedKey, copy } = useClipboardFeedback();

  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);
  const activeAgent = agentById.get(selectedAgentId) ?? agents[0] ?? null;
  const installCopyKey = activeAgent ? `${activeAgent.id}:install` : "";
  const runCopyKey = activeAgent ? `${activeAgent.id}:run` : "";

  const handleCopy = (cmd: string, key: string) => {
    void copy(cmd, key);
  };

  return (
    <section className="marketplace-section" id="marketplace" aria-labelledby="marketplace-title">
      <span className="section-anchor" id="team" aria-hidden="true" />
      <div className="marketplace-head">
        <div className="section-heading">
          <p className="eyebrow">EXTENSION MARKETPLACE</p>
          <h2 id="marketplace-title" className="market-main-title">
            子 Agent 应用中心：即装即用
          </h2>
          <p className="market-sub-title">
            基于统一的 MCP 协议，通过命令行一行安装，便可热加载到你的 Roll 指挥官内核中。
            按需配置，自主启动，完全解耦。
          </p>
        </div>
        <div className="market-count-tag">
          <strong>{agents.length}</strong>
          <span>CORE AGENTS DEPLOYED</span>
        </div>
      </div>

      <div className="market-layout">
        {/* Left Grid Selection */}
        <section className="market-grid-list" aria-label="AI 助手列表">
          {agents.map((agent) => (
            <Button
              variant="card"
              accent={agent.accent}
              active={activeAgent?.id === agent.id}
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
            >
              <div className="market-card-kicker-row">
                <span className="market-card-kicker">{agent.category}</span>
                <span className={`status-pill accent-${agent.accent}`}>ACTIVE</span>
              </div>
              <strong className="market-card-title">{agent.roleName}</strong>
              <span className="market-card-summary">{agent.plainSummary}</span>
            </Button>
          ))}
        </section>

        {/* Right Active Detail Panel */}
        {activeAgent ? (
          <aside
            className={`market-detail-aside accent-${activeAgent.accent}`}
            aria-label="AI 助手详情"
          >
            <div className="detail-status-row">
              <span className="detail-status-badge">READY TO BOOT</span>
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
