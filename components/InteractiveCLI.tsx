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
    tabName: "01.INSTALL",
    command: "npm i -g @roll-agent/core",
    description: "全局安装 Roll 指挥官内核。提供核心编排、进程调度与 MCP 客户端协议层。",
    commercialValue: "⚡️ 10秒快速轻量接入，本地无需复杂的庞大环境，零开发门槛部署指挥中台。",
    output: `[pnpm] info: installing @roll-agent/core@latest globally...
[pnpm] + @roll-agent/core@2.4.15 (node_modules/.bin/roll)
[pnpm] success: command "roll" is now globally available!

$ roll --version
Roll Commander Core v2.4.15 (MCP Enabled)`,
  },
  {
    id: "02",
    tabName: "02.DIAGNOSE",
    command: "roll doctor",
    description: "自我诊断环境。验证 Node.js 运行时、操作系统 CDP 底层库以及网络中台连接状态。",
    commercialValue:
      "🛡️ 自动化全链路前置筛查，保障大规模高频招聘操作的稳定性，杜绝中途掉线与配置错误。",
    output: `[roll] doctor: initiating system diagnostics...
[ok] node.js version: v22.7.0 (>= 22.6.0 supported)
[ok] local chrome instance detected (custom data directories enabled)
[ok] networks: mcp proxy check to "reply-authority.duliday.com" succeeded (ping: 15ms)
[ok] encryption: signature validation subsystem enabled
[roll] system is healthy and ready to deploy agents!`,
  },
  {
    id: "03",
    tabName: "03.REGISTER",
    command: "roll agent install @roll-agent/browser-use-agent",
    description: "通过标准 MCP 协议，从注册表拉取并热插拔加载「浏览器操控」子 Agent 运行时。",
    commercialValue:
      "📦 模块化解耦架构，独立资源分配，不限制多账号多浏览器并行隔离运行，资产更安全。",
    output: `[roll] pulling registry metdata for "@roll-agent/browser-use-agent"...
[roll] resolved to stable version 2.4.15
[roll] registering mcp service "@roll-agent/browser-use" via HTTP-streamable transport...
[roll] auto-starting browser-use daemon on port 3100...
[roll] service registered successfully in registry (~/.roll-agent/agents.json)
[roll] skils updated:
  - zhipin_read_messages
  - zhipin_send_prepared_reply
  - zhipin_exchange_wechat`,
  },
  {
    id: "04",
    tabName: "04.EXECUTE",
    command: 'roll ask "帮我查看boss直聘上有多少未读消息"',
    description:
      "向指挥官说一句大白话。Commander 将用大模型自主路由，将目标分解并调用对应子 Agent 执行。",
    commercialValue:
      "📈 变高门槛的复杂操作为一句话指令。AI 自动化筛人、秒回候选人、微信换取，企业直接降低 70% 劳动力损耗。",
    output: `[roll] raw input received: "帮我查看boss直聘上有多少未读消息"
[roll] routing request with deepseek-chat...
[roll] routed to agent: "browser-use-agent" (score: 0.98)
[roll] executing tool: "zhipin_read_messages" with { "onlyUnread": true }
[browser-use] booting headless-cdp chrome profile "boss-a"...
[browser-use] loading chat page... [success]
[browser-use] reading conversation lists...
[roll] result from agent:
  {
    "totalConversationsChecked": 25,
    "unreadCount": 12,
    "latestCandidates": ["张三 (前端开发)", "李四 (灵工店员)"]
  }
[roll] 刚才帮你查了一下，BOSS直聘当前账号共有 12 条未读消息，主要包括前端开发张三和灵工店员李四。`,
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
        <Terminal height="180px">
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
