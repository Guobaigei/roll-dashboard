"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Terminal } from "@/components/ui/Terminal";
import { useClipboardFeedback } from "@/hooks/use-clipboard-feedback";
import versions from "../public/roll-versions.json";

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
    terminalCommand: "npm i -g @roll-agent/core",
    description: "全局安装 Roll 指挥官，为企业 Agent、业务系统与通用 AI 工作台建立统一入口。",
    commercialValue: "第一步只安装核心能力，不要求立刻改造现有系统或迁移业务流程。",
    output: `→ Installing @roll-agent/core...
✓ Roll Commander v${versions.core} installed
✓ Command available: roll

NEXT: run "roll setup"`,
  },
  {
    id: "02",
    tabName: "02.SETUP",
    command: "roll setup",
    terminalCommand: "roll setup",
    description: "通过一次引导完成模型配置，并按企业场景选择需要的官方 Agent。",
    commercialValue: "从新设备到可用工作台只需一个入口，后续仍可按业务需要逐步扩展。",
    output: `ROLL SETUP

✓ Default model configured
✓ Roll workspace initialized
→ Select official Agents for this business
  browser-use · smart-reply · octopus
✓ Configuration saved to ~/roll.config.yaml

READY: run "roll chat"`,
  },
  {
    id: "03",
    tabName: "03.START",
    command: "roll chat",
    terminalCommand: "roll chat",
    description: "进入企业目标工作台，用持续会话协调专业 Agent，把业务任务推进到结果。",
    commercialValue: "业务人员只需描述目标，不必理解背后的系统接口与执行顺序。",
    output: `ROLL AGENT v${versions.core}
Enterprise Agent Workspace ready
Agents connected · Skills available · Approval guarded

› 描述你的业务目标...
  例如：整理本周各品牌招聘进展，并列出需要跟进的异常`,
  },
  {
    id: "04",
    tabName: "04.VERIFY",
    command: "roll doctor",
    terminalCommand: "roll doctor",
    description: "检查模型配置、Agent 连接和运行环境，确认企业能力已经可以安全调用。",
    commercialValue: "在投入业务使用前获得清晰的系统状态和修复指引，减少上线后的不确定性。",
    output: `ROLL SYSTEM DIAGNOSTICS

✓ Node.js runtime ready
✓ LLM configuration ready
✓ Agent registry available
✓ Required environment variables satisfied
✓ Runtime connections healthy

System ready for enterprise workflows.`,
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
      <div className="cli-steps-tabs" role="tablist" aria-label="Roll 快速部署步骤">
        {STEPS.map((s) => (
          <Button
            aria-controls={`setup-panel-${s.id}`}
            aria-selected={activeStep === s.id}
            id={`setup-tab-${s.id}`}
            key={s.id}
            role="tab"
            variant="tab"
            active={activeStep === s.id}
            onClick={() => setActiveStep(s.id)}
          >
            {s.tabName}
          </Button>
        ))}
      </div>

      <div
        className="cli-layout"
        id={`setup-panel-${current.id}`}
        role="tabpanel"
        aria-labelledby={`setup-tab-${current.id}`}
      >
        {/* Detail Panel */}
        <div className="cli-info-panel">
          <div className="step-tag">STEP {current.id}</div>
          <h3 className="cli-info-title">{current.description}</h3>
          <p className="cli-commercial-value">{current.commercialValue}</p>

          <div className="cli-command-block">
            <span className="cli-prompt-symbol">$</span>
            <code className="cli-command-text">{current.command}</code>
            <Button variant="copy" onClick={handleCopy} aria-live="polite">
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
