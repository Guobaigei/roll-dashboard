"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Clock3,
  Database,
  History,
  Inbox,
  KeyRound,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatDateTime } from "@/lib/format/date-time";
import { readApiError } from "@/lib/http/read-api-error";
import type { BrandSyncRunSlice, Tenant } from "@/lib/reply-authority/types";

type TokenWarning = {
  tokenId: string;
  label: string | null;
  fingerprint: string;
  message: string;
};

type AccessibleTenant = Tenant & {
  access: {
    canWrite: boolean;
  };
};

type TenantsResponse = {
  tenants: AccessibleTenant[];
  warnings: TokenWarning[];
  tokenCount: number;
};

type SyncRunsResponse = {
  runs: BrandSyncRunSlice[];
};

type HistoryTenant = {
  tenantId: string;
  name: string;
};

function bindingCount(tenant: Tenant) {
  return tenant.bindings?.zhipinRecruiters?.length ?? 0;
}

let tenantListRequest: Promise<TenantsResponse> | null = null;
const tenantHistoryRequests = new Map<string, Promise<SyncRunsResponse>>();

function fetchTenantListOnce() {
  if (!tenantListRequest) {
    tenantListRequest = fetch("/api/operator/tenants", {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readApiError(response, "租户数据请求失败"));
        }

        return (await response.json()) as TenantsResponse;
      })
      .finally(() => {
        tenantListRequest = null;
      });
  }

  return tenantListRequest;
}

function fetchTenantHistoryOnce(tenantId: string) {
  const current = tenantHistoryRequests.get(tenantId);
  if (current) {
    return current;
  }

  const request = fetch(`/api/operator/tenants/${encodeURIComponent(tenantId)}/brand-sync-runs`, {
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(await readApiError(response, "操作记录请求失败"));
      }

      return (await response.json()) as SyncRunsResponse;
    })
    .finally(() => {
      tenantHistoryRequests.delete(tenantId);
    });

  tenantHistoryRequests.set(tenantId, request);
  return request;
}

function ConfigureTokenPanel({ description, title }: { description: string; title: string }) {
  return (
    <div className="operator-panel operator-empty-panel">
      <KeyRound size={22} />
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="operator-action-link" href="/operator/account">
        去配置客户端令牌
        <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}

function tokenWarningName(warning: TokenWarning) {
  const label = warning.label?.trim();
  return label ? `「${label}」` : `（fp:${warning.fingerprint}）`;
}

function formatTokenWarning(warning: TokenWarning) {
  const message = warning.message.trim();
  const normalizedMessage = message.toLowerCase();
  const tokenName = tokenWarningName(warning);

  if (
    normalizedMessage.includes("invalid service token") ||
    normalizedMessage.includes("invalid token") ||
    message.includes("客户端令牌无效")
  ) {
    return `客户端令牌${tokenName}无效，请更新或删除后重试。`;
  }

  if (message.includes("缺少") || normalizedMessage.includes("scope")) {
    return `客户端令牌${tokenName}权限不足：${message}`;
  }

  return `客户端令牌${tokenName}请求失败：${message || "请稍后重试"}`;
}

function tenantDisplayName(tenant: Tenant) {
  return tenant.displayName || tenant.tenantId;
}

function statusLabel(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "partial_failed") return "部分失败";
  if (normalized.includes("success")) return "成功";
  if (normalized.includes("fail")) return "失败";
  if (normalized.includes("skip")) return "已跳过";
  if (normalized.includes("running") || normalized.includes("pending")) return "执行中";

  return status;
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "partial_failed") return "is-partial";
  if (normalized.includes("success")) return "is-success";
  if (normalized.includes("fail")) return "is-failed";
  if (normalized.includes("skip")) return "is-skipped";

  return "is-running";
}

function triggerLabel(trigger: string) {
  if (trigger === "manual") return "手动同步";
  if (trigger === "scheduled") return "自动同步";

  return trigger;
}

