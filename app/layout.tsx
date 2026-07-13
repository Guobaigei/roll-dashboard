import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteDescription =
  "Roll 将企业现有系统、数据与专业 Agent 连接成可执行的智能系统，让业务人员、AI Agent 与自动化流程共享同一套企业能力。";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Roll | 企业级 Agent 智能系统",
  description: siteDescription,
  openGraph: {
    title: "Roll | 企业级 Agent 智能系统",
    description: siteDescription,
    locale: "zh_CN",
    type: "website",
    siteName: "Roll",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roll | 企业级 Agent 智能系统",
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
