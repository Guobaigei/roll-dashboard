import type { Accent } from "@/lib/ui/accent";

export type Agent = {
  id: string;
  roleName: string;
  overview: string;
  plainSummary: string;
  examplePrompt: string;
  businessOutcome: string;
  accent: Accent;
  category: string;
  tags: string[];
  installCommand: string;
  runCommand: string;
  runtimeDetails: string;
};

export const agents: Agent[] = [
  {
    id: "browser-use-agent",
    roleName: "浏览器操控助手",
    overview:
      "在受控的本机 Chrome 运行时中操作招聘平台，执行消息读取、候选人筛选、打招呼、画像解析和联系方式交换。遇到滑块验证码等需要人工处理的状态时主动中断并提示，避免任务在未知状态下继续推进。",
    plainSummary: "将招聘平台中的重复浏览器操作交给专业 Agent，并在需要人工介入时明确暂停。",
    examplePrompt: "roll run browser-use-agent read_messages --input-json '{\"onlyUnread\":true}'",
    businessOutcome: "减少人工翻页、筛选与重复操作，让招聘团队把时间集中在候选人判断和后续转化。",
    accent: "orange",
    category: "浏览器业务操作",
    tags: ["受控浏览器运行时", "候选人消息处理", "验证码检测", "多实例配置"],
    installCommand: "roll agent install @roll-agent/browser-use-agent",
    runCommand: "roll run browser-use-agent [tool_name]",
    runtimeDetails: "独立托管服务 (streamable HTTP) | Chrome 隔离用户配置 | 多实例路由",
  },
  {
    id: "smart-reply-agent",
    roleName: "智能回复助手",
    overview:
      "连接 Reply Authority Service，根据企业岗位、排班、薪资、门店定位等业务上下文生成已签名回复，并应用企业配置的过滤与初筛规则。",
    plainSummary: "让不同招聘顾问复用同一套企业知识与回复策略，减少口径不一致和重复查询。",
    examplePrompt:
      'roll run smart-reply-agent generate_reply --input-json \'{"conversationId":"c129", "message":"几点上班"}\'',
    businessOutcome: "降低常见沟通错误与知识遗漏风险，让企业回复口径更一致、业务规则更容易复用。",
    accent: "blue",
    category: "智能回复中台与政策网关",
    tags: ["Reply Authority", "签名回复", "业务知识检索", "初筛规则"],
    installCommand: "roll agent install @roll-agent/smart-reply-agent",
    runCommand: "roll run smart-reply-agent [tool_name]",
    runtimeDetails: "按需运行 (stdio) | 依赖 Reply Authority Service | Bearer Token 鉴权",
  },
  {
    id: "reply-policy-tuner-agent",
    roleName: "回复策略调优师",
    overview:
      "通过校验、话术预览、双路评估和有条件写入管理租户级回复策略。策略更新需要先经过 Reply Authority Service 评估，并满足本地 Evaluate 门禁要求后才能写入。",
    plainSummary: "以「校验—预览—双路评估—有条件写入」闭环安全编排租户级回复策略，评估不过不落库。",
    examplePrompt:
      'roll run reply-policy-tuner-agent get_policy --input-json \'{"tenantId":"<tenant-id>"}\'',
    businessOutcome:
      "让策略调整在写入前拥有预览和评估依据，降低未经验证的业务规则直接上线所带来的风险。",
    accent: "purple",
    category: "策略 RSI 编排与评估门禁",
    tags: ["Reply Authority", "双路评估门禁", "有条件写入", "Judge 安全护栏"],
    installCommand: "roll agent install @roll-agent/reply-policy-tuner-agent",
    runCommand: "roll run reply-policy-tuner-agent [tool_name]",
    runtimeDetails:
      "按需调用微进程 (stdio) | 依赖 Reply Authority Service + Bearer Token | Evaluate 门禁 TTL 保护",
  },
  {
    id: "octopus-agent",
    roleName: "丸子 Agent",
    overview:
      "连接 Sponge MCP Server，将自然语言问题转换为受控的数据查询。执行前会校验查询语句与安全边界，权限仍由 Sponge 统一控制，并保留完整的审计记录。",
    plainSummary: "让业务人员直接询问品牌与项目数据，同时保留权限边界与查询记录。",
    examplePrompt:
      'roll run octopus-agent query_sponge --input-json \'{"question":"查询我能看到的品牌列表","originalQuestion":"查询我能看到的品牌列表"}\'',
    businessOutcome:
      "业务人员可用自然语言查询品牌与项目数据；权限仍由 Sponge 统一控制，查询过程保留审计记录。",
    accent: "teal",
    category: "自然语言查数与 SQL 护栏",
    tags: ["NL2SQL", "Sponge MCP", "SELECT + LIMIT 护栏", "Schema Cache"],
    installCommand: "roll agent install @roll-agent/octopus-agent",
    runCommand: "roll run octopus-agent [tool_name]",
    runtimeDetails:
      "按需调用微进程 (stdio / Python 3.11+) | 依赖 Sponge MCP Server Token | 审计日志落盘",
  },
];
