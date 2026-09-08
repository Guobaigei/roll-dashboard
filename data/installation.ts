export const installationMethods = [
  {
    id: "unix",
    label: "macOS / Linux",
    command: "curl -fsSL https://roll.duliday.com/install.sh | sh",
    prompt: "$",
    description: "在终端中运行",
    requirements:
      "macOS 13.5+；Linux 内核 4.18+、glibc 2.28+（不支持 Alpine / musl）。支持 x64 与 arm64。",
    output:
      '→ 下载适合当前系统的独立发行包\n→ 校验 SHA-256，安装 Roll 与自带运行环境\n→ 按提示配置 PATH 或重新打开终端\n\nNEXT: run "roll setup"',
  },
  {
    id: "windows",
    label: "Windows",
    command: "irm https://roll.duliday.com/install.ps1 | iex",
    prompt: "PS>",
    description: "在 PowerShell 中运行",
    requirements: "Windows 10 / Server 2016 及以上，PowerShell 5.1+。支持 x64 与 arm64。",
    output:
      '→ 下载适合当前系统的独立发行包\n→ 校验 SHA-256，安装 Roll 与自带运行环境\n→ 配置用户 PATH\n\nNEXT: run "roll setup"',
  },
  {
    id: "npm",
    label: "npm",
    command: "npm i -g @roll-agent/core",
    prompt: "$",
    description: "通过 npm 安装",
    requirements: "需预先安装 Node.js 22.13.0+ 和 npm。",
    output: '→ Installing @roll-agent/core...\n→ Command available: roll\n\nNEXT: run "roll setup"',
  },
] as const;
