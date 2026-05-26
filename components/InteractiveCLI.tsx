"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Terminal } from "@/components/ui/Terminal";

type Step = {
  id: string;
  tabName: string;
  command: string;
  description: string;
  commercialValue: string;
  output: string;
};

const STEPS: Step[] = [
  {
    id: "01",
    tabName: "01.VERSION",
    command: "roll --version",
    description: "检查 Roll 指挥官内核版本。提供核心编排、进程调度与 MCP 客户端协议层。",
    commercialValue: "⚡️ 精简、轻量的命令行底座，高弹性的微服务驱动内核。",
    output: "0.9.0",
  },
  {
    id: "02",
    tabName: "02.DIAGNOSE",
    command: "roll doctor",
    description:
      "一键环境自我诊断。验证 Node.js 运行时、操作系统底层浏览器接口、大模型服务商、安全验签中台及子 Agent 的环境就绪状态。",
    commercialValue: "🛡️ 全链路自动化前置检查，保障大规模高频自动化操作的系统稳定性与连接质量。",
    output: `(node:10377) ExperimentalWarning: Type Stripping is an experimental feature
2026-05-26T07:53:20.930Z [INFO ] [notify-agent] MCP Server running on stdio
2026-05-26T07:53:21.058Z [INFO ] [smart-reply-agent] MCP Server running on stdio
2026-05-26T07:53:21.866Z [INFO ] [smart-reply-agent] Querying smart-reply diagnostic status
Roll Agent 系统诊断

✓ Node.js 版本: v22.7.0
✓ 配置文件: /Users/rensiwen/roll.config.yaml
✓ LLM Providers: anthropic, openai, qwen, deepseek
✓ Agent 数据目录: /Users/rensiwen/.roll-agent/agents
✓ 已注册 Agent: 3 个 (notify-agent, smart-reply-agent, browser-use-agent)
✓ Agent 环境配置 (notify-agent): 声明的必填项已满足
✓ Agent 环境配置 (smart-reply-agent): 声明的必填项已在运行态生效 (diagnostic_status)
✓ Agent runtime (browser-use-agent): PID 67631, runtime sidecar 与当前配置一致
▲ Agent 环境配置 (browser-use-agent): 运行态漂移: RECRUITMENT_EVENTS_DEFAULT_AGENT_ID, RECRUITMENT_EVENTS_API_TOKEN, BROWSER_SECURITY_JSON, BROWSER_INSTANCES_JSON
✓ Browser runtime (browser-use-agent): 绕过 (使用 legacy 单实例运行时)
✓ Browser security (browser-use-agent): actionPolicy=log; foregroundPolicy=when-minimized; domainAllowlist=zhipin.com; maxPageContentBytes=102400

存在警告，可按 fix plan 处理。`,
  },
  {
    id: "03",
    tabName: "03.LIST",
    command: "roll agent list",
    description:
      "列出当前已注册且热加载的子 Agent 运行时形态、状态、通信传输协议（stdio / streamable-http）及物理安装路径。",
    commercialValue:
      "📦 模块化插拔架构，进程级强物理隔离，各子 Agent 自主运转，保证极高安全性与低耗能。",
    output: `┌───────────────────┬────────┬────────────┬─────────────────┬────────────────────────────────────────┐
│ Name              │ Status │ Source     │ Transport       │ Location                               │
├───────────────────┼────────┼────────────┼─────────────────┼────────────────────────────────────────┤
│ notify-agent      │ idle   │ local-path │ stdio           │ ~/Next-PJ/nano-agent/agents/notify     │
│ smart-reply-agent │ idle   │ installed  │ stdio           │ ~/.roll-agent/agents/smart-reply-agent │
│ browser-use-agent │ online │ local-path │ streamable-http │ http://127.0.0.1:3100/mcp              │
└───────────────────┴────────┴────────────┴─────────────────┴────────────────────────────────────────┘`,
  },
  {
    id: "04",
    tabName: "04.EXECUTE",
    command: 'roll ask "帮我检查下浏览器的状态"',
    description:
      "向指挥官说一句大白话指令。Commander 将通过大模型自主分析意图、进行路由决策、连接对应子 Agent 并返回结构化执行结果。",
    commercialValue:
      "📈 变高门槛的复杂代码调用为极简的一句话自然语言。完美结合业务场景，多账号并发状态即时反馈。",
    output: `→ 分析意图： "帮我检查下浏览器的状态"
→ 路由决策： browser-use-agent.browser_status (置信度: 1)
→ 连接 Agent "browser-use-agent"...
→ 调用 browser-use-agent.browser_status
{"running":true,"headless":false,"mode":"managed-cdp","activeSessions":[{"browserInstance":"boss-a","platform":"zhipin","pagesOpen":1,"currentUrl":"https://www.zhipin.com/"}],"instances":[{"id":"boss-a","platform":"zhipin","mode":"managed-cdp","cdp":{"endpoint":"http://127.0.0.1:9222","port":9222,"versionReachable":true},"profile":{"userDataDir":"/Users/rensiwen/.roll-agent/browser/profiles/boss-a"}}],"replyAuthorityKeysLoaded":true,"visualCursorEnabled":true,"visualActivityEnabled":true}
✓ 调用完成`,
  },
];

export function InteractiveCLI() {
  const [activeStep, setActiveStep] = useState<string>("01");
  const [copied, setCopied] = useState(false);

  const current = STEPS.find((s) => s.id === activeStep) ?? STEPS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="cli-container">
      {/* Step Stepper Header */}
      <div className="cli-steps-tabs">
        {STEPS.map((s) => (
          <Button
            key={s.id}
            variant="tab"
            active={activeStep === s.id}
            onClick={() => setActiveStep(s.id)}
          >
            {s.tabName}
          </Button>
        ))}
      </div>

      <div className="cli-layout">
        {/* Detail Panel */}
        <div className="cli-info-panel">
          <div className="step-tag">STEP {current.id}</div>
          <h3 className="cli-info-title">{current.description}</h3>
          <p className="cli-commercial-value">{current.commercialValue}</p>

          <div className="cli-command-block">
            <span className="cli-prompt-symbol">$</span>
            <code className="cli-command-text">{current.command}</code>
            <Button variant="copy" onClick={handleCopy}>
              {copied ? "COPIED!" : "COPY"}
            </Button>
          </div>
        </div>

        {/* Terminal Simulation Panel - Handled by UI Terminal Component */}
        <Terminal height="200px">
          <div className="terminal-line input-line">
            <span className="prompt">$</span>
            <span className="typing-text">{current.command}</span>
          </div>
          <div className="terminal-output">{current.output}</div>
          <div className="terminal-line cursor-line">
            <span className="prompt">$</span>
            <span className="blinking-cursor">_</span>
          </div>
        </Terminal>
      </div>
    </div>
  );
}
