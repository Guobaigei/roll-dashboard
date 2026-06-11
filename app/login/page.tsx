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
      copy="用手机号进入 Roll 运营后台，继续管理 Boss 招聘账号与后续自动化能力。"
      eyebrow="Reply Authority"
      mode="login"
      title="运营后台登录"
    >
      <LoginForm />
    </AuthShell>
  );
}
