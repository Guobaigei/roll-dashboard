# Project Rules

- 前端页面和客户端组件只能请求当前项目封装的 BFF 接口，例如 `/api/operator/*`；不得在浏览器端直接请求 Reply Authority 或其他上游服务。
- 上游 Reply Authority 调用必须集中在服务端封装中，例如 `lib/reply-authority/*` 和 `app/api/operator/*`，并统一处理鉴权、错误映射和响应格式。
- 后台页面初始加载如需租户、客户端令牌或租户详情数据，应通过 `/api/operator/*` 获取；开发模式下要对初始化请求做去重，避免 React dev effect 造成同一接口重复调用。
- 本项目验收不需要截图，优先用 DOM 状态、接口返回、布局溢出指标和命令输出来验证。
