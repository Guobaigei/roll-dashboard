import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/operator");
  }

  return (
    <AuthShell
      copy="创建账号并绑定 Boss 的用户名，后续可配置客户端令牌、租户和自动化能力。"
      eyebrow="Account Setup"
      mode="register"
      title="注册账户"
    >
      <RegisterForm />
    </AuthShell>
  );
}
