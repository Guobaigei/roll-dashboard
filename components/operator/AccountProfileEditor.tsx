"use client";

import { Loader2, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { RequestOverlay } from "@/components/ui/RequestOverlay";
import { StatusToast } from "@/components/ui/StatusToast";
import type { SafeOperatorUser } from "@/lib/db/operator-users";
import { readApiError } from "@/lib/http/read-api-error";

let accountRequest: Promise<SafeOperatorUser> | null = null;

function fetchAccountOnce() {
  if (!accountRequest) {
    accountRequest = fetch("/api/operator/account", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiError(response));
        }

        const body = (await response.json()) as { user: SafeOperatorUser };
        return body.user;
      })
      .finally(() => {
        accountRequest = null;
      });
  }

  return accountRequest;
}

export function AccountProfileEditor() {
  const router = useRouter();
  const [user, setUser] = useState<SafeOperatorUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchAccountOnce()
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "账号信息请求失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => {
      setNotice(null);
    }, 2600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notice]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || saving) {
      return;
    }

    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await fetch("/api/operator/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: formData.get("phone"),
          bossPlatform: "zhipin",
          bossUsername: formData.get("bossUsername"),
          password: formData.get("password") || undefined,
        }),
      });

      if (!response.ok) {
        setError(await readApiError(response));
        setSaving(false);
        return;
      }

      const body = (await response.json()) as { user: SafeOperatorUser };
      setUser(body.user);
      setNotice("账号信息已更新");
      const passwordInput = form.elements.namedItem("password");
      if (passwordInput instanceof HTMLInputElement) {
        passwordInput.value = "";
      }
      setSaving(false);
      router.refresh();
    } catch {
      setError("账号信息保存失败，请稍后重试");
      setSaving(false);
    }
  }

  return (
    <>
      <RequestOverlay active={saving} label="正在保存账号信息" />
      <StatusToast active={Boolean(notice)} message={notice ?? ""} />
      <form
        aria-busy={loading || saving}
        className="operator-panel operator-form operator-profile-panel"
        onSubmit={onSubmit}
      >
        <div className="operator-panel-title">
          <UserRound size={18} />
          账号信息
        </div>

        {loading ? (
          <div className="operator-empty-state">
            <Loader2 className="spin" size={18} />
            <span>正在通过 /api/operator/account 读取账号信息</span>
          </div>
        ) : (
          <div className="operator-profile-grid">
            <label>
              <span>手机号</span>
              <input defaultValue={user?.phone ?? ""} name="phone" required />
            </label>
            <label>
              <span>平台</span>
              <input disabled value="zhipin" />
            </label>
            <label>
              <span>用户名</span>
              <input
                defaultValue={user?.bossUsername ?? ""}
                name="bossUsername"
                placeholder="请输入 Boss 的用户名"
                required
              />
            </label>
            <label>
              <span>新密码</span>
              <input
                autoComplete="new-password"
                minLength={8}
                name="password"
                placeholder="不修改请留空"
                type="password"
              />
            </label>
          </div>
        )}

        {error ? <p className="operator-error">{error}</p> : null}
        <button className="auth-submit-btn" disabled={loading || saving} type="submit">
          {saving ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
          保存账号信息
        </button>
      </form>
    </>
  );
}
