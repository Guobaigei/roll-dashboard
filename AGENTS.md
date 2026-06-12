# Project Rules

- 前端页面和客户端组件只能请求当前项目封装的 BFF 接口，例如 `/api/operator/*`；不得在浏览器端直接请求 Reply Authority 或其他上游服务。
- 上游 Reply Authority 调用必须集中在服务端封装中，例如 `lib/reply-authority/*` 和 `app/api/operator/*`，并统一处理鉴权、错误映射和响应格式。
- 后台页面初始加载如需租户、客户端令牌或租户详情数据，应通过 `/api/operator/*` 获取；开发模式下要对初始化请求做去重，避免 React dev effect 造成同一接口重复调用。
- 本项目验收不需要截图，优先用 DOM 状态、接口返回、布局溢出指标和命令输出来验证。

## Project Shape

- `app/` 只放 Next App Router 页面、布局和 API route。业务页面按路由分组，例如 `app/operator/*`；BFF API 按资源分组，例如 `app/api/operator/tenants/*`。
- `components/` 只放 React 组件，组件文件使用 PascalCase。业务组件按场景分目录，例如 `components/auth/*`、`components/operator/*`；通用视觉组件放 `components/ui/*`。
- `hooks/` 放可复用 React hook，文件名使用 kebab-case，导出函数仍使用 `useXxx`。
- `lib/` 放非组件逻辑，按能力分目录，例如 `lib/auth/*`、`lib/db/*`、`lib/http/*`、`lib/operator/*`、`lib/reply-authority/*`。
- `docs/` 放长文档和外部 API 参考。根目录只保留项目入口文档和配置文件。
- `data/` 放首页静态展示数据，不接入运行时 API。
- `prisma/` 放 schema 和 migrations，不在业务组件中直接引用 Prisma。

## Naming Rules

- React component files use PascalCase: `TenantDetailEditor.tsx`。
- Hook files use kebab-case paths and camelCase exports: `hooks/use-clipboard-feedback.ts` exports `useClipboardFeedback`。
- Library files use kebab-case and describe the capability, not the caller: prefer `lib/http/read-api-error.ts` over generic names like `client.ts`。
- Generic helpers should live under a purpose folder: prefer `lib/format/date-time.ts` over root-level `lib/format.ts`。
- Long reference docs should be named by domain: `docs/reply-authority-api-reference.md`。

## Validation

- 代码改动后优先运行 `pnpm check`。
- 涉及 Next 路由、构建配置、Prisma 或依赖变更时再运行 `pnpm build`。
