"use client";

import { KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

import { AccountProfileEditor } from "@/components/operator/AccountProfileEditor";
import { RequestOverlay } from "@/components/ui/RequestOverlay";
import { StatusToast } from "@/components/ui/StatusToast";
import { readApiError } from "@/lib/http/read-api-error";

type SafeClientToken = {
  id: string;
  clientTokenLabel: string | null;
  fingerprint: string;
  createdAt: string;
};

let clientTokensRequest: Promise<SafeClientToken[]> | null = null;

function fetchClientTokensOnce() {
  if (!clientTokensRequest) {
    clientTokensRequest = fetch("/api/operator/tokens", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiError(response));
        }

        const body = (await response.json()) as { clientTokens: SafeClientToken[] };
        return body.clientTokens;
      })
      .finally(() => {
        clientTokensRequest = null;
      });
  }

  return clientTokensRequest;
}

export function ClientTokenManager() {
  const [clientTokens, setClientTokens] = useState<SafeClientToken[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchClientTokensOnce()
      .then((tokens) => {
        if (!cancelled) {
          setClientTokens(tokens);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "客户端令牌请求失败");
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
    if (loading || submitting || deletingId) {
      return;
    }

    setError(null);
    setNotice(null);
    setSubmitting(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await fetch("/api/operator/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientToken: formData.get("clientToken"),
          clientTokenLabel: formData.get("clientTokenLabel") || undefined,
        }),
      });

      if (!response.ok) {
        setError(await readApiError(response));
        setSubmitting(false);
        return;
      }

      const body = (await response.json()) as { clientToken: SafeClientToken };
      setClientTokens((current) => [...current, body.clientToken]);
      setNotice("客户端令牌已保存");
      form.reset();
      setSubmitting(false);
    } catch {
      setError("客户端令牌保存失败，请稍后重试");
      setSubmitting(false);
    }
  }

  async function deleteClientToken(clientTokenId: string) {
    if (loading || submitting || deletingId) {
      return;
    }

    setError(null);
    setNotice(null);
    setDeletingId(clientTokenId);

    try {
      const response = await fetch(`/api/operator/tokens/${clientTokenId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        setError(await readApiError(response));
        setDeletingId(null);
        return;
      }

      setClientTokens((current) =>
        current.filter((clientToken) => clientToken.id !== clientTokenId),
      );
      setNotice("客户端令牌已删除");
      setDeletingId(null);
    } catch {
      setError("客户端令牌删除失败，请稍后重试");
      setDeletingId(null);
    }
  }

  return (
    <>
      <RequestOverlay
        active={submitting || Boolean(deletingId)}
        label={
          submitting
            ? "正在保存客户端令牌"
            : deletingId
              ? "正在删除客户端令牌"
              : "正在处理客户端令牌"
        }
      />
      <section
        aria-busy={loading || submitting || Boolean(deletingId)}
        className="operator-shell"
        aria-labelledby="token-title"
      >
        <div className="operator-hero">
          <p className="eyebrow">CLIENT_TOKEN_VAULT</p>
          <h1 id="token-title">账号配置</h1>
          <p>配置多个客户端令牌后，后台会合并它们可访问且绑定当前用户名的租户。</p>
        </div>

        <div className="operator-grid">
          <AccountProfileEditor />
          <StatusToast active={Boolean(notice)} message={notice ?? ""} />

          <form className="operator-panel operator-form" onSubmit={onSubmit}>
            <div className="operator-panel-title">
              <KeyRound size={18} />
              添加客户端令牌
            </div>
            <label>
              <span>客户端令牌备注</span>
              <input
                disabled={submitting || Boolean(deletingId)}
                name="clientTokenLabel"
                placeholder="例如：测试环境客户端令牌"
              />
            </label>
            <label>
              <span>客户端令牌</span>
              <input
                disabled={submitting || Boolean(deletingId)}
                name="clientToken"
                required
                placeholder="粘贴客户端令牌，保存后加密入库"
              />
            </label>
            {error ? <p className="operator-error">{error}</p> : null}
            <button
              className="auth-submit-btn"
              disabled={loading || submitting || Boolean(deletingId)}
              type="submit"
            >
              {submitting ? <Loader2 className="spin" size={18} /> : <Plus size={18} />}
              添加客户端令牌
            </button>
          </form>

          <div className="operator-panel">
            <div className="operator-panel-title">
              <KeyRound size={18} />
              已保存客户端令牌
            </div>
            {loading ? (
              <div className="operator-empty-state">
                <Loader2 className="spin" size={18} />
                <span>正在通过 /api/operator/tokens 读取客户端令牌</span>
              </div>
            ) : clientTokens.length === 0 ? (
              <div className="operator-empty-state">
                <KeyRound size={18} />
                <span>暂无客户端令牌</span>
              </div>
            ) : (
              <div className="operator-token-list">
                {clientTokens.map((clientToken) => (
                  <div className="operator-token-item" key={clientToken.id}>
                    <span>
                      <strong>{clientToken.clientTokenLabel || "未命名客户端令牌"}</strong>
                      <small>fp:{clientToken.fingerprint}</small>
                    </span>
                    <button
                      className="operator-icon-btn"
                      disabled={loading || submitting || Boolean(deletingId)}
                      onClick={() => deleteClientToken(clientToken.id)}
                      title="删除客户端令牌"
                      type="button"
                    >
                      {deletingId === clientToken.id ? (
                        <Loader2 className="spin" size={16} />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
