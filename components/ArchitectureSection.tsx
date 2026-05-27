"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Module = {
  id: string;
  name: string;
  role: string;
  desc: string;
  code: string;
  commercialValue: string;
};

const ARCH_MODULES: Module[] = [
  {
    id: "commander",
    name: "01. COMMANDER 指挥官",
    role: "roll-core",
    desc: "CLI 引擎与核心调度大脑。分析大白话指令，基于 LLM 实现多路径自治路由，解析多协议注册表并维护进程连接池。",
    commercialValue:
      "💡 将混沌复杂的指令转化为结构化精准路由。不重构业务，直接替代高昂的中继开发。",
    code: `import { routeWithLLM } from "@roll-agent/core";

// 自动使用大模型解析用户请求的自然语言意图并路由
const route = await routeWithLLM(
  "帮我在当前账号下给候选人发送签名回复",
  registeredAgents,
  model
);
console.log(route.agentName);  // => "browser-use-agent"
console.log(route.toolName);   // => "send_prepared_reply"
console.log(route.confidence); // => 1.0`,
  },
  {
    id: "mcp",
    name: "02. MCP 协议网关",
    role: "Model Context Protocol",
    desc: "采用标准开放的 MCP 协议进行数据与能力的双向解耦传输。本地子进程采用 stdio 管道，持续长连接常驻服务采用 HTTP 协议流式传输。",
    commercialValue:
      "🔌 标准化生态。支持任意第三方 AI 客户端（如 Cursor, Claude Code）直接插拔接驳本地的所有招聘 Agent 能力。",
    code: `import { Server } from "@modelcontextprotocol/sdk/server/index.js";

const server = new Server({
  name: "roll-agent-mcp-bridge",
  version: "1.0.0"
}, {
  capabilities: { tools: {} }
});
// 开放标准的 Tools 定义供指挥官或外部 IDE 客户端调用
server.addTool({
  name: "get_candidate_status",
  handler: async (args) => { ... }
});`,
  },
  {
    id: "execution",
    name: "03. SUB-AGENTS 执行层",
    role: "Execution Workers",
    desc: "由多个微型垂直 Agent 组成，包括 强抗风控浏览器客户端（browser-use）、云端验签策略大脑（smart-reply）、多渠道飞书通知器（notify-agent）。",
    commercialValue:
      "🎯 分工协作，强隔离运行。浏览器操控不挂，智能回复独立过签，多角色分工完成极其稳健的批量回复闭环。",
    code: `// browser-use-agent 执行签名发送逻辑
const browser = await Chrome.boot({ profile: "recruiter-a" });
await browser.evaluate(
  recruiter.sendPreparedReply, 
  { preparedReplyId: "envelope_9x12" }
);
// notify-agent 同步至飞书团队群
await notify.send({
  text: "候选人已获取联系方式，自动同步完毕。"
});`,
  },
];

