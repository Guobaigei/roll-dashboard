# AGENT.md

面向 AI Agent 与协作者的项目说明。修改代码前请先阅读本文。

## 项目是什么

**Roll 官网落地页**（package 名：`roll-agent-site`），用于展示 Roll AI 招聘助手的产品价值与能力。

这不是带后台的数据看板，也不是真实 Agent 运行时。页面上的「执行中」「已沟通 12 位候选人」等内容均为**静态营销展示**，数据来自本地 TypeScript 文件，没有 API、数据库或认证。

## 技术栈

| 项 | 选择 |
|---|---|
| 框架 | Next.js 16（App Router） |
| UI | React 19 |
| 语言 | TypeScript（`strict: true`） |
| 样式 | 原生 CSS（`app/globals.css`），**未使用** Tailwind / CSS Modules |
| Lint / 格式 | Biome 2.4（`next` + `react` recommended domains） |
| 包管理 | pnpm |

## 目录结构

```
roll-dashboard/
├── app/
│   ├── page.tsx          # 首页入口，组合各 Server Component
│   ├── layout.tsx        # 根布局、SEO metadata、viewport
│   ├── globals.css       # 全部页面样式
│   └── icon.svg
├── components/
│   ├── AgentStore.tsx    # 03. Agent Marketplace 详情（Client Component）
│   ├── HeroSection.tsx   # 01. Hero 区
│   ├── InteractiveCLI.tsx# 01. 命令行渐进式交互组件
│   ├── ArchitectureSection.tsx # 02. 架构动效区
│   ├── TopNav.tsx        # 导航
│   └── SiteFooter.tsx    # 页脚
├── data/
│   └── agents.ts         # AI 助手静态数据与类型定义
├── biome.json            # Biome lint / format 配置
├── AGENT.md              # 本文件
└── README.md             # 简要启动说明
```

## 页面结构

首页为单页滚动布局，高精简 3 屏（Folds）聚焦转换：

| 锚点 | 区块 | 主要文件 |
|---|---|---|
| `#top` | 快速 CLI Onboarding | `components/HeroSection.tsx` + `components/InteractiveCLI.tsx` |
| `#architecture` | 系统架构数据流 (Commander-MCP-Execution) | `components/ArchitectureSection.tsx` |
| `#marketplace` | Sub-Agents 市场与装载 | `components/AgentStore.tsx` + `data/agents.ts` |

导航通过 `@/components/TopNav.tsx` 声明，链接锚点精准适配滚动边距（`scroll-padding-top`）。

## AI 助手数据模型

定义于 `data/agents.ts`：

```ts
export type Agent = {
  id: string;              // 唯一标识，kebab-case
  roleName: string;        // 助手名称（中文）
  overview: string;        // 详细职责说明
  plainSummary: string;    // 卡片上的简短摘要
  examplePrompt: string;   // 示例指挥语
  businessOutcome: string; // 交付结果描述
  accent: "orange" | "blue" | "green";  // 主题色，需与 CSS 一致
  category: string;        // 分类标签（卡片 kicker）
  tags: string[];          // 详情页标签，UI 最多展示 4 个
  installCommand: string;  // 安装命令
  runCommand: string;      // 运行命令
  runtimeDetails: string;  // 运行时规格
};
```

当前 3 个真实助手：`browser-use-agent`、`smart-reply-agent`、`notify-agent`。已彻底剔除不存在的 `hm-agent`。

### 新增助手

1. 在 `data/agents.ts` 的 `agents` 数组追加条目
2. 使用已有 `accent` 值之一，或同步在 `globals.css` 补充 `.accent-*` 样式
3. `AgentStore` 会自动渲染，无需改组件逻辑

## 组件约定

- **Server Component 优先**：页面区块拆为独立 Server Component；`AgentStore` 通过 `next/dynamic` 懒加载
- **Client Component 最小化**：仅 `AgentStore.tsx` 使用 `"use client"`
- **路径别名**：`@/*` 映射项目根目录（见 `tsconfig.json`）
- **无 UI 库**：不引入 shadcn、MUI 等，样式写在 `globals.css`

## 代码质量与架构

