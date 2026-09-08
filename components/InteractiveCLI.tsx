"use client";

import { type KeyboardEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PanelDotBackground } from "@/components/ui/PanelDotBackground";
import { Terminal } from "@/components/ui/Terminal";
import { installationMethods } from "@/data/installation";
import { useClipboardFeedback } from "@/hooks/use-clipboard-feedback";

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
    command: installationMethods[0].command,
    terminalCommand: installationMethods[0].command,
    description: installationMethods[0].description,
    commercialValue: "",
    output: installationMethods[0].output,
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
    output: `ROLL AGENT
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
  const [installMethodId, setInstallMethodId] = useState<string>("unix");
  const { copiedKey, copy } = useClipboardFeedback();
  const installMethod =
    installationMethods.find((method) => method.id === installMethodId) ?? installationMethods[0];
  const steps = STEPS.map((step) =>
    step.id === "01"
      ? {
          ...step,
          command: installMethod.command,
          terminalCommand: installMethod.command,
          description: installMethod.description,
          output: installMethod.output,
        }
      : step,
  );

  const handleCopy = (step: Step) => {
    void copy(step.command, `${installMethodId}:${step.id}`);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, stepId: string) => {
    const currentIndex = STEPS.findIndex((step) => step.id === stepId);
    let nextIndex: number | null = null;

    switch (event.key) {
      case "ArrowRight":
        nextIndex = (currentIndex + 1) % STEPS.length;
        break;
      case "ArrowLeft":
        nextIndex = (currentIndex - 1 + STEPS.length) % STEPS.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = STEPS.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    const nextStep = STEPS[nextIndex];
    setActiveStep(nextStep.id);
    event.currentTarget
      .closest('[role="tablist"]')
      ?.querySelector<HTMLButtonElement>(`#setup-tab-${nextStep.id}`)
      ?.focus();
  };

  return (
    <div className="cli-container">
      <PanelDotBackground />
      {/* Step Stepper Header */}
      <div
        className="cli-steps-tabs"
        role="tablist"
        aria-label="Roll 快速部署步骤"
        aria-orientation="horizontal"
      >
        {STEPS.map((s) => (
          <Button
            aria-controls={`setup-panel-${s.id}`}
            aria-selected={activeStep === s.id}
            id={`setup-tab-${s.id}`}
            key={s.id}
            role="tab"
            tabIndex={activeStep === s.id ? 0 : -1}
            variant="tab"
            active={activeStep === s.id}
            onClick={() => setActiveStep(s.id)}
            onKeyDown={(event) => handleTabKeyDown(event, s.id)}
          >
            {s.tabName}
          </Button>
        ))}
      </div>

      {steps.map((step) => (
        <div
          className="cli-layout"
          hidden={activeStep !== step.id}
          id={`setup-panel-${step.id}`}
          key={step.id}
          role="tabpanel"
          aria-labelledby={`setup-tab-${step.id}`}
        >
          {/* Detail Panel */}
          <div className="cli-info-panel">
            {step.id !== "01" && <div className="step-tag">STEP {step.id}</div>}
            {step.id === "01" && (
              <fieldset className="cli-install-methods" aria-label="安装方式">
                <div className="cli-install-options">
                  {installationMethods.map((method) => (
                    <label className="cli-install-option" key={method.id}>
                      <input
                        type="radio"
                        name="roll-install-method"
                        value={method.id}
                        checked={installMethodId === method.id}
                        onChange={() => setInstallMethodId(method.id)}
                      />
                      <span>{method.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <h3 className="cli-info-title">{step.description}</h3>
            {step.commercialValue && <p className="cli-commercial-value">{step.commercialValue}</p>}

            <div className="cli-command-block">
              <span className="cli-prompt-symbol">{installMethod.prompt}</span>
              <code className="cli-command-text">{step.command}</code>
              <Button
                variant="copy"
                onClick={() => handleCopy(step)}
                aria-label={`复制命令：${step.command}`}
                aria-live="polite"
              >
                {copiedKey === `${installMethodId}:${step.id}` ? "COPIED!" : "COPY"}
              </Button>
            </div>
            {step.id === "01" && (
              <div className="cli-install-details">
                <details key={installMethod.id}>
                  <summary>系统要求</summary>
                  <p>{installMethod.requirements}</p>
                </details>
              </div>
            )}
            {step.id === "04" && (
              <p className="cli-update-note">
                后续更新：<code>roll update --check</code> 检查更新，<code>roll update</code>
                升级。Windows 0.38.0 用户若更新失败，可重新运行在线安装脚本。
              </p>
            )}
          </div>

          {/* Terminal Simulation Panel - Handled by UI Terminal Component */}
          <Terminal height="200px" badge="流程示意 · 非实际执行">
            <div className="terminal-line input-line">
              <span className="prompt">{installMethod.prompt}</span>
              <span className="typing-text">{step.terminalCommand}</span>
            </div>
            <div className="terminal-output">{step.output}</div>
            <div className="terminal-line cursor-line">
              <span className="prompt">{installMethod.prompt}</span>
              <span className="blinking-cursor">_</span>
            </div>
          </Terminal>
        </div>
      ))}
    </div>
  );
}