function formatDuration(durationMs: number | null | undefined) {
  if (typeof durationMs !== "number" || !Number.isFinite(durationMs)) {
    return "耗时未知";
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  const seconds = durationMs / 1000;
  return `${seconds >= 10 ? seconds.toFixed(0) : seconds.toFixed(1)}s`;
}

function formatRunTime(value: string | null | undefined) {
  return value ? formatDateTime(value) : "未返回";
}

function runIssue(run: BrandSyncRunSlice) {
  return run.tenantResult.error || run.tenantResult.reason || null;
}

function countSuccessfulRuns(runs: BrandSyncRunSlice[]) {
  return runs.filter((run) => statusClass(run.tenantResult.status) === "is-success").length;
}

export function TenantList() {
  const [data, setData] = useState<TenantsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyTenant, setHistoryTenant] = useState<HistoryTenant | null>(null);
  const [historyData, setHistoryData] = useState<SyncRunsResponse | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchTenantListOnce()
      .then((body) => {
        if (!cancelled) {
          setData(body);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "租户数据请求失败");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!historyTenant) {
      return;
    }

    let cancelled = false;
    setHistoryData(null);
    setHistoryError(null);
    setHistoryLoading(true);

    fetchTenantHistoryOnce(historyTenant.tenantId)
      .then((body) => {
        if (!cancelled) {
          setHistoryData(body);
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setHistoryError(loadError instanceof Error ? loadError.message : "操作记录请求失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [historyTenant]);

  if (error) {
    return (
      <section className="operator-shell">
        <div className="operator-hero">
          <p className="eyebrow">TENANT_ACCESS</p>
          <h1>我的租户</h1>
        </div>
        <div className="operator-alert operator-alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
        <ConfigureTokenPanel
          description="当前账号还没有可用客户端令牌，或已保存客户端令牌需要更新。请先进入账号配置检查客户端令牌。"
          title="先检查客户端令牌"
        />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="operator-shell">
        <div className="operator-hero">
          <p className="eyebrow">TENANT_ACCESS</p>
          <h1>我的租户</h1>
        </div>
        <div className="operator-empty-state">
          <Loader2 className="spin" size={18} />
          <span>正在通过 /api/operator/tenants 读取租户</span>
        </div>
      </section>
    );
  }

  const allTokensFailed =
    data.tokenCount > 0 && data.tenants.length === 0 && data.warnings.length >= data.tokenCount;
  const loadingHistoryTenantId = historyLoading ? historyTenant?.tenantId : null;
  function closeHistoryDrawer() {
    setHistoryTenant(null);
    setHistoryData(null);
    setHistoryError(null);
    setHistoryLoading(false);
  }

  return (
    <section className="operator-shell" aria-labelledby="tenant-title">
      <div className="operator-hero operator-hero-row">
        <div>
          <p className="eyebrow">TENANT_ACCESS</p>
          <h1 id="tenant-title">我的租户</h1>
          <p>租户列表由已保存客户端令牌拉取，并按当前用户名绑定过滤。</p>
        </div>
        <div className="operator-metric-card">
          <strong>{data.tenants.length}</strong>
          <span>可访问租户</span>
        </div>
      </div>

      {data.warnings.length > 0 ? (
        <div className="operator-warning-list">
          {data.warnings.map((warning) => (
            <div className="operator-alert" key={warning.tokenId}>
              <AlertTriangle size={16} />
              <span>{formatTokenWarning(warning)}</span>
              <Link className="operator-alert-action" href="/operator/account">
                检查客户端令牌
                <ArrowUpRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      ) : null}

      {data.tokenCount === 0 ? (
        <ConfigureTokenPanel
          description="添加客户端令牌后，系统会自动拉取并合并可访问租户。"
          title="先添加客户端令牌"
        />
      ) : allTokensFailed ? (
        <ConfigureTokenPanel
          description="所有已保存客户端令牌都没有成功返回租户，请前往账号配置更新或删除失效客户端令牌。"
          title="客户端令牌不可用"
        />
      ) : data.tenants.length === 0 ? (
        <div className="operator-panel operator-empty-panel">
          <Inbox size={22} />
          <h2>暂无匹配租户</h2>
          <p>当前客户端令牌范围内没有绑定你用户名的租户。</p>
        </div>
      ) : (
        <div className="operator-table">
          <div className="operator-table-head">
            <span>租户</span>
            <span>状态</span>
            <span>同步时间</span>
            <span>Boss 绑定</span>
            <span>权限</span>
            <span>操作</span>
          </div>
          {data.tenants.map((tenant) => (
            <div className="operator-table-row" key={tenant.tenantId}>
              <span className="operator-tenant-title">
                <strong>{tenantDisplayName(tenant)}</strong>
                <small>{tenant.tenantId}</small>
              </span>
              <span className={tenant.ready ? "operator-status-ready" : "operator-status-created"}>
                {tenant.status}
              </span>
              <span className="operator-muted">{formatDateTime(tenant.syncedAt)}</span>
              <span className="operator-count-chip">{bindingCount(tenant)}</span>
              <span className="operator-access-chip">
                <ShieldCheck size={14} />
                {tenant.access.canWrite ? "可编辑" : "只读"}
              </span>
              <span className="operator-row-actions">
                <Link className="operator-row-action" href={`/operator/tenants/${tenant.tenantId}`}>
                  查看
                  <ArrowUpRight size={15} />
                </Link>
                <button
                  className="operator-row-action operator-row-button"
                  disabled={loadingHistoryTenantId === tenant.tenantId}
                  onClick={() =>
                    setHistoryTenant({
                      tenantId: tenant.tenantId,
                      name: tenantDisplayName(tenant),
                    })
                  }
                  type="button"
                >
                  <History size={15} />
                  记录
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {historyTenant ? (
        <TenantHistoryDrawer
          error={historyError}
          loading={historyLoading}
          onClose={closeHistoryDrawer}
          runs={historyData?.runs ?? []}
          tenant={historyTenant}
        />
      ) : null}
    </section>
  );
}

function TenantHistoryDrawer({
  error,
  loading,
  onClose,
  runs,
  tenant,
}: {
  error: string | null;
  loading: boolean;
  onClose: () => void;
  runs: BrandSyncRunSlice[];
  tenant: HistoryTenant;
}) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedRunId((current) => {
      if (runs.length === 0) {
        return null;
      }

      return current && runs.some((run) => run.runId === current) ? current : runs[0].runId;
    });
  }, [runs]);

  const selectedRun = runs.find((run) => run.runId === selectedRunId) ?? runs[0] ?? null;
  const successfulRuns = countSuccessfulRuns(runs);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <aside className="operator-history-drawer">
      <button
        aria-label="关闭操作记录"
        className="operator-history-scrim"
        onClick={onClose}
        type="button"
      />
      <div
        aria-busy={loading}
        aria-labelledby="tenant-history-title"
        aria-modal="true"
        className="operator-panel operator-history-panel"
        role="dialog"
      >
        <header className="operator-history-header">
          <div className="operator-history-heading">
            <span className="operator-history-icon">
              <History size={18} />
            </span>
            <span>
              <p className="eyebrow">OPERATION_LOG</p>
              <h2 id="tenant-history-title">操作记录</h2>
              <small>
                {tenant.name}
                <em>{tenant.tenantId}</em>
              </small>
            </span>
          </div>
          <button
            aria-label="关闭操作记录"
            className="operator-icon-btn operator-history-close"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </header>

        {!loading && !error && runs.length > 0 ? (
          <div className="operator-history-summary">
            <span>
              <strong>{runs.length}</strong>
              <small>记录总数</small>
            </span>
            <span>
              <strong>{successfulRuns}</strong>
              <small>成功同步</small>
            </span>
            <span>
              <strong>
                {formatRunTime(runs[0]?.tenantResult.syncedAt ?? runs[0]?.finishedAt)}
              </strong>
              <small>最近完成</small>
            </span>
          </div>
        ) : null}

        <div className="operator-history-content">
          {loading ? (
            <div className="operator-history-state">
              <Loader2 className="spin" size={18} />
              <span>正在读取操作记录</span>
            </div>
          ) : error ? (
            <div className="operator-alert operator-alert-error">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          ) : runs.length === 0 ? (
            <div className="operator-history-state">
              <Inbox size={18} />
              <span>暂无同步操作记录</span>
            </div>
          ) : selectedRun ? (
            <div className="operator-history-workspace">
              <div aria-label="操作记录列表" className="operator-history-rail" role="listbox">
                {runs.map((run) => {
                  const issue = runIssue(run);
                  const selected = run.runId === selectedRun.runId;

                  return (
                    <button
                      aria-selected={selected}
                      className={`operator-history-run ${statusClass(run.tenantResult.status)}${
                        selected ? " is-selected" : ""
                      }`}
                      key={run.runId}
                      onClick={() => setSelectedRunId(run.runId)}
                      role="option"
                      type="button"
                    >
                      <span className="operator-history-run-top">
                        <strong>{statusLabel(run.tenantResult.status)}</strong>
                        <em>{triggerLabel(run.trigger)}</em>
                      </span>
                      <span className="operator-history-run-meta">
                        <span>
                          <Clock3 size={13} />
                          {formatRunTime(run.startedAt)}
                        </span>
                        <span>{formatDuration(run.durationMs)}</span>
                      </span>
                      <span className="operator-history-stats">
                        <span>品牌 {run.tenantResult.brands ?? "-"}</span>
                        <span>门店 {run.tenantResult.stores ?? "-"}</span>
                        <span>职位 {run.tenantResult.positions ?? "-"}</span>
                      </span>
                      {issue ? <span className="operator-history-run-issue">{issue}</span> : null}
                    </button>
                  );
                })}
              </div>

              <OperationRunDetail run={selectedRun} />
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function OperationRunDetail({ run }: { run: BrandSyncRunSlice }) {
  const issue = runIssue(run);
  const aliases = run.tenantResult.brandAliases ?? [];

  return (
    <article className={`operator-history-detail ${statusClass(run.tenantResult.status)}`}>
      <div className="operator-history-detail-head">
        <span>
          <p className="eyebrow">RUN_DETAIL</p>
          <h3>{statusLabel(run.tenantResult.status)}</h3>
        </span>
        <strong>{triggerLabel(run.trigger)}</strong>
      </div>

      <div className="operator-history-detail-metrics">
        <span>
          <strong>{run.tenantResult.brands ?? "-"}</strong>
          <small>品牌</small>
        </span>
        <span>
          <strong>{run.tenantResult.stores ?? "-"}</strong>
          <small>门店</small>
        </span>
        <span>
          <strong>{run.tenantResult.positions ?? "-"}</strong>
          <small>职位</small>
        </span>
      </div>

      <dl className="operator-history-detail-list">
        <div>
          <dt>
            <Activity size={14} />
            运行状态
          </dt>
          <dd>
            批次 {statusLabel(run.status)} / 租户 {statusLabel(run.tenantResult.status)}
          </dd>
        </div>
        <div>
          <dt>
            <Clock3 size={14} />
            开始时间
          </dt>
          <dd>{formatRunTime(run.tenantResult.startedAt ?? run.startedAt)}</dd>
        </div>
        <div>
          <dt>
            <Clock3 size={14} />
            完成时间
          </dt>
          <dd>{formatRunTime(run.tenantResult.finishedAt ?? run.finishedAt)}</dd>
        </div>
        <div>
          <dt>
            <BarChart3 size={14} />
            执行耗时
          </dt>
          <dd>{formatDuration(run.tenantResult.durationMs ?? run.durationMs)}</dd>
        </div>
        <div>
          <dt>
            <Database size={14} />
            数据来源
          </dt>
          <dd>{run.tenantResult.source ?? "未返回"}</dd>
        </div>
        <div>
          <dt>
            <Database size={14} />
            同步时间
          </dt>
          <dd>{formatRunTime(run.tenantResult.syncedAt)}</dd>
        </div>
      </dl>

      <div className="operator-history-detail-section">
        <span className="operator-history-section-title">品牌别名</span>
        {aliases.length > 0 ? (
          <div className="operator-history-aliases">
            {aliases.map((alias) => (
              <span key={alias}>{alias}</span>
            ))}
          </div>
        ) : (
          <p>本次记录未返回品牌别名。</p>
        )}
      </div>

      {issue ? (
        <div className="operator-history-issue">
          <AlertTriangle size={15} />
          <span>{issue}</span>
        </div>
      ) : null}

      <div className="operator-history-run-id">
        <span>RUN_ID</span>
        <code>{run.runId}</code>
      </div>
    </article>
  );
}
