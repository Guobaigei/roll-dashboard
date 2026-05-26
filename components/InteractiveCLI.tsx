"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Terminal } from "@/components/ui/Terminal";
import { useClipboardFeedback } from "@/components/useClipboardFeedback";

type Step = {
  id: string;
  tabName: string;
  command: string;
  terminalCommand: string; // 终端中执行的示例命令，可以与一键复制的主命令不同
  description: string;
  commercialValue: string;
  output: string;
};

const STEPS: Step[] = [
  {
    id: "01",
    tabName: "01.INSTALL",
    command: "npm i -g @roll-agent/core",
    terminalCommand: "roll update --check",
    description:
      "全局一键安装 Roll 指挥官内核。提供核心编排、多账号管理与开放的 MCP 客户端协议层。",
    commercialValue:
      "⚡️ 10秒快速、轻量全局加载，无侵入本地环境，零重构成本一键布设招聘自动化大脑。",
    output: `→ 检查 roll 更新...
→ roll 已是最新版本 (v0.9.0)

已注册 Agent (3):
→ 📢 notify-agent [local-path] - 刷新本地 SKILL/manifest
→ 🧠 smart-reply-agent [installed-package] - 已是最新版本 (v1.2.5)
→ 🌐 browser-use-agent [local-path] - 刷新本地 SKILL/manifest`,
  },
  {
    id: "02",
    tabName: "02.DIAGNOSE",
    command: "roll doctor",
    terminalCommand: "roll doctor",
    description:
      "一键环境自我诊断。验证 Node.js 运行环境、系统底层网络接口、大模型密钥及子进程就绪状态。",
    commercialValue:
      "🛡️ 全链路自动化健康透视，安全无污染。排查异常，保障大规模高频自动化操作的系统稳定性与连接质量。",
    output: `Roll Agent 系统诊断

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
    tabName: "03.REGISTER",
    command: "roll agent install @roll-agent/browser-use-agent",
    terminalCommand: "roll agent install @roll-agent/browser-use-agent",
    description: "通过标准 MCP 协议，从注册表拉取并热插拔加载「浏览器操控」子 Agent 运行时。",
    commercialValue:
      "📦 模块化解耦架构，从中心仓库一键热插拔拉取并热加载。子 Agent 独立运行，保障核心资产安全隔离。",
    output: `[roll] pulling registry metadata for "@roll-agent/browser-use-agent"...
[roll] resolved to stable version 2.4.15
[roll] registering mcp service "@roll-agent/browser-use" via HTTP-streamable transport...
[roll] auto-starting browser-use daemon on port 3100...
[roll] service registered successfully in registry (~/.roll-agent/agents.json)
[roll] skills updated:
  - zhipin_read_messages
  - zhipin_send_prepared_reply
  - zhipin_exchange_wechat`,
  },
  {
    id: "04",
    tabName: "04.EXECUTE",
    command: 'roll ask "帮我检查下浏览器的状态"',
    terminalCommand: 'roll ask "帮我检查下浏览器的状态"',
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
  const { copiedKey, copy } = useClipboardFeedback();

  const current = STEPS.find((s) => s.id === activeStep) ?? STEPS[0];

  const handleCopy = () => {
    void copy(current.command, current.id);
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
              {copiedKey === current.id ? "COPIED!" : "COPY"}
            </Button>
          </div>
        </div>

        {/* Terminal Simulation Panel - Handled by UI Terminal Component */}
        <Terminal height="200px">
          <div className="terminal-line input-line">
            <span className="prompt">$</span>
            <span className="typing-text">{current.terminalCommand}</span>
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
