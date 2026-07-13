"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Module = {
  id: string;
  name: string;
  role: string;
  desc: string;
  mechanism: readonly string[];
  commercialValue: string;
};

const ARCH_MODULES: Module[] = [
  {
    id: "commander",
    name: "01. COMMANDER 指挥官",
    role: "GOAL ORCHESTRATION",
    desc: "企业任务的统一指挥层。理解最终目标，维护任务上下文，组织执行顺序，并在失败或关键操作出现时决定下一步。",
    mechanism: [
      "统一接收来自业务人员、通用 Agent 与业务系统的目标",
      "根据任务进度选择专业能力，并持续处理返回结果",
      "在关键操作前请求确认，让任务推进与人工控制并存",
    ],
    commercialValue:
      "复杂业务不再依赖人工来回切换系统。企业只需明确目标，Roll 负责组织过程并给出真实结果。",
  },
  {
    id: "mcp",
    name: "02. MCP 协议网关",
    role: "STANDARD CAPABILITY LAYER",
    desc: "企业能力的标准连接层。将不同系统与专业 Agent 转换为 Roll 可以统一理解和调用的能力，同时保持各自独立运行。",
    mechanism: [
      "用统一标准连接本地工具、远程服务与企业内部系统",
      "将能力说明和执行边界一并交给指挥官",
      "允许新 Agent 独立接入、替换和升级，不改写整个系统",
    ],
    commercialValue:
      "企业可以持续增加智能化覆盖面，同时复用现有技术资产，降低重复集成与长期维护成本。",
  },
  {
    id: "execution",
    name: "03. SUB-AGENTS 执行层",
    role: "SPECIALIST EXECUTION",
    desc: "由面向具体业务的专业 Agent 组成，分别负责浏览器操作、企业回复、策略调优、业务查数和消息通知等真实动作。",
    mechanism: [
      "每个 Agent 聚焦一种专业能力，并声明清晰的输入与结果",
      "按任务需要组合多个 Agent，而不是把所有逻辑塞进一个机器人",
      "独立运行、按需升级，单个能力变化不影响整套系统",
    ],
    commercialValue:
      "专业能力可以像企业数字员工一样持续扩展：各司其职、按需组合，并对最终业务结果负责。",
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
            指挥官 - MCP - 执行层：让企业能力可以持续组合与扩展
          </h2>
          <p className="arch-sub-title">
            Roll 不把所有业务逻辑塞进一个庞大的机器人。指挥官负责目标与过程，MCP 负责统一连接，专业
            Agent 负责真实执行，让企业可以从一个场景起步，再逐步扩展。
          </p>
        </div>
        <div className="arch-selectors">
          {ARCH_MODULES.map((m) => (
            <Button
              className="arch-select-btn"
              key={m.id}
              active={activeMod === m.id}
              aria-pressed={activeMod === m.id}
              onClick={() => setActiveMod(m.id)}
            >
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
              aria-label="Roll 企业 Agent 系统三层架构图"
            >
              <title>Roll 企业 Agent 系统三层架构</title>
              <desc>
                业务人员、通用 Agent 与企业系统将目标交给指挥官，通过 MCP 连接层调用专业业务 Agent。
              </desc>
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
                  ENTERPRISE_INPUT
                </text>
                <text
                  x="42"
                  y="245"
                  fill="#fff"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  People / Agent / System
                </text>
                <text x="42" y="265" fill="#666" fontSize="10" fontFamily="monospace">
                  Goal / Request / Workflow
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
                  Roll Commander
                </text>
                <text x="292" y="258" fill="#aaa" fontSize="11" fontFamily="monospace">
                  Goal Orchestration
                </text>
                <text x="292" y="278" fill="#ff7b00" fontSize="10" fontFamily="monospace">
                  &gt; coordinating work...
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
                  MCP Link
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
                  01. OPERATIONS AUTOMATION
                </text>
                <text
                  x="572"
                  y="125"
                  fill="#fff"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  业务操作 Agent
                </text>
                <text x="572" y="145" fill="#666" fontSize="10" fontFamily="monospace">
                  Browser / Workflow
                </text>
                <rect x="705" y="133" width="45" height="15" rx="3" fill="#002244" />
                <text x="710" y="144" fill="#00d2ff" fontSize="9" fontFamily="monospace">
                  CONNECTED
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
                  02. POLICY &amp; KNOWLEDGE
                </text>
                <text
                  x="572"
                  y="240"
                  fill="#fff"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  企业知识 Agent
                </text>
                <text x="572" y="260" fill="#666" fontSize="10" fontFamily="monospace">
                  Reply / Policy / Guardrails
                </text>
                <rect x="710" y="248" width="40" height="15" rx="3" fill="#222" />
                <text x="716" y="259" fill="#888" fontSize="9" fontFamily="monospace">
                  READY
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
                  03. DATA INTELLIGENCE
                </text>
                <text
                  x="572"
                  y="355"
                  fill="#fff"
                  fontSize="13"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  数据洞察 Agent
                </text>
                <text x="572" y="375" fill="#666" fontSize="10" fontFamily="monospace">
                  Query / Validate / Explain
                </text>
                <rect x="710" y="363" width="40" height="15" rx="3" fill="#003311" />
                <text x="716" y="374" fill="#00ff66" fontSize="9" fontFamily="monospace">
                  READY
                </text>
              </g>
            </svg>
          </div>
        </Card>

        <Card title={`${current.id.toUpperCase()}_BUSINESS_LAYER`} dot={true}>
          <div className="arch-explain-body">
            <div className="arch-explain-header">
              <span className="explain-role">{current.role}</span>
              <h3 className="explain-title">{current.name}</h3>
              <p className="explain-desc">{current.desc}</p>
            </div>

            <div className="arch-mechanism-block">
              <span className="arch-mechanism-label">HOW IT WORKS</span>
              <ol>
                {current.mechanism.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>

            <div className="explain-value">
              <strong>ENTERPRISE VALUE | 企业价值</strong>
              <span>{current.commercialValue}</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