export function ArchitectureSection() {
  const [activeMod, setActiveMod] = useState<string>("commander");

  const current = ARCH_MODULES.find((m) => m.id === activeMod) ?? ARCH_MODULES[0];

  return (
    <section className="arch-section" id="architecture" aria-labelledby="arch-title">
      <span className="section-anchor" id="how" aria-hidden="true" />
      <div className="section-heading arch-heading-layout">
        <div>
          <p className="eyebrow">SYSTEM ARCHITECTURE</p>
          <h2 id="arch-title" className="arch-main-title">
            指挥官 - MCP - 执行层：模块化高弹性内核
          </h2>
          <p className="arch-sub-title">
            Roll 颠覆了传统单一臃肿的机器人软件，通过 **Model Context Protocol**
            实现能力的解耦。本地指挥官掌控中台逻辑，多子进程 Agent 分而治之，提供极佳的健壮性。
          </p>
        </div>
        <div className="arch-selectors">
          {ARCH_MODULES.map((m) => (
            <Button key={m.id} active={activeMod === m.id} onClick={() => setActiveMod(m.id)}>
              {m.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="arch-grid">
        {/* Animated Interactive SVG Diagram */}
        <Card title="SYSTEM_DATAFLOW_VISUALIZER" dot={true}>
          <div className="svg-wrapper">
            <svg
              viewBox="0 0 800 480"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="arch-svg-element"
              role="img"
              aria-label="System Architecture Diagram"
            >
              <title>Roll Agent System Architecture</title>
              {/* Background Grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.03)"
                    strokeWidth="1"
                  />
                </pattern>
                <linearGradient id="neonOrange" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ff7b00" />
                  <stop offset="100%" stopColor="#ff4500" />
                </linearGradient>
                <linearGradient id="neonBlue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d2ff" />
                  <stop offset="100%" stopColor="#0066ff" />
                </linearGradient>
                <linearGradient id="neonGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00ff66" />
                  <stop offset="100%" stopColor="#119c68" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Animated Flow Tracks (Dashed lines) */}
              <path
                id="flow1"
                d="M 170 240 H 280"
                stroke="rgba(255, 123, 0, 0.2)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                id="flow1b"
                d="M 440 240 H 500"
                stroke="rgba(255, 123, 0, 0.2)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                id="flow2"
                d="M 500 240 Q 530 240 530 130 H 560"
                stroke="rgba(0, 210, 255, 0.2)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                id="flow3"
                d="M 500 240 H 560"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <path
                id="flow4"
                d="M 500 240 Q 530 240 530 350 H 560"
                stroke="rgba(0, 255, 102, 0.2)"
                strokeWidth="2"
                strokeDasharray="6 4"
              />

              {/* Animated Particles flowing on tracks */}
              <circle r="4" fill="#ff7b00" className="animated-particle p1">
                <animateMotion dur="3s" repeatCount="indefinite" path="M 170 240 H 280" />
              </circle>
              <circle r="4" fill="#ff7b00" className="animated-particle p1b">
                <animateMotion dur="2.5s" repeatCount="indefinite" path="M 440 240 H 500" />
              </circle>
              <circle r="4" fill="#00d2ff" className="animated-particle p2">
                <animateMotion
                  dur="4s"
                  repeatCount="indefinite"
                  path="M 500 240 Q 530 240 530 130 H 560"
                />
              </circle>
              <circle r="4" fill="#ffffff" className="animated-particle p3">
                <animateMotion dur="3.5s" repeatCount="indefinite" path="M 500 240 H 560" />
              </circle>
              <circle r="4" fill="#00ff66" className="animated-particle p4">
                <animateMotion
                  dur="4s"
                  repeatCount="indefinite"
                  path="M 500 240 Q 530 240 530 350 H 560"
                />
              </circle>

              {/* Node 1: Input / IM Trigger */}
              <g className={`svg-node ${activeMod === "commander" ? "focused" : ""}`}>
                <rect
                  x="30"
                  y="195"
                  width="140"
                  height="90"
                  rx="6"
                  fill="#141416"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1.5"
                />
                <rect
                  x="30"
                  y="195"
                  width="140"
                  height="24"
                  rx="0"
                  fill="rgba(255,255,255,0.03)"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1.5"
                />
                <text x="42" y="212" fill="#888" fontSize="10" fontFamily="monospace">
                  INPUT_SOURCE
                </text>
                <text
                  x="42"
                  y="245"
                  fill="#fff"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  CLI / IM Trigger
                </text>
                <text x="42" y="265" fill="#666" fontSize="10" fontFamily="monospace">
                  Natural Lang / RPC
                </text>
              </g>

              {/* Node 2: Commander Core (Scheduler) */}
              <g className={`svg-node ${activeMod === "commander" ? "focused" : ""}`}>
                <rect
                  x="280"
                  y="180"
                  width="160"
                  height="120"
                  rx="8"
                  fill="#141416"
                  stroke="url(#neonOrange)"
                  strokeWidth="2"
                  className="glow-orange"
                />
                <rect x="280" y="180" width="160" height="26" fill="rgba(255, 123, 0, 0.08)" />
                <text
                  x="292"
                  y="197"
                  fill="#ff7b00"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  01. COMMANDER CORE
                </text>
                <text
                  x="292"
                  y="235"
                  fill="#fff"
                  fontSize="15"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  roll-core CLI
                </text>
                <text x="292" y="258" fill="#aaa" fontSize="11" fontFamily="monospace">
                  LLM Router Engine
                </text>
                <text x="292" y="278" fill="#ff7b00" fontSize="10" fontFamily="monospace">
                  &gt; routing with LLM...
                </text>
              </g>

              {/* Node 3: MCP Gateway / Protocol client */}
              <g className={`svg-node ${activeMod === "mcp" ? "focused" : ""}`}>
                <circle cx="500" cy="240" r="16" fill="#0f0f11" stroke="#fff" strokeWidth="2" />
                <text
                  x="494"
                  y="244"
                  fill="#fff"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  M
                </text>
                <text x="475" y="272" fill="#888" fontSize="9" fontFamily="monospace">
                  MCP Gate
                </text>
              </g>

              {/* Sub-Agent 1: browser-use */}
              <g className={`svg-node ${activeMod === "execution" ? "focused" : ""}`}>
                <rect
                  x="560"
                  y="80"
                  width="200"
                  height="90"
                  rx="6"
                  fill="#141416"
                  stroke="url(#neonBlue)"
                  strokeWidth="1.5"
                />
                <text
                  x="572"
                  y="102"
                  fill="#00d2ff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  01. @roll-agent/browser-use
                </text>
                <text
                  x="572"
                  y="125"
                  fill="#fff"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  浏览器操控助手
                </text>
                <text x="572" y="145" fill="#666" fontSize="10" fontFamily="monospace">
                  行为仿真 / 强抗风控
                </text>
                <rect x="705" y="133" width="45" height="15" rx="3" fill="#002244" />
                <text x="710" y="144" fill="#00d2ff" fontSize="9" fontFamily="monospace">
                  PORT 3100
                </text>
              </g>

              {/* Sub-Agent 2: smart-reply */}
              <g className={`svg-node ${activeMod === "execution" ? "focused" : ""}`}>
                <rect
                  x="560"
                  y="195"
                  width="200"
                  height="90"
                  rx="6"
                  fill="#141416"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1.5"
                />
                <text
                  x="572"
                  y="217"
                  fill="#aaa"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  02. @roll-agent/smart-reply
                </text>
                <text
                  x="572"
                  y="240"
                  fill="#fff"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  智能回复助手
                </text>
                <text x="572" y="260" fill="#666" fontSize="10" fontFamily="monospace">
                  Reply Authority Cloud API
                </text>
                <rect x="710" y="248" width="40" height="15" rx="3" fill="#222" />
                <text x="716" y="259" fill="#888" fontSize="9" fontFamily="monospace">
                  STDIO
                </text>
              </g>

              {/* Sub-Agent 3: notify */}
              <g className={`svg-node ${activeMod === "execution" ? "focused" : ""}`}>
                <rect
                  x="560"
                  y="310"
                  width="200"
                  height="90"
                  rx="6"
                  fill="#141416"
                  stroke="url(#neonGreen)"
                  strokeWidth="1.5"
                />
                <text
                  x="572"
                  y="332"
                  fill="#00ff66"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  03. @roll-agent/notify-agent
                </text>
                <text
                  x="572"
                  y="355"
                  fill="#fff"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  消息通知助手
                </text>
                <text x="572" y="375" fill="#666" fontSize="10" fontFamily="monospace">
                  Feishu Webhook Out出站
                </text>
                <rect x="710" y="363" width="40" height="15" rx="3" fill="#003311" />
                <text x="716" y="374" fill="#00ff66" fontSize="9" fontFamily="monospace">
                  STDIO
                </text>
              </g>
            </svg>
          </div>
        </Card>

        {/* Detailed Explanation Code/SaaS Card */}
        <Card title={`${current.id}_explanation.ts`} dot={true}>
          <div className="arch-explain-body">
            <div className="arch-explain-header">
              <span className="explain-role">{current.role}</span>
              <h3 className="explain-title">{current.name}</h3>
              <p className="explain-desc">{current.desc}</p>
              <div className="explain-value">
                <strong>商业收益：</strong>
                <span>{current.commercialValue}</span>
              </div>
            </div>

            <div className="arch-code-block">
              <div className="code-header">
                <span className="code-lang">TS</span>
                <span className="code-filename">example-{current.id}.ts</span>
              </div>
              <pre className="code-content">
                <code>{current.code}</code>
              </pre>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
