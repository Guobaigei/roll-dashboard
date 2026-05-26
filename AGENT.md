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
│   ├── AgentStore.tsx    # AI 助手列表 + 详情（Client Component）
│   ├── HeroSection.tsx   # Hero 区
│   ├── PainSection.tsx   # 痛点区
│   ├── WorkflowSection.tsx
│   ├── CaseSection.tsx
│   ├── TrustSection.tsx
│   ├── TopNav.tsx
│   └── SiteFooter.tsx
├── data/
│   ├── agents.ts         # AI 助手静态数据与类型定义
│   └── page-content.ts   # 首页文案静态数据
├── biome.json            # Biome lint / format 配置
├── AGENT.md              # 本文件
└── README.md             # 简要启动说明
```

## 页面结构

首页 `#top` 为单页滚动布局，锚点导航：

| 锚点 | 区块 | 主要文件 |
|---|---|---|
| `#why` | 为什么需要 Roll | `components/PainSection.tsx` |
| `#how` | 工作流说明 | `components/WorkflowSection.tsx` |
| `#team` | AI 助手展示 | `components/AgentStore.tsx` + `data/agents.ts` |
| `#case` | 落地场景 | `components/CaseSection.tsx` |

`AgentStore` 通过 `section-anchor` + `id="team"` 实现锚点定位；`globals.css` 中 `#team` 等设置了 `scroll-margin-top: 86px` 以适配固定顶栏。

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
  accent: "orange" | "blue" | "green" | "purple";  // 主题色，需与 CSS 一致
  category: string;        // 分类标签（卡片 kicker）
  tags: string[];            // 详情页标签，UI 最多展示 4 个
};
```

当前 4 个助手：`browser-use-agent`、`smart-reply-agent`、`notify-agent`、`hm-agent`。

### 新增助手

1. 在 `data/agents.ts` 的 `agents` 数组追加条目
2. 使用已有 `accent` 值之一，或同步在 `globals.css` 补充 `.accent-*` 样式
3. `AgentStore` 会自动渲染，无需改组件逻辑

## 组件约定

- **Server Component 优先**：页面区块拆为独立 Server Component；`AgentStore` 通过 `next/dynamic` 懒加载
- **Client Component 最小化**：仅 `AgentStore.tsx` 使用 `"use client"`
- **路径别名**：`@/*` 映射项目根目录（见 `tsconfig.json`）
- **无 UI 库**：不引入 shadcn、MUI 等，样式写在 `globals.css`

## 代码质量

- **Biome**：配置于 `biome.json`，启用 `recommended` 规则及 `next` / `react` domains（与 Next.js 16 `create-next-app` 官方 Biome 模板一致）
- **TypeScript**：`strict: true`，独立 `pnpm typecheck`
- **Next.js 16 注意**：`next lint` 已移除，`next build` 不再自动跑 lint；提交前请手动运行 `pnpm check`
- **`app/globals.css`**：Biome lint 已关闭（遗留 CSS 体量大），格式化仍生效；`prefers-reduced-motion` 与 `.below-fold` 的 `content-visibility` 已配置

## 样式约定

- 设计 token 定义在 `:root`（如 `--ink`、`--orange`、`--page-max`）
- 助手卡片/详情通过 `accent-${agent.accent}` 类名切换配色（如 `.accent-orange`）
- 新增区块时复用现有 pattern：`.section-heading`、`.eyebrow`、`.section-anchor`
- 保持中文排版：`lang="zh-CN"`，正文字号约 `--body-size: 19px`

## 常用命令

```bash
pnpm install    # 安装依赖
pnpm dev        # 本地开发（默认 http://localhost:3000）
pnpm build      # 生产构建
pnpm lint       # Biome 格式 + lint + import 排序
pnpm lint:fix   # 自动修复可安全修复的问题
pnpm format     # 仅格式化
pnpm typecheck  # TypeScript 检查（tsc --noEmit）
pnpm check      # lint + typecheck
```

修改代码后建议运行 `pnpm check`；样式改动在浏览器中目视确认即可。

## 修改指南

### 应该做的

- 保持改动范围小，只动与任务相关的文件
- 营销文案、静态数据优先改 `data/page-content.ts` 或 `data/agents.ts`
- 新样式追加到 `globals.css`，沿用现有 CSS 变量与 BEM 式类名
- 遵循现有中文语气：面向招聘业务人员，强调「不用换系统」「一句话交代」等产品卖点

### 不应该做的

- 不要引入 API 路由、数据库、状态管理库，除非明确要求
- 不要添加 Tailwind、Styled Components 等新的样式方案
- 不要把 Hero 区的模拟动效改成真实后端驱动，除非产品方向变更
- 不要为静态展示数据过度抽象（例如不必要的 fetch 层或 mock server）
- 不要创建 README/AGENT 以外的文档，除非用户要求

## SEO 与元信息

`app/layout.tsx` 中的 `metadata` 与 `viewport`：

- **title**: `Roll | 强大的AI招聘助手`
- **description**: 飞书/微信/钉钉 + 候选人消息处理相关描述
- **openGraph / twitter**: 社交分享元信息
- **metadataBase**: 读取 `NEXT_PUBLIC_SITE_URL`（未设置时默认 `http://localhost:3000`）

更新产品定位时同步修改此处；部署生产环境请配置 `NEXT_PUBLIC_SITE_URL`。

## 产品语境（供文案参考）

Roll 是面向**灵工/招聘**场景的 AI 助手平台：

- 用户在飞书、微信、钉钉等聊天软件下发指令
- Roll 统筹多个专业助手：浏览器操控、智能回复、团队通知、资料查询
- 对接 BOSS 直聘、鱼泡等招聘网站
- 目标：减少重复操作，加快候选人筛选与跟进

页面文案应与此一致，避免写成通用 SaaS 或开发者工具口吻。

## 相关文件速查

| 需求 | 文件 |
|---|---|
| 改首页文案/区块 | `data/page-content.ts` 或对应 `components/*Section.tsx` |
| 改 AI 助手列表 | `data/agents.ts` |
| 改助手交互 UI | `components/AgentStore.tsx` |
| 改样式/布局/动效 | `app/globals.css` |
| 改页面 title/description | `app/layout.tsx` |
| 改 Biome 规则 / 格式 | `biome.json` |
| 改站点图标 | `app/icon.svg` |
