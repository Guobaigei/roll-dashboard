import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "花卷 Agent (Roll) | 轻量级 Agent 编排系统",
  description: "指挥官 + MCP 协议 + 按需加载的 Roll Agent 官网与 Subagent 应用商店。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
