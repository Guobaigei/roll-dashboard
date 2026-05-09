import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Roll | 常用聊天里的 AI 招聘助手",
  description: "Roll 帮招聘团队在飞书、微信、钉钉里处理候选人消息、筛选合适人选、生成回复并同步团队进展。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
