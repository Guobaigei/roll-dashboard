import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteDescription =
  "Roll 帮招聘团队在飞书、微信、钉钉里处理候选人消息、筛选合适人选、生成回复并同步团队进展。";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Roll | 强大的AI招聘助手",
  description: siteDescription,
  openGraph: {
    title: "Roll | 强大的AI招聘助手",
    description: siteDescription,
    locale: "zh_CN",
    type: "website",
    siteName: "Roll",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roll | 强大的AI招聘助手",
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff8ee",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
