export type Agent = {
  id: string;
  roleName: string;
  overview: string;
  plainSummary: string;
  examplePrompt: string;
  businessOutcome: string;
  accent: "orange" | "blue" | "green" | "purple";
  category: string;
  tags: string[];
};

export const agents: Agent[] = [
  {
    id: "browser-use-agent",
    roleName: "浏览器操控助手",
    overview: "负责打开浏览器 进入 BOSS 直聘、鱼泡等招聘网站，帮你看消息、看资料、筛人和打招呼。",
    plainSummary: "替你打开招聘网站，完成看消息、筛人、打招呼这些重复操作。",
    examplePrompt: "帮我看今天有哪些新候选人消息；帮我挑出适合优候选人打招呼。",
    businessOutcome: "不用人工一页页翻消息，合适候选人更快被发现和跟进。",
    accent: "orange",
    category: "看消息和筛人",
    tags: ["BOSS直聘", "鱼泡", "看消息", "打招呼"],
  },
  {
    id: "smart-reply-agent",
    roleName: "智能回复助手",
    overview: "负责理解候选人问题结合岗位要求，生成自然、统一、可直接使用的智能回复。",
    plainSummary: "根据候选人的问题和岗位信息，生成可以直接发送的招聘回复。",
    examplePrompt: "帮我回复10条未读候选人消息；帮我给张三回复消息",
    businessOutcome: "回复更快、更稳定，并且拥有无限耐心以及行业专家的经验。",
    accent: "blue",
    category: "写回复",
    tags: ["岗位话术", "候选人问题", "统一回复", "沟通阶段"],
  },
  {
    id: "notify-agent",
    roleName: "消息通知助手",
    overview: "负责把候选人进展、异常提醒和下一步动作同步到团队。",
    plainSummary: "把处理结果同步到团队群，避免漏通知、漏跟进。",
    examplePrompt: "候选人已经同意加微信，帮我把进展发到招聘团队。",
    businessOutcome: "负责人不用追问进度，团队能及时接上下一步动作。",
    accent: "green",
    category: "同步团队",
    tags: ["团队群", "进展同步", "异常提醒", "下一步"],
  },
  {
    id: "hm-agent",
    roleName: "海绵数据查询助手",
    overview: "负责查询品牌、公司、门店、项目等信息资料",
    plainSummary: "帮你快速查清岗位和门店信息，减少凭印象沟通。",
    examplePrompt: "帮我查一下这个品牌都有哪些门店",
    businessOutcome: "快速查询品牌、公司、门店、项目的详细信息。",
    accent: "purple",
    category: "查资料",
    tags: ["品牌", "门店", "岗位", "薪资排班"],
  },
];
