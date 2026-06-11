"use client";

import { ArrowRight, Loader2, Phone, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { RequestOverlay } from "@/components/ui/RequestOverlay";
import { readApiError } from "@/lib/http/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.get("phone"),
          password: formData.get("password"),
        }),
      });

      if (!response.ok) {
        setError(await readApiError(response));
        setLoading(false);
        return;
      }

      router.replace("/operator");
      router.refresh();
    } catch {
      setError("登录请求失败，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <>
      <RequestOverlay active={loading} label="正在登录后台" />
      <form aria-busy={loading} className="auth-form" onSubmit={onSubmit}>
        <div className="auth-form-heading">
          <span>OPERATOR_LOGIN</span>
          <h2>进入后台</h2>
        </div>
        <label>
          <span>手机号</span>
          <div className="auth-input-shell">
            <Phone size={17} />
            <input name="phone" type="tel" autoComplete="tel" required placeholder="13800000000" />
          </div>
        </label>
        <label>
          <span>密码</span>
          <div className="auth-input-shell">
            <ShieldCheck size={17} />
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="至少 8 位"
            />
          </div>
        </label>
        {error ? <p className="auth-form-error">{error}</p> : null}
        <button className="auth-submit-btn" disabled={loading} type="submit">
          {loading ? <Loader2 className="spin" size={18} /> : <ArrowRight size={18} />}
          登录
        </button>
        <p className="auth-form-footnote">
          还没有账号？<Link href="/register">注册运营账号</Link>
        </p>
      </form>
    </>
  );
}
