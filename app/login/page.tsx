import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/operator");
  }

  return (
    <AuthShell
      copy="使用手机号登录 Roll 后台，管理 Boss 招聘账号、客户端令牌和租户配置。"
      eyebrow="Reply Authority"
      mode="login"
      title="Roll 后台登录"
    >
      <LoginForm />
    </AuthShell>
  );
}
