export type Agent = {
  id: string;
  roleName: string;
  overview: string;
  plainSummary: string;
  examplePrompt: string;
  businessOutcome: string;
  accent: "orange" | "blue" | "green";
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
      "采用行为仿真级防封技术接管本机 Chrome 浏览器。自动登录第三方招聘平台，执行批量读取未读、筛选打招呼、简历画像解析以及主动联系方式交换。内置滑块验证码智能检测，安全中断保护您的账号产值。",
    plainSummary:
      "行为仿真级安全操控 Chrome 浏览器，秒级并发处理第三方招聘平台未读消息，无侵入式自动获取联系方式。",
    examplePrompt: "roll run browser-use-agent read_messages --input-json '{\"onlyUnread\":true}'",
    businessOutcome:
      "⚡️ 告别枯燥的人工手动翻页与打招呼，实现高频高危操作的物理抗封与 24 小时高并发在线。",
    accent: "orange",
    category: "网页自动化与账号托管",
    tags: ["强抗风控接管", "获取联系方式", "安全风控中断", "并发账号"],
    installCommand: "roll agent install @roll-agent/browser-use-agent",
    runCommand: "roll run browser-use-agent [tool_name]",
    runtimeDetails: "物理常驻后台服务 (HTTP-streamable:3100) | Chrome 隔离用户配置",
  },
  {
    id: "smart-reply-agent",
    roleName: "智能回复助手",
    overview:
      "智能回复逻辑的核心大脑。本地 Agent 仅作为数据安全搬运与执行网关，核心回复逻辑深度接驳 Reply Authority Service 战略回复中台。在云端秒级加载企业岗位、排班、薪资、门店定位等上下文知识，自动应用过滤与初筛规则（如过滤学生、限制年龄等），并自动签发带高强度安全防伪签名的回复内容。",
    plainSummary:
      "接驳云端 Reply Authority，全自动执行匹配策略，高精稳健签发无错、统一的企业级应答。",
    examplePrompt:
      'roll run smart-reply-agent generate_reply --input-json \'{"conversationId":"c129", "message":"几点上班"}\'',
    businessOutcome:
      "🛡️ 杜绝新招聘顾问的低级沟通失误，自动过滤不符资质，将优秀招聘话术复制给 100% 流程。",
    accent: "blue",
    category: "智能回复中台与政策网关",
    tags: ["Reply Authority", "自动话术过签", "业务知识检索", "资质准入网关"],
    installCommand: "roll agent install @roll-agent/smart-reply-agent",
    runCommand: "roll run smart-reply-agent [tool_name]",
    runtimeDetails: "按需调用微进程 (stdio) | 零常驻内存开销 | 强加密通道",
  },
  {
    id: "notify-agent",
    roleName: "消息通知助手",
    overview:
      "极简、高效的多端通知分发哨兵。当前版本提供飞书自定义群机器人 (Webhook) 数据流推送服务。当 `browser-use-agent` 自动完成联系方式获取、聊天触发验证码报错等核心业务流状态变更时，该哨兵即时将状态及结构化文本内容广播给后端团队群。",
    plainSummary:
      "飞书群机器人单向 Webhook 哨兵，在成功获取联系方式或滑块报错时，毫秒级通知招聘群跟进。",
    examplePrompt:
      'roll run notify-agent send_feishu_message --input-json \'{"text":"[Roll] 候选人李四已自动换取联系方式成功"}\'',
    businessOutcome:
      "📢 全流程透明，无漏回漏跟。负责人不用反复查岗进度，线下招聘顾问即时衔接私域转化。",
    accent: "green",
    category: "状态广播与即时即达哨兵",
    tags: ["飞书 Webhook", "单向出站通知", "异常自动报警", "线下私域流接驳"],
    installCommand: "roll agent install @roll-agent/notify-agent",
    runCommand: "roll run notify-agent [tool_name]",
    runtimeDetails: "按需调用极简进程 (stdio) | 基于 Node 22 原生运行时",
  },
];
