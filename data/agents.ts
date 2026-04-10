export type AgentStatus = "ready" | "preview" | "pending-command";

export type Agent = {
  id: string;
  name: string;
  description: string;
  overview: string;
  category: string;
  tags: string[];
  transport: "stdio" | "streamable-http";
  runtime: string;
  tools: string[];
  requirements: string[];
  useCases: string[];
  boundaries: string[];
  workflow: string[];
  installCommand?: string;
  docsUrl: string;
  status: AgentStatus;
  highlight: string;
};

export const agents: Agent[] = [
  {
    id: "browser-use-agent",
    name: "browser-use-agent",
    description:
      "浏览器操控 Agent。控制浏览器操作招聘平台，读取消息、打开聊天、发送回复、换微信、查看推荐列表、打招呼、查看简历。",
    overview:
      "浏览器自动化 Agent，作为招聘平台消息收发的执行层。通过 Playwright 控制浏览器，提供平台级 workflow 操作；HTTP 常驻服务让浏览器 session 跨调用持久。",
    category: "浏览器自动化",
    tags: ["招聘平台", "Playwright", "BOSS直聘", "鱼泡", "HTTP 常驻"],
    transport: "streamable-http",
    runtime: "core-managed",
    tools: [
      "browser_status",
      "list_pages",
      "navigate_active_tab",
      "open_platform",
      "select_page",
      "zhipin_read_messages",
      "zhipin_open_chat",
      "zhipin_get_candidate_info",
      "zhipin_send_reply",
      "zhipin_exchange_wechat",
      "zhipin_get_username",
      "zhipin_get_candidate_list",
      "zhipin_say_hello",
      "zhipin_open_resume",
      "zhipin_locate_resume_canvas",
      "zhipin_close_resume",
      "yupao_read_messages",
      "yupao_send_reply",
    ],
    requirements: ["Node.js 22.6+", "系统 Chrome", "招聘平台登录态", "Agent 服务进程"],
    useCases: [
      "读取 BOSS 直聘或鱼泡的未读消息列表",
      "打开指定候选人的聊天窗口并提取资料与聊天记录",
      "发送招聘回复、交换微信、对推荐列表候选人批量打招呼",
      "定位简历弹窗里的 canvas 坐标，辅助后续截图或自动化动作",
    ],
    boundaries: [
      "负责浏览器页面操作，不负责生成招聘回复策略",
      "依赖当前浏览器登录态和可见页面结构",
      "首次使用已打开但未跟踪页面时，需要先 list_pages + select_page",
    ],
    workflow: [
      "zhipin_read_messages",
      "zhipin_open_chat(candidateName)",
      "zhipin_get_candidate_info",
      "zhipin_send_reply(message)",
      "zhipin_exchange_wechat",
    ],
    docsUrl: "https://github.com/steveoon/roll-agent/tree/main/agents/browser-use",
    status: "pending-command",
    highlight: "Roll 的浏览器执行层。",
    installCommand: "roll agent install @roll-agent/browser-use-agent",
  },
  {
    id: "smart-reply-agent",
    name: "smart-reply-agent",
    description:
      "智能招聘回复 Agent。根据候选人消息、品牌数据和回复策略，生成个性化招聘回复。",
    overview:
      "招聘场景智能回复 Agent，负责候选人消息理解、沟通阶段判断与回复文本生成。它维护回复所需品牌数据，并把页面读取和消息发送交给 browser-use-agent。",
    category: "智能招聘",
    tags: ["招聘回复", "漏斗阶段", "Reply Policy", "Duliday", "LLM"],
    transport: "stdio",
    runtime: "on-demand",
    tools: ["generate_reply", "sync_brand_data"],
    requirements: [
      "Node.js 22.6+",
      "ANTHROPIC_API_KEY 或 OPENAI_API_KEY",
      "SMART_REPLY_PROXY_BASE_URL 可选",
      "DULIDAY_TOKEN",
      "DULIDAY_BRAND_LIST_URL",
      "DULIDAY_JOB_LIST_URL",
    ],
    useCases: [
      "根据候选人消息生成一条招聘回复",
      "结合对话历史、候选人信息和品牌数据草拟回复",
      "判断当前沟通处于哪个招聘漏斗阶段",
      "按既定回复策略生成更稳妥、更合规的回复",
      "同步 Duliday 品牌/岗位数据，供后续回复生成使用",
    ],
    boundaries: [
      "只负责生成回复文本和维护品牌数据",
      "不打开聊天页面，不读取候选人资料页面，不抓取当前聊天记录",
      "不直接发送消息，不交换微信，不执行浏览器自动化",
    ],
    workflow: [
      "browser-use-agent 读取候选人资料、聊天记录或当前页面上下文",
      "调用方整理 candidateMessage、conversationHistory、candidateInfo",
      "smart-reply-agent.generate_reply(...) 生成回复草案",
      "browser-use-agent 将回复发送到招聘平台",
    ],
    docsUrl: "https://github.com/steveoon/roll-agent/tree/main/agents/smart-reply",
    status: "pending-command",
    highlight: "让候选人沟通有阶段、有上下文。",
    installCommand: "roll agent install @roll-agent/smart-reply-agent",
  },
  {
    id: "notify-agent",
    name: "notify-agent",
    description:
      "通用消息通知 Agent。向飞书等渠道发送纯文本消息，消息内容由调用方组织，不内置模板。",
    overview:
      "轻量通知 Agent，负责将调用方已组织好的纯文本消息发送到外部渠道。当前支持飞书自定义机器人，不绑定业务场景。",
    category: "通知",
    tags: ["飞书", "Webhook", "纯文本", "跨 Agent 工作流"],
    transport: "stdio",
    runtime: "on-demand",
    tools: ["send_feishu_message"],
    requirements: ["Node.js 22.6+", "FEISHU_BOT_WEBHOOK"],
    useCases: [
      "发送飞书自定义机器人纯文本消息",
      "把招聘候选人微信交换结果通知到团队频道",
      "把任务完成或异常状态通知给外部渠道",
    ],
    boundaries: [
      "只发送已组织好的纯文本，不负责模板拼装",
      "不负责 Markdown、富文本卡片、图片或文件消息",
      "不负责重试、去重、回执查询或通知审计",
      "多渠道通知应新增独立 tool 或扩展渠道层",
    ],
    workflow: [
      "browser-use-agent.open_platform(\"zhipin\")",
      "browser-use-agent.zhipin_get_username()",
      "browser-use-agent.zhipin_get_candidate_info(candidateName)",
      "browser-use-agent.zhipin_exchange_wechat(candidateName)",
      "编排层组织通知文本",
      "notify-agent.send_feishu_message(text)",
    ],
    docsUrl: "https://github.com/steveoon/roll-agent/tree/main/agents/notify",
    status: "pending-command",
    highlight: "把关键动作送到团队可见的地方。",
    installCommand:
      "roll agent add https://github.com/steveoon/roll-agent/tree/main/agents/notify",
  },
  {
    id: "hm-agent",
    name: "hm-agent",
    description:
      "查询海绵系统中的品牌、公司、门店、项目等信息的 Agent；用户提到「海绵」「品牌/公司/门店/项目」等应优先选本 Agent。",
    overview:
      "面向海绵（Duliday）的只读查询 Subagent。对外仅暴露 hm-query(message)：用自然语言提问，内部自动判断实体类型并调海绵接口，返回摘要；多结果时返回 needsClarification 与候选项；接口失败时返回明确原因。",
    category: "海绵",
    tags: ["海绵", "Duliday", "品牌", "公司", "门店", "项目", "MCP", "只读"],
    transport: "stdio",
    runtime: "on-demand",
    tools: ["hm-query"],
    requirements: [
      "Node.js 22+",
      "AI_API_KEY（百炼 / OpenAI 兼容）",
      "HM_BASE_URL",
      "HM_DULIDAY_TOKEN",
      "可选：AI_BASE_URL、AI_MODEL、HM_REQUEST_STRATEGY 等（见 references/env.yaml）",
    ],
    useCases: [
      "按名称查品牌、公司、门店或项目",
      "用一句话描述意图，由 Agent 内部选工具并汇总结果",
      "结果不唯一时获得候选项列表以便二次澄清",
    ],
    boundaries: [
      "只读查询，不写库、不改海绵数据",
      "事实须来自工具返回，不编造字段",
      "不负责浏览器自动化或通用网页检索",
    ],
    workflow: [
      "配置 roll.config.yaml 中 agents.env.hm-agent（与 references/env.yaml 一致）",
      "roll agent install hm-agent",
      "roll run hm-agent hm-query --input-json '{\"message\":\"…\"}' --json",
    ],
    docsUrl: "https://www.npmjs.com/package/hm-agent",
    status: "pending-command",
    highlight: "海绵主数据一句话查询。",
    installCommand: "roll agent install hm-agent",
  },
];

export const categories = ["All", ...Array.from(new Set(agents.map((agent) => agent.category)))];