- **UI 抽象组件库**：位于 `components/ui/`，包含 `Button`、`Card`、`Terminal`、`Table`。其他业务组件（`InteractiveCLI`、`ArchitectureSection`、`AgentStore`）已经 100% 改造，并使用这些通用的基础原子组件。
- **Theme 设计系统**：全站设计 token（间距、字体、字号、字重、圆角、过渡、阴影）完全抽象并收拢于 `app/globals.css` 中的 `:root` 变量中，供所有页面及组件统合复用。
- **Biome**：配置于 `biome.json`，启用 `recommended` 规则及 `next` / `react` domains（与 Next.js 16 `create-next-app` 官方 Biome 模板一致）
- **TypeScript**：`strict: true`，独立 `pnpm typecheck`
- **Next.js 16 注意**：`next lint` 已移除，`next build` 不再自动跑 lint；提交前请手动运行 `pnpm check`
- **`app/globals.css`**：Biome lint 已关闭（遗留 CSS 体量大），格式化仍生效；`prefers-reduced-motion` 与 `.below-fold` 的 `content-visibility` 已配置

## 样式与视觉约定

- **字体栈**：中文优先使用“微软雅黑”（`Microsoft YaHei`），英文显示与正文优先使用 `Berkeley Mono Trial`，代码块优先使用 `Maple Mono`。整体具有强烈的极简极客 Monospace 质感。
- **配色系统**：全站为深色磨砂纯黑风格（`--bg: #09090b`），支持 Cyber-grid 背景网格（`grid` pattern）。
- **主题色切换**：通过 `accent-${agent.accent}` 注入对应助手的专属极光色（如 `orange` 操控、`blue` 回复、`green` 通知）。
- **动效规范**：所有长折叠区块均设置了 `content-visibility: auto`，全局注入 `@media (prefers-reduced-motion: reduce)` 安全无障碍防动晕配置。

## 常用命令

```bash
pnpm install    # 安装依赖
pnpm dev        # 本地开发（默认 http://localhost:3000）
pnpm build      # 生产构建
pnpm lint       # Biome 格式 + lint + import 排序
pnpm lint:fix   # 自动修复可安全修复的问题
pnpm format     # 仅格式化
pnpm typecheck  # TypeScript 检查（tsc --noEmit）
pnpm check      # lint + typecheck 一起跑（推荐）
```

修改代码后建议运行 `pnpm check`；样式改动在浏览器中目视确认即可。

## 修改指南

### 应该做的

- 保持改动范围小，只动与任务相关的文件
- 营销文案、静态数据优先改 `data/agents.ts` 或对应的 `Section` 组件
- 新样式追加到 `globals.css`，沿用现有 CSS 变量与 BEM 式类名
- 遵循极简、极客、有硬核技术诚实度的文案语调

### 不应该做的

- 不要引入 API 路由、数据库、状态管理库，除非明确要求
- 不要添加 Tailwind、Styled Components 等新的样式方案
- 不要为静态展示数据过度抽象（例如不必要的 fetch 层或 mock server）
- 不要创建 README/AGENT 以外的文档，除非用户要求

## SEO 与元信息

`app/layout.tsx` 中的 `metadata` 与 `viewport`：

- **title**: `Roll | 强大的AI招聘助手`
- **description**: 飞书/微信/钉钉 + 候选人消息处理相关描述
- **openGraph / twitter**: 社交分享元信息
- **metadataBase**: 读取 `NEXT_PUBLIC_SITE_URL`（未设置时默认 `http://localhost:3000`）
- **themeColor**: 配置为适配深色主题的 `#09090b`

更新产品定位时同步修改此处；部署生产环境请配置 `NEXT_PUBLIC_SITE_URL`。

## 产品语境（供文案参考）

Roll 是面向**灵工/招聘**场景 of AI 助手平台：

- 用户在飞书、微信、钉钉等聊天软件或 CLI 终端下发指令
- 指挥官（`roll-core`）自主进行多大模型规划与路由
- 基于开放标准的 **Model Context Protocol (MCP)** 热插拔挂载和调用本地的子进程 Agent
- 核心服务通过 Native CDP 与云端 Reply Authority 协同，高并发、物理抗封地批量处理消息并广播飞书

页面文案应与此一致，避免写成通用 SaaS 或开发者工具口吻。

## 相关文件速查

| 需求 | 文件 |
|---|---|
| 改首页 Hero 与 CLI 流程 | `components/HeroSection.tsx` & `components/InteractiveCLI.tsx` |
| 改产品架构与 SVG 动画 | `components/ArchitectureSection.tsx` |
| 改 AI 助手应用市场数据 | `data/agents.ts` |
| 改助手详情与卡片逻辑 | `components/AgentStore.tsx` |
| 改样式/布局/动效 | `app/globals.css` |
| 改页面 title/description | `app/layout.tsx` |
| 改 Biome 规则 / 格式 | `biome.json` |
| 改站点图标 | `app/icon.svg` |
